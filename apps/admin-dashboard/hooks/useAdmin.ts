import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminApi, vendorApi, type ProductModerationAction } from "@repo/api";

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: ({ signal }) => adminApi.getAnalytics(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};

export const useAdminUsers = (role?: string) => {
  return useInfiniteQuery({
    queryKey: ["admin-users", role],
    queryFn: ({ pageParam = 1 }) =>
      adminApi.listUsers({
        page: pageParam,
        limit: 10,
        role: role || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
};

export const useAdminOrders = (status?: string) => {
  return useInfiniteQuery({
    queryKey: ["admin-orders", status],
    queryFn: ({ pageParam = 1 }) =>
      adminApi.listOrders({
        page: pageParam,
        limit: 10,
        status: status || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
};

export const useAdminInventory = (threshold = 10) => {
  return useQuery({
    queryKey: ["admin-inventory", threshold],
    queryFn: () => adminApi.getLowStockInventory(threshold),
  });
};

export const useAdminPendingProducts = () => {
  return useInfiniteQuery({
    queryKey: ["admin-pending-products"],
    queryFn: ({ pageParam = 1 }) =>
      adminApi.listPendingProducts({ page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
};

export const useModerateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      productId: string;
      action: ProductModerationAction;
      reason?: string;
    }) => adminApi.moderateProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
};

export const useAdminPendingVendors = () => {
  return useInfiniteQuery({
    queryKey: ["admin-pending-vendors"],
    queryFn: ({ pageParam = 1 }) =>
      vendorApi.listPendingApplications({ page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
};

export const useVendorDocuments = (vendorId: string) => {
  return useQuery({
    queryKey: ["vendor-documents", vendorId],
    queryFn: () => vendorApi.listDocuments(vendorId),
    enabled: !!vendorId,
  });
};

export const useReviewVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorApi.reviewApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-vendors"] });
    },
  });
};
