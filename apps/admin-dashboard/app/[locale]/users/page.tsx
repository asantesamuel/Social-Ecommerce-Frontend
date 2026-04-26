'use client';

import { useAdminUsers, useUpdateUserStatus } from '../../../hooks/useAdmin';
import React, { useState } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface UserPage {
  data: User[];
  page: number;
  totalPages: number;
  total: number;
}

export default function UsersManagementPage() {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminUsers(roleFilter);
  const updateUserStatus = useUpdateUserStatus();

  if (isLoading) return <div className="flex h-full items-center justify-center p-8 text-2xl font-black">FETCHING USERS...</div>;
  if (isError) return <div className="text-[#ff3b30] font-black text-2xl">FAILED TO FETCH USERS</div>;

  const users = data?.pages.flatMap((page: UserPage) => page.data) || [];

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'reactivate'} this user?`)) {
      updateUserStatus.mutate({ userId, isActive: !currentStatus });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">User Management</h2>
          <p className="text-gray-500 font-medium whitespace-nowrap">Control platform access and roles.</p>
        </div>
        <select 
          aria-label='User Role Filter'
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-transparent border border-[#e4e4e7] dark:border-white/20 rounded-xl px-4 py-2 font-bold uppercase text-sm outline-none"
        >
          <option value="">All Roles</option>
          <option value="user">Shoppers</option>
          <option value="vendor">Vendors</option>
          <option value="admin">Admins</option>
        </select>
      </header>

      <div className="glass-card p-0 overflow-hidden text-sm md:text-base">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-[#f4f4f5] dark:border-white/10 uppercase text-xs tracking-wider font-bold text-gray-500">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id} className="border-b border-[#f4f4f5] dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold">{user.firstName} {user.lastName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 font-medium">{user.email}</td>
                  <td className="p-4">
                    <span className="text-xs font-bold uppercase px-2 py-1 bg-black text-white dark:bg-white dark:text-black rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        disabled={updateUserStatus.isPending}
                        className={`text-xs font-bold uppercase px-4 py-2 rounded-xl transition-all ${user.isActive ? 'border border-[#ff3b30] text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white' : 'border border-green-600 text-green-600 hover:bg-green-600 hover:text-white'}`}
                      >
                        {user.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
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
          {isFetchingNextPage ? 'Loading...' : 'Load More Users'}
        </button>
      )}
    </div>
  );
}
