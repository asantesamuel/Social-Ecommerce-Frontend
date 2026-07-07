"use client";

import { useAdminAnalytics } from "../../hooks/useAdmin";
import { formatCurrency, type AdminAnalytics } from "@repo/api";

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

const statusTone: Record<string, string> = {
  pending: "bg-[#fff7ed] text-[#9a3412]",
  paid: "bg-[#ecfdf3] text-[#027a48]",
  delivered: "bg-[#eff6ff] text-[#1d4ed8]",
  failed: "bg-[#fef2f2] text-[#b42318]",
  cancelled: "bg-[#fef2f2] text-[#b42318]",
};

export default function AdminOverview() {
  const { data, isLoading, isError } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="h-44 animate-pulse rounded-[8px] bg-white/70" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-[8px] bg-white/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[8px] border border-[#f3b3ad] bg-[#fff4f2] p-8">
        <p className="eyebrow">Analytics unavailable</p>
        <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.03em] text-[#11100e]">
          Failed to fetch analytics
        </h2>
        <p className="mt-2 font-medium text-[#706b63]">
          Check your admin token and API server, then refresh the dashboard.
        </p>
      </div>
    );
  }

  const { overview, orders, recentOrders, topProducts } =
    data as AdminAnalytics;
  const orderTotal = Object.values(orders as Record<string, number>).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[8px] bg-[#11100e] p-6 text-[#fffdf8] shadow-[0_32px_90px_rgba(17,16,14,0.2)] sm:p-8">
          <p className="eyebrow text-[#f06a5f]">Command Center</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black uppercase leading-[0.94] tracking-[-0.04em] sm:text-6xl">
            Platform Overview
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/65">
            Monitor revenue, orders, product velocity, and customer activity
            from one calm operational surface.
          </p>
        </div>

        <div className="glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Revenue</p>
            <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#027a48]">
              Live
            </span>
          </div>
          <div>
            <p className="mt-10 text-5xl font-black tracking-[-0.04em]">
              {formatCurrency(overview.totalRevenue)}
            </p>
            <p className="mt-2 text-sm font-medium text-[#706b63]">
              Paid and delivered orders
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Orders", overview.totalOrders],
          ["Platform Users", overview.totalUsers],
          ["Active Vendors", overview.totalVendors],
          ["Active Products", overview.totalProducts],
        ].map(([label, value]) => (
          <div key={label} className="glass-card">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#706b63]">
              {label}
            </p>
            <p className="mt-5 text-4xl font-black tracking-[-0.04em]">
              {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="eyebrow">Order Mix</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">
                Status
              </h2>
            </div>
            <span className="text-sm font-black text-[#706b63]">
              {orderTotal} total
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {Object.entries(orders as Record<string, number>).map(
              ([status, count]) => {
                const percent = orderTotal
                  ? Math.round((count / orderTotal) * 100)
                  : 0;
                return (
                  <div key={status}>
                    <div className="mb-2 flex justify-between text-sm font-bold">
                      <span className="capitalize text-[#11100e]">
                        {status}
                      </span>
                      <span className="text-[#706b63]">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e9e1d3]">
                      <div
                        className="h-full rounded-full bg-[#c83a2d]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="glass-card">
          <div className="mb-6">
            <p className="eyebrow">Recent Orders</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">
              Latest activity
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-[#ded7ca]">
            {(recentOrders as RecentOrder[]).map((order) => (
              <div
                key={order.id}
                className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-black">{order.customer}</p>
                  <p className="mt-1 text-sm font-medium text-[#706b63]">
                    {new Date(order.placedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusTone[order.status] || "bg-[#f3efe6] text-[#706b63]"}`}
                >
                  {order.status}
                </span>
                <p className="text-lg font-black">
                  {formatCurrency(order.total)}
                </p>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="py-10 text-center text-sm font-medium text-[#706b63]">
                No recent orders yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card">
        <div className="mb-6">
          <p className="eyebrow">Top Performers</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em]">
            Product velocity
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {(topProducts as TopProduct[]).map((product, index) => (
            <div
              key={product.productId}
              className="rounded-[8px] border border-[#ded7ca] bg-[#fffdf8]/70 p-4"
            >
              <span className="text-sm font-black text-[#c83a2d]">
                0{index + 1}
              </span>
              <h3 className="mt-4 line-clamp-2 min-h-12 font-black leading-tight">
                {product.productName}
              </h3>
              <p className="mt-5 text-2xl font-black">
                {formatCurrency(product.revenue)}
              </p>
              <p className="mt-1 text-sm font-medium text-[#706b63]">
                {product.totalSold} sold
              </p>
            </div>
          ))}
          {topProducts.length === 0 && (
            <p className="text-sm font-medium text-[#706b63]">
              No sales data yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
