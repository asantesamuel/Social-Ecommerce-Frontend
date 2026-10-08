"use client";

import { useState } from "react";
import { useAdminInventory } from "../../../hooks/useAdmin";

export default function InventoryAlertsPage() {
  const [threshold, setThreshold] = useState(10);
  const inventory = useAdminInventory(threshold);
  const alerts = inventory.data?.alerts ?? [];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jwso-kicker mb-2">Stock monitoring</p>
          <h1 className="jwso-page-title">Inventory alerts</h1>
          <p className="jwso-copy mt-2">
            Products at or below your chosen stock threshold.
          </p>
        </div>
        <div className="jwso-field w-32">
          <label htmlFor="inventory-threshold" className="jwso-label">
            Threshold
          </label>
          <input
            id="inventory-threshold"
            className="jwso-input"
            type="number"
            min="1"
            max="100"
            value={threshold}
            onChange={(event) =>
              setThreshold(
                Math.min(100, Math.max(1, Number(event.target.value) || 1)),
              )
            }
          />
        </div>
      </header>
      {inventory.isLoading ? (
        <div
          className="jwso-skeleton h-52 rounded-[6px]"
          aria-label="Loading inventory"
        />
      ) : inventory.isError ? (
        <div className="jwso-empty" role="alert">
          <h2 className="jwso-section-title">Inventory unavailable</h2>
          <p>Stock data could not be loaded.</p>
          <button
            type="button"
            onClick={() => inventory.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">No low-stock products</h2>
          <p>None of the products checked are at or below {threshold} units.</p>
        </div>
      ) : (
        <div className="jwso-table-wrap">
          <table className="jwso-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Vendor</th>
                <th scope="col">Stock remaining</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.productId}>
                  <td className="font-semibold">{alert.productName}</td>
                  <td>{alert.vendorName}</td>
                  <td className="tabular-nums">{alert.stockQuantity}</td>
                  <td>
                    <span className="jwso-status" data-tone="warning">
                      Low stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
