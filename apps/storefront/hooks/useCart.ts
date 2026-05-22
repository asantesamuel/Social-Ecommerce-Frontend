import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api';
import Cookies from 'js-cookie';
import { usePathname } from '../i18n/routing';

export const useCart = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');
  const isAuthenticated = !!Cookies.get('accessToken') || !!Cookies.get('refreshToken');

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cart');
      return data;
    },
    enabled: isAuthenticated && !isAuthPage,
  });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data } = await apiClient.post('/cart/items', { productId, quantity });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { data } = await apiClient.put(`/cart/items/${itemId}`, { quantity });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await apiClient.delete(`/cart/items/${itemId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete('/cart');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return { cart: cartQuery, addItem, updateItem, removeItem, clearCart };
};
