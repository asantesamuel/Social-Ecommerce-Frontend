import { useQuery } from "@tanstack/react-query";
import { catalogApi, type ProductQueryParams } from "@repo/api";

export const useProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => catalogApi.listProducts(params),
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
