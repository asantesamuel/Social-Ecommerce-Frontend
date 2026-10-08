"use client";

/* eslint-disable @next/next/no-img-element -- Product media uses vendor-provided URLs. */

import { useSearchParams } from "next/navigation";
import { useCategories, useProductFeed } from "../../hooks/useCatalog";
import { Link, useRouter } from "../../i18n/routing";
import ProductTile from "../../components/ProductTile";
import { formatCurrency } from "@repo/api";

export default function Home() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get("search")?.trim() || undefined;
  const categoryId = params.get("category") || undefined;
  const feed = useProductFeed({ search, categoryId });
  const categories = useCategories();
  const products = feed.data?.pages.flatMap((page) => page.data) ?? [];
  const featured =
    !search && !categoryId
      ? products.find((product) => product.imageUrls?.[0])
      : undefined;
  const activeCategory = categories.data?.find(
    (category) => category.id === categoryId,
  );

  const selectCategory = (nextCategory?: string) => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (nextCategory) next.set("category", nextCategory);
    router.push(next.size ? `/?${next.toString()}` : "/");
  };

  return (
    <main className="jwso-page jwso-container flex-1">
      {featured && (
        <section
          className="mb-10 grid overflow-hidden rounded-[8px] bg-[#dfe9e4] md:grid-cols-[1fr_1.08fr]"
          aria-label="Featured product"
        >
          <div className="flex flex-col justify-center gap-5 p-7 sm:p-10 lg:p-14">
            <p className="jwso-kicker">JWSO marketplace</p>
            <h1 className="max-w-xl text-[2rem] font-bold leading-[1.12] sm:text-[2.7rem] lg:text-[3.1rem]">
              Discover something worth keeping.
            </h1>
            <p className="jwso-copy max-w-md">
              Explore products from independent sellers, with the details you
              need to choose confidently.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/products/${featured.id}`} className="jwso-button">
                Explore product
              </Link>
              <span className="jwso-price text-lg">
                {formatCurrency(featured.price)}
              </span>
            </div>
          </div>
          <Link
            href={`/products/${featured.id}`}
            className="relative block min-h-[270px] overflow-hidden md:min-h-[400px]"
            aria-label={`View ${featured.name}`}
          >
            <img
              src={featured.imageUrls![0]}
              alt={featured.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-[4px] bg-white/95 px-3 py-2 text-sm font-semibold">
              {featured.name}
            </span>
          </Link>
        </section>
      )}

      <section aria-labelledby="catalog-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="jwso-kicker mb-2">Shop JWSO</p>
            <h1 id="catalog-title" className="jwso-page-title">
              {search
                ? `Results for “${search}”`
                : activeCategory
                  ? activeCategory.name
                  : "Explore products"}
            </h1>
          </div>
          {(search || categoryId) && (
            <Link href="/" className="jwso-button jwso-button--quiet">
              Clear filters
            </Link>
          )}
        </div>

        {categories.isLoading ? (
          <div className="mb-7 flex gap-2" aria-label="Loading categories">
            <span className="jwso-skeleton h-9 w-20 rounded-[6px]" />
            <span className="jwso-skeleton h-9 w-28 rounded-[6px]" />
          </div>
        ) : categories.isError ? (
          <p className="jwso-copy mb-5">
            Categories are unavailable. You can still browse products.
          </p>
        ) : (
          <div
            className="mb-7 flex gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="Product categories"
          >
            <button
              type="button"
              onClick={() => selectCategory()}
              aria-pressed={!categoryId}
              className={`jwso-button whitespace-nowrap ${categoryId ? "jwso-button--secondary" : ""}`}
            >
              All products
            </button>
            {categories.data?.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                aria-pressed={categoryId === category.id}
                className={`jwso-button whitespace-nowrap ${categoryId === category.id ? "" : "jwso-button--secondary"}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {feed.isLoading ? (
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
            aria-label="Loading products"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index}>
                <div className="jwso-skeleton aspect-[4/5] rounded-[6px]" />
                <div className="jwso-skeleton mt-3 h-5 w-3/4 rounded-[4px]" />
              </div>
            ))}
          </div>
        ) : feed.isError ? (
          <div className="jwso-empty" role="alert">
            <h2 className="jwso-section-title">Products could not be loaded</h2>
            <p>Please try again in a moment.</p>
            <button
              type="button"
              onClick={() => feed.refetch()}
              className="jwso-button"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="jwso-empty">
            <h2 className="jwso-section-title">No matching products</h2>
            <p>
              {search || categoryId
                ? "Try another search or browse all products."
                : "Products will appear here when sellers publish them."}
            </p>
            {(search || categoryId) && (
              <Link href="/" className="jwso-button">
                Browse all products
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">
              {products.map((product) => (
                <ProductTile key={product.id} product={product} />
              ))}
            </div>
            {feed.hasNextPage && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  className="jwso-button jwso-button--secondary"
                >
                  {feed.isFetchingNextPage ? "Loading…" : "Load more products"}
                </button>
              </div>
            )}
            {feed.isFetchNextPageError && (
              <p
                className="mt-4 text-center text-[var(--jwso-error)]"
                role="alert"
              >
                More products could not be loaded. Please try again.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
