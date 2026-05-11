'use client';

import { ShoppingBag, Globe, LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { Link, usePathname, useRouter } from '../i18n/routing';
import { useCart } from '../hooks/useCart';
import Cookies from 'js-cookie';
import { apiClient } from '@repo/api';

export default function Navbar() {
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const handleLangChange = (locale: string) => {
    router.replace(pathname, { locale });
  };

  const handleLogout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Continue local logout even if the server cannot be reached.
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      delete apiClient.defaults.headers.common.Authorization;
      queryClient.clear();
      router.replace('/login');
    }
  };

  const cartItemCount = cart.data?.items?.length || 0;

  return (
    <nav className="fixed top-0 w-full z-50 glass-card rounded-none border-t-0 border-x-0 !px-8 !py-4 flex items-center justify-between shadow-sm">
      <Link href="/" className="text-2xl font-bold tracking-tighter">
        STOREFRONT<span className="text-minimal-red">.</span>
      </Link>
      
      <div className="flex items-center gap-6">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button aria-label='Language' className="flex items-center gap-2 hover:opacity-70 transition-opacity outline-none">
              <Globe size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" className="bg-white border border-white/20 p-2 rounded-xl mt-2 shadow-xl shadow-black/10 z-50 min-w-[120px] dark:bg-black/90 dark:backdrop-blur-xl">
            {['en', 'es', 'fr'].map((lang) => (
              <DropdownMenu.Item
                key={lang}
                onClick={() => handleLangChange(lang)}
                className="px-4 py-2 text-sm uppercase rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:outline-none cursor-pointer transition-colors"
              >
                {lang}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <Link href="/cart" className="relative hover:opacity-70 transition-opacity">
          <ShoppingBag size={20} />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-minimal-red text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </Link>
        <button aria-label='Logout' onClick={handleLogout} className="hover:opacity-70 transition-opacity text-minimal-gray hover:text-minimal-red">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
