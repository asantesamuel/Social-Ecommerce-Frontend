'use client';

import { useAdminPendingProducts, useModerateProduct } from '../../../hooks/useAdmin';
import React, { useState } from 'react';

export default function ModerationQueuePage() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminPendingProducts();
  const moderateProduct = useModerateProduct();
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});

  if (isLoading) return <div className="flex h-full items-center justify-center p-8 text-2xl font-black">FETCHING MANIFESTS...</div>;
  if (isError) return <div className="text-[#ff3b30] font-black text-2xl">FAILED TO FETCH QUEUE</div>;

  const products = data?.pages.flatMap((page: any) => page.data) || [];

  const handleAction = (productId: string, action: 'approve' | 'reject' | 'flag') => {
    let reason;
    if (action !== 'approve') {
      reason = rejectReason[productId];
      if (!reason) {
        alert('Please provide a reason before rejecting or flagging.');
        return;
      }
    }
    
    moderateProduct.mutate(
      { productId, action, reason },
      {
        onSuccess: () => {
           setRejectReason((prev) => {
             const newState = { ...prev };
             delete newState[productId];
             return newState;
           });
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-4xl font-black uppercase tracking-tighter">Needs Review</h2>
        <p className="text-gray-500 font-medium">Moderate incoming vendor product listings.</p>
      </header>

      {products.length === 0 ? (
         <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Inbox Zero</h3>
            <p className="text-gray-500 font-medium max-w-sm">There are no pending products awaiting your review.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-[#f4f4f5] dark:divide-white/10 glass-card p-0 overflow-hidden">
          {products.map((product: any) => (
            <div key={product.id} className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
               {/* Product Image / Visual Placeholder */}
               <div className="w-full md:w-48 h-48 bg-gray-100 dark:bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                 {product.imageUrls?.[0] ? (
                   <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-xs font-bold uppercase text-gray-400">No Image</span>
                 )}
               </div>

               {/* Details */}
               <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-black">{product.name}</h3>
                    <span className="text-2xl font-black text-[#ff3b30]">${product.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-4 flex-1">{product.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
                    <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">Category: {product.category?.name || 'Uncategorized'}</div>
                    <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">Vendor: {product.vendor?.companyName || 'Unknown'}</div>
                    <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">Stock: {product.stockQuantity}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
                     <button
                       onClick={() => handleAction(product.id, 'approve')}
                       disabled={moderateProduct.isPending}
                       className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-xs rounded-xl hover:opacity-80 transition-opacity"
                     >
                       Approve Drops
                     </button>
                     
                     <div className="flex flex-1 gap-2">
                       <input 
                         type="text" 
                         placeholder="Reason for Rejection/Flag..."
                         value={rejectReason[product.id] || ''}
                         onChange={(e) => setRejectReason(prev => ({ ...prev, [product.id]: e.target.value }))}
                         className="flex-1 bg-transparent border border-[#e4e4e7] dark:border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                       />
                       <button
                         onClick={() => handleAction(product.id, 'reject')}
                         disabled={moderateProduct.isPending}
                         className="px-6 py-3 border border-red-500 text-red-500 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                       >
                         Reject
                       </button>
                       <button
                         onClick={() => handleAction(product.id, 'flag')}
                         disabled={moderateProduct.isPending}
                         className="px-6 py-3 border border-orange-500 text-orange-500 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-500 hover:text-white transition-colors"
                       >
                         Flag
                       </button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto w-full max-w-sm py-4 border-2 border-black dark:border-white rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More Pending Products'}
        </button>
      )}
    </div>
  );
}
