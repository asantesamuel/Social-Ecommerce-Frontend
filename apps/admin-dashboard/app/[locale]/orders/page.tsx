"use client";

import { useState } from "react";
import { formatCurrency } from "@repo/api";
import { useAdminOrders } from "../../../hooks/useAdmin";

const statuses = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "refunded",
  "cancelled",
];

export default function OrdersManagementPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const ordersQuery = useAdminOrders(statusFilter);
  const orders = ordersQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jwso-kicker mb-2">Marketplace activity</p>
          <h1 className="jwso-page-title">Orders</h1>
          <p className="jwso-copy mt-2">
            Monitor order volume and fulfilment status.
          </p>
        </div>
        <div className="jwso-field w-full sm:w-48">
          <label htmlFor="order-status-filter" className="jwso-label">
            Status
          </label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="jwso-select"
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </header>
      {ordersQuery.isLoading ? (
        <div
          className="jwso-skeleton h-52 rounded-[6px]"
          aria-label="Loading orders"
        />
      ) : ordersQuery.isError ? (
        <div className="jwso-empty" role="alert">
          <h2 className="jwso-section-title">Orders unavailable</h2>
          <p>Order data could not be loaded.</p>
          <button
            type="button"
            onClick={() => ordersQuery.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">No orders found</h2>
          <p>
            {statusFilter
              ? "Try another status filter."
              : "Orders will appear here when customers place them."}
          </p>
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className="jwso-button"
            >
              Show all orders
            </button>
          )}
        </div>
      ) : (
        <div className="jwso-table-wrap">
          <table className="jwso-table">
            <thead>
              <tr>
                <th scope="col">Order ID</th>
                <th scope="col">Customer</th>
                <th scope="col">Placed</th>
                <th scope="col">Items</th>
                <th scope="col" className="jwso-table__right">
                  Total
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td
                    className="max-w-40 truncate font-semibold"
                    title={String(order.id)}
                  >
                    {order.id}
                  </td>
                  <td>{order.customer || "Customer unavailable"}</td>
                  <td className="whitespace-nowrap">
                    {new Date(order.placedAt).toLocaleString()}
                  </td>
                  <td className="tabular-nums">{order.itemCount ?? 0}</td>
                  <td className="jwso-table__right jwso-price">
                    {formatCurrency(order.total)}
                  </td>
                  <td>
                    <span
                      className="jwso-status"
                      data-tone={
                        order.status === "cancelled" ||
                        order.status === "refunded"
                          ? "error"
                          : order.status === "delivered" ||
                              order.status === "paid"
                            ? "success"
                            : "info"
                      }
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ordersQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => ordersQuery.fetchNextPage()}
          disabled={ordersQuery.isFetchingNextPage}
          className="jwso-button jwso-button--secondary mx-auto"
        >
          {ordersQuery.isFetchingNextPage ? "Loading…" : "Load more orders"}
        </button>
      )}
    </div>
  );
}
