'use client';

import { useAdminOrders } from '../../../hooks/useAdmin';
import React, { useState } from 'react';

export default function OrdersManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminOrders(statusFilter);

  if (isLoading) return <div className="flex h-full items-center justify-center p-8 text-2xl font-black">FETCHING ORDERS...</div>;
  if (isError) return <div className="text-[#ff3b30] font-black text-2xl">FAILED TO FETCH ORDERS</div>;

  const orders = data?.pages.flatMap((page: any) => page.data) || [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Order Matrix</h2>
          <p className="text-gray-500 font-medium whitespace-nowrap">Global logistics and sales stream.</p>
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-transparent border border-[#e4e4e7] dark:border-white/20 rounded-xl px-4 py-2 font-bold uppercase text-sm outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </header>

      <div className="glass-card p-0 overflow-hidden text-sm md:text-base">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-[#f4f4f5] dark:border-white/10 uppercase text-xs tracking-wider font-bold text-gray-500">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Placed At</th>
                <th className="p-4">Items</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b border-[#f4f4f5] dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold max-w-[120px] truncate" title={order.id}>{order.id}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">{order.customer}</td>
                  <td className="p-4 text-gray-500 font-medium text-xs">{new Date(order.placedAt).toLocaleString()}</td>
                  <td className="p-4 font-bold">{order.itemCount}</td>
                  <td className="p-4 text-right font-black">${order.total}</td>
                  <td className="p-4 text-right">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-black text-white dark:bg-white dark:text-black rounded-full">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto w-full max-w-sm py-4 border-2 border-black dark:border-white rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          {isFetchingNextPage ? 'Extracting...' : 'Load More Orders'}
        </button>
      )}
    </div>
  );
}
