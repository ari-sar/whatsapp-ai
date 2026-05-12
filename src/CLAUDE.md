# Backend (`src/`)

Node + Express + TypeScript. Three audiences hit this API:

1. **WhatsApp Cloud API** → `POST /webhook` (HMAC-signed) → `messageProcessor`
2. **Shop-owner portal** (`meetwave-client-portal`) → `/api/auth/*` (OTP→JWT), `/api/me/*` (JWT-gated), `/api/plans`, `/api/flows`, `/api/payments/*`
3. **Admin portal** (`meetwave-admin`) → `/api/admin/auth/*` (OTP→opaque session), `/api/admin/panel/*` (session-gated CRUD for flows/plans/users)

Plus legacy unauthenticated `/api/admin/*` for direct CRUD (kept for backfill).

## Request Path Map

```
POST /webhook                                → verifySignature → webhookHandler → processMessage
GET  /webhook                                → webhookController.verifyWebhook
POST /api/auth/otp/{send,verify}             → authController        (rate-limited)
GET  /api/me, /api/me/*                      → authJwt → meController / meServiceAreaController
*    /api/me/service-areas[/:id|/bulk]       → authJwt → meServiceAreaController (per-Client pincode list)
GET  /api/plans                              → plansController.listPlans (public)
GET  /api/flows                              → flowsController.listBusinessFlows (public, active only)
POST /api/payments/*                         → paymentsController
POST /api/admin/auth/otp/{send,verify}       → adminAuthController   (rate-limited, AdminPhone allowlist)
GET  /api/admin/auth/me, POST .../logout     → verifyAdminSession → adminAuthController
*    /api/admin/panel/{flows,plans,users}    → verifyAdminSession → admin* controllers
*    /api/admin/*  (legacy)                  → adminRoutes — unauth
```

## Flow Engine (`services/flowEngine.ts` + `services/messageProcessor.ts`)

Flows are stored in DB (`BusinessFlow` + `FlowStep`). The engine is type-generic — no per-flow code.

- `loadFlow(flowId)` — fetches the flow and its steps; returns `null` if missing.
- `promptStep(step, ctx, collected)` — dispatches the right WhatsApp send based on `step.type`:
  - `text` / `end` → `sendTextMessage(interpolate(prompt, collected))`
  - `list` → `sendInteractiveListMessage(bodyText, buttonLabel, sections)`
  - `button` → `sendInteractiveButtonMessage(bodyText, buttons)`
  - `start` / `condition` / `check` → no-op (pass-through)
- `handleStep(step, input, collected, clientId)` — **async**. Validates input, collects fields, picks the next step from `transitions`. For `check` steps it evaluates the configured operator (incl. DB-backed `in_source`). Returns `{ nextStepId, collectedPatch?, reprompt?, invalidMessage? }`.
- After a transition lands on a `start`, `condition`, or `check` step (`isAutoAdvanceStep`), `messageProcessor.routeToFlow` auto-advances through them in a loop until it reaches a step that prompts the user.
- If `handleStep` says `reprompt: true`, the engine sends `invalidMessage` (if any) and calls `promptStep` again on the same step (no DB write).

### Transition matching

```ts
transitions: [
  { to: 'End_Booked',     condition: { type: 'input_eq', value: 'confirm_yes' } },
  { to: 'End_Cancelled',  condition: { type: 'input_eq', value: 'confirm_no'  } },
  { to: 'Awaiting_Pincode' }                       // unconditional default (fallback)
]
```

Supported condition types:
- For most steps: `input_eq`, `input_in`, `collected_eq` — matched in order; first match wins; unconditional acts as fallback. For `list`/`button` steps, if no transition matches the input value, the engine re-prompts.
- For `check` steps: `check_pass` / `check_fail` — picked based on the operator result (see `evaluateCheck`). An unconditional transition acts as a fallback if neither is set.

### Interpolation

`config.prompt` may include `{{key}}` references resolved against `Lead.collected_data` at send time. E.g. `Confirm booking for {{service_label}} at pincode {{pincode}}?`.

## Auth Middleware

- `verifySignature` — HMAC SHA-256 of `req.rawBody` with `APP_SECRET`, matched against the `x-hub-signature-256` header. Body is captured raw via `express.json({ verify })` in `index.ts`.
- `authJwt` — Bearer JWT (HS256, 30d) signed by `JWT_SECRET`. Attaches `req.user = { id, phone }`.
- `verifyAdminSession` — Bearer opaque token looked up in `AdminSession`. Rejects expired or admin-deactivated sessions. Attaches `req.admin = { sessionId, adminPhoneId, phone }`. Bumps `AdminSession.last_seen_at` on each request.

## OTP Rate Limits

Both `utils/otp.ts` (user) and `utils/adminOtp.ts` (admin) share the same shape:

- 30s cooldown between sends per phone
- 5 sends per phone per rolling hour
- 5 verify attempts per OTP before lockout
- 5-minute OTP TTL

Admin additionally enforces `AdminPhone` allowlist on both send and verify.

## Multi-Tenant Sending

`whatsappApi.ts` is stateless — every call passes `{ token, phoneNumberId, to }`. For customer replies, these come from the matched `Client` row. For admin OTPs they come from `ADMIN_WA_TOKEN` / `ADMIN_WA_PHONE_ID` env (via `adminOtpSender.ts`).

## Adding a Backend Feature — Conventions

- One controller file per resource. Export each handler as a named function.
- Routes are thin: just verb-path → controller. Validation lives in the controller.
- Validate with type-checks + early returns; reject malformed input with `400 { error, code }`.
- Log entry and result lines with a `TAG` per file (existing pattern): `console.log(\`${TAG}.fn entry\`, {...})`.
- Serializers (camelCase API shape) live in `utils/serializers.ts` or inline if small.
- Don't return Prisma Date objects directly — always `.toISOString()`.

## Directory Files Worth Reading Before Editing

- `services/flowEngine.ts` — touching prompt/transition logic affects every active conversation.
- `services/messageProcessor.ts` — the only entry to flow execution.
- `controllers/keywordController.ts` — enforces the `response_id` XOR `flow_id` invariant.
- `middleware/verifyAdminSession.ts` — last line of defense for `/api/admin/panel/*`.
