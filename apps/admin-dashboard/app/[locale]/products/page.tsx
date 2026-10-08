"use client";

/* eslint-disable @next/next/no-img-element -- Moderation previews use vendor-provided URLs. */

import { useState } from "react";
import { formatCurrency, getApiErrorMessage } from "@repo/api";
import {
  useAdminPendingProducts,
  useModerateProduct,
} from "../../../hooks/useAdmin";

export default function ModerationQueuePage() {
  const productsQuery = useAdminPendingProducts();
  const moderate = useModerateProduct();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonRequired, setReasonRequired] = useState<string | null>(null);
  const products = productsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const handleAction = (
    productId: string,
    action: "approve" | "reject" | "flag",
  ) => {
    const reason = reasons[productId]?.trim();
    if (action !== "approve" && !reason) {
      setReasonRequired(productId);
      return;
    }
    setReasonRequired(null);
    moderate.mutate(
      { productId, action, reason },
      {
        onSuccess: () =>
          setReasons((current) => {
            const next = { ...current };
            delete next[productId];
            return next;
          }),
      },
    );
  };

  return (
    <div className="grid gap-6">
      <header>
        <p className="jwso-kicker mb-2">Listing quality</p>
        <h1 className="jwso-page-title">Product moderation</h1>
        <p className="jwso-copy mt-2">
          Review listings before they appear in the marketplace.
        </p>
      </header>
      {moderate.isError && (
        <p className="jwso-alert" data-tone="error" role="alert">
          {getApiErrorMessage(
            moderate.error,
            "The review could not be saved. Please try again.",
          )}
        </p>
      )}
      {productsQuery.isLoading ? (
        <div
          className="jwso-skeleton h-52 rounded-[6px]"
          aria-label="Loading product queue"
        />
      ) : productsQuery.isError ? (
        <div className="jwso-empty" role="alert">
          <h2 className="jwso-section-title">Review queue unavailable</h2>
          <p>Pending products could not be loaded.</p>
          <button
            type="button"
            onClick={() => productsQuery.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">No products awaiting review</h2>
          <p>New vendor listings will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--jwso-line)] border-y border-[var(--jwso-line)]">
          {products.map((product) => (
            <article
              key={product.id}
              className="grid gap-5 py-6 sm:grid-cols-[112px_minmax(0,1fr)]"
            >
              <div className="h-28 w-28 overflow-hidden rounded-[4px] bg-[var(--jwso-surface-soft)]">
                {product.imageUrls?.[0] ? (
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-xs text-[var(--jwso-muted)]">
                    No image
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="jwso-section-title">{product.name}</h2>
                  <strong className="jwso-price">
                    {formatCurrency(product.price)}
                  </strong>
                </div>
                <p className="jwso-copy mt-2 text-sm">{product.description}</p>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <dt className="inline text-[var(--jwso-muted)]">
                      Vendor:{" "}
                    </dt>
                    <dd className="inline font-semibold">
                      {product.vendor?.companyName ||
                        product.vendor?.businessName ||
                        "Unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-[var(--jwso-muted)]">
                      Category:{" "}
                    </dt>
                    <dd className="inline">
                      {product.category?.name || "Uncategorized"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-[var(--jwso-muted)]">Stock: </dt>
                    <dd className="inline tabular-nums">
                      {product.stockQuantity ?? 0}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(product.id, "approve")}
                    disabled={moderate.isPending}
                    className="jwso-button"
                  >
                    Approve
                  </button>
                  <div className="jwso-field min-w-[180px] flex-1">
                    <label
                      htmlFor={`reason-${product.id}`}
                      className="jwso-label"
                    >
                      Reason for rejection or flag
                    </label>
                    <input
                      id={`reason-${product.id}`}
                      className="jwso-input"
                      value={reasons[product.id] ?? ""}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [product.id]: event.target.value,
                        }))
                      }
                      aria-invalid={reasonRequired === product.id}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAction(product.id, "reject")}
                    disabled={moderate.isPending}
                    className="jwso-button jwso-button--danger"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(product.id, "flag")}
                    disabled={moderate.isPending}
                    className="jwso-button jwso-button--secondary"
                  >
                    Flag
                  </button>
                </div>
                {reasonRequired === product.id && (
                  <p
                    className="mt-2 text-sm text-[var(--jwso-error)]"
                    role="alert"
                  >
                    Enter a reason before rejecting or flagging.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {productsQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => productsQuery.fetchNextPage()}
          disabled={productsQuery.isFetchingNextPage}
          className="jwso-button jwso-button--secondary mx-auto"
        >
          {productsQuery.isFetchingNextPage ? "Loading…" : "Load more products"}
        </button>
      )}
    </div>
  );
}
