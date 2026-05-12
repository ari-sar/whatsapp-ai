# Meetwave Admin Portal

Ionic React + Vite single-page admin app. Logs in with an OTP-allowlisted phone number, manages flows / users / plans / settings. Talks only to `/api/admin/auth/*` and `/api/admin/panel/*` on the backend.

## Architecture

- **State**: Zustand stores. `useAdminAuthStore` (persisted to `localStorage` key `meetwave-admin-auth`) holds the opaque session token, expiry, and the admin profile. `useFlowStore` and `useBuilderStore` are ephemeral builder state.
- **API**: `axios` instance with interceptors. Base URL from `VITE_API_BASE_URL` (defaults to `http://localhost:3000`). On any 401 the auth store is cleared so the router falls back to `/login`.
- **Routing**: `react-router-dom` v5 via `IonReactRouter`. Tab routes live under `/app/*`; flow editor is hoisted to top-level `/flows/:id` so it can use the full viewport (no tab bar).

## Folder Structure

```
src/
  main.tsx                      Bootstraps React + StrictMode
  App.tsx                       IonApp + IonRouterOutlet, guarded routes
  vite-env.d.ts
  theme/
    variables.css               Ionic theme overrides
  layouts/
    TabsLayout.tsx              IonTabs: Flow / Users / Plans / Settings
  pages/
    Login.tsx                   Phone → OTP two-stage form
    Flows.tsx                   List flows, new/edit/delete
    FlowEdit.tsx                Header metadata fields + <FlowCanvas/>
    Users.tsx                   Filter chips (All / No plan / Expired / Inactive) + list
    Plans.tsx                   Plan CRUD via modal with discount fields
    Settings.tsx                Static info + logout
  api/
    axiosInstance.ts            Bearer-token interceptor; clears session on 401
    authService.ts              sendOtp / verifyOtp / logout / getMe
    flowsService.ts             listFlows / getFlow / createFlow / updateFlow / deleteFlow
    plansService.ts             list/create/update/delete plans
    usersService.ts             listUsers(filter)
  store/
    useAdminAuthStore.ts        Persisted: token, expiresAt, admin
    useFlowStore.ts             Ephemeral: nodes, edges, flow metadata
    useBuilderStore.ts          Ephemeral: selectedNodeId, error, loading
  features/
    builder/
      FlowCanvas.tsx            ReactFlow canvas + toolbar + side inspector
      NodeInspector.tsx         Form for the currently selected step (type-driven)
      hooks/useFlowBuilder.ts   Bridges Zustand ↔ React Flow + saveFlow API call
      utils/flowTransform.ts    DB ↔ canvas: flowToNodes, nodesToSteps (with validation)
      nodes/
        StepNode.tsx            Custom React Flow node component
        nodeTypes.ts            Map (text|list|button|condition|start|end) → StepNode
        nodes.css
```

## Auth Flow

1. `Login.tsx` → `POST /api/admin/auth/otp/send` with `{ phone }`. Backend checks `AdminPhone` allowlist + rate limit + sends OTP via WhatsApp (using `ADMIN_WA_TOKEN` + `ADMIN_WA_PHONE_ID`).
2. User enters OTP → `POST /api/admin/auth/otp/verify` returns `{ token, expiresAt, admin }`.
3. Token + expiry stored in `useAdminAuthStore` (persisted). Router redirects to `/app/flows`.
4. Every subsequent API call attaches `Authorization: Bearer <token>`. Backend `verifyAdminSession` middleware looks up the session in DB, bumps `last_seen_at`, and rejects expired / disabled-admin / unknown-token requests.
5. Logout → `POST /api/admin/auth/logout` deletes the session row, store is cleared.

## Flow Builder

Two-pane layout inside `FlowEdit`:

1. **Canvas (ReactFlow)** — nodes are draggable; connect a source-handle (bottom) to a target-handle (top) of another node to create a transition. Selecting a node updates `useBuilderStore.selectedNodeId`.
2. **Inspector (NodeInspector)** — renders type-specific form fields for the selected node:
   - `text`: prompt, validation regex, invalid message, collectKey
   - `list`: prompt, buttonLabel, sections[].rows[], collectKey, collectLabelKey, invalidMessage
   - `button`: prompt, buttons[] (max 3), collectKey, invalidMessage
   - `condition` / `start` / `end`: label only; transitions added on the canvas
   - **Step ID** is editable — rename propagates to all edges. (Backend has no automatic rename for live `Lead.current_step` values — renaming breaks active conversations.)

Saving: `useFlowBuilder.saveFlow()` calls `nodesToSteps` to translate canvas state into the backend payload (FlowStepInput[]), then `POST /api/admin/panel/flows` (create) or `PUT /api/admin/panel/flows/:id` (update). Validation is light: needs at least one node, single (or zero) start node, name + businessType set. Server is the source of truth.

## Pages Behavior Notes

- **Users**: backend returns the list pre-filtered by `?filter=all|no_plan|expired|inactive`. `inactive` = no plan OR plan expired (matches the "inactive" filter the admin asked for).
- **Plans**: `priceInPaise` and `discountAmount` are integers in paise (₹1 = 100 paise). Features are stored as a string array; UI uses one-per-line textarea.
- **Settings**: shows admin profile + session expiry + backend URL + version. Logout posts to backend then clears the auth store. No mutable settings yet.

## Env Vars

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend base URL. Default `http://localhost:3000`. |

## Conventions

- **Field shape**: API responses are `camelCase`; payloads to write (POST/PUT) mostly mirror, except `FlowStepInput` which uses `snake_case` for `step_id`/`position_x`/`position_y` because the backend treats it as raw step shape. See `flowsService.ts`.
- **No mocks**: unlike client portal, this app talks to the backend directly. Add mocks if needed for dev without a running backend.
