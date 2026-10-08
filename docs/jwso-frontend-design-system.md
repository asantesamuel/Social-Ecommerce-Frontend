# JWSO frontend design system

Status: implementation reference for the current frontend. This document describes what exists today; proposed capabilities live in [JWSO future requirements](./jwso-future-requirements.md).

## Product philosophy

JWSO is one marketplace with three compositions. The storefront is product-first and encourages fast discovery. The vendor workspace prioritizes listing work and onboarding status. The admin workspace prioritizes operational scanning and consequential decisions. They share tokens, form behavior, feedback, and language, but not a decorative page template.

Premium means precise hierarchy, useful imagery, readable type, and restraint. It does not mean blank space, heavy shadows, visual effects, or unsupported trust claims. The storefront makes the product and its seller visible. As users approach a purchase, surfaces should simplify; a complete checkout does not yet exist and is not represented as available.

Inspirations are principles, not templates: Apple's discipline, ASOS's browsing density, Amazon's findability, Etsy's seller context, Nike's product presentation, and Shopify's checkout focus. The final system is JWSO.

## Current capability inventory

| Experience | Current routes and supported flows                                                                                                                                                                                                                                                                              | Important limits                                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Storefront | Localized `/[locale]` catalog with API search, category selection and pagination; `/[locale]/products/[id]` gallery, quantity and add to cart; `/[locale]/cart` view/update/remove/clear; `/[locale]/login` and `/[locale]/signup` customer registration or vendor application; auth handoff and failure routes | No purchase/checkout API, wishlist, reviews, product comparison, advanced filters, recommendation feed, seller profile or customer account/order pages |
| Vendor     | Localized `/[locale]` with profile status, onboarding payment handoff, document upload, rejected application reapply, approved product creation with upload and paginated listing; auth handoff and failure routes                                                                                              | No vendor order management, inventory editing, analytics, store settings, or product editing APIs in this frontend                                     |
| Admin      | Localized `/[locale]` analytics overview, `/users` role filter and status mutation, `/orders` status filter, `/inventory` threshold, `/vendors` application/document review, `/products` product moderation; auth handoff and failure routes                                                                    | Orders and inventory are read-only; no notification dispatch, dispute, payout, category management, or global settings screens                         |

The design must not imply that a read-only table has an edit action. Counters and statuses come from API responses, never placeholder figures. Links and commands must lead to an implemented route or mutation.

Production vendor onboarding must set `NEXT_PUBLIC_VENDOR_APPLICATIONS_SOURCE=api`. The repository retains a mock adapter for local development, but demo profile data must not be used to validate production vendor UI.

## Foundation

The source of truth is `packages/ui/src/jwso.css`, imported by all three app stylesheets. CSS custom properties are the shared contract. Use these before one-off color values.

### Color

| Purpose        | Token                 | Value     | Use                        |
| -------------- | --------------------- | --------- | -------------------------- |
| Canvas         | `--jwso-canvas`       | `#f5f7f6` | App background             |
| Surface        | `--jwso-surface`      | `#fff`    | Tables, dialogs, forms     |
| Soft surface   | `--jwso-surface-soft` | `#eef2f0` | Quiet fills, skeletons     |
| Text           | `--jwso-ink`          | `#172421` | Primary information        |
| Secondary text | `--jwso-muted`        | `#596761` | Supporting information     |
| Metadata       | `--jwso-subtle`       | `#74817b` | Nonessential labels        |
| Border         | `--jwso-line`         | `#dce4df` | Separation                 |
| Brand          | `--jwso-brand`        | `#096b57` | Primary actions, selection |
| Brand hover    | `--jwso-brand-hover`  | `#075443` | Action hover               |
| Brand soft     | `--jwso-brand-soft`   | `#e4f2ec` | Quiet selected/hover state |
| Accent         | `--jwso-accent`       | `#c6463c` | Sparse commerce emphasis   |
| Success        | `--jwso-success`      | `#16734f` | Confirmed state            |
| Warning        | `--jwso-warning`      | `#966411` | Pending/attention state    |
| Error          | `--jwso-error`        | `#b53b36` | Failed/destructive state   |
| Information    | `--jwso-info`         | `#315a9e` | Neutral process state      |
| Promotion      | `--jwso-promotion`    | `#a93b31` | Verified promotion only    |
| Selected       | `--jwso-selected`     | `#d5eae0` | Selection                  |
| Disabled       | `--jwso-disabled`     | `#aeb9b3` | Disabled control reference |

Never signal meaning by color alone. Statuses always include text. Promotions, vendor verification, ratings, and fulfilment promises require real data before appearing.

### Type and spacing

Geist is loaded locally and assigned to `--font-jwso-sans`. Page titles use `.jwso-page-title` (2rem mobile, 2.35rem desktop); section titles use `.jwso-section-title` (1.4rem); overlines use `.jwso-kicker` (.75rem); body is default ~1rem with `.jwso-copy` for secondary text; `.jwso-meta` is .82rem; `.jwso-price` is tabular and bold. Product names use compact two-line treatment; operational tables use .86rem body and .73rem headers. Avoid viewport-scaled font sizes and negative letter spacing.

Use a 4px baseline: 4/8/12/16/20/24/32/40/48/64px. Page gutters: 16px mobile, 32px from 768px; content width max 1320px via `.jwso-container`. Page vertical padding: 36px mobile, 44px desktop. Compact forms and tables use 12-20px internal gaps; commerce image grids can use 16-24px gutters. Group related controls closer than unrelated sections.

Radius: 4px small status/media, 6px controls, 8px panels. No pill-shaped primary controls. Shadows are exceptional (`--jwso-shadow` for a floating menu), not the default elevation mechanism. Use borders and surface contrast first. Breakpoint conventions follow Tailwind: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. Fixed-format images use aspect ratio; tables scroll horizontally rather than crush cells.

### Iconography and motion

The storefront uses Lucide for recognizable search, cart, account and quantity actions. Icon-only buttons need an accessible name and tooltip/title. Operational actions use text when the command is consequential. Motion is limited to short color changes, product-image hover and loading pulse. Reduced-motion CSS removes animation/scroll behavior.

## Component standards

| Pattern                       | Standard                                                                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Buttons                       | `.jwso-button` for a command; secondary/quiet/danger modifiers for priority. Disable pending mutations, label the pending state, expose failure. Icon controls use `.jwso-icon-button` and `aria-label`/`title`.                                             |
| Forms                         | Visible `<label>` tied to every input. Use `.jwso-field`, `.jwso-label`, `.jwso-input`, `.jwso-select`, `.jwso-textarea`, `.jwso-help`. Keep browser validation plus existing business validation. Errors use `role="alert"`; success uses `role="status"`.  |
| Product tiles                 | Unframed image-first tile, 4:5 media, name, optional actual seller, actual formatted price. No fake sale, rating or novelty badge. Whole tile links to product detail.                                                                                       |
| Panels                        | `.jwso-panel` for a genuine summary/tool, not every page section. Do not nest panels.                                                                                                                                                                        |
| Tables                        | `.jwso-table-wrap` + `.jwso-table`; real `<th scope="col">`, left text/right money, consistent row height, tabular numbers, real pagination button. Preserve row readability through horizontal scroll. Do not show sort affordance without a sort contract. |
| Status and alerts             | `.jwso-status` with semantic `data-tone`; `.jwso-alert` with tone and explicit next step. Keep backend technical detail out of the main UI when a human explanation suffices.                                                                                |
| Navigation                    | Persistent brand and app identity; storefront search is prominent, admin sections are stable tabs, vendor is one status-led workspace. Current route uses `aria-current`.                                                                                    |
| Filters                       | Applied filters remain visible; clear action returns to all products/orders/users. Do not show category-specific facets until supported.                                                                                                                     |
| Search                        | Storefront form submits the API-supported text search and preserves query in the URL. No fake suggestions.                                                                                                                                                   |
| Empty/loading/error           | `.jwso-empty` explains why and a real next action where possible. `.jwso-skeleton` preserves content geometry. Failed queries offer retry; a successful empty response is not an error.                                                                      |
| Modals/drawers/dropdowns/tabs | Prefer semantic native dialog or accessible established primitives when a real flow needs them. Escape, focus return, labeling, and mobile layout are required. Current language menu uses Radix. Do not add decorative dialogs.                             |

Keyboard focus is visible globally. Controls should remain at least 42px high, except compact table content where row actions remain touch-friendly. Dynamic product imagery has meaningful alternative text in primary contexts; duplicate thumbnails use empty alt with accessible button labels. Respect user zoom and mobile wrapping.

## Commerce patterns

The homepage is a discovery and catalog page, not a marketing landing page. It uses a real product image only when one exists, then category controls, search results, dense product tiles and progressive loading. If the feed has no products, show an honest state rather than fabricated merchandise. Search and category filters use API parameters and URL state. The product page gives media priority, exposes seller identity and stock when available, has bounded quantity selection, and uses the existing add-to-cart mutation. No reviews, returns or shipping assertions appear without data. The cart exposes product lines, quantity/removal, subtotal and a clear disclosure that checkout is not available yet. The account surfaces currently comprise login, customer signup and vendor application; customer profile, order history and addresses are future work.

## Vendor patterns

One workspace follows actual profile status: pending payment → external gateway → pending review/document upload → approved product work, or rejected reapplication. Suspended accounts receive a clear restriction state. Approved product management is table-first with a separate create form and review status. Do not invent revenue, orders, inventory edit or store settings. Future vendor operations should use the same compact tables, status language, visible filters and focused forms.

## Admin patterns

The overview shows returned marketplace metrics, order status, recent orders and top products. Users, orders and low stock use shared table anatomy. Vendor application and product moderation put reason inputs next to consequential actions. Confirm account suspension and vendor approval; mutation errors stay visible. Do not add decorative charts or unsupported notifications. Future moderation, payment, disputes and platform settings should extend this interaction language.

## Quality and contribution rules

Before adding a visual element, identify its data source or action. Preserve authentication handoff, BFF credentials, API hooks and role protections. Do not place tokens in browser storage or UI state. Test keyboard and touch interactions, 320px/mobile/tablet/laptop/large desktop layout, slow/empty/error states, and all supported mutations. New copy that includes a commerce claim must be backed by actual behavior or data. New routes, variants and states should be documented here and in future requirements when not yet implemented.
