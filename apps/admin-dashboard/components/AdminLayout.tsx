"use client";

import { Link, usePathname } from "../i18n/routing";
import { useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  buildLocalizedAppUrl,
} from "@repo/api";

export default function AdminLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      queryClient.clear();
      window.location.href = buildLocalizedAppUrl(
        "storefront",
        "/login",
        locale,
      );
    } catch {
      window.alert("Sign out could not be completed. Please try again.");
    }
  };

  const navLinks = [
    { name: "Command Center", href: `/` },
    { name: "Users", href: `/users` },
    { name: "Orders", href: `/orders` },
    { name: "Inventory", href: `/inventory` },
    { name: "Vendors", href: `/vendors` },
    { name: "Moderation", href: `/products` },
  ];

  return (
    <div className="min-h-screen">
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-[#ded7ca]/80 bg-[#fffdf8]/84 px-4 py-3 shadow-[0_14px_40px_rgba(17,16,14,0.06)] backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 whitespace-nowrap text-xl font-black uppercase tracking-[0.08em]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#11100e] text-sm text-[#fffdf8] transition-transform duration-300 group-hover:-rotate-6">
              A
            </span>
            <span>
              Admin<span className="text-[#c83a2d]">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-[8px] border border-[#ded7ca] bg-white/60 p-1 lg:flex">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`rounded-[6px] px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition-colors ${
                      isActive
                        ? "bg-[#11100e] text-[#fffdf8]"
                        : "text-[#706b63] hover:bg-[#11100e]/5 hover:text-[#11100e]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-[8px] border border-[#ded7ca] bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#c83a2d] transition-all hover:-translate-y-0.5 hover:border-[#c83a2d]"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-8 lg:pt-32">
        <div className="flex flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
