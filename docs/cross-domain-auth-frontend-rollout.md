# Cross-domain auth frontend rollout

## Configuration

Configure the three Vercel projects independently. Set the variables in each
project's Production environment and redeploy that project after saving them.
The `.env.example` in each app lists its required values. A root-level `.env`
is not a substitute for app-level or Vercel project configuration.

| Variable | Storefront | Admin | Vendor |
| --- | --- | --- | --- |
| `API_URL` | Backend API origin | Same backend origin | Same backend origin |
| `NEXT_PUBLIC_STOREFRONT_URL` | Storefront origin | Storefront origin | Storefront origin |
| `NEXT_PUBLIC_ADMIN_DASHBOARD_URL` | Admin origin | Admin origin | Admin origin |
| `NEXT_PUBLIC_VENDOR_DASHBOARD_URL` | Vendor origin | Vendor origin | Vendor origin |
| `AUTH_HANDOFF_CLIENT_ID` | Not set | `admin-dashboard` | `vendor-dashboard` |
| `AUTH_HANDOFF_CLIENT_SECRET` | Not set | Admin client secret | Vendor client secret |
| `AUTH_HANDOFF_CALLBACK_URL` | Not set | Admin origin + `/auth/callback` | Vendor origin + `/auth/callback` |

Use exact HTTPS origins with no path, query, or fragment for
`API_URL` and public app URLs. The dashboard callback values must exactly match
the backend registrations. The two dashboard client secrets must be different,
at least 32 bytes, and must match the corresponding backend values. Never use
`NEXT_PUBLIC_` for a secret. `SESSION_COOKIE_SECRET` is not used because these
sessions store JWTs in host-only `HttpOnly` cookies, not encrypted cookie data.
Remove obsolete `NEXT_PUBLIC_API_URL` from the three Vercel projects after the
new builds are deployed; browser API requests now use `/api/backend/*`.

Backend rollout must precede frontend rollout. The backend needs its registered
admin/vendor callback URLs and secrets (`AUTH_HANDOFF_ADMIN_CALLBACK_URL`,
`AUTH_HANDOFF_VENDOR_CALLBACK_URL`, `AUTH_HANDOFF_ADMIN_CLIENT_SECRET`,
`AUTH_HANDOFF_VENDOR_CLIENT_SECRET`), `REDIS_URL`, and `FRONTEND_URLS` containing
all three frontend origins. Keep the existing backend JWT and database settings.

## Release sequence

1. Confirm the backend handoff authorize/exchange endpoints and Redis are live,
   then verify both dashboard client registrations and CORS origins.
2. Configure the three Vercel projects as above. Production and Preview need
   separate, fully registered URL/client sets; an arbitrary Preview hostname
   cannot use the Production callback registration.
3. Deploy the storefront, admin, and vendor builds after backend readiness.
   The old dashboard guard and JS-readable token code must not be mixed with
   the new session flow during acceptance testing.
4. Clear old `accessToken`, `refreshToken`, and `userRole` cookies in each test
   browser, or use a new browser profile. New login also expires those cookies.
5. Test customer login, direct dashboard visit, storefront-initiated admin and
   vendor login, refresh, wrong-role denial, expired/replayed callback, logout,
   and repeat after a page reload. Check all three deployment hostnames.
6. Inspect Vercel runtime logs for `auth_handoff` events. The hashed
   `correlationId` connects start/authorize/callback records without logging
   tokens, codes, state, verifiers, cookies, or user data. Remove these temporary
   diagnostics after the rollout stabilizes.

Each dashboard owns its own host-only session. Signing out of one app clears
that app's session; a still-authenticated storefront may authorize a new
dashboard handoff on the next visit. Full sign-out across all applications
would require a separate global logout protocol and is not part of this plan.

## Validation and rollback

Use `npm test`, `npm run check-types`, `npm run lint`, `npm run build`, and
`npm run test:e2e` locally. Verify in Chrome DevTools that the login JSON has
no tokens, dashboard exchange has no browser request, and each hostname has
its own host-only `HttpOnly; Secure; SameSite=Lax` cookies. Confirm that
`/en/login` loads without redirects and direct dashboard visits never alternate
between dashboard and storefront.

Rollback requires reverting all three frontend deployments together to the
legacy version while leaving the backward-compatible backend endpoints in
place. Do not remove backend handoff settings or old cookie compatibility until
production sessions and flows have been checked and the rollout is stable.
