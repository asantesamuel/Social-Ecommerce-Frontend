"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProduct } from "../../../../hooks/useCatalog";
import { useCart } from "../../../../hooks/useCart";
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react";
import { Link, useRouter } from "../../../../i18n/routing";
import Image from "next/image";
import { formatCurrency } from "@repo/api";

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: productData, isLoading } = useProduct(id);
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center p-24">
        <div className="animate-pulse h-96 w-full max-w-4xl bg-black/5 dark:bg-white/10 rounded-3xl" />
      </div>
    );
  if (!productData)
    return (
      <div className="p-24 text-center font-bold text-xl text-minimal-gray">
        Product not found
      </div>
    );

  const product = productData;

  const handleAddToCart = () => {
    addItem.mutate(
      { productId: id, quantity },
      {
        onSuccess: () => {
          router.push("/cart");
        },
      },
    );
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 flex-1 relative z-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-minimal-gray hover:text-foreground transition-colors mb-12 font-medium tracking-wide"
      >
        <ArrowLeft size={20} /> Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-start">
        {/* Images */}
        <div className="flex flex-col gap-4 sticky top-32">
          <div className="w-full aspect-[4/5] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 rounded-3xl overflow-hidden glass-card flex items-center justify-center p-0 shadow-sm border-0 border-transparent">
            {product.imageUrls?.[0] ? (
              <Image
                src={product.imageUrls[0]}
                alt={product.name}
                className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="text-minimal-gray font-bold tracking-widest uppercase opacity-50 text-xl">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col pt-4">
          <div className="mb-4 text-minimal-red font-bold uppercase tracking-[0.2em] text-sm">
            {product.category?.name || "Uncategorized"}
          </div>
          <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter leading-none">
            {product.name}
          </h1>
          <div className="text-4xl font-black text-foreground mb-12">
            {formatCurrency(product.price)}
          </div>

          <p className="text-minimal-gray text-xl leading-relaxed mb-16 font-light">
            {product.description}
          </p>

          <div className="grid grid-cols-[140px_1fr] gap-4 mb-12">
            <div className="flex items-center justify-between glass-card !p-2 rounded-2xl shadow-sm">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors outline-none cursor-pointer"
              >
                <Minus size={20} />
              </button>
              <span className="font-black text-xl">{quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors outline-none cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addItem.isPending}
              className="btn-dopamine flex items-center justify-center gap-3 px-8 outline-none disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100"
            >
              <ShoppingCart size={24} />
              {addItem.isPending ? "ADDING..." : "ADD TO CART"}
            </button>
          </div>

          <div className="text-sm font-semibold text-minimal-gray flex gap-6 pt-8 border-t border-black/5 dark:border-white/10">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <strong className="text-foreground">
                {product.stockQuantity ?? 0}
              </strong>{" "}
              in stock
            </span>
            <span>
              Vendor:{" "}
              <strong className="text-foreground">
                {product.vendor?.companyName || "N/A"}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
