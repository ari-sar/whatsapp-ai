# Backend Spec — Meetwave Client Portal

This document specifies the backend endpoints required by the client portal at `frontend/meetwave-client-portal/`. The frontend currently runs against mocks (`src/mocks/handlers.ts`, `USE_MOCKS = true`). Flip `USE_MOCKS` to `false` once these endpoints exist.

The existing backend at `src/` already has the WhatsApp webhook, multi-tenant `Client` model, and flow engine. Most additions below are **end-user endpoints** (`/api/me/*`) scoped to a JWT-authenticated business owner, plus plans, payments, and OTP auth.

## Conventions

- **Base URL**: same Express app, port 3000 dev / Railway prod.
- **Auth**: `Authorization: Bearer <jwt>` on all `/api/me/*` and any non-public endpoint listed below. Reject with `401` if missing/expired.
- **Content type**: `application/json` everywhere.
- **Errors**: `{ "error": "human readable message", "code"?: "MACHINE_CODE" }` with appropriate 4xx/5xx status.
- **IDs**: UUIDs unless stated otherwise.
- **Money**: integer paise. Currency `"INR"`.
- **Phone numbers**: 10-digit Indian numbers without country code in the database; assume `+91` prefix when calling external services (WhatsApp, OTP SMS).

## JWT shape

```json
{
  "sub": "<user uuid>",
  "phone": "9876543210",
  "iat": 1700000000,
  "exp": 1702592000
}
```

`exp` must be exactly **30 days** after `iat`. Sign with `JWT_SECRET` env var. The frontend reads `expiresAt` from the verify response and treats the session as dead at that timestamp.

## New Prisma models

Add to `prisma/schema.prisma`:

```prisma
model User {
  id              String   @id @default(uuid())
  phone           String   @unique
  name            String?
  business_name   String?
  business_type_id String? // = Flow.id (we reuse flow id as business type id)
  plan_id         String?
  is_onboarded    Boolean  @default(false)
  client_id       String?  @unique  // back-reference to the Client tenant created on onboarding

  client          Client?  @relation(fields: [client_id], references: [id])
  keywords        UserKeyword[]
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

model OtpRequest {
  id         String   @id @default(uuid())
  phone      String
  code_hash  String   // bcrypt/argon hash of the 6-digit code, never store plaintext
  expires_at DateTime
  consumed   Boolean  @default(false)
  attempts   Int      @default(0)
  created_at DateTime @default(now())

  @@index([phone, created_at])
}

model Plan {
  id             String   @id @default(uuid())
  name           String
  price_in_paise Int
  currency       String   @default("INR")
  billing_cycle  String   // "monthly" | "yearly" | "one-time"
  features       String[] // array of feature strings
  is_active      Boolean  @default(true)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
}

model BusinessFlow {
  id           String  @id           // matches existing Flow registry id (e.g. "rental_booking")
  business_type String                // "Appliance Rental"
  name         String                 // "Rental Booking"
  description  String
  step_count   Int
  is_active    Boolean @default(true)
}

model UserKeyword {
  id               String   @id @default(uuid())
  user_id          String
  trigger          String   // lowercased
  response_message String
  user             User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  @@unique([user_id, trigger])
}

model PaymentOrder {
  id                String   @id @default(uuid())
  user_id           String
  plan_id           String
  razorpay_order_id String   @unique
  amount            Int
  currency          String
  status            String   // "created" | "paid" | "failed"
  razorpay_payment_id String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}
```

The existing `Keyword` model on `Client` stays — that's the runtime trigger table used by the webhook engine. `UserKeyword` is the owner-facing editable list. On every save, mirror `UserKeyword` rows into `Keyword` rows under the user's `Client` (or use `UserKeyword` directly in `messageProcessor.ts` — your call; see note at the end).

## Endpoints

### Auth

#### POST `/api/auth/otp/send`

Public. Generates a 6-digit code, hashes it into `OtpRequest`, sends via SMS provider (MSG91/Twilio/etc — wire up later, log to console in dev). Rate-limit per phone (e.g., 1 per 30s, 5 per hour).

Request:
```json
{ "phone": "9876543210" }
```

Response 200:
```json
{ "requestId": "<otp uuid>", "expiresInSeconds": 300 }
```

Errors: `400` invalid phone, `429` rate limited.

#### POST `/api/auth/otp/verify`

Public. Verifies the code against the most recent unconsumed `OtpRequest` for that phone. On success: marks request consumed, upserts a `User` row, returns JWT. If user already exists with `is_onboarded = false`, return `isNew: true` (semantically "needs onboarding") — the frontend uses this only as a hint; the gate is `user.isOnboarded`.

Request:
```json
{ "phone": "9876543210", "otp": "123456" }
```

Response 200:
```json
{
  "token": "<jwt>",
  "expiresAt": 1702592000000,
  "isNew": true,
  "user": {
    "id": "<uuid>",
    "phone": "9876543210",
    "name": null,
    "businessName": null,
    "businessTypeId": null,
    "planId": null,
    "isOnboarded": false,
    "createdAt": "2026-05-12T10:00:00.000Z"
  }
}
```

`expiresAt` is **milliseconds since epoch**, not seconds. Errors: `400` bad OTP, `410` expired, `429` too many attempts.

### Current user

#### GET `/api/me`

Auth required. Returns the same `user` shape as above.

Response 200: `User`

#### POST `/api/me/onboarding`

Auth required. Sets the user's profile, validates the plan and businessType, creates a `Client` row tied to this user (this is what the webhook engine looks up via `phone_number_id` — you'll need to add a step where the user provides their WhatsApp `phone_number_id` and `access_token`, OR pre-provision a shared phone number — out of scope for v1, leave `Client.access_token` empty and have ops fill it). Marks `is_onboarded = true`.

Request:
```json
{
  "name": "Asha Verma",
  "businessName": "Asha Appliance Rentals",
  "businessTypeId": "rental_booking",
  "planId": "<plan uuid>",
  "paymentId": "<razorpay payment id>",
  "orderId": "<razorpay order id>"
}
```

Validation: verify the `PaymentOrder` exists with `status = "paid"`, `user_id` matches the JWT subject, and `plan_id` matches. Reject if not.

Response 200: updated `User`.

Errors: `400` validation, `402` payment not verified.

### Plans

#### GET `/api/plans`

Public (no auth needed — shown during onboarding). Returns active plans.

Response 200:
```json
[
  {
    "id": "<uuid>",
    "name": "Starter",
    "priceInPaise": 49900,
    "currency": "INR",
    "billingCycle": "monthly",
    "features": ["1 active flow", "50 keywords", "Up to 200 leads/month"],
    "isActive": true
  }
]
```

### Flows

#### GET `/api/flows`

Public (used in onboarding). Returns all active `BusinessFlow` rows.

Response 200:
```json
[
  {
    "id": "rental_booking",
    "businessType": "Appliance Rental",
    "name": "Rental Booking",
    "description": "Pincode → service selection → confirm booking.",
    "stepCount": 3
  }
]
```

Seed this table from the in-code flow registry at `src/flows/index.ts`.

#### GET `/api/me/flow`

Auth required. Returns the user's currently selected flow id.

Response 200:
```json
{ "flowId": "rental_booking" }
```

Returns `{ "flowId": null }` if none set.

#### PUT `/api/me/flow`

Auth required. Changes the user's flow.

Request:
```json
{ "flowId": "restaurant_order" }
```

Response 200:
```json
{ "flowId": "restaurant_order" }
```

Implementation: update `User.business_type_id`. **Do not retroactively change `Lead.current_flow_id`** for in-flight leads — they should finish or time out in their current flow.

Errors: `400` unknown `flowId`.

### Keywords (owner-managed)

All auth required. All scoped to the authenticated user via `UserKeyword`.

#### GET `/api/me/keywords`

Response 200:
```json
[
  {
    "id": "<uuid>",
    "trigger": "price",
    "responseMessage": "Our prices start at ₹999.",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### POST `/api/me/keywords`

Request:
```json
{ "trigger": "PRICE", "responseMessage": "Our prices start at ₹999." }
```

Lowercase the `trigger` before storing. Reject duplicates per user with `409`.

Response 201: created `Keyword`.

#### PUT `/api/me/keywords/:id`

Request: same as POST. Reject if `id` doesn't belong to the JWT user with `404`.

Response 200: updated `Keyword`.

#### DELETE `/api/me/keywords/:id`

Response 204 (no body) or 200 `{ "deleted": true }`.

### Leads

#### GET `/api/me/leads/stats`

Auth required. Aggregates `Lead` rows for this user's `Client`.

Response 200:
```json
{
  "total": 152,
  "monthly": [
    { "month": "Dec 25", "count": 12 },
    { "month": "Jan 26", "count": 30 },
    { "month": "Feb 26", "count": 28 },
    { "month": "Mar 26", "count": 35 },
    { "month": "Apr 26", "count": 22 },
    { "month": "May 26", "count": 25 }
  ]
}
```

Return the last 6 months including the current month, in chronological order. `month` format: `"MMM YY"` localized to `en-IN`. Backfill missing months with `count: 0`.

### Payments (Razorpay)

#### POST `/api/payments/orders`

Auth required. Creates a Razorpay order via server-side SDK, persists a `PaymentOrder` row with status `"created"`.

Request:
```json
{ "planId": "<plan uuid>" }
```

Response 200:
```json
{
  "orderId": "order_NXXX...",
  "amount": 49900,
  "currency": "INR",
  "keyId": "rzp_test_..."
}
```

`keyId` is the **public** Razorpay key id, safe to send to the client. The secret stays server-side.

#### POST `/api/payments/verify`

Auth required. Verifies the Razorpay HMAC signature, marks `PaymentOrder` status `"paid"`. Returns `verified: true` only on success.

Request:
```json
{
  "razorpayPaymentId": "pay_NXXX...",
  "razorpayOrderId": "order_NXXX...",
  "razorpaySignature": "<hmac>"
}
```

Verification logic:
```js
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(razorpayOrderId + '|' + razorpayPaymentId)
  .digest('hex');
const verified = expected === razorpaySignature;
```

Response 200:
```json
{ "verified": true }
```

If verification fails, return `{ "verified": false }` with status `200` (the frontend treats this as a failure). Optionally also return `400` — either is fine, the frontend reads `verified`.

## Environment variables to add

```
JWT_SECRET=<random 64-byte string>
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=<secret>
OTP_SMS_PROVIDER_URL=<MSG91/Twilio endpoint>
OTP_SMS_API_KEY=<provider key>
```

## Existing endpoints to revisit (separate from this spec)

The current backend has these gaps documented in `CLAUDE.md`. The portal does **not** depend on them for v1, but they should be cleaned up:

1. `keywordController.createKeyword` does not accept `flow_id` — fix so admins can wire keyword→flow rules. (Note: portal users no longer manage flows. This becomes purely an admin/internal concern.)
2. `adminRoutes` has no auth middleware — add `x-api-key` validation distinct from user JWT.
3. `Keyword.response_id` and `Keyword.flow_id` mutual-exclusion is not enforced — validate at the controller layer.

## Integration note: `UserKeyword` vs runtime `Keyword`

The webhook message processor (`src/services/messageProcessor.ts`) currently looks up `Keyword` by `client_id`. There are two options for hooking up user-managed keywords:

- **Option A** (recommended): On every UserKeyword create/update/delete, sync a mirror row in `Keyword` (with `client_id = user.client_id`). The processor stays unchanged. Simpler runtime path; one-way replication you control.
- **Option B**: Modify `messageProcessor.routeToKeyword` to query `UserKeyword` via the user's `client_id → user_id` join. One table, no sync, but adds a join on every inbound message.

Pick whichever fits your team's preferences. The frontend doesn't care.
