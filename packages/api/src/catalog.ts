import { apiClient } from "./client";
import type {
  Category,
  CreateProductPayload,
  PaginatedResponse,
  Product,
  ProductQueryParams,
} from "./types";

export const catalogApi = {
  async listProducts(
    params?: ProductQueryParams,
  ): Promise<PaginatedResponse<Product>> {
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      "/products",
      { params },
    );
    return data;
  },

  async getProduct(id: string): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  async listCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },

  async listVendorProducts(
    params?: ProductQueryParams,
  ): Promise<PaginatedResponse<Product>> {
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      "/products/vendor/my-products",
      { params },
    );
    return data;
  },

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const { data } = await apiClient.post<Product>("/products", payload);
    return data;
  },
};
