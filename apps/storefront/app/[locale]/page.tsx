'use client';

import { useProducts, useCategories } from '../../hooks/useCatalog';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/routing';

export default function Home() {
  const t = useTranslations('Index');
  const { data: productsData, isLoading: pLoad } = useProducts({ limit: 12 });
  const { data: categoriesData, isLoading: cLoad } = useCategories();

  return (
    <main className="container mx-auto px-4 pt-24 pb-12 flex-1 relative z-10 w-full">
      <div className="mb-12 max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.9]">{t('title')}</h1>
        <p className="text-[#888888] text-xl md:text-3xl font-bold tracking-tight max-w-3xl leading-snug">
          The curated catalog of refined modern goods. Connect straight to our high-energy inventory.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-minimal-gray mb-6">Collections</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {cLoad ? (
            <div className="h-14 w-40 bg-black/5 dark:bg-white/10 rounded-2xl animate-pulse" />
          ) : (
            categoriesData?.map((cat: any) => (
              <button key={cat.id} className="whitespace-nowrap px-8 py-4 rounded-[24px] bg-white border border-[#f4f4f5] shadow-md font-black tracking-widest uppercase hover:bg-[#ff3b30] hover:text-white text-[#111] transition-all cursor-pointer hover:-translate-y-1">
                {cat.name}
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-minimal-gray mb-6">Latest Arrivals</h2>
        {pLoad ? (
          <div className="bento-grid gap-6 p-0">
             {[1,2,3,4].map(i => <div key={i} className="h-80 glass-card animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="bento-grid gap-6 p-0">
            {productsData?.data?.map((product: any) => (
              <Link href={`/products/${product.id}`} key={product.id} className="bento-item glass-card group flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl shadow-sm rounded-3xl p-5">
                <div className="w-full aspect-square bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 rounded-2xl mb-6 overflow-hidden relative">
                   {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-minimal-gray font-bold tracking-widest opacity-50 uppercase text-xs">No Image</div>
                   )}
                </div>
                <div className="flex justify-between items-start mt-auto flex-col gap-2">
                   <div>
                     <h3 className="font-bold text-xl leading-tight mb-2 tracking-tight group-hover:text-minimal-red transition-colors">{product.name}</h3>
                     <p className="text-minimal-gray text-sm line-clamp-2 font-medium leading-relaxed">{product.description}</p>
                   </div>
                   <div className="font-black text-2xl text-foreground mt-4">${product.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
