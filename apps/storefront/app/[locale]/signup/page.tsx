"use client";

import { useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "../../../i18n/routing";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@repo/api";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEstablishedDate, setCompanyEstablishedDate] = useState("");
  const submitLock = useRef(false);
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const isVendor = searchParams.get("role") === "vendor";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || register.isPending) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedCompanyName = companyName.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passRegex.test(password)) {
      setValidationError(
        "Password must be 8+ characters with uppercase, lowercase, and numbers.",
      );
      return;
    }

    setValidationError("");
    submitLock.current = true;
    register.mutate(
      {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: normalizedEmail,
        password,
        role: isVendor ? "vendor" : "customer",
        ...(isVendor && {
          companyName: trimmedCompanyName,
          companyEstablishedDate,
        }),
      },
      {
        onSettled: () => {
          submitLock.current = false;
        },
      },
    );
  };

  const registerErrorMessage = getApiErrorMessage(
    register.error,
    "Registration failed. Please try again.",
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-28">
      <div className="w-full max-w-2xl rounded-[8px] border border-[#ded7ca] bg-[#fffdf8]/88 p-6 shadow-[0_28px_90px_rgba(17,16,14,0.12)] backdrop-blur-xl sm:p-10">
        <p className="eyebrow text-center">
          {isVendor ? "Vendor Onboarding" : "Customer Access"}
        </p>
        <h1 className="mb-3 mt-3 text-center text-4xl font-black uppercase leading-none tracking-[-0.03em] text-[#11100e]">
          {isVendor ? "Vendor Partner" : "Create Account"}
        </h1>
        <p className="mb-8 text-center font-medium leading-6 text-[#706b63]">
          {isVendor
            ? "Launch your storefront in minutes."
            : "Join the future of commerce."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="signup-first-name"
                className="mb-2 block text-sm font-bold text-[#11100e]"
              >
                First Name
              </label>
              <input
                id="signup-first-name"
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="premium-input"
                placeholder="Jane"
              />
            </div>
            <div>
              <label
                htmlFor="signup-last-name"
                className="mb-2 block text-sm font-bold text-[#11100e]"
              >
                Last Name
              </label>
              <input
                id="signup-last-name"
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="premium-input"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-2 block text-sm font-bold text-[#11100e]"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="premium-input"
              placeholder="hey@example.com"
            />
          </div>

          {isVendor && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signup-company"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Company Name
                </label>
                <input
                  id="signup-company"
                  type="text"
                  required={isVendor}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="premium-input"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label
                  htmlFor="signup-established"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Est. Date
                </label>
                <input
                  id="signup-established"
                  type="date"
                  required={isVendor}
                  value={companyEstablishedDate}
                  onChange={(e) => setCompanyEstablishedDate(e.target.value)}
                  className="premium-input"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="signup-password"
              className="mb-2 block text-sm font-bold text-[#11100e]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
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
            disabled={register.isPending}
            className="btn-dopamine mt-6 w-full py-4 disabled:opacity-50"
          >
            {register.isPending ? "Signing up..." : "Create Account"}
          </button>

          {validationError && (
            <p className="text-center text-sm font-bold text-[#c83a2d]">
              {validationError}
            </p>
          )}
          {register.isError && (
            <p className="text-center text-sm font-bold text-[#c83a2d]">
              {registerErrorMessage}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm font-medium text-[#706b63]">
          Already a member?{" "}
          <Link
            href="/login"
            className="font-black text-[#11100e] underline decoration-[#c83a2d]/30 underline-offset-4 transition-colors hover:text-[#c83a2d]"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
