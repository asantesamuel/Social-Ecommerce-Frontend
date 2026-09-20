import { apiClient } from "./client";
import type { Cart } from "./types";

export const cartApi = {
  async getCart(): Promise<Cart> {
    const { data } = await apiClient.get<Cart>("/cart");
    return data;
  },

  async addItem(payload: {
    productId: string;
    quantity: number;
  }): Promise<Cart> {
    const { data } = await apiClient.post<Cart>("/cart/items", payload);
    return data;
  },

  async updateItem(payload: {
    itemId: string;
    quantity: number;
  }): Promise<Cart> {
    const { data } = await apiClient.put<Cart>(
      `/cart/items/${payload.itemId}`,
      { quantity: payload.quantity },
    );
    return data;
  },

  async removeItem(itemId: string): Promise<Cart> {
    const { data } = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return data;
  },

  async clearCart(): Promise<Cart> {
    const { data } = await apiClient.delete<Cart>("/cart");
    return data;
  },
};
