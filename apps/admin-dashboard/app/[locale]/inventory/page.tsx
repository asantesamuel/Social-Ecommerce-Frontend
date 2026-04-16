'use client';

import { useAdminInventory } from '../../../hooks/useAdmin';
import React, { useState } from 'react';

export default function InventoryAlertsPage() {
  const [threshold, setThreshold] = useState(10);
  const { data, isLoading, isError } = useAdminInventory(threshold);

  if (isLoading) return <div className="flex h-full items-center justify-center p-8 text-2xl font-black">SCANNING INVENTORY...</div>;
  if (isError) return <div className="text-[#ff3b30] font-black text-2xl">FAILED TO SCAN INVENTORY</div>;

  const alerts = data?.alerts || [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Inventory Alerts</h2>
          <p className="text-[#ff3b30] font-bold whitespace-nowrap">Critical Low Stock Thresholds.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="font-bold text-sm uppercase">Threshold:</label>
          <input 
            type="number" 
            value={threshold} 
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-24 bg-transparent border border-[#e4e4e7] dark:border-white/20 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-black dark:focus:border-white"
            min="1"
            max="100"
          />
        </div>
      </header>

      {alerts.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mb-6 flex items-center justify-center text-white">✓</div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Systems Nominal</h3>
          <p className="text-gray-500 font-medium max-w-sm">All inventory levels are currently sitting comfortably above the warning thresholds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alerts.map((alert: any) => (
            <div key={alert.productId} className="glass-card shadow-2xl border-t-4 border-[#ff3b30] transition-transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black tracking-widest uppercase text-red-500 bg-red-500/10 px-2 py-1 rounded">Critically Low</span>
                <span className="text-3xl font-black text-[#ff3b30]">{alert.stockQuantity}</span>
              </div>
              <h3 className="text-xl font-bold truncate mb-1" title={alert.productName}>{alert.productName}</h3>
              <p className="text-sm font-medium text-gray-500">Vendor: <span className="text-black dark:text-white">{alert.vendorName}</span></p>
              
              <div className="mt-6">
                <button className="w-full py-3 bg-black text-white dark:bg-white dark:text-black font-black uppercase tracking-widest text-xs rounded-xl hover:opacity-80 transition-opacity">
                  Notify Vendor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
