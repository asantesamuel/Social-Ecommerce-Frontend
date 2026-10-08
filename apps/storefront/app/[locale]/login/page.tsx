"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getApiErrorMessage } from "@repo/api";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "../../../i18n/routing";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    login.mutate({ email: email.trim().toLowerCase(), password });
  };

  return (
    <main className="jwso-page jwso-container flex w-full flex-1 items-center justify-center">
      <div className="w-full max-w-[440px]">
        <p className="jwso-kicker mb-2">JWSO account</p>
        <h1 className="jwso-page-title">Sign in</h1>
        <p className="jwso-copy mt-3">
          Use your account to shop or continue to your dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <div className="jwso-field">
            <label htmlFor="login-email" className="jwso-label">
              Email address
            </label>
            <input
              id="login-email"
              className="jwso-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="jwso-field">
            <label htmlFor="login-password" className="jwso-label">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                className="jwso-input !pr-12"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-[var(--jwso-muted)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {login.isError && (
            <p className="jwso-alert" data-tone="error" role="alert">
              {getApiErrorMessage(
                login.error,
                "Sign in failed. Please try again.",
              )}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="jwso-button w-full"
          >
            {login.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-7 border-t border-[var(--jwso-line)] pt-6 text-sm">
          <p className="jwso-copy mb-3">New to JWSO?</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3 font-semibold text-[var(--jwso-brand)]">
            <Link href="/signup">Create an account</Link>
            <Link href="/signup?intent=vendor">Apply to sell</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
