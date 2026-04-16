import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api';

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/analytics');
      return data;
    },
  });
};

export const useAdminUsers = (role?: string) => {
  return useInfiniteQuery({
    queryKey: ['admin-users', role],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get('/admin/users', {
        params: { page: pageParam, limit: 10, role },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
  });
};

export const useAdminOrders = (status?: string) => {
  return useInfiniteQuery({
    queryKey: ['admin-orders', status],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get('/admin/orders', {
        params: { page: pageParam, limit: 10, status },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
  });
};

export const useAdminInventory = (threshold = 10) => {
  return useQuery({
    queryKey: ['admin-inventory', threshold],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/inventory/low-stock', {
        params: { threshold },
      });
      return data;
    },
  });
};

export const useAdminPendingProducts = () => {
  return useInfiniteQuery({
    queryKey: ['admin-pending-products'],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get('/admin/products/pending', {
        params: { page: pageParam, limit: 10 },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
  });
};

export const useModerateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, action, reason }: { productId: string; action: 'approve' | 'reject' | 'flag'; reason?: string }) => {
      const { data } = await apiClient.post(`/admin/products/${productId}/moderate`, { action, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-products'] });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data } = await apiClient.post(`/admin/users/${userId}/status`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};
