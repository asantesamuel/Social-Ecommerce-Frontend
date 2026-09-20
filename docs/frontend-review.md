# E-Commerce Frontend Review And Refactor Notes

Reference: `ecommerce-api-spec.docx.pdf`, E-Commerce API Technical Specification, version 1.0, March 2026.

## Executive Summary

The frontend is a Turborepo monorepo with three Next.js applications:

- `apps/storefront`: customer-facing shopping, auth, catalogue, product detail, and cart.
- `apps/admin-dashboard`: operational dashboard for analytics, users, orders, inventory, product moderation, and vendor review.
- `apps/vendor-dashboard`: vendor onboarding, Paystack fee handoff, document upload, product image upload, and vendor product creation.

The backend specification describes a role-based platform with customers, vendors, and admins, JWT access/refresh tokens, Paystack checkout and onboarding payments, S3 pre-signed uploads, vendor approval state, product moderation, cart/order workflows, and social cart sharing.

The frontend currently implements the shell for all three roles and has the strongest coverage around vendor onboarding/admin review. Storefront browsing and cart are present. Checkout, order history, customer social features, admin category management, and refunds are still not implemented.

## Turborepo Architecture

This repo uses npm workspaces plus Turborepo. The root `package.json` defines workspaces under `apps/*` and `packages/*`. `turbo.json` defines shared tasks:

- `build`: builds each package/app and respects upstream dependency builds.
- `lint`: runs lint across workspace packages.
- `check-types`: runs Next route type generation and TypeScript checks.
- `dev`: starts app dev servers without caching because they are persistent.

This architecture lets each app remain independently deployable while sharing typed configuration, API services, lint rules, TypeScript config, and future UI primitives. Shared code should live in `packages/*`; app-specific workflow UI should stay inside each app.

## Current Architecture

### Shared packages

- `packages/api`: shared API client, auth/session helpers, typed frontend DTOs, domain API services, upload helpers, and formatting helpers.
- `packages/ui`: currently a starter/sample UI package. It is not consumed by any app after this review, so it is optional or a future shared design-system package.
- `packages/eslint-config`: shared ESLint config.
- `packages/typescript-config`: shared TypeScript configs.

### App structure

Each app uses:

- Next.js App Router under `app/[locale]`.
- `next-intl` localized routing for `en`, `es`, and `fr`.
- React Query for API state.
- Cookie-based access/refresh token storage via shared API helpers.
- A `proxy.ts` route guard that checks for an auth session, applies role-aware UX routing, and redirects to storefront login when missing.

## Backend API Alignment

| Area                                | Status                               | Notes                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Roles: customer, vendor, admin      | Implemented for UX routing           | Apps exist for all roles. Admin user filter uses `customer` instead of `user`. App proxies now apply role-aware UX guards while backend authorization remains authoritative.                     |
| JWT access and refresh tokens       | Implemented                          | Shared axios client attaches access token and refreshes on 401. Login/logout use shared session helpers.                                                                                         |
| Customer registration/login         | Implemented                          | Storefront login/signup works against `/auth/login` and `/auth/register`. Vendor application signup creates a customer login and uses typed mock `/vendors/apply` data until the backend exists. |
| Vendor onboarding state machine     | Partial                              | Vendor dashboard supports `pending_payment`, `pending_review`, `rejected`, and `approved`. It still depends on backend-specific `/vendors/reapply` behavior not described in the spec.           |
| Paystack onboarding fee             | Partial                              | Vendor dashboard posts to `/vendors/pay-fee`, redirects to Paystack, and polls `/vendors/me` after return. Webhook confirmation remains backend-owned.                                           |
| Product catalogue                   | Partial                              | Storefront lists products and details. Search/filter UI is not fully wired.                                                                                                                      |
| Product approval flow               | Partial                              | Admin moderation queue can approve/reject/flag pending products. Vendor products display approval status.                                                                                        |
| Cart                                | Partial                              | Storefront can view, add, update, remove, and clear cart items. Shared cart social flow is missing.                                                                                              |
| Checkout and Paystack order payment | Not implemented                      | Cart page has a checkout button only. No shipping address, `/orders/checkout`, Paystack callback, order confirmation, or payment status view.                                                    |
| Orders                              | Partial                              | Admin order list exists. Customer order history/details are missing. Vendor order view is missing.                                                                                               |
| S3 pre-signed upload flow           | Implemented for vendor/product flows | Upload helper now centralizes presign, direct PUT, and confirm. Vendor documents and product images use it.                                                                                      |
| Admin management                    | Partial                              | Analytics, users, orders, low-stock inventory, product moderation, and vendor review exist. Categories, refunds, platform config, feature flags, and transaction review are missing.             |
| Social features                     | Not implemented                      | Friend requests, friends list, shared carts, and shared cart views are not present.                                                                                                              |
| Security expectations               | Partial                              | Client adds bearer token and refreshes. Role-aware app proxies are UX gates only; true authorization remains backend-owned.                                                                      |

## Workflow Review

### Registration And Login

Files:

- `apps/storefront/app/[locale]/login/page.tsx`
- `apps/storefront/app/[locale]/signup/page.tsx`
- `apps/storefront/hooks/useAuth.ts`
- `packages/api/src/auth.ts`
- `packages/api/src/session.ts`
- `packages/api/src/client.ts`

Flow:

1. User submits credentials in storefront.
2. `useAuth` calls `authApi.login`, `authApi.register`, or customer registration followed by `vendorApi.submitApplication` for vendor applicants.
3. Shared session helper writes `accessToken` and `refreshToken`.
4. Role decides redirect: customer to storefront, admin to admin dashboard, vendor to vendor dashboard.

Status: implemented for basic login/signup and vendor application signup. Vendor applicants start with a customer account, provide an initial verification document, submit through typed mock vendor application data, and then continue in the vendor dashboard onboarding states. Set `NEXT_PUBLIC_VENDOR_APPLICATIONS_SOURCE=api` when the backend `/vendors/apply` endpoint and document upload contract are ready.

### Authentication And Session Handling

Files:

- `packages/api/src/client.ts`
- `packages/api/src/session.ts`
- `apps/*/proxy.ts`

Flow:

1. Request interceptor skips auth endpoints.
2. Non-auth requests attach `Authorization: Bearer <accessToken>`.
3. A 401 triggers `/auth/refresh` using `refreshToken`.
4. Failed refresh clears cookies and redirects to storefront login.

Status: implemented. Route proxies are role-aware UX gates only; they are not a replacement for backend authorization.

### Customer Product Browsing

Files:

- `apps/storefront/app/[locale]/page.tsx`
- `apps/storefront/hooks/useCatalog.ts`
- `packages/api/src/catalog.ts`

Flow:

1. Home page requests `/products?limit=12` and `/categories`.
2. Products render as cards with image, name, description, and price.
3. Category buttons currently display categories but do not alter query params.

Status: partial. Needs search, filter state, pagination, and empty/error states.

### Product Details

Files:

- `apps/storefront/app/[locale]/products/[id]/page.tsx`
- `apps/storefront/hooks/useCatalog.ts`
- `apps/storefront/hooks/useCart.ts`

Flow:

1. Product detail fetches `/products/:id`.
2. User selects quantity.
3. Add-to-cart posts to `/cart/items` and redirects to cart.

Status: partial. It handles basic add-to-cart but should guard out-of-stock states and unauthenticated add attempts more clearly.

### Cart Management

Files:

- `apps/storefront/app/[locale]/cart/page.tsx`
- `apps/storefront/hooks/useCart.ts`
- `packages/api/src/cart.ts`

Flow:

1. Cart hook fetches `/cart` if auth cookies exist.
2. Quantity changes call `PUT /cart/items/:itemId`.
3. Remove and clear call cart delete endpoints.

Status: partial. Checkout, tax/shipping breakdown, cart sharing, and payment are missing.

### Checkout And Orders

Files:

- `apps/storefront/app/[locale]/cart/page.tsx`
- `apps/admin-dashboard/app/[locale]/orders/page.tsx`
- `packages/api/src/admin.ts`

Flow:

1. Customer checkout is not wired yet.
2. Admin can list orders from `/admin/orders`.

Status: customer checkout/order history/details are not implemented. Admin order read is partial. Vendor order view is missing.

### Vendor Onboarding

Files:

- `apps/vendor-dashboard/app/[locale]/page.tsx`
- `apps/vendor-dashboard/hooks/useVendorDashboard.ts`
- `apps/vendor-dashboard/components/PaymentGate.tsx`
- `apps/vendor-dashboard/components/PaymentReturnNotice.tsx`
- `apps/vendor-dashboard/components/DocumentUploadPanel.tsx`
- `apps/vendor-dashboard/components/RejectedApplicationPanel.tsx`
- `packages/api/src/vendor.ts`
- `packages/api/src/uploads.ts`

Flow:

1. Vendor dashboard fetches `/vendors/me`.
2. `pending_payment`: vendor pays onboarding fee through `/vendors/pay-fee`.
3. Paystack return query params trigger status polling.
4. `pending_review`: vendor uploads documents through pre-signed upload flow and submits metadata to `/vendors/documents`.
5. `rejected`: vendor can reapply through `/vendors/reapply`.
6. `approved`: vendor can create products.

Status: partial but strong. Needs product edit/unpublish, vendor analytics, vendor orders, and exact endpoint confirmation for `/vendors/apply` and reapply behavior.

### Vendor Product Management

Files:

- `apps/vendor-dashboard/components/ApprovedVendorWorkspace.tsx`
- `apps/vendor-dashboard/hooks/useVendorDashboard.ts`
- `packages/api/src/catalog.ts`
- `packages/api/src/uploads.ts`

Flow:

1. Categories load from `/categories`.
2. Vendor products load from `/products/vendor/my-products`.
3. Product image uploads via `/uploads/presign`, direct S3 PUT, `/uploads/confirm`.
4. Product creation posts to `/products` with image URLs.

Status: create/list implemented. Edit, delete, unpublish, inventory update, and multi-image management are missing.

### Admin Dashboard

Files:

- `apps/admin-dashboard/app/[locale]/page.tsx`
- `apps/admin-dashboard/app/[locale]/users/page.tsx`
- `apps/admin-dashboard/app/[locale]/orders/page.tsx`
- `apps/admin-dashboard/app/[locale]/inventory/page.tsx`
- `apps/admin-dashboard/app/[locale]/products/page.tsx`
- `apps/admin-dashboard/app/[locale]/vendors/page.tsx`
- `apps/admin-dashboard/hooks/useAdmin.ts`
- `packages/api/src/admin.ts`
- `packages/api/src/vendor.ts`

Flow:

1. Analytics uses `/admin/analytics`.
2. Users uses `/admin/users` and `/admin/users/:id/status`.
3. Orders uses `/admin/orders`.
4. Inventory uses `/admin/inventory/low-stock`.
5. Product moderation uses `/admin/products/pending` and `/admin/products/:id/moderate`.
6. Vendor review uses pending vendor/document/review endpoints.

Status: partial. Needs category management, refunds, financial transaction review, platform config, feature flags, and admin role guard UX.

### Social Features

Files: none.

Status: not implemented. Backlog should include friendships, friend search, request accept/decline, shared cart creation, shared cart view, and permissions around sharing.

## Cleanup And Refactor Report

### Removed

- `tmp-intl-setup.js`: one-off setup script, not referenced.
- `apps/*/app/[locale]/page.module.css`: unused starter CSS modules.
- `apps/*/public/{next.svg,vercel.svg,turborepo-light.svg,turborepo-dark.svg,globe.svg,file-text.svg,window.svg}`: unused starter assets.
- `apps/storefront/public/output.css`: unused generated CSS artifact.
- `apps/vendor-dashboard/hooks/useAuth.ts`: copied storefront auth hook, unused in vendor app.
- `apps/vendor-dashboard/hooks/useCatalog.ts`: copied storefront catalogue hook, unused in vendor app.
- `apps/vendor-dashboard/hooks/useCart.ts`: copied cart hook, unused and misleading in vendor app.
- `apps/vendor-dashboard/i18n/i18n/*`: duplicate nested i18n files, not imported.
- `apps/vendor-dashboard/messages/messages/*`: duplicate nested locale files, not loaded by `next-intl`.
- Unused package dependencies: app-level `@repo/ui`, `@reduxjs/toolkit`, `react-redux`, direct Radix dialog/slot dependencies, and `jwt-decode` from `packages/api`.

### Refactored

- `packages/api/src/*`: added typed domain API services, shared DTOs, config, session helpers, upload helper, error helper, and currency formatting.
- Storefront hooks now call typed shared services instead of raw axios.
- Admin hooks now call typed shared services instead of raw axios.
- Vendor dashboard API logic moved from the page into `useVendorDashboard`.
- Vendor dashboard UI split into status-focused components.
- Admin vendor review page rewritten to remove encoding damage and use shared types.
- Admin user role filter now sends `customer` instead of `user`.
- Hardcoded storefront redirect URLs in proxies now use `NEXT_PUBLIC_STOREFRONT_URL` with localhost fallback.
- Storefront prices now use a shared formatter that tolerates numeric strings from PostgreSQL numeric fields.
- Next layouts now use checked-in local fonts instead of `next/font/google`, so production builds do not require network access to Google Fonts.

### Still Candidate For Cleanup

- `packages/ui` is currently unused. Either build it into a real design-system package and consume it, or remove it from workspaces later.
- Global CSS is duplicated across apps. It could move to a shared style package later, but that should be done with care around Tailwind and Next app boundaries.

## Important File Breakdown

### Root

- `package.json`: workspace definitions and root scripts. Essential.
- `turbo.json`: task graph and caching rules. Essential.
- `README.md`: setup overview. Essential, but could link to this review doc.

### `packages/api`

- `src/client.ts`: axios instance, bearer-token injection, refresh handling, and login redirect on auth failure. Essential.
- `src/session.ts`: auth cookie read/write/clear helpers. Essential.
- `src/config.ts`: API URL, app URLs, locale helpers, and localized app URL builder. Essential.
- `src/types.ts`: frontend DTOs aligned to backend entities and workflows. Essential.
- `src/auth.ts`: login/register/logout API functions and role landing helpers. Essential.
- `src/catalog.ts`: product/category/vendor-product API functions. Essential.
- `src/cart.ts`: cart CRUD API functions. Essential.
- `src/admin.ts`: admin analytics/users/orders/inventory/moderation API functions. Essential.
- `src/vendor.ts`: vendor profile/payment/reapply/documents/review API functions. Essential.
- `src/uploads.ts`: pre-signed upload, direct PUT, and confirm helper. Essential for S3 flows.
- `src/errors.ts`: safe API error message extraction. Useful shared utility.
- `src/format.ts`: currency and number formatting. Useful shared utility.
- `src/index.ts`: package exports. Essential.

### `apps/storefront`

- `app/[locale]/layout.tsx`: providers, font, nav, footer. Essential.
- `app/[locale]/page.tsx`: catalogue landing page. Essential, partially implemented.
- `app/[locale]/login/page.tsx`: login form. Essential.
- `app/[locale]/signup/page.tsx`: registration form. Essential, needs vendor onboarding decision.
- `app/[locale]/products/[id]/page.tsx`: product detail and add-to-cart. Essential.
- `app/[locale]/cart/page.tsx`: cart view and item mutations. Essential, checkout missing.
- `hooks/useAuth.ts`: auth mutations and role redirects. Essential.
- `hooks/useCatalog.ts`: product/category queries. Essential.
- `hooks/useCart.ts`: cart queries/mutations. Essential.
- `components/Navbar.tsx`: locale switch, cart badge, logout. Essential.
- `components/Footer.tsx`: footer. Optional but useful.
- `proxy.ts`: token-presence UX guard. Essential but should become role/route aware later.

### `apps/vendor-dashboard`

- `app/[locale]/layout.tsx`: providers and font. Essential.
- `app/[locale]/page.tsx`: vendor status coordinator. Essential.
- `hooks/useVendorDashboard.ts`: vendor profile, Paystack return polling, uploads, reapply, product creation, logout. Essential.
- `components/PaymentReturnNotice.tsx`: Paystack callback status. Essential.
- `components/VendorHeader.tsx`: vendor status and logout. Essential.
- `components/PaymentGate.tsx`: onboarding fee UI. Essential.
- `components/DocumentUploadPanel.tsx`: private document upload flow. Essential.
- `components/RejectedApplicationPanel.tsx`: rejection and reapply UI. Essential.
- `components/ApprovedVendorWorkspace.tsx`: create product and list vendor products. Essential.
- `proxy.ts`: redirects unauthenticated users to storefront login. Essential.

### `apps/admin-dashboard`

- `app/[locale]/layout.tsx`: providers, font, and admin layout. Essential.
- `components/AdminLayout.tsx`: nav and logout. Essential.
- `hooks/useAdmin.ts`: admin and vendor-review queries/mutations. Essential.
- `app/[locale]/page.tsx`: analytics overview. Essential.
- `app/[locale]/users/page.tsx`: user suspension/reactivation. Essential.
- `app/[locale]/orders/page.tsx`: global order list. Essential, lacks status mutation/detail/refund.
- `app/[locale]/inventory/page.tsx`: low-stock alerts. Essential, notification action is not wired.
- `app/[locale]/products/page.tsx`: product moderation queue. Essential.
- `app/[locale]/vendors/page.tsx`: vendor application review and document links. Essential.
- `proxy.ts`: redirects unauthenticated users to storefront login. Essential.

### i18n And Config Files

- `apps/*/i18n/routing.ts`: locale routing definitions. Essential.
- `apps/*/i18n/request.ts`: locale message loading. Essential.
- `apps/*/messages/*.json`: minimal translation payloads. Essential for `next-intl`, but currently sparse.
- `apps/*/tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `tsconfig.json`, `next.config.js`: essential app configuration.

## Feature Backlog

Implemented:

- Basic customer auth.
- JWT attach/refresh/logout.
- Product list/detail.
- Cart view/add/update/remove/clear.
- Admin analytics/users/orders/inventory/products/vendors.
- Vendor onboarding fee handoff and callback polling.
- Vendor document upload through pre-signed URLs.
- Vendor product image upload and product creation.

Partially implemented:

- Product filtering/pagination/search.
- Product moderation.
- Vendor product management.
- Admin order management.
- Admin inventory workflows.

Not implemented yet:

- Customer checkout with shipping address.
- Paystack customer order payment.
- Customer order history and order details.
- Vendor order view.
- Vendor sales analytics.
- Product edit/unpublish/delete.
- Admin refunds and transaction review.
- Admin category management.
- Admin platform configuration and feature flags.
- Social friendships.
- Shared cart creation and shared cart viewing.
- Profile management.

Needs backend confirmation:

- Exact `/vendors/apply` availability and document upload contract. The UI currently uses typed mock vendor application data by default.
- Exact vendor reapply behavior and fee requirements after rejection.
- Whether product browse is public or requires JWT. The spec has conflicting signals: customer browsing is a core capability, but security notes say all routes except auth require JWT.
- Exact admin product moderation endpoint shape.
- Exact vendor document review URL flow for admin.
- Whether TypeORM numeric fields are serialized as numbers or strings.

Needs product/design decision:

- Whether storefront should allow anonymous catalogue browsing.
- How shared carts should appear in customer navigation.
- How to present order tracking and refund status.

## Test Checklist

- Login as customer, vendor, and admin; verify role redirect destinations.
- Expire/delete `accessToken` with valid `refreshToken`; verify refresh and retry.
- Delete both tokens; verify protected routes redirect to storefront login.
- Storefront: load catalogue, product detail, add item, update quantity, remove item, clear cart.
- Storefront: verify prices render when API sends either numbers or numeric strings.
- Storefront: vendor application signup creates a customer account, builds typed mock application/document data, and redirects to the vendor dashboard.
- Vendor: pending payment state launches Paystack fee URL.
- Vendor: Paystack return with `reference` or `trxref` triggers status polling.
- Vendor: pending review uploads a document through presign, direct PUT, confirm, and document submit.
- Vendor: rejected state shows reason and reapply action.
- Vendor: approved state uploads product image and creates product.
- Admin: analytics loads with empty and populated data.
- Admin: filter users by `customer`, `vendor`, and `admin`.
- Admin: suspend/reactivate a non-admin user.
- Admin: list orders by status.
- Admin: change low-stock threshold.
- Admin: approve, reject, and flag pending products with reason where required.
- Admin: open vendor documents and approve/reject vendor applications.

## Recommendations

- Add generated OpenAPI client types once backend tsoa `swagger.json` is available. This should replace manually maintained DTOs in `packages/api/src/types.ts`.
- Add role-aware client route helpers using decoded JWT claims for UX gating, while keeping backend authorization as source of truth.
- Decide whether `packages/ui` becomes the design system. If yes, move repeated layout primitives there; if no, remove the package and app dependencies.
- Add customer checkout as the next frontend slice because it unlocks orders, Paystack payment, and order history.
- Add Playwright smoke tests for auth redirect, cart, vendor onboarding states, and admin moderation.
