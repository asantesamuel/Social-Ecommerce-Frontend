"use client";

/* eslint-disable @next/next/no-img-element -- Product media uses vendor-provided URLs. */

import { formatCurrency, type Product } from "@repo/api";
import { Link } from "../i18n/routing";

export default function ProductTile({ product }: { product: Product }) {
  const image = product.imageUrls?.[0];
  const vendor = product.vendor?.companyName || product.vendor?.businessName;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block min-w-0 text-inherit no-underline"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-[#e7eeea]">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--jwso-muted)]">
            Image unavailable
          </div>
        )}
      </div>
      <div className="pt-3">
        {vendor && <p className="jwso-meta truncate">{vendor}</p>}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-[.95rem] font-semibold leading-5 group-hover:text-[var(--jwso-brand)]">
          {product.name}
        </h3>
        <p className="jwso-price mt-2 text-base">
          {formatCurrency(product.price)}
        </p>
      </div>
    </Link>
  );
}
