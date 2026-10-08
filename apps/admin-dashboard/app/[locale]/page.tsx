"use client";

import { formatCurrency } from "@repo/api";
import { useAdminAnalytics } from "../../hooks/useAdmin";

export default function AdminOverview() {
  const analytics = useAdminAnalytics();
  if (analytics.isLoading)
    return (
      <div className="grid gap-5" aria-label="Loading overview">
        <div className="jwso-skeleton h-10 w-64 rounded-[4px]" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="jwso-skeleton h-28 rounded-[6px]" />
          ))}
        </div>
      </div>
    );
  if (analytics.isError || !analytics.data)
    return (
      <div className="jwso-empty" role="alert">
        <h1 className="jwso-section-title">Overview unavailable</h1>
        <p>Marketplace data could not be loaded. Please try again.</p>
        <button
          type="button"
          onClick={() => analytics.refetch()}
          className="jwso-button"
        >
          Retry
        </button>
      </div>
    );

  const { overview, orders, recentOrders, topProducts } = analytics.data;
  const orderTotal = Object.values(orders).reduce(
    (sum, value) => sum + Number(value),
    0,
  );
  const metrics = [
    ["Revenue", formatCurrency(overview.totalRevenue)],
    ["Orders", Number(overview.totalOrders).toLocaleString()],
    ["Users", Number(overview.totalUsers).toLocaleString()],
    ["Vendors", Number(overview.totalVendors).toLocaleString()],
    ["Products", Number(overview.totalProducts).toLocaleString()],
  ];

  return (
    <div className="grid gap-8">
      <header>
        <p className="jwso-kicker mb-2">Marketplace operations</p>
        <h1 className="jwso-page-title">Overview</h1>
        <p className="jwso-copy mt-2">
          Current marketplace activity and performance.
        </p>
      </header>
      <section
        aria-label="Marketplace metrics"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {metrics.map(([label, value]) => (
          <div key={label} className="jwso-panel p-5">
            <p className="jwso-meta font-semibold">{label}</p>
            <p className="jwso-price mt-3 text-[1.5rem] leading-tight break-words">
              {value}
            </p>
          </div>
        ))}
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <section className="jwso-panel" aria-labelledby="order-status-title">
          <div className="jwso-panel__header">
            <h2 id="order-status-title" className="jwso-section-title">
              Order status
            </h2>
            <p className="jwso-meta mt-1">{orderTotal} orders</p>
          </div>
          <div className="jwso-panel__body">
            <dl className="divide-y divide-[var(--jwso-line)]">
              {Object.entries(orders).map(([status, count]) => (
                <div key={status} className="flex justify-between py-3 text-sm">
                  <dt className="capitalize">{status.replace(/_/g, " ")}</dt>
                  <dd className="font-semibold tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
            {orderTotal === 0 && (
              <p className="jwso-copy">No orders have been recorded.</p>
            )}
          </div>
        </section>
        <section aria-labelledby="recent-orders-title">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="recent-orders-title" className="jwso-section-title">
              Recent orders
            </h2>
          </div>
          <div className="jwso-table-wrap">
            <table className="jwso-table">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="jwso-table__right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-semibold">{order.customer}</td>
                    <td className="whitespace-nowrap text-[var(--jwso-muted)]">
                      {new Date(order.placedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="jwso-status">{order.status}</span>
                    </td>
                    <td className="jwso-table__right jwso-price">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <p className="p-6 text-sm text-[var(--jwso-muted)]">
                No recent orders.
              </p>
            )}
          </div>
        </section>
      </div>
      <section aria-labelledby="top-products-title">
        <h2 id="top-products-title" className="jwso-section-title mb-3">
          Top products
        </h2>
        <div className="jwso-table-wrap">
          <table className="jwso-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className="jwso-table__right">
                  Units sold
                </th>
                <th scope="col" className="jwso-table__right">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.productId}>
                  <td className="font-semibold">{product.productName}</td>
                  <td className="jwso-table__right tabular-nums">
                    {product.totalSold}
                  </td>
                  <td className="jwso-table__right jwso-price">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topProducts.length === 0 && (
            <p className="p-6 text-sm text-[var(--jwso-muted)]">
              Sales data will appear when products are purchased.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
