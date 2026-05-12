# Meetwave — WhatsApp AI SaaS

Multi-tenant WhatsApp bot platform. Shop owners (`User`) sign up via OTP, get a `Client` (tenant) with WhatsApp credentials, configure keywords + a flow; their customers (`Lead`) talk to the bot on WhatsApp. Admins (separate allowlist) manage flows, users, and plans.

## Folder Structure

```
src/                              Backend (Node/Express/TypeScript)
  index.ts                        Express setup, route mounts
  routes/
    adminRoutes.ts                /api/admin/* — legacy CRUD (Clients/Responses/Keywords/Leads)
    adminAuthRoutes.ts            /api/admin/auth/* — admin OTP login + session
    adminPanelRoutes.ts           /api/admin/panel/* — admin-gated CRUD (flows/plans/users)
    authRoutes.ts                 /api/auth/otp/{send,verify} — shop-owner OTP + JWT
    meRoutes.ts                   /api/me/* — JWT-gated: profile, my flow, keywords, lead stats
    plansRoutes.ts                /api/plans — list active plans (public)
    flowsRoutes.ts                /api/flows — list active business flows (public)
    paymentsRoutes.ts             /api/payments/* — Razorpay order create/verify
    webhookRoutes.ts              /webhook — WhatsApp Cloud API receive
  controllers/
    adminAuthController.ts        Admin OTP send/verify, /me, /logout (allowlist enforced)
    adminFlowsController.ts       Admin flow CRUD (BusinessFlow + FlowStep)
    adminPlansController.ts       Admin plan CRUD (incl. discount fields)
    adminUsersController.ts       Admin user list with plan + filters
    authController.ts             Shop-owner OTP send/verify → JWT
    meController.ts               JWT-protected user self-service
    meServiceAreaController.ts    JWT-protected per-client serviceable pincodes CRUD
    flowsController.ts            Public list of active BusinessFlow metadata
    plansController.ts            Public list of active Plans
    paymentsController.ts         Razorpay order/verify
    webhookHandler.ts             Parses WhatsApp payload → IncomingInput, acks 200, fires processMessage
    webhookController.ts          GET /webhook hub.verify_token check
    clientController.ts           Client CRUD (legacy)
    responseController.ts         Static reply templates
    keywordController.ts          Trigger rules: keyword → response OR flow (mutually exclusive)
    leadController.ts             Read-only lead list
  services/
    messageProcessor.ts           Core webhook dispatch: active flow step OR keyword match (DB-backed)
    flowEngine.ts                 Generic step executor: loadFlow, promptStep, handleStep, transitions
    whatsappApi.ts                Graph API wrappers (sendTextMessage, sendInteractiveListMessage, sendInteractiveButtonMessage)
    adminOtpSender.ts             Sends admin OTP via WhatsApp using ADMIN_WA_TOKEN/ADMIN_WA_PHONE_ID
    otpSmsProvider.ts             Shop-owner OTP delivery (stub/dev)
    razorpayClient.ts             Razorpay SDK wrapper
    keywordSync.ts                Mirrors UserKeyword → Client.Keyword for runtime lookup
  flows/
    types.ts                      Shared types (IncomingInput, FlowContext, Step, Flow)
    index.ts                      Re-exports types only (in-code registry retired)
    rentalBookingFlow.ts          (Reference only — flow is now seeded into DB)
  middleware/
    verifySignature.ts            HMAC-SHA256 webhook signature check (APP_SECRET)
    authJwt.ts                    Bearer JWT check for /api/me/*
    verifyAdminSession.ts         Bearer opaque-token check for /api/admin/panel/* and /api/admin/auth/{logout,me}
  utils/
    otp.ts                        Shop-owner OTP gen/hash/rate-limit
    adminOtp.ts                   Admin OTP gen/hash/rate-limit + session token gen
    jwt.ts                        signUserToken / verifyUserToken (30d)
    serializers.ts                DB → API shape mappers
  config/
    prisma.ts                     Singleton PrismaClient

prisma/
  schema.prisma                   DB schema
  seed.ts                         Seeds Plans + rental_booking BusinessFlow + FlowSteps

frontend/meetwave-client-portal/  Shop-owner portal (Ionic React + Vite) — see its CLAUDE.md
frontend/meetwave-admin/          Admin portal (Ionic React + Vite) — see its CLAUDE.md
```

## Data Model (Prisma — high level)

- `Client` — tenant; owns Keywords + Leads. Linked 1:1 to User via `User.client_id`.
- `User` — shop owner (logs into client portal). FK to Plan; `plan_started_at`, `plan_expires_at` track active subscription.
- `Lead` — end customer of a Client; carries `current_flow_id` + `current_step` + `collected_data` for state.
- `Keyword` — `(client_id, trigger)` unique; FK to either `Response` or `BusinessFlow.id` (mutually exclusive).
- `Response` — static reply template (text/media).
- `BusinessFlow` + `FlowStep` — DB-stored conversational flow. `BusinessFlow.initial_step_id` points at the entry `FlowStep.step_id`. Steps store `type` (start/text/list/button/condition/check/end), `config` (Json — prompt, sections, buttons, validation, collectKey, or check operator+source…), and `transitions` (Json — `[{to, condition?}]`).
- `Plan` — `name, price_in_paise, currency, billing_cycle, duration_days?, description?, discount_amount?, discount_days?, features[], is_active`.
- `ServiceablePincode` — `(client_id, pincode)` unique per-tenant list. Used by the `check` flow node's `in_source`/`not_in_source` operator with `source: "serviceable_pincodes"`. Shop owner manages it from the client portal's **Areas** tab via `/api/me/service-areas`.
- `AdminPhone` — allowlist of phone numbers permitted to log into the admin portal.
- `AdminOtpRequest` — separate from `OtpRequest` (shop-owner); holds admin OTP rate-limit / verify state.
- `AdminSession` — opaque-token 30-day sessions for admin portal.
- `OtpRequest` — shop-owner OTP.
- `PaymentOrder` / `UserKeyword` — billing + user-defined keyword templates.

## Execution Flow (Webhook → Response)

```
POST /webhook
  webhookHandler.ts
    parseIncomingInput(message) → { type: 'text'|'list'|'button', value: string }
    res.sendStatus(200)                  ← ack before processing
    processMessage(phoneNumberId, from, input)   ← async

  messageProcessor.ts
    find Client by phone_number_id
    upsert Lead (last_message, timestamp)

    if Lead.current_flow_id && Lead.current_step:
      flowEngine.loadFlow(flow_id) → DbFlow {steps[], initial_step_id}
      await flowEngine.handleStep(step, input, collected, clientId)
        → { nextStepId, collectedPatch?, reprompt?, invalidMessage? }
        → if reprompt: send invalidMessage + re-prompt current step
        → if nextStepId === null: clear Lead flow state
        → else: advance Lead.current_step, run flowEngine.promptStep(nextStep)
        → 'start' / 'condition' / 'check' steps auto-advance via transitions (isAutoAdvanceStep)

    else if input.type === 'text':
      find Keyword by (client_id, trigger)
        → if Keyword.flow_id: loadFlow, find entry step, set Lead.current_flow_id/step, promptStep
        → if Keyword.response_id: sendTextMessage(response.message)
        → else: send default_fallback response or hardcoded fallback text
```

## Flows in DB (replaces in-code registry)

Each `BusinessFlow` row has many `FlowStep` rows. A step's shape:

```ts
{
  step_id: 'Awaiting_Pincode',
  type: 'text',                           // start|text|list|button|condition|end
  config: {                               // schema varies by type
    label: 'Ask pincode',
    prompt: 'Please share your 6-digit pincode',
    validation: '^\\d{6}$',
    invalidMessage: 'That does not look like a valid pincode.',
    collectKey: 'pincode',
    // list-only: sections, buttonLabel, headerText, footerText
    // button-only: buttons[], headerText, footerText
  },
  transitions: [
    { to: 'Awaiting_Service' },                                 // unconditional default
    { to: 'End_Cancelled', condition: { type: 'input_eq', value: 'confirm_no' } },
    // also: { type: 'input_in', values: [...] } | { type: 'collected_eq', key, value }
  ],
}
```

`promptStep` supports `{{collectedKey}}` interpolation in `config.prompt`. `transitions` are evaluated in order; the first matching one (or first unconditional if none match) wins.

### `check` node (generic if-else)

Silent (no message sent), auto-advances. Evaluates one operator and routes to a `check_pass` or `check_fail` transition.

```ts
{
  step_id: 'Pincode_Serviceable?',
  type: 'check',
  config: {
    checkKey: 'pincode',           // collected_data key to evaluate
    operator: 'in_source',         // see below
    source: 'serviceable_pincodes' // per-Client DB list (only source today)
    // other ops use: value | values[] | pattern
  },
  transitions: [
    { to: 'Ask_Service',         condition: { type: 'check_pass' } },
    { to: 'End_Not_Serviceable', condition: { type: 'check_fail' } }
  ]
}
```

Operators (resolved in `flowEngine.evaluateCheck`):

| Operator | Field used | Meaning |
|----------|-----------|---------|
| `equals` / `not_equals` | `value` (string) | exact compare |
| `in_list` / `not_in_list` | `values` (string[]) | literal list |
| `contains` | `value` (string) | substring match |
| `regex` | `pattern` (string) | regex match |
| `in_source` / `not_in_source` | `source` (string) | per-Client DB lookup; only `serviceable_pincodes` today |

Adding a new source = new table + a case in `flowEngine.resolveSource` + a dropdown option in `NodeInspector.SOURCE_OPTIONS`. The `check` node type itself doesn't change.

To add/edit a flow: use the admin app (Flow tab). Programmatically: insert/edit `BusinessFlow` + `FlowStep` rows.

## Naming Conventions

- Flow IDs: `snake_case` (e.g. `rental_booking`) — set explicitly or slugified from name on create.
- Step IDs: any stable string — admin UI defaults to `<type>_<rand>` but renaming is supported. Changing a step ID while leads have that value in `Lead.current_step` will break those conversations.
- Keyword triggers: stored and matched as `lowercase` (enforced in `keywordController.createKeyword`).
- Button/List reply IDs: `snake_case` — returned verbatim by WhatsApp in `interactive.{button,list}_reply.id`.

## Closed Gaps (history)

1. ✅ `/api/admin/panel/flows` CRUD now exists (admin-gated).
2. ✅ All `/api/admin/panel/*` routes require `verifyAdminSession`. Legacy `/api/admin/*` still unauth — kept for backfill scripts; do not expose publicly.
3. ✅ `keywordController.createKeyword` now accepts `flow_id` and enforces mutual exclusion with `response_id` (validates referenced flow/response exists).
4. ✅ Flows live in DB (`BusinessFlow` + `FlowStep`); `messageProcessor` reads from DB via `flowEngine`.

## Safety Rules

- **Schema changes**: always run `npx prisma migrate dev --name <desc>` after editing `prisma/schema.prisma`. Run `npx prisma db seed` to (re)seed plans + the rental_booking flow.
- **`Keyword.response_id` and `Keyword.flow_id` are mutually exclusive** — enforced in `keywordController.ts`.
- **Webhook must ack 200 before async work** — never await heavy operations before `res.sendStatus(200)`.
- **`Client.access_token`** is the per-tenant WhatsApp Graph API token. `ADMIN_WA_TOKEN` is the system-level token for admin OTPs — keep separate.
- **Don't edit compiled JS files** (`src/**/*.js`, `src/**/*.d.ts`).
- **Flow step IDs must be stable across edits** — leads carry `Lead.current_step` as a string; renaming breaks active conversations.
- **Admin OTP** — allowlist (`AdminPhone`) is enforced on both send and verify. Per-phone cooldown (30s) + hourly cap (5) + max-5 verify attempts per OTP. Rate-limit logic in `src/utils/adminOtp.ts`.

## Environment Variables (backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `APP_SECRET` | WhatsApp app secret for webhook signature verification |
| `PORT` | Server port (default 3000) |
| `JWT_SECRET` | Signing secret for shop-owner JWTs |
| `ADMIN_WA_TOKEN` | WhatsApp Graph API token used to send admin OTPs |
| `ADMIN_WA_PHONE_ID` | Phone number ID for the admin OTP sender |
| `ADMIN_SESSION_DAYS` | Admin session duration (default 30) |
| `OTP_SMS_PROVIDER_URL` / `OTP_SMS_API_KEY` | Shop-owner OTP delivery (optional; logs to console if unset) |
| `MOCK_PAYMENTS` | If `true`, skips Razorpay verification in `meController.onboarding` |

`Client.access_token` is stored per row (not in env) — allows multi-tenant Graph API calls.

## Auth Models

- **Shop-owner portal** (`frontend/meetwave-client-portal/`) — `/api/auth/otp/{send,verify}` → JWT (`Authorization: Bearer <jwt>`); validated by `authJwt` middleware on `/api/me/*`. Uses `OtpRequest` table.
- **Admin portal** (`frontend/meetwave-admin/`) — `/api/admin/auth/otp/{send,verify}` → opaque session token (`Authorization: Bearer <token>`); validated by `verifyAdminSession` middleware on `/api/admin/panel/*` and `/api/admin/auth/{logout,me}`. Uses `AdminOtpRequest` table + `AdminPhone` allowlist + `AdminSession` table.
- **Legacy admin** (`/api/admin/*`, not `/api/admin/panel/*` or `/api/admin/auth/*`) — currently unauthenticated. Used only for backfill/dev; do not expose to the internet.

## First-time setup checklist

1. `npm install` (root + each frontend).
2. Configure `.env` with `DATABASE_URL`, `JWT_SECRET`, `APP_SECRET`, `ADMIN_WA_TOKEN`, `ADMIN_WA_PHONE_ID`.
3. `npx prisma migrate dev --name admin_flows_plans` to apply the schema.
4. `npx prisma db seed` to load Starter/Pro plans + the `rental_booking` flow.
5. Insert at least one row into `AdminPhone` for yourself: `INSERT INTO "AdminPhone" (id, phone, is_active) VALUES (gen_random_uuid(), '9XXXXXXXXX', true);`
6. Start backend (`npm run dev`), client portal (`cd frontend/meetwave-client-portal && npm run dev`), admin portal (`cd frontend/meetwave-admin && npm run dev`).
