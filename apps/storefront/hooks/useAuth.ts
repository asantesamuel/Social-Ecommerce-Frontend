import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  getLocaleFromPath,
  getRoleLandingUrl,
  persistAuthSession,
  type RegisterPayload,
} from "@repo/api";
import { useRouter } from "../i18n/routing";

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      persistAuthSession(data);
      queryClient.invalidateQueries();

      const role = data.user?.role;
      if (role === "admin") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else if (role === "vendor") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else {
        router.push("/");
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterPayload) => authApi.register(credentials),
    onSuccess: (data) => {
      persistAuthSession(data);
      queryClient.invalidateQueries();

      const role = data.user?.role;
      if (role === "admin") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else if (role === "vendor") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else {
        router.push("/");
      }
    },
  });

  return { login: loginMutation, register: registerMutation };
};
