# Meetwave — WhatsApp AI SaaS

Multi-tenant WhatsApp bot platform. Businesses (Clients) configure keywords and conversational flows; customers interact via WhatsApp; state is persisted per lead.

## Folder Structure

```
src/                          Backend (Node/Express/TypeScript)
  index.ts                    Entry: Express setup, middleware, route mounts
  routes/
    adminRoutes.ts            /api/admin/* — CRUD for Clients, Responses, Keywords, Leads
    webhookRoutes.ts          /webhook — WhatsApp Cloud API receive
  controllers/
    webhookHandler.ts         Parses WhatsApp payload → IncomingInput, acks 200, fires processMessage
    clientController.ts       Client CRUD (multi-tenant owner of keywords/leads)
    responseController.ts     Static reply templates
    keywordController.ts      Trigger rules: keyword → response OR flow
    leadController.ts         Read-only lead list
  services/
    messageProcessor.ts       Core dispatch: active flow step OR keyword match
    whatsappApi.ts            Graph API wrappers (sendTextMessage, sendInteractiveListMessage, sendInteractiveButtonMessage)
  flows/
    types.ts                  Flow, Step, FlowContext, StepResult, IncomingInput interfaces
    index.ts                  Flow registry: Record<id, Flow> + getFlow(id)
    rentalBookingFlow.ts      Example 3-step flow (pincode → service list → confirm buttons)
  middleware/
    verifySignature.ts        HMAC-SHA256 webhook signature check (requires APP_SECRET env)
  config/
    prisma.ts                 Singleton PrismaClient

prisma/
  schema.prisma               DB schema (Client, Response, Keyword, Lead)

frontend/meetwave-client-portal/   Visual flow builder (Ionic React + Vite)
  src/
    api/
      axiosInstance.ts        Axios with dynamic baseURL + x-api-key from useSettingsStore
      flowService.ts          Flow CRUD calls to /api/admin/flows
      leadService.ts          Leads + keywords API calls
    store/
      useSettingsStore.ts     Persisted: backendUrl, apiKey — gates onboarding
      useFlowStore.ts         Canvas state: nodes, edges, flow metadata
      useBuilderStore.ts      Ephemeral UI: selectedNodeId, loading, error
    features/
      builder/
        FlowCanvas.tsx        Main React Flow canvas
        hooks/useFlowBuilder.ts  Sync between Zustand ↔ React Flow, saveFlow
        utils/flowTransform.ts   nodesToFlow() and flowToNodes() — dual-state bridge
        nodes/StepNode.tsx    Custom React Flow node component
      crm/LeadsTable.tsx      Lead list with active flow/step display
    components/
      onboarding/             API key + backend URL entry — shown if !isConfigured()
      shared/Header.tsx       IonHeader with menu button + logout
    types/
      flow.ts                 StepType, StepConfig, Flow, Step types (portal-side)
```

## Execution Flow (Webhook → Response)

```
POST /webhook
  webhookHandler.ts
    parseIncomingInput(message) → { type: 'text'|'list'|'button', value: string }
    res.sendStatus(200)           ← must ack before processing (WhatsApp times out ~5s)
    processMessage(phoneNumberId, from, input)  ← async, fire-and-forget

  messageProcessor.ts
    find Client by phone_number_id
    upsert Lead (last_message, timestamp)

    if Lead.current_flow_id && Lead.current_step:
      getFlow(flow_id) → step.handle(input, ctx)
        → StepResult { nextStep, collectedPatch?, error? }
        → update Lead.current_step + collected_data
        → if nextStep !== null: call nextStep.prompt(ctx)
        → if nextStep === null: clear Lead flow state

    else if input.type === 'text':
      find Keyword by (client_id, trigger)
        → if Keyword.flow_id: set Lead.current_flow_id/step, call flow.initialStep.prompt()
        → if Keyword.response_id: sendTextMessage(response.message)
        → else: send default_fallback response or hardcoded fallback text
```

## Stateful Flows

Flows live in `src/flows/`. Each flow implements the `Flow` interface:
- `id`: matches the `Keyword.flow_id` value (e.g. `"rental_booking"`)
- `initialStep`: first step ID
- `steps`: Record of `Step` objects, each with `prompt(ctx)` and `handle(input, ctx)`

**To add a new flow:**
1. Create `src/flows/<name>Flow.ts` — implement `Flow` from `src/flows/types.ts`
2. Register it in `src/flows/index.ts` flowRegistry
3. Insert a `Keyword` row with `flow_id = <flow.id>` via API or direct DB
4. No migration needed (flows are code, not DB rows)

`FlowContext.send` provides `text`, `list`, `button` — use these instead of importing whatsappApi directly inside flows.

## Naming Conventions

- Flow IDs: `snake_case` (e.g. `rental_booking`)
- Step IDs: `PascalCase_with_underscores` (e.g. `Awaiting_Pincode`, `Awaiting_Service`)
- Keyword triggers: stored and matched as `lowercase` (enforced in `keywordController.createKeyword`)
- Button/List reply IDs: `snake_case` (e.g. `confirm_yes`, `svc_ac`) — returned verbatim by WhatsApp

## Known Gaps (not yet implemented)

1. **`/api/admin/flows` routes don't exist** — the portal's `flowService.ts` calls these but they're not in `adminRoutes.ts`. Flows are hardcoded in `src/flows/`, not stored in DB.
2. **Admin API has no auth middleware** — `adminRoutes.ts` exposes all CRUD without `x-api-key` validation.
3. **`keywordController.createKeyword` doesn't accept `flow_id`** — only `response_id` is wired. Must add `flow_id` to the create body and DB write.
4. **Portal calls backend directly** — no Flow model in Prisma yet. If flows are moved to DB, schema migration and new routes are both required.

## Safety Rules

- **Schema changes**: always run `npx prisma migrate dev --name <desc>` after editing `prisma/schema.prisma`. Never edit generated `src/config/prisma.js` directly.
- **`Keyword.response_id` and `Keyword.flow_id` are mutually exclusive** — enforce this in `keywordController.ts`; only one should be set.
- **Webhook must ack 200 before any async work** — never await heavy operations before `res.sendStatus(200)`.
- **`Client.access_token`** is the per-tenant WhatsApp Graph API token, not the admin API key. Keep them separate.
- **Don't edit compiled JS files** (`src/*.js`, `src/*.d.ts`) — these are tsc output. Edit `.ts` source only.
- **Flow step IDs must be stable** — changing a step ID in code while leads have that value in `Lead.current_step` will break active conversations.

## Environment Variables (backend)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `APP_SECRET` | WhatsApp app secret for webhook signature verification |
| `PORT` | Server port (default 3000) |

`Client.access_token` is stored per row (not in env) — allows multi-tenant Graph API calls.

## Portal Auth Model

The portal (`meetwave-client-portal`) asks for a `backendUrl` and `apiKey` at onboarding. These are stored in `useSettingsStore` (localStorage, key: `meetwave-settings`) and injected as `x-api-key` header via `axiosInstance.ts`. The backend does not yet validate this header.
