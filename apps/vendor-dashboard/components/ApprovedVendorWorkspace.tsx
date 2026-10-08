"use client";

/* eslint-disable @next/next/no-img-element -- Product previews use vendor-provided URLs. */

import type { UseMutationResult } from "@tanstack/react-query";
import { formatCurrency, type Category, type Product } from "@repo/api";
import type { ProductFormState } from "../hooks/useVendorDashboard";

type Props = {
  categories: Category[];
  categoriesError: boolean;
  createProductMutation: UseMutationResult<Product, unknown, void, unknown>;
  handleNameChange: (value: string) => void;
  handleProductFieldChange: (
    field: keyof ProductFormState,
    value: string,
  ) => void;
  productForm: ProductFormState;
  productImage: File | null;
  productMessage: string | null;
  setProductImage: (file: File | null) => void;
  setProductMessage: (message: string | null) => void;
  vendorProducts: Product[];
  productsLoading: boolean;
  productsError: boolean;
  hasMoreProducts: boolean;
  loadingMoreProducts: boolean;
  loadMoreProducts: () => void;
  retryProducts: () => void;
};

export default function ApprovedVendorWorkspace({
  categories,
  categoriesError,
  createProductMutation,
  handleNameChange,
  handleProductFieldChange,
  productForm,
  productImage,
  productMessage,
  setProductImage,
  setProductMessage,
  vendorProducts,
  productsLoading,
  productsError,
  hasMoreProducts,
  loadingMoreProducts,
  loadMoreProducts,
  retryProducts,
}: Props) {
  const change = (field: keyof ProductFormState, value: string) => {
    handleProductFieldChange(field, value);
    setProductMessage(null);
  };
  return (
    <div className="grid gap-8">
      <section aria-labelledby="vendor-products-title">
        <div className="mb-4">
          <p className="jwso-kicker mb-2">Catalog</p>
          <h2 id="vendor-products-title" className="jwso-section-title">
            Your products
          </h2>
          <p className="jwso-copy mt-1 text-sm">
            Track stock, price and listing review status.
          </p>
        </div>
        {productsLoading ? (
          <div
            className="jwso-skeleton h-44 rounded-[6px]"
            aria-label="Loading products"
          />
        ) : productsError && vendorProducts.length === 0 ? (
          <div className="jwso-empty" role="alert">
            <h3 className="jwso-section-title">Products unavailable</h3>
            <p>Your listings could not be loaded.</p>
            <button
              type="button"
              onClick={retryProducts}
              className="jwso-button"
            >
              Retry
            </button>
          </div>
        ) : vendorProducts.length === 0 ? (
          <div className="jwso-empty">
            <h3 className="jwso-section-title">No products yet</h3>
            <p>Create your first listing below. It will be sent for review.</p>
            <a href="#create-product" className="jwso-button">
              Create a product
            </a>
          </div>
        ) : (
          <div className="jwso-table-wrap">
            <table className="jwso-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Review status</th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex min-w-[180px] items-center gap-3">
                        <div className="h-12 w-12 flex-none overflow-hidden rounded-[4px] bg-[var(--jwso-surface-soft)]">
                          {product.imageUrls?.[0] && (
                            <img
                              src={product.imageUrls[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          {product.slug && (
                            <p className="jwso-meta">{product.slug}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="jwso-price">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="tabular-nums">
                      {product.stockQuantity ?? 0}
                    </td>
                    <td>
                      <span
                        className="jwso-status"
                        data-tone={
                          product.approvalStatus === "approved"
                            ? "success"
                            : product.approvalStatus === "rejected" ||
                                product.approvalStatus === "flagged"
                              ? "error"
                              : "warning"
                        }
                      >
                        {product.approvalStatus || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {productsError && vendorProducts.length > 0 && (
          <p className="jwso-alert mt-3" data-tone="error" role="alert">
            More products could not be loaded. Please try again.
          </p>
        )}
        {hasMoreProducts && (
          <button
            type="button"
            onClick={loadMoreProducts}
            disabled={loadingMoreProducts}
            className="jwso-button jwso-button--secondary mt-4"
          >
            {loadingMoreProducts ? "Loading…" : "Load more products"}
          </button>
        )}
      </section>

      <section
        id="create-product"
        aria-labelledby="create-product-title"
        className="border-t border-[var(--jwso-line)] pt-7"
      >
        <h2 id="create-product-title" className="jwso-section-title">
          Create a product
        </h2>
        <p className="jwso-copy mt-1 text-sm">
          New listings are reviewed before they appear in the storefront.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createProductMutation.mutate();
          }}
          className="mt-6 grid max-w-[780px] gap-5 sm:grid-cols-2"
        >
          <div className="jwso-field">
            <label htmlFor="product-name" className="jwso-label">
              Product name
            </label>
            <input
              id="product-name"
              className="jwso-input"
              required
              value={productForm.name}
              onChange={(event) => {
                handleNameChange(event.target.value);
                setProductMessage(null);
              }}
            />
          </div>
          <div className="jwso-field">
            <label htmlFor="product-slug" className="jwso-label">
              URL slug
            </label>
            <input
              id="product-slug"
              className="jwso-input"
              required
              value={productForm.slug}
              onChange={(event) =>
                change("slug", event.target.value.toLowerCase())
              }
            />
            <p className="jwso-help">
              Generated from the name; you can edit it.
            </p>
          </div>
          <div className="jwso-field">
            <label htmlFor="product-price" className="jwso-label">
              Price
            </label>
            <input
              id="product-price"
              className="jwso-input"
              type="number"
              min="0"
              step="0.01"
              required
              value={productForm.price}
              onChange={(event) => change("price", event.target.value)}
            />
          </div>
          <div className="jwso-field">
            <label htmlFor="product-stock" className="jwso-label">
              Stock quantity
            </label>
            <input
              id="product-stock"
              className="jwso-input"
              type="number"
              min="0"
              step="1"
              required
              value={productForm.stockQuantity}
              onChange={(event) => change("stockQuantity", event.target.value)}
            />
          </div>
          <div className="jwso-field sm:col-span-2">
            <label htmlFor="product-category" className="jwso-label">
              Category
            </label>
            <select
              id="product-category"
              className="jwso-select"
              value={productForm.categoryId}
              onChange={(event) => change("categoryId", event.target.value)}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesError && (
              <p className="jwso-help">
                Categories could not be loaded. You can still create the listing
                without one.
              </p>
            )}
          </div>
          <div className="jwso-field sm:col-span-2">
            <label htmlFor="product-description" className="jwso-label">
              Description
            </label>
            <textarea
              id="product-description"
              className="jwso-textarea"
              value={productForm.description}
              onChange={(event) => change("description", event.target.value)}
            />
          </div>
          <div className="jwso-field sm:col-span-2">
            <label htmlFor="product-image" className="jwso-label">
              Product image
            </label>
            <input
              id="product-image"
              className="jwso-input file:mr-3 file:border-0 file:bg-[var(--jwso-brand-soft)] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[var(--jwso-brand)]"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setProductImage(event.target.files?.[0] || null);
                setProductMessage(null);
              }}
            />
            <p className="jwso-help">
              JPEG, PNG or WEBP.{" "}
              {productImage && `Selected: ${productImage.name}`}
            </p>
          </div>
          {productMessage && (
            <p
              className="jwso-alert sm:col-span-2"
              data-tone={createProductMutation.isError ? "error" : "success"}
              role="status"
            >
              {productMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={
              createProductMutation.isPending ||
              !productForm.name.trim() ||
              !productForm.slug.trim() ||
              productForm.price === "" ||
              productForm.stockQuantity === ""
            }
            className="jwso-button sm:col-span-2 sm:w-fit"
          >
            {createProductMutation.isPending
              ? "Uploading and saving…"
              : "Create product"}
          </button>
        </form>
      </section>
    </div>
  );
}
