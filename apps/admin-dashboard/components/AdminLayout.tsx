"use client";

import { useQueryClient } from "@tanstack/react-query";
import { authApi, buildLocalizedAppUrl } from "@repo/api";
import { Link, usePathname } from "../i18n/routing";

const navLinks = [
  { name: "Overview", href: "/" },
  { name: "Users", href: "/users" },
  { name: "Orders", href: "/orders" },
  { name: "Inventory", href: "/inventory" },
  { name: "Vendors", href: "/vendors" },
  { name: "Moderation", href: "/products" },
];

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

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--jwso-line)] bg-white">
        <div className="jwso-container flex min-h-[66px] items-center justify-between gap-4">
          <Link href="/" className="jwso-brand">
            <span className="jwso-brand__mark">J</span>JWSO{" "}
            <span className="jwso-app-label border-l border-[var(--jwso-line)] pl-3">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="jwso-button jwso-button--secondary"
          >
            Sign out
          </button>
        </div>
        <nav
          aria-label="Admin sections"
          className="jwso-container flex gap-1 overflow-x-auto pb-0"
        >
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-[var(--jwso-brand)] text-[var(--jwso-brand)]" : "border-transparent text-[var(--jwso-muted)] hover:text-[var(--jwso-ink)]"}`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="jwso-container jwso-page">{children}</main>
    </div>
  );
}
