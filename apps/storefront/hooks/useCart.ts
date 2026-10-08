import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, cartApi } from "@repo/api";
import { usePathname } from "../i18n/routing";

export const useCart = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isAuthPage =
    pathname.includes("/login") || pathname.includes("/signup");

  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: authApi.session,
    staleTime: 30_000,
    retry: false,
  });

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
    enabled: Boolean(session.data?.user) && !isAuthPage,
  });

  const addItem = useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: cartApi.updateItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeItem = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearCart = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return {
    session,
    cart: cartQuery,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
};
