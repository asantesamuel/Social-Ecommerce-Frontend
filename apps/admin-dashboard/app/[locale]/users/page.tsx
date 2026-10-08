"use client";

import { useState } from "react";
import { getApiErrorMessage } from "@repo/api";
import { useAdminUsers, useUpdateUserStatus } from "../../../hooks/useAdmin";

export default function UsersManagementPage() {
  const [roleFilter, setRoleFilter] = useState("");
  const usersQuery = useAdminUsers(roleFilter);
  const updateUserStatus = useUpdateUserStatus();
  const users = usersQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    if (
      window.confirm(
        `Are you sure you want to ${currentStatus ? "suspend" : "reactivate"} this user?`,
      )
    )
      updateUserStatus.mutate({ userId, isActive: !currentStatus });
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="jwso-kicker mb-2">Access management</p>
          <h1 className="jwso-page-title">Users</h1>
          <p className="jwso-copy mt-2">Review accounts and manage access.</p>
        </div>
        <div className="jwso-field w-full sm:w-48">
          <label htmlFor="role-filter" className="jwso-label">
            Role
          </label>
          <select
            id="role-filter"
            className="jwso-select"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </header>
      {updateUserStatus.isError && (
        <p className="jwso-alert" data-tone="error" role="alert">
          {getApiErrorMessage(
            updateUserStatus.error,
            "Access could not be updated. Please try again.",
          )}
        </p>
      )}
      {usersQuery.isLoading ? (
        <div
          className="jwso-skeleton h-52 rounded-[6px]"
          aria-label="Loading users"
        />
      ) : usersQuery.isError ? (
        <div className="jwso-empty" role="alert">
          <h2 className="jwso-section-title">Users unavailable</h2>
          <p>Account data could not be loaded.</p>
          <button
            type="button"
            onClick={() => usersQuery.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">No users found</h2>
          <p>Try a different role filter.</p>
          <button
            type="button"
            onClick={() => setRoleFilter("")}
            className="jwso-button"
          >
            Show all roles
          </button>
        </div>
      ) : (
        <div className="jwso-table-wrap">
          <table className="jwso-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col" className="jwso-table__right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-semibold">
                    {[user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ") || "Name unavailable"}
                  </td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td>
                    <span
                      className="jwso-status"
                      data-tone={user.isActive ? "success" : "error"}
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="jwso-table__right">
                    {user.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(user.id, user.isActive ?? false)
                        }
                        disabled={updateUserStatus.isPending}
                        className={`jwso-button ${user.isActive ? "jwso-button--danger" : "jwso-button--secondary"}`}
                      >
                        {user.isActive ? "Suspend" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {usersQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => usersQuery.fetchNextPage()}
          disabled={usersQuery.isFetchingNextPage}
          className="jwso-button jwso-button--secondary mx-auto"
        >
          {usersQuery.isFetchingNextPage ? "Loading…" : "Load more users"}
        </button>
      )}
    </div>
  );
}
