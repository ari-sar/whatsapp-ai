# Meetwave Flow Builder — Project Structure

## Architecture Overview

This is a **feature-based** Ionic React application for building and managing WhatsApp conversational flows. The structure separates concerns across API, state management, UI components, and business logic.

## Directory Structure

```
src/
├── api/
│   ├── axiosInstance.ts       # Axios with x-api-key interceptor
│   ├── flowService.ts         # Flow CRUD endpoints
│   └── leadService.ts         # Leads & Keywords API calls
├── components/
│   ├── shared/
│   │   └── Header.tsx         # Reusable header with logout
│   └── onboarding/
│       ├── ApiKeyForm.tsx     # Backend URL + API key input
│       └── OnboardingScreen.tsx  # Full onboarding page
├── features/
│   ├── builder/               # Flow Builder feature
│   │   ├── nodes/
│   │   │   ├── StepNode.tsx   # Custom React Flow node
│   │   │   └── nodeTypes.ts   # Node type registry
│   │   ├── hooks/
│   │   │   └── useFlowBuilder.ts  # State sync + actions
│   │   ├── utils/
│   │   │   └── flowTransform.ts   # nodes/edges <-> JSON
│   │   └── FlowCanvas.tsx     # Main builder UI
│   ├── crm/                   # Leads management feature
│   │   └── LeadsTable.tsx     # View & manage leads
│   └── onboarding/            # (Placeholder for future expansion)
├── store/
│   ├── useFlowStore.ts        # Zustand: Flow (nodes, edges, metadata)
│   ├── useSettingsStore.ts    # Zustand: Backend URL, API key (persisted)
│   └── useBuilderStore.ts     # Zustand: UI state (selected node, pan, zoom)
├── types/
│   ├── flow.ts                # Flow, Step, StepConfig types
│   └── crm.ts                 # Lead, Keyword, Response types
├── theme/
│   └── variables.css          # Ionic design tokens
├── App.tsx                    # Main routing + sidebar
└── main.tsx                   # React bootstrap
```

## Key Design Patterns

### 1. **API Interceptor** (`api/axiosInstance.ts`)
- Automatically injects `x-api-key` header from `useSettingsStore`
- Base URL is dynamically set from settings or `VITE_API_BASE_URL`
- No manual auth management in components

### 2. **Dual State Representation** (Flow Builder)
- **React Flow format**: `nodes` (position, data) + `edges` (connections)
- **Engine JSON format**: Nested tree structure matching Prisma backend
- `flowTransform.ts` bridges the two:
  - `nodesToFlow()` → saves to backend
  - `flowToNodes()` → loads from backend

### 3. **Zustand Triple-Store**
- **`useFlowStore`**: Canvas state (nodes, edges, flow metadata). Changes drive UI.
- **`useSettingsStore`**: Backend credentials. Persisted to localStorage. Provides onboarding gate.
- **`useBuilderStore`**: Ephemeral UI state (selected node, pan, zoom, loading, errors).

### 4. **Feature-Based Modules**
- Each major feature (builder, crm, onboarding) lives in `features/`
- Self-contained: its own components, hooks, utils, types
- Avoids "component soup" — predictable file locations

### 5. **Custom React Flow Nodes**
- `StepNode.tsx` renders all step types (text, list, button, condition, start, end)
- Styled in `nodes.css` — selected nodes highlight with primary color
- Registry in `nodeTypes.ts` — maps node type → component

## Workflow: Building a Flow

1. **Onboarding**: User enters backend URL + API key → stored in `useSettingsStore`
2. **Create Flow**: Open builder, add steps via dropdown (`addNewNode`)
3. **Edit Steps**: Click node → updates stored in `useFlowStore`
4. **Connect**: Drag edges between nodes → stored in `useFlowStore`
5. **Save**: Click "Save" → `useFlowBuilder.saveFlow()`:
   - Validates flow (`validateFlow`)
   - Transforms to JSON (`nodesToFlow`)
   - Sends to backend (`flowService.updateFlow`)
6. **CRM**: View leads, see current flow + step for each lead

## Getting Started

```bash
cd frontend/meetwave-client-portal

# Install dependencies (already done)
npm install

# Start dev server
npm run dev

# Navigate to http://localhost:5173
# Enter backend URL (e.g., https://your-railway-app.up.railway.app)
# Enter API key from admin panel
# Start building flows!
```

## Future Enhancements

- Settings page (change credentials, reset)
- Flow templates / cloning
- Flow versioning
- Analytics dashboard
- Webhook testing tool
- Flow execution logs
