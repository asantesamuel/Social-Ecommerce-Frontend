"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Globe2,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { authApi } from "@repo/api";
import { Link, usePathname, useRouter } from "../i18n/routing";
import { useCart } from "../hooks/useCart";

export default function Navbar() {
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setSearch(searchParams.get("search") ?? ""), [searchParams]);
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: authApi.session,
    staleTime: 30_000,
    retry: false,
  });

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/?search=${encodeURIComponent(query)}` : "/");
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      queryClient.clear();
      router.replace("/login");
    } catch {
      window.alert("Sign out could not be completed. Please try again.");
    }
  };

  const cartItemCount =
    cart.data?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--jwso-line)] bg-white">
      <div className="jwso-container flex h-[68px] items-center gap-4 lg:gap-7">
        <Link
          href="/"
          className="jwso-brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="jwso-brand__mark">J</span>JWSO
        </Link>

        <form
          role="search"
          onSubmit={handleSearch}
          className="hidden min-w-0 flex-1 sm:flex lg:mx-6"
        >
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            className="jwso-input !rounded-r-none"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
          />
          <button
            className="jwso-button !rounded-l-none"
            type="submit"
            aria-label="Search products"
            title="Search products"
          >
            <Search size={18} aria-hidden="true" />
          </button>
        </form>

        <nav
          aria-label="Storefront"
          className="hidden items-center gap-5 text-sm font-semibold lg:flex"
        >
          <Link href="/" className="hover:text-[var(--jwso-brand)]">
            Shop
          </Link>
          <Link
            href="/signup?intent=vendor"
            className="whitespace-nowrap hover:text-[var(--jwso-brand)]"
          >
            Sell on JWSO
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="jwso-icon-button jwso-icon-button--secondary"
                aria-label="Choose language"
                title="Choose language"
              >
                <Globe2 size={18} aria-hidden="true" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="end"
              className="z-[60] mt-2 min-w-32 rounded-[6px] border border-[var(--jwso-line)] bg-white p-1 shadow-[var(--jwso-shadow)]"
            >
              {(["en", "es", "fr"] as const).map((locale) => (
                <DropdownMenu.Item
                  key={locale}
                  onSelect={() => router.replace(pathname, { locale })}
                  className="cursor-pointer rounded-[4px] px-3 py-2 text-sm uppercase outline-none hover:bg-[var(--jwso-surface-soft)] focus:bg-[var(--jwso-surface-soft)]"
                >
                  {locale}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <Link
            href="/cart"
            className="jwso-icon-button jwso-icon-button--secondary relative"
            aria-label={`Cart, ${cartItemCount} items`}
            title="Cart"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-[4px] bg-[var(--jwso-accent)] px-1 text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
          {session.data?.user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="jwso-icon-button jwso-icon-button--secondary"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          ) : (
            <Link
              href="/login"
              className="jwso-icon-button jwso-icon-button--secondary"
              aria-label="Sign in"
              title="Sign in"
            >
              <UserRound size={18} aria-hidden="true" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="jwso-icon-button jwso-icon-button--secondary lg:!hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            title={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <Menu size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="jwso-container border-t border-[var(--jwso-line)] py-3 lg:hidden">
          <nav
            aria-label="Mobile storefront"
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold"
          >
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            <Link
              href="/signup?intent=vendor"
              onClick={() => setMenuOpen(false)}
            >
              Sell on JWSO
            </Link>
          </nav>
          <form
            role="search"
            onSubmit={handleSearch}
            className="mt-3 flex sm:hidden"
          >
            <label htmlFor="mobile-search" className="sr-only">
              Search products
            </label>
            <input
              id="mobile-search"
              className="jwso-input !rounded-r-none"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
            />
            <button
              className="jwso-button !rounded-l-none"
              type="submit"
              aria-label="Search products"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
