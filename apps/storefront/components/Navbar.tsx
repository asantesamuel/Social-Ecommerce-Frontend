'use client';

import { ShoppingBag, Globe, LogOut, UserRound } from 'lucide-react';
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
  const isAuthenticated = !!Cookies.get('accessToken') || !!Cookies.get('refreshToken');

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
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-[#ded7ca]/80 bg-[#fffdf8]/82 px-4 py-3 shadow-[0_14px_40px_rgba(17,16,14,0.06)] backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
      <Link href="/" className="group flex items-center gap-3 text-xl font-black uppercase tracking-[0.08em]">
        <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#11100e] text-sm text-[#fffdf8] transition-transform duration-300 group-hover:-rotate-6">S</span>
        <span>Storefront<span className="text-[#c83a2d]">.</span></span>
      </Link>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button aria-label='Language' className="grid h-10 w-10 place-items-center rounded-[8px] border border-[#ded7ca] bg-white/70 text-[#11100e] transition-all hover:-translate-y-0.5 hover:border-[#11100e]">
              <Globe size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" className="z-50 mt-2 min-w-[120px] rounded-[8px] border border-[#ded7ca] bg-[#fffdf8] p-2 shadow-[0_18px_50px_rgba(17,16,14,0.12)]">
            {['en', 'es', 'fr'].map((lang) => (
              <DropdownMenu.Item
                key={lang}
                onClick={() => handleLangChange(lang)}
                className="cursor-pointer rounded-[6px] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] outline-none transition-colors hover:bg-[#11100e] hover:text-white"
              >
                {lang}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <Link href="/cart" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-[8px] border border-[#ded7ca] bg-white/70 text-[#11100e] transition-all hover:-translate-y-0.5 hover:border-[#11100e]">
          <ShoppingBag size={20} />
          {cartItemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c83a2d] px-1 text-[10px] font-black text-white">
              {cartItemCount}
            </span>
          )}
        </Link>
        {isAuthenticated ? (
          <button aria-label='Logout' onClick={handleLogout} className="grid h-10 w-10 place-items-center rounded-[8px] border border-[#ded7ca] bg-white/70 text-[#706b63] transition-all hover:-translate-y-0.5 hover:border-[#c83a2d] hover:text-[#c83a2d]">
            <LogOut size={19} />
          </button>
        ) : (
          <Link href="/login" aria-label="Account" className="grid h-10 w-10 place-items-center rounded-[8px] border border-[#ded7ca] bg-white/70 text-[#11100e] transition-all hover:-translate-y-0.5 hover:border-[#11100e]">
            <UserRound size={19} />
          </Link>
        )}
      </div>
      </div>
    </nav>
  );
}
