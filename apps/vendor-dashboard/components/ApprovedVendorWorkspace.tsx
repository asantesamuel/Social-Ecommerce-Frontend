"use client";

/* eslint-disable @next/next/no-img-element -- Product previews come from dynamic upload URLs. */

import type { UseMutationResult } from "@tanstack/react-query";
import { formatCurrency, type Category, type Product } from "@repo/api";
import type { ProductFormState } from "../hooks/useVendorDashboard";

type ApprovedVendorWorkspaceProps = {
  categories: Category[];
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
};

export default function ApprovedVendorWorkspace({
  categories,
  createProductMutation,
  handleNameChange,
  handleProductFieldChange,
  productForm,
  productImage,
  productMessage,
  setProductImage,
  setProductMessage,
  vendorProducts,
}: ApprovedVendorWorkspaceProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-card p-8 shadow-md">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              Create Product
            </h3>
            <p className="text-sm font-medium text-[#888]">
              Upload the product image first, then save the listing.
            </p>
          </div>
          <span className="rounded-full bg-[#111] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
            Real Upload Flow
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={productForm.name}
            onChange={(event) => {
              handleNameChange(event.target.value);
              setProductMessage(null);
            }}
            placeholder="Product name"
            className="rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none"
          />
          <input
            value={productForm.slug}
            onChange={(event) => {
              handleProductFieldChange(
                "slug",
                event.target.value.toLowerCase(),
              );
              setProductMessage(null);
            }}
            placeholder="product-slug"
            className="rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none"
          />
          <input
            value={productForm.price}
            onChange={(event) => {
              handleProductFieldChange("price", event.target.value);
              setProductMessage(null);
            }}
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            className="rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none"
          />
          <input
            value={productForm.stockQuantity}
            onChange={(event) => {
              handleProductFieldChange("stockQuantity", event.target.value);
              setProductMessage(null);
            }}
            type="number"
            min="0"
            step="1"
            placeholder="Stock quantity"
            className="rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none"
          />
          <select
            value={productForm.categoryId}
            onChange={(event) => {
              handleProductFieldChange("categoryId", event.target.value);
              setProductMessage(null);
            }}
            className="rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none md:col-span-2"
          >
            <option value="">No Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <textarea
            value={productForm.description}
            onChange={(event) => {
              handleProductFieldChange("description", event.target.value);
              setProductMessage(null);
            }}
            placeholder="Product description"
            className="min-h-32 resize-y rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none md:col-span-2"
          />
          <div className="md:col-span-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                setProductImage(event.target.files?.[0] || null);
                setProductMessage(null);
              }}
              className="block w-full rounded-xl border border-[#e4e4e7] bg-gray-50 px-4 py-4 text-sm text-slate-500 transition-all file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-black file:px-6 file:py-3 file:text-sm file:font-semibold file:text-white"
            />
            <p className="mt-3 text-xs font-medium text-minimal-gray">
              Accepted: JPEG, PNG, WEBP. Image upload is verified before the
              product is stored.
            </p>
            {productImage && (
              <p className="mt-2 text-xs font-bold text-[#111]">
                Selected: {productImage.name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => createProductMutation.mutate()}
          disabled={
            createProductMutation.isPending ||
            !productForm.name.trim() ||
            !productForm.slug.trim() ||
            productForm.price === "" ||
            productForm.stockQuantity === ""
          }
          className="btn-dopamine mt-6 w-full py-4 text-lg text-white disabled:opacity-50"
        >
          {createProductMutation.isPending
            ? "Uploading and Saving..."
            : "Create Product"}
        </button>

        {productMessage && (
          <p className="mt-4 text-sm font-medium text-minimal-gray">
            {productMessage}
          </p>
        )}
      </div>

      <div className="glass-card p-8 shadow-md">
        <div className="mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tight text-black">
            Your Products
          </h3>
          <p className="text-sm font-medium text-[#888]">
            Product images are saved only after the pre-signed upload is
            confirmed.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {vendorProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-[#f4f4f5] bg-[#fafafa] p-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#f4f4f5]">
                  {product.imageUrls?.[0] ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-black tracking-tight">
                        {product.name}
                      </h4>
                      <p className="text-sm font-medium text-minimal-gray">
                        {product.slug}
                      </p>
                    </div>
                    <span className="rounded-full bg-black px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
                      {product.approvalStatus || "pending"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-6 text-sm font-bold text-[#555]">
                    <span>{formatCurrency(product.price)}</span>
                    <span>{product.stockQuantity ?? 0} in stock</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {vendorProducts.length === 0 && (
            <p className="text-sm font-medium text-minimal-gray">
              No products yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
