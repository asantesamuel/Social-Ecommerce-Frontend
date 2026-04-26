'use client';

import { Link, usePathname, useRouter } from '../i18n/routing';
import Cookies from 'js-cookie';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@repo/api';

export default function AdminLayout({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        // Revoke the refresh token on the server so it can't be reused
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Proceed with client-side logout even if the server call fails
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      queryClient.clear();
      // Redirect to the storefront login page (port 3001), not the API server (port 3000)
      window.location.href = 'http://localhost:3001/en/login';
    }
  };

  const navLinks = [
    { name: 'Command Center', href: `/` },
    { name: 'Users', href: `/users` },
    { name: 'Orders', href: `/orders` },
    { name: 'Inventory', href: `/inventory` },
    { name: 'Vendors', href: `/vendors` },
    { name: 'Moderation', href: `/products` },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-card rounded-none border-t-0 border-x-0 !px-8 !py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-2xl font-black tracking-tighter uppercase whitespace-nowrap">
          ADMIN<span className="text-[#ff3b30]">.</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`text-sm font-black uppercase tracking-widest transition-colors ${
                    isActive ? 'text-[#ff3b30]' : 'text-gray-400 hover:text-black'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          
          <button onClick={handleLogout} className="hover:opacity-70 transition-opacity text-sm font-black uppercase tracking-widest text-[#ff3b30] hover:text-black">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <main className="pt-28 pb-16 px-8 lg:px-16 max-w-6xl mx-auto">
        <div className="flex flex-col gap-8">
          {children}
        </div>
      </main>
    </div>
  );
}
