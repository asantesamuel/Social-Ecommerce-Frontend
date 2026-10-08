"use client";

/* eslint-disable @next/next/no-img-element -- Product media uses vendor-provided URLs. */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatCurrency, getApiErrorMessage } from "@repo/api";
import { useProduct } from "../../../../hooks/useCatalog";
import { useCart } from "../../../../hooks/useCart";
import { Link, useRouter } from "../../../../i18n/routing";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const productQuery = useProduct(id);
  const { session, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const product = productQuery.data;
  const images = product?.imageUrls ?? [];
  const stock = product?.stockQuantity;

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [id]);

  const addToCart = () => {
    addItem.mutate(
      { productId: id, quantity },
      { onSuccess: () => router.push("/cart") },
    );
  };

  return (
    <main className="jwso-page jwso-container flex-1">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--jwso-muted)] hover:text-[var(--jwso-brand)]"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to products
      </Link>
      {productQuery.isLoading ? (
        <div className="grid gap-8 md:grid-cols-2" aria-label="Loading product">
          <div className="jwso-skeleton aspect-square rounded-[6px]" />
          <div className="space-y-5">
            <div className="jwso-skeleton h-9 w-3/4 rounded-[4px]" />
            <div className="jwso-skeleton h-6 w-1/3 rounded-[4px]" />
          </div>
        </div>
      ) : productQuery.isError || !product ? (
        <div className="jwso-empty" role="alert">
          <h1 className="jwso-section-title">Product unavailable</h1>
          <p>We could not load this product. It may have been removed.</p>
          <Link href="/" className="jwso-button">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)] lg:gap-14">
          <section aria-label="Product images" className="min-w-0">
            <div className="aspect-square overflow-hidden rounded-[6px] bg-[#e7eeea] sm:aspect-[5/4]">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={`${product.name}, image ${activeImage + 1} of ${images.length}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full place-items-center text-[var(--jwso-muted)]">
                  Image unavailable
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={activeImage === index}
                    className={`h-20 w-20 flex-none overflow-hidden rounded-[4px] border-2 ${activeImage === index ? "border-[var(--jwso-brand)]" : "border-transparent"}`}
                  >
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className="min-w-0">
            {product.category?.name && (
              <p className="jwso-kicker mb-3">{product.category.name}</p>
            )}
            <h1 className="text-[2rem] font-bold leading-tight sm:text-[2.5rem]">
              {product.name}
            </h1>
            <p className="jwso-price mt-4 text-[1.8rem]">
              {formatCurrency(product.price)}
            </p>
            {(product.vendor?.companyName || product.vendor?.businessName) && (
              <div className="mt-6 border-y border-[var(--jwso-line)] py-4">
                <p className="jwso-meta">Sold by</p>
                <p className="mt-1 font-semibold">
                  {product.vendor.companyName || product.vendor.businessName}
                </p>
              </div>
            )}
            {product.description && (
              <div className="mt-6">
                <h2 className="text-sm font-bold">About this product</h2>
                <p className="jwso-copy mt-2 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
            {typeof stock === "number" && (
              <p className="mt-6 text-sm font-semibold" role="status">
                {stock > 0 ? `${stock} available` : "Out of stock"}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <div
                className="inline-flex h-[42px] items-center border border-[var(--jwso-line)] bg-white"
                aria-label={`Quantity ${quantity}`}
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="jwso-icon-button jwso-icon-button--secondary !border-0"
                  aria-label="Decrease quantity"
                  title="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.min(stock ?? Number.MAX_SAFE_INTEGER, quantity + 1),
                    )
                  }
                  disabled={typeof stock === "number" && quantity >= stock}
                  className="jwso-icon-button jwso-icon-button--secondary !border-0"
                  aria-label="Increase quantity"
                  title="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              {session.isLoading ? (
                <button
                  type="button"
                  disabled
                  className="jwso-button flex-1 sm:flex-none"
                >
                  Checking account…
                </button>
              ) : session.data?.user ? (
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={addItem.isPending || stock === 0}
                  className="jwso-button flex-1 sm:flex-none"
                >
                  <ShoppingBag size={17} aria-hidden="true" />{" "}
                  {addItem.isPending ? "Adding…" : "Add to cart"}
                </button>
              ) : (
                <Link href="/login" className="jwso-button flex-1 sm:flex-none">
                  Sign in to add to cart
                </Link>
              )}
            </div>
            {addItem.isError && (
              <p className="mt-3 text-sm text-[var(--jwso-error)]" role="alert">
                {getApiErrorMessage(
                  addItem.error,
                  "Could not add this product. Please try again.",
                )}
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
