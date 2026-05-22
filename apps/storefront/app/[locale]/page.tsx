'use client';

/* eslint-disable @next/next/no-img-element -- Catalog images come from dynamic upload URLs. */

import { useProducts, useCategories } from '../../hooks/useCatalog';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/routing';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrls?: string[];
}

export default function Home() {
  const t = useTranslations('Index');
  const { data: productsData, isLoading: pLoad } = useProducts({ limit: 12 });
  const { data: categoriesData, isLoading: cLoad } = useCategories();
  const products = productsData?.data as Product[] | undefined;
  const featuredProduct = products?.find((product) => product.imageUrls?.[0]) || products?.[0];

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 pb-16 pt-28 sm:px-8 lg:pt-32">
      <section className="grid min-h-[520px] gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between rounded-[8px] bg-[#11100e] p-6 text-[#fffdf8] shadow-[0_32px_90px_rgba(17,16,14,0.22)] sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <span className="eyebrow text-[#f06a5f]">Curated Commerce</span>
            <span className="hidden rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70 sm:inline-flex">New Season</span>
          </div>
          <div className="max-w-3xl py-16 lg:py-20">
            <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:text-8xl">{t('title')}</h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/68 sm:text-xl">
              A polished catalog for refined modern goods, built around tactile product stories, fast discovery, and a checkout flow that feels calm.
            </p>
          </div>
          <div className="grid gap-3 border-t border-white/12 pt-6 text-sm font-bold text-white/70 sm:grid-cols-3">
            <span>Free shipping over $120</span>
            <span>Vendor verified goods</span>
            <span>Secure cart sync</span>
          </div>
        </div>

        <Link href={featuredProduct ? `/products/${featuredProduct.id}` : '/'} className="group relative min-h-[420px] overflow-hidden rounded-[8px] bg-[#e9e1d3] shadow-[0_28px_80px_rgba(17,16,14,0.12)]">
          {featuredProduct?.imageUrls?.[0] ? (
            <img src={featuredProduct.imageUrls[0]} alt={featuredProduct.name} className="h-full min-h-[520px] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="grid h-full min-h-[520px] place-items-center bg-[linear-gradient(135deg,#e9e1d3,#f9f5eb)] text-8xl font-black text-[#11100e]/10">S</div>
          )}
          <div className="absolute inset-x-4 bottom-4 rounded-[8px] border border-white/35 bg-[#fffdf8]/88 p-5 shadow-[0_20px_50px_rgba(17,16,14,0.14)] backdrop-blur-md">
            <span className="eyebrow">Featured Drop</span>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black leading-tight">{featuredProduct?.name || 'Premium essentials'}</h2>
                <p className="mt-1 line-clamp-1 text-sm font-medium text-[#706b63]">{featuredProduct?.description || 'Explore the latest arrivals.'}</p>
              </div>
              {featuredProduct && <span className="text-2xl font-black">${featuredProduct.price.toFixed(2)}</span>}
            </div>
          </div>
        </Link>
      </section>

      <div className="flex flex-col gap-4 border-y border-[#ded7ca] py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow">Collections</p>
        <p className="max-w-xl text-sm font-medium leading-6 text-[#706b63]">Minimal filters, clear product cards, and enough visual rhythm to make browsing feel editorial without slowing shoppers down.</p>
      </div>

      <section>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {cLoad ? (
            <div className="h-12 w-40 animate-pulse rounded-[8px] bg-black/5" />
          ) : (
            (categoriesData as Category[] | undefined)?.map((cat) => (
              <button key={cat.id} className="whitespace-nowrap rounded-[8px] border border-[#ded7ca] bg-[#fffdf8]/80 px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-[#11100e] shadow-[0_12px_30px_rgba(17,16,14,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#11100e] hover:bg-[#11100e] hover:text-[#fffdf8]">
                {cat.name}
              </button>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Latest Arrivals</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] sm:text-5xl">Shop the edit</h2>
          </div>
        </div>
        {pLoad ? (
          <div className="bento-grid">
             {[1,2,3,4].map(i => <div key={i} className="h-96 animate-pulse rounded-[8px] bg-white/70 shadow-[0_24px_80px_rgba(17,16,14,0.08)]" />)}
          </div>
        ) : (
          <div className="bento-grid">
            {products?.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} className="group flex min-h-[420px] flex-col overflow-hidden rounded-[8px] border border-[#ded7ca] bg-[#fffdf8]/82 p-3 shadow-[0_18px_60px_rgba(17,16,14,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#11100e]/50 hover:shadow-[0_28px_80px_rgba(17,16,14,0.12)]">
                <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden rounded-[6px] bg-[#e9e1d3]">
                   {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                   ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-[0.14em] text-[#706b63]/70">No Image</div>
                   )}
                   <span className="absolute left-3 top-3 rounded-full bg-[#fffdf8]/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#11100e] backdrop-blur">New</span>
                </div>
                <div className="mt-auto flex flex-col gap-4 px-1 pb-1">
                   <div>
                     <h3 className="mb-2 text-xl font-black leading-tight tracking-[-0.02em] transition-colors group-hover:text-[#c83a2d]">{product.name}</h3>
                     <p className="line-clamp-2 text-sm font-medium leading-6 text-[#706b63]">{product.description}</p>
                   </div>
                   <div className="flex items-center justify-between border-t border-[#ded7ca] pt-4">
                     <span className="text-2xl font-black">${product.price.toFixed(2)}</span>
                     <span className="text-xs font-black uppercase tracking-[0.12em] text-[#706b63]">View</span>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
