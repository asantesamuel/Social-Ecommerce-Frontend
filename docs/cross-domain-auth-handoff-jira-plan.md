# Cross-Domain Authentication Handoff Plan

## Document Status

This document is an implementation plan. The authentication handoff described below has not yet been implemented.

It contains two coordinated Jira tickets:

1. A backend ticket for issuing and exchanging short-lived authorization codes.
2. A frontend ticket for creating host-local sessions in the storefront, admin dashboard, and vendor dashboard.

The backend ticket must establish and test the API contract before the frontend integration is considered complete.

## Architecture Decision

The three Next.js applications will remain independently deployed on separate Vercel hostnames. They will not attempt to share cookies across `*.vercel.app` domains.

Authentication will use a custom authorization-code handoff:

1. A protected dashboard creates a local handoff transaction containing a random `state` value and PKCE verifier.
2. The dashboard stores the temporary values in short-lived, host-local, HttpOnly cookies.
3. The dashboard redirects the browser to the storefront authorization route.
4. The storefront authenticates the user, or reuses its existing local session.
5. The storefront asks the backend to create a one-time authorization code for the requested dashboard.
6. The backend checks the user's current role, hashes the code, stores the handoff in Redis with a short TTL, and returns an allowlisted callback URL.
7. The browser carries only the one-time code and state to the dashboard callback.
8. The dashboard verifies state and exchanges the code server-to-server using its PKCE verifier and server-only client secret.
9. The backend atomically consumes the code and issues a new access/refresh token pair for that dashboard session.
10. The dashboard stores those tokens in host-local, HttpOnly cookies and redirects to the protected page.

Real access tokens and refresh tokens must never appear in redirect URLs, browser history, analytics, or client-side JavaScript responses.

## Current Codebase Findings

### Backend

Repository: `D:/Projects/Ecommerce_Social_Web_App/ecommerce-api`

- `src/modules/auth/auth.controller.ts` exposes register, login, refresh, and logout endpoints through tsoa.
- `src/modules/auth/auth.service.ts` validates credentials, issues 15-minute access JWTs and 7-day refresh JWTs, persists refresh tokens, and enforces failed-login blocking.
- `src/entities/RefreshToken.ts` stores refresh tokens in PostgreSQL.
- `src/utils/jwt.ts` signs and verifies access and refresh JWTs.
- `src/middlewares/authenticate.ts` supplies tsoa JWT authentication.
- `src/middlewares/rateLimiter.ts` supplies Redis-backed production rate limiting and an in-memory development/test fallback.
- `src/config/env.ts` validates production configuration with Zod and already requires Redis in production.
- `src/config/frontendOrigins.ts` validates exact frontend origins for CORS.
- `src/tests/auth.test.ts` uses Jest and Supertest for auth integration tests.
- No authorization-code handoff endpoint, client registry, PKCE validation, or one-time-code store exists.

### Frontend

Repository: `D:/Projects/Ecommerce_Social_Web_App/ecommerce-frontend`

- `packages/api/src/session.ts` writes access tokens, refresh tokens, and roles into JavaScript-readable cookies.
- `packages/api/src/client.ts` reads the access token in JavaScript, attaches a bearer header, refreshes after a 401, and redirects to the storefront login when refresh fails.
- `packages/api/src/route-guards.ts` assumes the current application can read the cookies created by the storefront.
- `apps/storefront/hooks/useAuth.ts` logs in directly against the backend, writes tokens in the browser, and redirects by role.
- `apps/admin-dashboard/proxy.ts` and `apps/vendor-dashboard/proxy.ts` redirect missing sessions directly to the storefront login.
- The separate Vercel hostnames cannot read one another's host-local cookies, producing the confirmed redirect loop.
- No server-side login route, BFF proxy, handoff start route, handoff callback route, PKCE helper, or cross-app E2E test currently exists.

---

# Jira Ticket 1: Backend

## Title

Implement secure one-time authorization-code handoff for independently deployed frontend applications

## Type

Story / Security-sensitive backend feature

## Priority

Critical

## Problem Statement

The storefront, admin dashboard, and vendor dashboard are deployed on different Vercel hostnames. A login session created on the storefront cannot be read by the other applications. Redirecting authenticated admin and vendor users between applications therefore causes an infinite redirect loop.

The backend must provide a secure mechanism that lets an authenticated storefront session authorize a specific dashboard to create its own independent session. The mechanism must not place access tokens or refresh tokens in URLs and must reject expired, replayed, tampered, wrong-client, and wrong-role exchanges.

## Goal

Add a standards-informed authorization-code handoff using:

- Random, opaque, single-use authorization codes.
- SHA-256 code hashing at rest.
- Redis TTL and atomic consumption.
- PKCE S256 verification.
- Exact client and callback registration.
- Server-only client authentication during exchange.
- Existing JWT access/refresh token issuance after successful exchange.
- Current user and role revalidation at both authorization and exchange time.

## User Story

As an authenticated admin or vendor, I want the backend to issue a short-lived handoff code for my authorized dashboard so that the dashboard can create its own session without receiving credentials or long-lived tokens through the browser URL.

## In Scope

- A validated handoff client registry for admin and vendor dashboards.
- A protected endpoint that creates a one-time handoff code.
- An exchange endpoint called by the target Next.js server.
- PKCE S256 challenge/verifier support.
- Server-only per-client secret validation.
- Exact callback URL generation from backend configuration.
- Role-to-client authorization.
- Redis-backed handoff storage with atomic one-time consumption.
- In-memory handoff storage for local development and tests when Redis is unavailable.
- Dedicated rate limiting for create and exchange operations.
- Jest/Supertest coverage, store-level concurrency/replay coverage, configuration validation, and Swagger generation.
- Environment and deployment documentation.

## Out of Scope

- Replacing the existing email/password login mechanism.
- Introducing Clerk, Auth0, Descope, or another identity provider.
- Sharing cookies across domains.
- Social login, MFA, password reset, email verification, or account recovery.
- Redesigning the current JWT claims or refresh-token lifetime.
- Broad refresh-token hashing or rotation changes unrelated to handoff. Those should be tracked separately.
- Treating frontend role cookies as authoritative. Backend authorization remains authoritative.

## Proposed API Contract

### POST `/auth/handoff/authorize`

Authentication: existing access JWT through `@Security('jwt')`.

Request:

```json
{
  "clientId": "admin-dashboard",
  "state": "opaque-random-state",
  "codeChallenge": "base64url-sha256-challenge",
  "codeChallengeMethod": "S256"
}
```

Supported client IDs:

- `admin-dashboard`, requiring the current user role to be `admin`.
- `vendor-dashboard`, requiring the current user role to be `vendor`.

The endpoint must not accept an arbitrary callback URL. It must resolve the exact callback URL from validated server configuration.

Successful response: `201 Created`

```json
{
  "redirectUrl": "https://registered-dashboard.example/auth/callback?code=opaque-code&state=opaque-random-state",
  "expiresIn": 60
}
```

Expected errors:

- `400` for malformed client, state, challenge, or unsupported challenge method.
- `401` for missing/invalid access token.
- `403` for inactive users or role/client mismatch.
- `429` when handoff creation limits are exceeded.

### POST `/auth/handoff/exchange`

Authentication: server-only client credentials. Prefer HTTP Basic client authentication or an equivalently explicit header parsed only on the server. Client secrets must never be accepted from browser JavaScript or returned in any response.

Request:

```json
{
  "clientId": "admin-dashboard",
  "code": "opaque-code",
  "codeVerifier": "original-pkce-verifier"
}
```

Successful response: `200 OK`

```json
{
  "accessToken": "existing-access-jwt-format",
  "refreshToken": "existing-refresh-jwt-format",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }
}
```

Expected errors must use a generic response that does not reveal whether the code, client, verifier, or user was the failing element:

- `400` or `401` for invalid, expired, consumed, wrong-client, or PKCE-mismatched codes.
- `403` for an inactive user or a role that no longer permits the requested client.
- `429` when exchange limits are exceeded.

## Persistence and Security Design

Use Redis because handoff codes are ephemeral, must expire automatically, and need atomic one-time consumption.

Store only a SHA-256 hash of the authorization code. The Redis value may contain:

```text
userId
clientId
codeChallenge
codeChallengeMethod
createdAt
```

Requirements:

- Generate codes with at least 32 cryptographically random bytes and base64url encoding.
- Hash the code before using it as a Redis key.
- Use a default TTL of 60 seconds, configurable within a conservative bounded range.
- Atomically read and delete the handoff record during exchange using `GETDEL` or an equivalent Lua script.
- A failed PKCE/client validation must not permit a later replay. The implementation must define whether invalid exchange attempts consume the code; the conservative recommendation is to consume it once presented to the exchange endpoint.
- Do not store raw authorization codes, access tokens, refresh tokens, passwords, client secrets, or request bodies in logs.
- Do not add a PostgreSQL entity or migration unless Redis cannot satisfy an explicit production requirement. This feature does not require durable authorization-code retention.
- Continue persisting the newly issued refresh token through the existing `RefreshToken` repository.
- Re-fetch the user during exchange and verify `isActive` and the current database role before issuing tokens.

## Configuration

Add Zod-validated environment variables in `src/config/env.ts` and document them in `.env.example` and `README.md`:

```env
AUTH_HANDOFF_CODE_TTL_SECONDS=60
AUTH_HANDOFF_ADMIN_CALLBACK_URL=https://admin-app.vercel.app/auth/callback
AUTH_HANDOFF_VENDOR_CALLBACK_URL=https://vendor-app.vercel.app/auth/callback
AUTH_HANDOFF_ADMIN_CLIENT_SECRET=<random-server-secret>
AUTH_HANDOFF_VENDOR_CLIENT_SECRET=<different-random-server-secret>
```

Configuration requirements:

- Callback values must be absolute HTTPS URLs in production.
- Callback paths must be exact; wildcard callback URLs are forbidden.
- Production must fail fast when a callback or client secret is missing.
- Development may use exact localhost callback URLs.
- Secrets must be at least 32 random bytes and must not be printed during validation failures.
- Existing `FRONTEND_URLS` must continue to include the three deployed frontend origins.

## Likely Backend Files

Existing files to extend:

- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.dto.ts`
- `src/modules/auth/auth.service.ts`
- `src/config/env.ts`
- `src/app.ts`
- `src/tests/auth.test.ts`
- `.env.example`
- `README.md`

Likely new files:

- `src/modules/auth/auth-handoff.service.ts`
- `src/modules/auth/auth-handoff.store.ts`
- `src/config/authClients.ts`
- `src/config/redis.ts` if Redis ownership is moved out of `rateLimiter.ts`
- `src/tests/authHandoff.test.ts`
- Focused unit tests for the handoff store and PKCE helpers

Do not duplicate Redis clients. Refactor the existing Redis construction from `src/middlewares/rateLimiter.ts` into a shared infrastructure module if both rate limiting and handoff storage need it.

## Ordered Implementation Tasks

### Task 1: Define and validate registered handoff clients

**Goal:** Establish one authoritative mapping from client ID to callback URL, required role, and secret.

**What needs to be done:**

- Extend `src/config/env.ts` with bounded TTL, exact callbacks, and client secrets.
- Add a typed client registry containing `clientId`, `callbackUrl`, `requiredRole`, and secret comparison behavior.
- Validate HTTPS in production and exact localhost URLs in development/test.
- Update `.env.example` and `README.md` without adding real secrets.

**Why it matters:** Prevents open redirects, wrong-application token issuance, and accidental production misconfiguration.

**Dependencies:** None.

**Risk:** High because incorrect callback validation can create an account-takeover path.

### Task 2: Add the one-time Redis handoff store

**Goal:** Persist authorization transactions for a short time and consume them exactly once.

**What needs to be done:**

- Extract or reuse a single Redis connection.
- Define a store interface with create and atomic consume operations.
- Hash raw codes before storage.
- Apply TTL at creation.
- Implement a deterministic in-memory test/development fallback with the same semantics.
- Add concurrency tests proving that two simultaneous exchanges cannot both succeed.

**Why it matters:** Replay resistance is the central security property of the handoff.

**Dependencies:** Task 1.

**Risk:** Critical because non-atomic consumption can issue multiple sessions from one code.

### Task 3: Implement authorize and exchange services

**Goal:** Create role-bound codes and exchange them for existing JWT sessions.

**What needs to be done:**

- Validate state and PKCE S256 values.
- Enforce role-to-client mapping during authorization.
- Generate a random code, persist only its hash, and construct the configured callback URL.
- Authenticate the target client during exchange using constant-time secret comparison.
- Atomically consume the code.
- Verify the PKCE code verifier.
- Re-fetch the user and check account activity and role.
- Reuse or extract the existing JWT/refresh-token issuance logic to avoid divergent token behavior.
- Return generic exchange failures.

**Why it matters:** This is the security boundary that authorizes one application to create a session for a user authenticated elsewhere.

**Dependencies:** Tasks 1 and 2.

**Risk:** Critical because code, role, or client-validation mistakes can create privilege escalation.

### Task 4: Expose, rate-limit, and document the endpoints

**Goal:** Publish stable tsoa contracts without weakening existing login controls.

**What needs to be done:**

- Add DTOs and controller methods.
- Protect authorize with `@Security('jwt')`.
- Apply a dedicated exchange/client limiter rather than relying only on the broad `/auth` limiter.
- Ensure generated routes and Swagger document both include the endpoints.
- Return consistent API errors through the existing error handler.
- Add structured security events without codes, tokens, secrets, or request bodies.

**Why it matters:** Makes the feature consumable and observable while controlling abuse.

**Dependencies:** Task 3.

**Risk:** High due to auth routing and rate-limit interactions.

### Task 5: Add integration, replay, expiry, and authorization tests

**Goal:** Demonstrate the complete contract and all important failure boundaries.

**What needs to be done:**

- Test successful admin and vendor authorization/exchange.
- Test role/client mismatches.
- Test invalid and missing client credentials.
- Test wrong PKCE verifier.
- Test expired code.
- Test replay after successful exchange.
- Test concurrent exchange attempts.
- Test inactive or role-changed users between authorize and exchange.
- Test exact configured callback output and state echo.
- Test code/secret/token absence from logs and responses where feasible.
- Verify existing login, refresh, logout, rate-limit, migration, and protected-resource tests remain green.

**Why it matters:** Authentication behavior is not complete until failure and replay paths are verified.

**Dependencies:** Tasks 1-4.

**Risk:** High because incomplete tests can leave silent security regressions.

## Backend Acceptance Criteria

1. Given an authenticated admin, when `admin-dashboard` authorization is requested with valid PKCE data, the API returns an exact configured admin callback containing only a one-time code and the supplied state.
2. Given an authenticated vendor, the equivalent vendor flow succeeds.
3. A customer cannot create admin or vendor handoff codes.
4. An admin cannot create a vendor handoff code, and a vendor cannot create an admin handoff code.
5. Arbitrary callback URLs supplied by clients are rejected or ignored; the backend always uses its registry.
6. Raw authorization codes are never stored in Redis or PostgreSQL.
7. Authorization codes expire automatically and cannot be exchanged after expiry.
8. A code can create no more than one session, including under concurrent exchange attempts.
9. The exchange fails for the wrong client ID, client secret, or PKCE verifier.
10. The exchange rechecks user activity and role before issuing tokens.
11. Successful exchange issues tokens with the same claims and lifetimes as ordinary login and persists the refresh token through the existing repository.
12. No access token, refresh token, authorization code, verifier, password, or client secret is logged.
13. Production startup fails clearly when required handoff configuration is missing or unsafe.
14. Swagger, build, lint, and all focused/full auth tests pass.

## Backend Definition of Done

- API contract is reviewed with the frontend owner.
- All backend acceptance criteria pass.
- Generated tsoa routes and Swagger are updated.
- Environment examples and Render configuration guidance are updated.
- Redis unavailability behavior is explicit and production-safe.
- Existing auth behavior remains backward compatible until the frontend migration is deployed.
- No raw secrets or tokens are committed.
- The completion report names changed files, migration impact, test commands/results, remaining risks, and exact frontend contract.

---

# Jira Ticket 2: Frontend

## Title

Implement cross-domain authorization-code handoff and host-local server sessions across storefront, admin, and vendor applications

## Type

Story / Security-sensitive frontend platform feature

## Priority

Critical

## Dependency

Blocked by the reviewed backend handoff contract from Jira Ticket 1. Frontend scaffolding may use mocks, but production integration cannot be accepted before the backend exchange behavior is verified.

## Problem Statement

The storefront currently writes JWTs into JavaScript-readable cookies and redirects admin/vendor users directly to separate Vercel applications. Those applications cannot read storefront cookies, so their proxies redirect the user back to login, creating an infinite loop.

The frontend must implement a browser-safe handoff where each application owns its own HttpOnly session cookies. The browser may carry a short-lived authorization code between domains, but it must never receive access or refresh tokens in a URL or JavaScript response.

## Goal

- Keep all three Vercel projects independently deployed.
- Introduce dashboard-local handoff start and callback routes.
- Introduce storefront-local login and authorization routes.
- Exchange codes from Next.js server code, not browser JavaScript.
- Store access and refresh tokens in host-local, HttpOnly cookies.
- Route browser API traffic through a same-origin Next.js BFF so JavaScript no longer reads JWTs.
- Remove the redirect loop while preserving localized routes and role-aware UX.

## In Scope

- Shared server-only auth/cookie utilities.
- Storefront BFF login, registration as applicable, refresh, logout, session, and handoff authorization routes.
- Admin and vendor `/auth/start` and `/auth/callback` route handlers.
- PKCE S256 generation and state validation.
- Host-local HttpOnly cookie creation and clearing.
- A same-origin backend proxy/BFF with one refresh-and-retry attempt.
- Migration of the shared Axios client away from JavaScript token access.
- Route-guard changes that initiate handoff instead of bouncing directly between applications.
- Safe return-path validation.
- Loading/error/retry UX for expired or invalid handoffs.
- Vercel environment configuration.
- Unit/integration tests and a cross-application Playwright smoke test.

## Out of Scope

- Shared parent-domain cookies.
- Custom-domain setup.
- A third-party identity provider.
- Changes to backend business authorization rules.
- UI redesign unrelated to authentication.
- Storing tokens in localStorage, sessionStorage, query parameters, URL fragments, or JavaScript-readable cookies.
- An unrestricted generic proxy capable of forwarding to arbitrary hosts.

## Target Browser Flow

### Direct admin/vendor dashboard visit

1. The dashboard proxy sees no local session.
2. It redirects to its own `/auth/start?returnTo=/en` route.
3. `/auth/start` generates a state value and PKCE verifier/challenge.
4. It stores state, verifier, and validated relative return path in short-lived HttpOnly cookies on that dashboard host.
5. It redirects to the storefront `/auth/authorize` route with client ID, state, and challenge. The verifier never leaves the dashboard cookie.
6. If the storefront has no local session, `/auth/authorize` redirects to the localized login page with a safe storefront-local continuation.
7. After login, the storefront returns to `/auth/authorize`.
8. The storefront server calls backend `/auth/handoff/authorize` using its HttpOnly access cookie.
9. The backend returns the registered dashboard callback containing code and state.
10. The dashboard callback verifies state, reads the verifier, and exchanges the code server-to-server using the server-only client secret.
11. The callback sets host-local access, refresh, and UX-role cookies; clears transient handoff cookies; and redirects to the saved return path.
12. The dashboard proxy now sees the local session and permits the request.

### Login started on the storefront

1. Customer login remains on the storefront.
2. After admin/vendor login succeeds, the storefront redirects to the role dashboard's `/auth/start` route rather than directly to `/{locale}`.
3. The dashboard initiates the same PKCE/state flow and returns through the already-authenticated storefront authorization route.

## Cookie Requirements

Application session cookies:

- `HttpOnly: true`
- `Secure: true` in production
- `SameSite: Lax`
- `Path: /`
- No shared `Domain` attribute
- Access-cookie lifetime aligned with the 15-minute access token
- Refresh-cookie lifetime aligned with the 7-day refresh token
- UX role/session marker may be HttpOnly and must never be treated as backend authorization

Transient handoff cookies:

- App-specific names to avoid localhost collisions
- `HttpOnly: true`
- `Secure: true` in production
- `SameSite: Lax`
- `Path: /auth`
- Maximum lifetime of five minutes
- Cleared on success and on terminal callback failure

## BFF Requirements

- Browser code calls a same-origin route such as `/api/backend/*` rather than the remote API directly.
- The BFF reads the host-local HttpOnly access token and attaches the bearer header server-side.
- On one backend `401`, the BFF uses the HttpOnly refresh token against `/auth/refresh`, updates cookies, and retries exactly once.
- A second `401` clears the local session and returns an unauthenticated response that sends the user through handoff/login again.
- The proxy target must be built from one fixed, server-only API base URL.
- Reject absolute URLs, protocol-relative paths, path traversal, unsupported methods, and hop-by-hop headers.
- Preserve query strings, request bodies, content types, status codes, and safe response headers.
- Do not log authorization headers, cookies, request bodies, codes, verifiers, or tokens.
- State-changing routes must enforce same-origin/CSRF protections appropriate to the BFF design.

## Frontend Environment Variables

Common public application origins, already used by shared routing:

```env
NEXT_PUBLIC_STOREFRONT_URL=https://storefront-app.vercel.app
NEXT_PUBLIC_ADMIN_DASHBOARD_URL=https://admin-app.vercel.app
NEXT_PUBLIC_VENDOR_DASHBOARD_URL=https://vendor-app.vercel.app
```

Server-only values in each Vercel project:

```env
API_URL=https://production-api.example
AUTH_HANDOFF_CLIENT_ID=admin-dashboard
AUTH_HANDOFF_CLIENT_SECRET=<admin-server-secret>
AUTH_HANDOFF_CALLBACK_URL=https://admin-app.vercel.app/auth/callback
SESSION_COOKIE_SECRET=<random-server-secret-if-cookie-encryption-or-signing-is-used>
```

The vendor project uses `vendor-dashboard` and its own secret/callback. Client secrets and session secrets must not use the `NEXT_PUBLIC_` prefix.

The storefront needs `API_URL` but does not expose dashboard client secrets. It authorizes handoffs using the authenticated user's storefront session.

## Likely Frontend Files

Existing files to extend or replace carefully:

- `packages/api/src/auth.ts`
- `packages/api/src/client.ts`
- `packages/api/src/session.ts`
- `packages/api/src/cookies.ts`
- `packages/api/src/config.ts`
- `packages/api/src/route-guards.ts`
- `packages/api/src/roles.ts`
- `packages/api/src/types.ts`
- `apps/storefront/hooks/useAuth.ts`
- `apps/storefront/proxy.ts`
- `apps/admin-dashboard/proxy.ts`
- `apps/vendor-dashboard/proxy.ts`
- `apps/storefront/components/Navbar.tsx`
- `apps/admin-dashboard/components/AdminLayout.tsx`
- `apps/vendor-dashboard/hooks/useVendorDashboard.ts`

Likely new shared server-only modules:

- `packages/api/src/server/auth-cookies.ts`
- `packages/api/src/server/backend-proxy.ts`
- `packages/api/src/server/handoff.ts`
- `packages/api/src/server/pkce.ts`

Likely new app routes:

- `apps/storefront/app/api/auth/login/route.ts`
- `apps/storefront/app/api/auth/logout/route.ts`
- `apps/storefront/app/api/auth/session/route.ts`
- `apps/storefront/app/auth/authorize/route.ts`
- `apps/admin-dashboard/app/auth/start/route.ts`
- `apps/admin-dashboard/app/auth/callback/route.ts`
- `apps/vendor-dashboard/app/auth/start/route.ts`
- `apps/vendor-dashboard/app/auth/callback/route.ts`
- Same-origin backend proxy route handlers in each application

Exact structure may change to match Next.js server-only module boundaries, but server-only secrets and token handling must never enter client bundles.

## Ordered Implementation Tasks

### Task 1: Add shared server-side auth primitives

**Goal:** Establish safe cookie, PKCE, return-path, backend-request, and client-registry helpers.

**What needs to be done:**

- Define cookie names/options centrally.
- Add PKCE verifier/challenge and cryptographic state generation.
- Add constant-time state comparison where applicable.
- Add strict relative return-path validation.
- Add server-only environment validation and fail-fast production behavior.
- Prevent server-only modules from being imported into client components.

**Why it matters:** Every app must implement the same security rules without copy/paste drift.

**Dependencies:** Reviewed backend contract.

**Risk:** High because accidental client bundling could expose secrets.

### Task 2: Move storefront authentication behind server routes

**Goal:** Stop exposing JWTs to storefront JavaScript and establish the source session used to authorize handoffs.

**What needs to be done:**

- Add same-origin login/logout/session routes.
- Have the login route call the backend, set HttpOnly cookies, and return only safe user data.
- Update `authApi` and `useAuth` to use those routes.
- Preserve customer login behavior.
- Redirect successful admin/vendor login to the target dashboard `/auth/start` route.
- Preserve safe continuation back to `/auth/authorize` when login was initiated by a dashboard.
- Update navbar/cart authentication checks so they no longer read JWTs with `js-cookie`.

**Why it matters:** A secure handoff cannot end with tokens being returned to browser JavaScript.

**Dependencies:** Task 1.

**Risk:** Critical because this changes login/session ownership.

### Task 3: Implement dashboard start and callback routes

**Goal:** Give each dashboard its own independent session.

**What needs to be done:**

- Add admin/vendor `/auth/start` routes.
- Generate and store app-specific transient state/verifier/return-path cookies.
- Redirect to storefront authorization with client ID, state, and challenge.
- Add callbacks that validate state, call backend exchange server-to-server, set local session cookies, clear transient cookies, and redirect safely.
- Provide safe failure responses for missing state, missing verifier, expired code, replay, role mismatch, backend outage, and invalid client configuration.
- Never include tokens in callback redirects or browser-visible JSON.

**Why it matters:** This is the actual cross-domain session transfer.

**Dependencies:** Backend exchange endpoint and Tasks 1-2.

**Risk:** Critical because state/PKCE mistakes can enable login CSRF or code interception.

### Task 4: Replace cross-domain redirects and browser token access

**Goal:** Remove the loop-producing behavior and migrate API calls to server-held credentials.

**What needs to be done:**

- Change dashboard route guards to initiate local `/auth/start` rather than redirecting directly to storefront login.
- Ensure `/auth/start`, `/auth/callback`, static assets, and API routes cannot be intercepted by the protected-route guard.
- Replace `getAccessToken`, `getRefreshToken`, `setAuthCookies`, `persistAuthSession`, and direct bearer-header logic in browser code.
- Introduce the same-origin BFF proxy and refresh-once behavior.
- Update logout in all three applications to revoke the refresh token server-side and clear host-local cookies.
- Preserve backend authorization as the final authority.

**Why it matters:** Leaving any old redirect or client-token path active can recreate the loop or leak credentials.

**Dependencies:** Tasks 1-3.

**Risk:** Critical due to broad shared-client impact across carts, vendor workflows, and admin workflows.

### Task 5: Add verification, deployment configuration, and rollout protection

**Goal:** Prove the full browser-to-dashboard story and deploy without locking users out.

**What needs to be done:**

- Add focused tests for cookie options, state, PKCE, return paths, callback failures, and BFF retry limits.
- Add Playwright coverage for customer, admin, and vendor login across independently served applications.
- Verify direct dashboard visits, already-authenticated storefront sessions, expired callbacks, replay, wrong roles, logout, and refresh.
- Add Vercel environment variables to all three projects and redeploy after backend rollout.
- Add temporary structured diagnostics containing correlation IDs and reason categories but no secrets.
- Clear old browser cookies during validation and document the rollout instruction for users/testers.

**Why it matters:** Build/type checks cannot prove cross-domain redirects, cookie scope, or browser session behavior.

**Dependencies:** Tasks 1-4 and deployed backend.

**Risk:** High because environment drift can reproduce production-only failures.

## Frontend Acceptance Criteria

1. A fresh request to the storefront login renders normally and does not redirect repeatedly.
2. A direct admin dashboard visit without an admin-local session completes the handoff and lands on the requested localized admin path after valid admin login.
3. A direct vendor dashboard visit behaves equivalently for a valid vendor.
4. Customer login stays on the storefront.
5. Admin/vendor login started on the storefront completes handoff rather than directly navigating to a dashboard that lacks cookies.
6. Each Vercel hostname receives its own host-local HttpOnly session cookies.
7. Access and refresh tokens never appear in URLs, browser-visible login/exchange JSON, localStorage, sessionStorage, or JavaScript-readable cookies.
8. State mismatch, missing verifier, expired code, replay, wrong role, and wrong client all fail safely without a redirect loop.
9. Callback and start routes are not intercepted by protected route guards.
10. Return paths are relative, same-origin, and validated; `//host`, absolute URLs, encoded bypasses, and traversal attempts are rejected.
11. Browser API calls continue to support cart, vendor, and admin workflows through the BFF.
12. A backend 401 triggers no more than one server-side refresh and retry.
13. Failed refresh clears only the current application's local session and begins a new login/handoff flow.
14. Logout revokes the current refresh token and clears local cookies.
15. Public environment variables contain only public origins; client/session secrets remain server-only.
16. Build, lint, type checks, focused tests, and cross-app Playwright smoke tests pass.
17. Production verification shows no alternating `/en/login` and `/en` redirects.

## Frontend Definition of Done

- Backend contract is integrated without undocumented deviations.
- All three Vercel projects contain the correct production environment values.
- No auth secret is included in a client bundle.
- Old JavaScript token persistence and direct bearer-token interception are removed or proven unreachable.
- Customer, admin, and vendor flows are browser-verified.
- Logout, refresh, invalid code, expired code, replay, and wrong-role paths are verified.
- Existing cart, vendor, and admin API workflows pass regression checks.
- The completion report names changed files, tests/results, deployed URLs tested, environment variable names, and residual risks.

---

# Recommended Execution Order

1. Agree on the API contract and exact production callback URLs.
2. Complete backend Tasks 1-3 and publish a reviewed Swagger contract.
3. Add backend tests and deploy backend handoff endpoints behind production configuration.
4. Implement frontend server auth primitives and storefront BFF login.
5. Implement dashboard start/callback flows using backend test/staging.
6. Migrate shared API traffic and logout to the BFF.
7. Run backend integration tests and frontend cross-app browser tests.
8. Configure server-only Vercel secrets separately for admin and vendor.
9. Deploy backend first, then storefront, then admin/vendor dashboards.
10. Clear old test cookies and execute the production smoke-test matrix.
11. Keep the old backend login/refresh contract temporarily for rollback compatibility, then remove obsolete browser-token paths only after production verification.

---

# Copy-Paste Prompt for the Backend Coding Agent

```text
You are implementing the backend half of a security-sensitive cross-domain authentication handoff in:

D:/Projects/Ecommerce_Social_Web_App/ecommerce-api

Read the repository before editing. Preserve unrelated user changes. Do not invent architecture that conflicts with existing tsoa controllers, TypeORM repositories, JWT utilities, Redis usage, Zod environment validation, error handling, or Jest/Supertest conventions.

Problem:
The storefront, admin dashboard, and vendor dashboard are independently deployed on different Vercel hostnames and cannot share cookies. The backend must let an authenticated storefront session issue a short-lived one-time authorization code that a registered dashboard can exchange server-to-server for its own access/refresh token pair.

Required design:
- Implement POST /auth/handoff/authorize protected by the existing JWT security scheme.
- Implement POST /auth/handoff/exchange authenticated with a server-only client ID/secret.
- Support only admin-dashboard and vendor-dashboard registered clients.
- Map admin-dashboard to role admin and vendor-dashboard to role vendor.
- Resolve exact callback URLs from validated backend environment configuration; never accept arbitrary callback destinations.
- Require PKCE S256, state, a cryptographically random authorization code, a configurable default 60-second TTL, SHA-256 code hashing at rest, and atomic one-time code consumption.
- Use Redis for production handoff storage, with an equivalent deterministic in-memory implementation for tests/development. Do not create a PostgreSQL handoff table unless code evidence proves Redis cannot meet the requirement.
- Reuse one Redis connection rather than creating competing clients.
- Re-fetch the user at exchange time and recheck isActive and the current database role.
- Reuse/extract the existing JWT and RefreshToken issuance behavior so exchanged sessions have the same claims/lifetimes as ordinary login.
- Persist the newly issued refresh token using the existing repository.
- Use generic exchange failures. Never log or persist raw codes, code verifiers, passwords, access tokens, refresh tokens, client secrets, authorization headers, or request bodies.
- Add dedicated rate limits and structured security diagnostics without sensitive values.
- Update Zod env validation, .env.example, README, tsoa DTO/controller declarations, generated routes/Swagger, and tests.

Required tests:
- Successful admin and vendor flows.
- Role/client mismatch.
- Invalid client credentials.
- Wrong PKCE verifier.
- Exact callback and state echo.
- Expired code.
- Replay after successful exchange.
- Concurrent exchange attempts where only one succeeds.
- User suspension or role change between authorize and exchange.
- Missing/unsafe production environment configuration.
- Regression coverage for login, refresh, logout, and auth rate limits.

Before implementation, summarize current findings and the exact files you intend to change. Then implement in dependency order. Run route generation, build, lint, focused tests, and the full auth-relevant suite. Do not claim database, Redis, deployment, or browser verification unless actually performed.

After implementation, provide a step-by-step completion report containing:
1. The request flow from authorize through exchange.
2. Every created or modified file and why.
3. The final request/response contracts and status codes.
4. Redis keys, TTL, hashing, and atomic-consumption behavior without revealing secrets.
5. Environment variables added.
6. Tests and exact results.
7. Deployment order and rollback notes.
8. Remaining risks or unverified behavior.
```

---

# Copy-Paste Prompt for the Frontend Coding Agent

```text
You are implementing the frontend half of a security-sensitive cross-domain authentication handoff in:

D:/Projects/Ecommerce_Social_Web_App/ecommerce-frontend

Read the monorepo before editing. Preserve unrelated user changes and existing next-intl behavior. Follow the established Turborepo and shared-package structure. Do not place server-only secrets or Node-only auth modules in client bundles.

Problem:
The storefront, admin dashboard, and vendor dashboard use different Vercel hostnames. The current storefront writes JWTs into JavaScript-readable cookies and redirects by role. Dashboard proxies cannot read those cookies and redirect back to storefront login, causing an infinite loop.

Required architecture:
- Keep all three applications independently deployed.
- Each application must own host-local HttpOnly, Secure-in-production, SameSite=Lax session cookies with no shared Domain attribute.
- Implement dashboard-local /auth/start and /auth/callback route handlers for admin and vendor.
- /auth/start must generate cryptographic state and a PKCE verifier/challenge, store state/verifier/validated return path in short-lived app-specific HttpOnly cookies, and redirect to the storefront authorization route.
- The storefront must expose a server authorization route that requires/reuses a storefront local session, calls backend POST /auth/handoff/authorize, and redirects only to the backend-provided registered callback.
- If the storefront session is missing, preserve a safe storefront-local continuation through the localized login page.
- Dashboard callbacks must verify state, read the PKCE verifier, exchange the one-time code server-to-server using server-only client credentials, set local session cookies, clear transient cookies, and redirect to a validated relative return path.
- Tokens must never appear in a URL, localStorage, sessionStorage, browser-readable cookie, or browser-visible exchange response.
- Move login, refresh, logout, and protected backend calls behind same-origin Next.js route handlers/BFF logic.
- The BFF must attach bearer tokens server-side, refresh and retry no more than once on 401, update cookies, and reject arbitrary proxy destinations.
- Change route guards so a missing dashboard session starts local handoff instead of directly bouncing to storefront login.
- Ensure /auth/start, /auth/callback, API routes, Next internals, and assets bypass protected-route redirects.
- Customer login remains on storefront. Admin/vendor login initiated on storefront must go through the target dashboard /auth/start flow.
- Backend authorization remains authoritative; frontend role checks are UX only.

Likely affected areas include packages/api/src/{auth,client,session,cookies,config,route-guards,roles,types}.ts; storefront useAuth/Navbar/proxy; admin and vendor proxies/logout handlers; new server-only shared helpers; and new app route handlers for login, authorization, start, callback, logout, session, and the backend proxy.

Security requirements:
- Strict relative return-path validation.
- No open redirect.
- No tokens or secrets in logs.
- Server-only API_URL and AUTH_HANDOFF_CLIENT_SECRET values.
- App-specific transient cookie names.
- Short transient-cookie lifetime.
- State and PKCE failure handling.
- Same-origin/CSRF protection for state-changing BFF requests.
- No unrestricted generic forward proxy or absolute target URL support.

Required verification:
- Customer login remains on storefront.
- Direct admin and vendor visits complete handoff and land on the original localized route.
- Existing storefront session can complete a new dashboard handoff.
- Wrong role, tampered state, missing verifier, expired code, replay, backend outage, and refresh failure stop safely without loops.
- Logout revokes the current refresh token and clears local cookies.
- Existing cart, admin, vendor, upload, and payment-start workflows still reach the backend through the BFF.
- Build, lint, type checks, focused tests, and a Playwright cross-application smoke flow pass.
- Production headers/network show no alternating /en/login and /en redirects.

Before implementation, summarize current findings, confirm the backend contract, and list the files you intend to change. Implement incrementally and keep the application runnable between stages. Do not claim Vercel or browser verification unless actually performed.

After implementation, provide a step-by-step completion report containing:
1. The exact browser redirect sequence for customer, admin, and vendor.
2. Every created or modified file and why.
3. Cookie names/attributes/lifetimes without values.
4. BFF request, refresh, and retry behavior.
5. Environment variables required in each Vercel project.
6. Tests and exact results.
7. Production verification performed.
8. Remaining risks, rollback steps, and anything not verified.
```

---

# Step-by-Step Explanation of the Planned Implementation

This section explains what the completed implementation will do. It is not a claim that the code has already been changed.

1. The backend receives new registered-client configuration for the admin and vendor callbacks and secrets.
2. The backend receives a short-lived handoff store backed by Redis.
3. The backend receives an authenticated authorize endpoint that checks the current user's role and creates a one-time code.
4. The backend stores only the code hash with client and PKCE information for approximately 60 seconds.
5. The backend receives an exchange endpoint that verifies the dashboard client, atomically consumes the code, verifies PKCE, rechecks the user, and issues normal JWTs.
6. The storefront login moves behind a Next.js server route, which stores tokens in HttpOnly storefront cookies and returns only safe user information to browser code.
7. The admin and vendor dashboards receive local `/auth/start` routes that create state and PKCE values before sending the browser to storefront authorization.
8. The storefront authorization route uses its local session to ask the backend for a code and then redirects to the backend-approved dashboard callback.
9. Each dashboard callback exchanges the code from server-side code, stores its own host-local HttpOnly tokens, and clears the temporary handoff cookies.
10. Dashboard proxies check their own local cookies and no longer bounce directly between dashboard and storefront.
11. Browser API calls move through same-origin Next.js BFF routes so client JavaScript no longer reads tokens.
12. The BFF attaches access tokens, refreshes once when necessary, updates cookies, and clears the local session after terminal authentication failure.
13. Logout becomes a server action/route that revokes the refresh token and removes the current application's cookies.
14. Automated backend replay/expiry/role tests and frontend cross-application browser tests verify the full flow.
15. Backend deploys first; storefront deploys second; admin and vendor deploy after the contract is live.

## Required Post-Implementation Completion Report Template

The coding agents must replace placeholders with evidence after implementation:

```text
Implementation status: Complete / Partial / Blocked

1. Behavior delivered
- [Actual flow]

2. Files changed
- [Path]: [Reason]

3. API contract delivered
- [Endpoint, auth, request, response, errors]

4. Security controls delivered
- [Code hashing, TTL, PKCE, state, client validation, cookie attributes]

5. Environment/deployment changes
- [Variable name and destination project; never include secret values]

6. Verification
- [Command]: [Pass/fail and counts]
- [Browser/deployment check]: [Observed result]

7. Migration and compatibility
- [Backward compatibility, rollout order, cleanup timing]

8. Remaining work and risks
- [Anything incomplete or not verified]
```

