"use client";

/* eslint-disable @next/next/no-img-element -- Cart media uses vendor-provided URLs. */

import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency, getApiErrorMessage } from "@repo/api";
import { useCart } from "../../../hooks/useCart";
import { Link } from "../../../i18n/routing";

export default function CartPage() {
  const { session, cart, updateItem, removeItem, clearCart } = useCart();
  const items = cart.data?.items ?? [];
  const operationError =
    updateItem.error || removeItem.error || clearCart.error;

  return (
    <main className="jwso-page jwso-container w-full max-w-[1160px] flex-1">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--jwso-muted)] hover:text-[var(--jwso-brand)]"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Continue shopping
      </Link>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--jwso-line)] pb-5">
        <h1 className="jwso-page-title">Your cart</h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => clearCart.mutate()}
            disabled={clearCart.isPending}
            className="jwso-button jwso-button--quiet"
          >
            Clear cart
          </button>
        )}
      </div>
      {session.isLoading || (session.data?.user && cart.isLoading) ? (
        <div
          className="jwso-skeleton h-48 rounded-[6px]"
          aria-label="Loading cart"
        />
      ) : !session.data?.user ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">Sign in to see your cart</h2>
          <p>Your cart is linked to your account.</p>
          <Link href="/login" className="jwso-button">
            Sign in
          </Link>
        </div>
      ) : cart.isError ? (
        <div className="jwso-empty" role="alert">
          <h2 className="jwso-section-title">Your cart could not be loaded</h2>
          <p>Your items have not been changed. Please try again.</p>
          <button
            type="button"
            onClick={() => cart.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">Your cart is empty</h2>
          <p>Explore JWSO and add products you like.</p>
          <Link href="/" className="jwso-button">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 border-t border-[var(--jwso-line)]">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 border-b border-[var(--jwso-line)] py-5 sm:gap-6"
              >
                <div className="h-24 w-20 flex-none overflow-hidden rounded-[4px] bg-[var(--jwso-surface-soft)] sm:h-32 sm:w-28">
                  {item.product?.imageUrls?.[0] ? (
                    <img
                      src={item.product.imageUrls[0]}
                      alt={item.productName || item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-2 text-center text-xs text-[var(--jwso-muted)]">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h2 className="min-w-0 font-semibold">
                      {item.productName || item.product?.name || "Product"}
                    </h2>
                    <div className="text-right">
                      <p className="jwso-price">
                        {formatCurrency(Number(item.unitPrice) * item.quantity)}
                      </p>
                      <p className="jwso-meta">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex h-[38px] items-center border border-[var(--jwso-line)] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                        disabled={item.quantity <= 1 || updateItem.isPending}
                        className="jwso-icon-button jwso-icon-button--secondary !h-[36px] !min-h-[36px] !w-[36px] !flex-none !border-0"
                        aria-label={`Decrease ${item.productName || "product"} quantity`}
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={updateItem.isPending}
                        className="jwso-icon-button jwso-icon-button--secondary !h-[36px] !min-h-[36px] !w-[36px] !flex-none !border-0"
                        aria-label={`Increase ${item.productName || "product"} quantity`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.id)}
                      disabled={removeItem.isPending}
                      className="jwso-icon-button jwso-icon-button--secondary"
                      aria-label={`Remove ${item.productName || "product"}`}
                      title="Remove item"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {operationError && (
              <p className="jwso-alert mt-4" data-tone="error" role="alert">
                {getApiErrorMessage(
                  operationError,
                  "Cart could not be updated. Please try again.",
                )}
              </p>
            )}
          </div>
          <aside
            className="jwso-panel lg:sticky lg:top-24"
            aria-label="Cart summary"
          >
            <div className="jwso-panel__header">
              <h2 className="jwso-section-title">Summary</h2>
            </div>
            <div className="jwso-panel__body">
              <div className="flex justify-between gap-3">
                <span className="jwso-copy">Subtotal</span>
                <strong className="jwso-price">
                  {formatCurrency(cart.data?.subtotal ?? 0)}
                </strong>
              </div>
              <p className="jwso-help mt-3">
                Shipping and final charges are not calculated here.
              </p>
              <div className="jwso-alert mt-6" data-tone="warning">
                <strong>Checkout is not available yet.</strong>
                <p className="mt-1 text-sm">
                  You can save items in your cart while purchasing is being
                  prepared.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
