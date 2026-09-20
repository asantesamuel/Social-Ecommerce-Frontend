import { apiClient } from "./client";
import type {
  AdminAnalytics,
  InventoryAlertsResponse,
  Order,
  PaginatedResponse,
  Product,
  User,
} from "./types";

export type ProductModerationAction = "approve" | "reject" | "flag";

export const adminApi = {
  async getAnalytics(signal?: AbortSignal): Promise<AdminAnalytics> {
    const { data } = await apiClient.get<AdminAnalytics>("/admin/analytics", {
      signal,
    });
    return data;
  },

  async listUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>(
      "/admin/users",
      { params },
    );
    return data;
  },

  async updateUserStatus(payload: {
    userId: string;
    isActive: boolean;
  }): Promise<User> {
    const { data } = await apiClient.post<User>(
      `/admin/users/${payload.userId}/status`,
      { isActive: payload.isActive },
    );
    return data;
  },

  async listOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Order>> {
    const { data } = await apiClient.get<PaginatedResponse<Order>>(
      "/admin/orders",
      { params },
    );
    return data;
  },

  async getLowStockInventory(
    threshold: number,
  ): Promise<InventoryAlertsResponse> {
    const { data } = await apiClient.get<InventoryAlertsResponse>(
      "/admin/inventory/low-stock",
      { params: { threshold } },
    );
    return data;
  },

  async listPendingProducts(params: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      "/admin/products/pending",
      { params },
    );
    return data;
  },

  async moderateProduct(payload: {
    productId: string;
    action: ProductModerationAction;
    reason?: string;
  }): Promise<Product> {
    const { data } = await apiClient.post<Product>(
      `/admin/products/${payload.productId}/moderate`,
      { action: payload.action, reason: payload.reason },
    );
    return data;
  },
};
