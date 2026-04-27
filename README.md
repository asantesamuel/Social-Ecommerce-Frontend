# E-Commerce Frontend Monorepo

This workspace contains the frontend applications for the e-commerce platform. It uses Turborepo with shared packages and three separate Next.js apps for customers, admins, and vendors.

## Apps

- `apps/storefront`: customer-facing shopping experience on port `3001`
- `apps/admin-dashboard`: admin dashboard on port `3002`
- `apps/vendor-dashboard`: vendor onboarding and management dashboard on port `3003`

## Shared Packages

- `packages/api`: shared Axios client with JWT and refresh-token handling
- `packages/ui`: shared UI components
- `packages/eslint-config`: shared lint configuration
- `packages/typescript-config`: shared TypeScript configuration

## Main Functionality

- storefront product browsing, product detail pages, auth, and cart flows
- admin analytics, order review, user management, inventory alerts, and product moderation
- vendor onboarding with Paystack fee payment and document submission
- localized routing with `next-intl` for `en`, `es`, and `fr`

## Development

Install dependencies:

```bash
npm install
```

Run all apps:

```bash
npm run dev
```

Run a single app:

```bash
npm run dev -- --filter=storefront
npm run dev -- --filter=admin-dashboard
npm run dev -- --filter=vendor-dashboard
```

## Build and Validation

```bash
npm run build
npm run lint
npm run check-types
```
