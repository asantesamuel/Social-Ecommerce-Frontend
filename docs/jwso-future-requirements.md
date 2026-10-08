# JWSO future product and design requirements

These are **not implemented**. No screen should present them as working until the product rules, backend contract, security model, and end-to-end tests exist. Reference [the JWSO design system](./jwso-frontend-design-system.md) for tokens and component behavior.

Each item identifies the user problem, expected journey, affected surfaces, UI/states, backend needs, and accessibility/mobile requirements. Priorities are product suggestions, not delivery commitments.

## Commerce and customer

### 1. Checkout and order confirmation (P0)

- **Problem/flow:** A cart cannot currently become a purchase. From cart, the customer should review line items and final charges, provide or select address and shipping option, pay, then receive an order result and receipt.
- **Screens/components/states:** Cart CTA, focused checkout steps, address form, delivery choice, payment handoff, persistent summary, confirmation. Cover validation, payment pending, failed, cancelled, expired, duplicate submission and recovery; never claim success from redirect alone.
- **Backend/data:** Priced checkout quote, tax/shipping calculation, stock reservation rules, idempotent order creation, payment provider verification/webhook, order read and receipt. Define guest checkout policy explicitly.
- **A11y/mobile:** Linear keyboard flow, labeled errors, retained entered data, readable summary and sticky CTA only where it does not obscure fields. Keep mobile steps short.

### 2. Customer account, orders and addresses (P0)

- **Problem/flow:** Customers need to review purchases and manage delivery details after checkout. Open account, see orders, inspect one order, manage addresses/profile.
- **Screens/components/states:** Account navigation, order table/cards, order detail timeline, address forms, empty/loading/error and restricted states.
- **Backend/data:** Customer-scoped profile, order list/detail, address CRUD and authorization; do not reuse admin order endpoints.
- **A11y/mobile:** Responsive order summaries, semantic timeline, clear edit/primary address labeling.

### 3. Vendor identity and profile (P1)

- **Problem/flow:** Shoppers need to evaluate who is selling an item. Click a seller on a product page or tile to see seller details and other products.
- **Screens/components/states:** Seller name/link, profile, verified identity only if actually verified, policies, catalogue; missing profile/verification states.
- **Backend/data:** Public seller profile and products, verification status semantics, publishable policy fields and moderation.
- **A11y/mobile:** Seller information before long descriptions, non-color-only trust signals, compact profile header.

### 4. Ratings and reviews (P1)

- **Problem/flow:** Buyers need credible product and seller feedback. Read reviews before purchase; verified purchasers may submit one after fulfilment.
- **Screens/components/states:** Aggregate score with count, review list, sort/filter, write/revise form, moderation and report states; distinguish zero reviews from poor ratings.
- **Backend/data:** Purchase eligibility, review CRUD, moderation, aggregate computation and abuse prevention.
- **A11y/mobile:** Accessible rating input and readable score text, no stars as sole information, collapsed filters on mobile.

### 5. Wishlist and saved products (P1)

- **Problem/flow:** Shoppers want to save products without adding to cart. Save from tile/detail, view saved list, remove or add to cart.
- **Screens/components/states:** Save control, account saved page, sign-in prompt, success/undo, unavailable/deleted product.
- **Backend/data:** User-scoped saved products and idempotent save/unsave; session merging policy if anonymous saving is supported.
- **A11y/mobile:** Named icon control with pressed state, no hover-only action, touch target ≥42px.

### 6. Advanced search and suggestions (P1)

- **Problem/flow:** Text search currently submits a basic query; customers need help finding products when terms are vague or mistyped. Type, review suggestions, submit or choose one.
- **Screens/components/states:** Header combobox, category suggestions, recent/popular terms where permitted, no-results guidance, loading and network failure.
- **Backend/data:** Suggestion API, ranking, typo tolerance, category association, privacy/retention for search history.
- **A11y/mobile:** WAI-ARIA combobox keyboard pattern, Escape/focus management, full-width mobile search, no forced auto-submit.

### 7. Category-specific filters and sorting (P1)

- **Problem/flow:** Basic category selection is insufficient for large catalogues. Apply relevant facets and sort, then compare results.
- **Screens/components/states:** Electronics: brand, condition, storage, memory, screen size. Fashion: size, color, fit, material. Shared price/availability. Applied chips, clear, result count, empty and invalid filter states.
- **Backend/data:** Search facets/counts, typed filter schema by category, stable sort and pagination; no client-only filtering of a partial page.
- **A11y/mobile:** Labeled controls, filter drawer with focus trapping and Apply/Clear, persistent selected values after navigation.

### 8. Related, recommended and recently viewed products (P2)

- **Problem/flow:** Customers need relevant discovery beyond a single listing. Browse related items on detail, personalized suggestions only when signals and consent support them.
- **Screens/components/states:** Product rails and optional account/history section; explainable labels, fallback and empty states.
- **Backend/data:** Related-product or recommendation endpoint, event collection and consent, inventory/approval filtering, retention rules.
- **A11y/mobile:** Scrollable rails with keyboard reachability and clear item boundaries; avoid automatic motion.

### 9. Product comparison and saved searches (P2)

- **Problem/flow:** For considered purchases, shoppers need side-by-side attributes or an alert when new matches appear. Select products or save a filter/search.
- **Screens/components/states:** Compare selection, attribute table, missing-attribute state; saved-search list and notification preferences.
- **Backend/data:** Normalized product attributes by category, saved query CRUD, opt-in notification and unsubscribe.
- **A11y/mobile:** Semantic comparison table with horizontal scroll or stacked attribute pairs; announce selection count.

### 10. Promotions, shipping and returns messaging (P1)

- **Problem/flow:** Customers need accurate final cost and fulfilment expectations. Show promotional price, shipping estimate and return rules only from validated offers/policies.
- **Screens/components/states:** Price hierarchy, discount label, delivery estimate, policy disclosure, expired/invalid offer state.
- **Backend/data:** Promotion eligibility/expiry, real price history if struck-through prices are shown, shipping quotes, seller/marketplace returns policy.
- **A11y/mobile:** Clearly distinguish base price from final price and conditions; never use color alone to communicate a discount.

## Vendor operations

### 11. Product editing and bulk inventory (P1)

- **Problem/flow:** Sellers can create products but cannot maintain them. Search/list, edit price/stock/content, optionally select multiple for a supported bulk action.
- **Screens/components/states:** Product table actions, edit form/drawer, unsaved-change warning, approval impact, conflict and validation states.
- **Backend/data:** Vendor-owned product edit, inventory update, bulk endpoint, optimistic concurrency and moderation rules.
- **A11y/mobile:** Explicit row actions, mobile stacked details, selection announced to assistive technology.

### 12. Vendor orders and fulfilment (P1)

- **Problem/flow:** Sellers need to process their own orders. Open queue, inspect order, update a supported fulfilment stage, enter shipment details.
- **Screens/components/states:** Status-filtered order table, detail, customer/shipping summary, status transition confirmation, partial fulfilment and failure states.
- **Backend/data:** Vendor-scoped order read/mutations, allowed transitions, shipment/tracking and audit log; privacy boundaries for customer data.
- **A11y/mobile:** Status in text, visible next action, compact mobile order cards.

### 13. Vendor analytics and store settings (P2)

- **Problem/flow:** Sellers need trustworthy performance signals and editable public store information. Review a date range, identify product performance; edit policies/profile.
- **Screens/components/states:** Revenue/orders/product-performance views with dates and definitions, settings forms, no-data/partial-data states.
- **Backend/data:** Vendor-scoped aggregates and period definitions, public profile/settings CRUD, policy review.
- **A11y/mobile:** Chart data table alternatives, tabular metrics, simple date picker and concise mobile summaries.

## Marketplace operations

### 14. Admin notifications and inventory intervention (P1)

- **Problem/flow:** Admin can see low stock but cannot notify sellers. Select an alert, inspect vendor, send a templated or approved message and see delivery result.
- **Screens/components/states:** Inventory row action, message confirmation, sent/failed audit history, retry and permissions states.
- **Backend/data:** Notification command, delivery service, deduplication, template governance, rate limit and audit.
- **A11y/mobile:** Explicit recipient and message before send; no silent dispatch; table scroll remains usable on mobile.

### 15. Payments, refunds and disputes (P1)

- **Problem/flow:** Operators need to investigate and resolve money and order problems. Search case/order, inspect timeline, act within permissions.
- **Screens/components/states:** Case list/detail, evidence, refund/resolve forms, irreversible-action confirmation, pending/external-provider failure states.
- **Backend/data:** Payment ledger/read APIs, refund/idempotency, dispute workflow, role permissions, immutable audit trail.
- **A11y/mobile:** Clear monetary values and consequence text; no color-only urgency; condensed case summary on mobile.

### 16. Category, content and platform settings (P2)

- **Problem/flow:** Admin eventually needs controlled taxonomy and policy management. Edit a category or setting, preview impact, publish with review.
- **Screens/components/states:** Hierarchy table, edit form, draft/published state, dependency warning and rollback view.
- **Backend/data:** Category/settings CRUD, permissions, validation, versioning and audit.
- **A11y/mobile:** Accessible tree semantics or a flat indented table, explicit parent labels and safe mobile edit flow.

## Cross-cutting product work

### 17. Localization completion (P1)

- **Problem/flow:** Routes support `en`, `es` and `fr`, but new operational and commerce copy is currently authored in English. Users selecting another locale should eventually receive a complete translation, not just a URL change.
- **Screens/components/states:** All navigation, forms, errors, empty states, dates, currency and transactional content; fallback language state.
- **Backend/data:** Translation catalog and localized content fields where appropriate, locale-aware currency/number/date policy.
- **A11y/mobile:** Correct `lang`, direction if more locales are added, string-expansion testing and responsive wrapping.

### 18. Session-aware cross-app navigation (P1)

- **Problem/flow:** A seller or admin moving among JWSO applications should know which workspace they are entering without duplicate or conflicting sign-in state.
- **Screens/components/states:** Role-aware account menu and explicit app switcher only for authorized destinations; failed handoff recovery.
- **Backend/data:** Existing cross-domain handoff contract remains authoritative; role/session API and trusted destination allowlist.
- **A11y/mobile:** Clear destination labels, keyboard-accessible switcher, never expose tokens or one-time codes in UI state.

## Release gate for any item

Define the API contract, authorization, empty/loading/error/permission states, analytics or audit needs, mobile behavior, accessible interaction, and tests before surfacing a control. Remove the corresponding "future" disclosure only after the workflow is verified end to end. Do not fill new screens with static metrics or inert buttons.
