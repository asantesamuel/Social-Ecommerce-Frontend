'use client';

import { useAdminAnalytics } from '../../hooks/useAdmin';

interface RecentOrder {
  id: string;
  customer: string;
  placedAt: string;
  total: number;
  status: string;
}

interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  totalSold: number;
}

export default function AdminOverview() {
  const { data, isLoading, isError } = useAdminAnalytics();

  if (isLoading) return <div className="flex h-full items-center justify-center p-8 text-2xl font-black">SYNCING OVERVIEW...</div>;
  if (isError) return <div className="text-[#ff3b30] font-black text-2xl">FAILED TO FETCH ANALYTICS</div>;

  const { overview, recentOrders, topProducts } = data;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-4xl font-black uppercase tracking-tighter">Platform Overview</h2>
        <p className="text-gray-500 font-medium">Real-time telemetry and metrics.</p>
      </header>

      {/* Metrics Bento Grid */}
      <div className="bento-grid">
        <div className="glass-card shadow-lg bg-black text-white dark:bg-white dark:text-black">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-2">Total Revenue</h3>
          <p className="text-4xl font-black">${overview.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="glass-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Total Orders</h3>
          <p className="text-4xl font-black text-[#ff3b30]">{overview.totalOrders.toLocaleString()}</p>
        </div>
        <div className="glass-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Platform Users</h3>
          <p className="text-4xl font-black">{overview.totalUsers.toLocaleString()}</p>
        </div>
        <div className="glass-card">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Active Vendors</h3>
          <p className="text-4xl font-black">{overview.totalVendors.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="glass-card">
          <h3 className="text-xl font-bold uppercase tracking-tighter mb-6">Recent Orders</h3>
          <div className="flex flex-col gap-4">
            {(recentOrders as RecentOrder[]).map((order) => (
              <div key={order.id} className="flex justify-between items-center py-2 border-b border-[#f4f4f5] dark:border-white/10 last:border-0">
                <div>
                  <p className="font-bold">{order.customer}</p>
                  <p className="text-xs text-gray-500 font-medium">{new Date(order.placedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black">${order.total}</p>
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-full">{order.status}</span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-gray-500 text-sm">No recent orders.</p>}
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-card flex flex-col">
          <h3 className="text-xl font-bold uppercase tracking-tighter mb-6">Top Performers</h3>
          <div className="flex flex-col gap-4 flex-1">
            {(topProducts as TopProduct[]).map((p, i) => (
              <div key={p.productId} className="flex justify-between items-center py-2 border-b border-[#f4f4f5] dark:border-white/10 last:border-0">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-gray-300 dark:text-gray-600">0{i + 1}</span>
                  <p className="font-bold truncate max-w-[200px]">{p.productName}</p>
                </div>
                <div className="text-right">
                  <p className="font-black">${p.revenue}</p>
                  <p className="text-xs text-gray-500 font-medium">{p.totalSold} sold</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-gray-500 text-sm">No sales data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
