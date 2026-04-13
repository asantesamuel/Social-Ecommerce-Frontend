import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await apiClient.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      Cookies.set('accessToken', data.accessToken, { secure: window.location.protocol === 'https:', sameSite: 'strict' });
      Cookies.set('refreshToken', data.refreshToken, { secure: window.location.protocol === 'https:', sameSite: 'strict' });
      apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      queryClient.invalidateQueries();
      
      const role = data.user?.role;
      if (role === 'admin') {
        window.location.href = 'http://localhost:3002';
      } else if (role === 'vendor') {
        window.location.href = 'http://localhost:3003';
      } else {
        router.push('/');
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await apiClient.post('/auth/register', credentials);
      return data;
    },
    onSuccess: (data) => {
      Cookies.set('accessToken', data.accessToken, { secure: window.location.protocol === 'https:', sameSite: 'strict' });
      Cookies.set('refreshToken', data.refreshToken, { secure: window.location.protocol === 'https:', sameSite: 'strict' });
      apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      queryClient.invalidateQueries();
      
      const role = data.user?.role;
      if (role === 'admin') {
        window.location.href = 'http://localhost:3002';
      } else if (role === 'vendor') {
        window.location.href = 'http://localhost:3003';
      } else {
        router.push('/');
      }
    },
  });

  return { login: loginMutation, register: registerMutation };
};
