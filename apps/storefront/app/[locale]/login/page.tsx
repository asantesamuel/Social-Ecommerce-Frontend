"use client";

import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "../../../i18n/routing";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email: email.trim().toLowerCase(), password });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-28">
      <div className="w-full max-w-md rounded-[8px] border border-[#ded7ca] bg-[#fffdf8]/88 p-6 shadow-[0_28px_90px_rgba(17,16,14,0.12)] backdrop-blur-xl sm:p-10">
        <p className="eyebrow text-center">Member Access</p>
        <h1 className="mb-3 mt-3 text-center text-4xl font-black uppercase leading-none tracking-[-0.03em] text-[#11100e]">
          Welcome Back
        </h1>
        <p className="mb-8 text-center font-medium leading-6 text-[#706b63]">
          Log in to continue your cart, saved products, and vendor access.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="mb-2 block text-sm font-bold text-[#11100e]"
              htmlFor="login-email"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="premium-input"
              placeholder="hey@example.com"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-bold text-[#11100e]"
              htmlFor="login-password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input pr-12"
                placeholder="Password"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[8px] text-[#706b63] transition-colors hover:bg-[#11100e]/5 hover:text-[#11100e]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="btn-dopamine mt-4 w-full py-4 disabled:opacity-50"
          >
            {login.isPending ? "Logging in..." : "Enter Storefront"}
          </button>
          {login.isError && (
            <p className="text-center text-sm font-bold text-[#c83a2d]">
              Invalid credentials
            </p>
          )}
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center text-sm font-medium text-[#706b63]">
          <span>Don&apos;t have an account?</span>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="font-black text-[#11100e] underline decoration-[#c83a2d]/30 underline-offset-4 transition-colors hover:text-[#c83a2d]"
            >
              Sign up as Customer
            </Link>
            <Link
              href="/signup?role=vendor"
              className="font-black text-[#11100e] underline decoration-[#c83a2d]/30 underline-offset-4 transition-colors hover:text-[#c83a2d]"
            >
              Become a Vendor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
