import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { catalogApi, type ProductQueryParams } from "@repo/api";

export const useProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => catalogApi.listProducts(params),
  });
};

export const useProductFeed = (
  filters: Pick<ProductQueryParams, "search" | "categoryId">,
) => {
  return useInfiniteQuery({
    queryKey: ["product-feed", filters.search ?? "", filters.categoryId ?? ""],
    queryFn: ({ pageParam }) =>
      catalogApi.listProducts({ ...filters, page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => catalogApi.getProduct(id),
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: catalogApi.listCategories,
  });
};
