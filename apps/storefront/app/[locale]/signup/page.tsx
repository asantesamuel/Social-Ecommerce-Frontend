"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getApiErrorMessage, type VendorDocumentType } from "@repo/api";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "../../../i18n/routing";

const MAX_VENDOR_DOCUMENT_SIZE = 10 * 1024 * 1024;

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [country, setCountry] = useState("");
  const [documentType, setDocumentType] = useState<VendorDocumentType>(
    "business_registration",
  );
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const submitLock = useRef(false);
  const { register, vendorApplication } = useAuth();
  const searchParams = useSearchParams();
  const isVendorApplication = searchParams.get("intent") === "vendor";
  const activeMutation = isVendorApplication ? vendorApplication : register;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLock.current || activeMutation.isPending) return;

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedBusinessName = businessName.trim();
    const trimmedRegistrationNumber = registrationNumber.trim();
    const normalizedContactEmail = contactEmail.trim().toLowerCase();
    const trimmedCountry = country.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setValidationError(
        "Password must be 8+ characters with uppercase, lowercase, and numbers.",
      );
      return;
    }
    if (isVendorApplication) {
      if (
        !trimmedBusinessName ||
        !trimmedRegistrationNumber ||
        !trimmedCountry
      ) {
        setValidationError("Please complete all required business fields.");
        return;
      }
      if (!emailRegex.test(normalizedContactEmail)) {
        setValidationError("Please enter a valid business contact email.");
        return;
      }
      if (!selectedDocument) {
        setValidationError(
          "Please upload a business document for your vendor application.",
        );
        return;
      }
      if (selectedDocument.size > MAX_VENDOR_DOCUMENT_SIZE) {
        setValidationError("Vendor documents must be 10MB or smaller.");
        return;
      }
    }

    setValidationError("");
    submitLock.current = true;
    const mutationOptions = {
      onSettled: () => {
        submitLock.current = false;
      },
    };
    if (isVendorApplication) {
      vendorApplication.mutate(
        {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: normalizedEmail,
          password,
          businessName: trimmedBusinessName,
          registrationNumber: trimmedRegistrationNumber,
          contactEmail: normalizedContactEmail,
          country: trimmedCountry,
          document: selectedDocument as File,
          documentType,
        },
        mutationOptions,
      );
      return;
    }
    register.mutate(
      {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: normalizedEmail,
        password,
        role: "customer",
      },
      mutationOptions,
    );
  };

  const errorMessage = getApiErrorMessage(
    activeMutation.error,
    isVendorApplication
      ? "Vendor application failed. Please try again."
      : "Registration failed. Please try again.",
  );

  return (
    <main className="jwso-page jwso-container flex w-full flex-1 justify-center">
      <div className="w-full max-w-[640px]">
        <p className="jwso-kicker mb-2">
          {isVendorApplication ? "Sell on JWSO" : "JWSO account"}
        </p>
        <h1 className="jwso-page-title">
          {isVendorApplication ? "Apply to sell" : "Create an account"}
        </h1>
        <p className="jwso-copy mb-8 mt-3">
          {isVendorApplication
            ? "Create your JWSO account and submit your business details for review. Vendor access begins after onboarding is complete."
            : "Join JWSO to discover products and manage your cart."}
        </p>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="jwso-field">
              <label htmlFor="signup-first-name" className="jwso-label">
                First name
              </label>
              <input
                id="signup-first-name"
                className="jwso-input"
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="jwso-field">
              <label htmlFor="signup-last-name" className="jwso-label">
                Last name
              </label>
              <input
                id="signup-last-name"
                className="jwso-input"
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <div className="jwso-field">
            <label htmlFor="signup-email" className="jwso-label">
              Email address
            </label>
            <input
              id="signup-email"
              className="jwso-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {isVendorApplication && (
            <>
              <h2 className="jwso-section-title border-t border-[var(--jwso-line)] pt-6">
                Business details
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="jwso-field">
                  <label htmlFor="signup-business-name" className="jwso-label">
                    Business name
                  </label>
                  <input
                    id="signup-business-name"
                    className="jwso-input"
                    type="text"
                    required
                    autoComplete="organization"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                  />
                </div>
                <div className="jwso-field">
                  <label
                    htmlFor="signup-registration-number"
                    className="jwso-label"
                  >
                    Registration number
                  </label>
                  <input
                    id="signup-registration-number"
                    className="jwso-input"
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(event) =>
                      setRegistrationNumber(event.target.value)
                    }
                  />
                </div>
                <div className="jwso-field">
                  <label htmlFor="signup-contact-email" className="jwso-label">
                    Business contact email
                  </label>
                  <input
                    id="signup-contact-email"
                    className="jwso-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                </div>
                <div className="jwso-field">
                  <label htmlFor="signup-country" className="jwso-label">
                    Country
                  </label>
                  <input
                    id="signup-country"
                    className="jwso-input"
                    type="text"
                    required
                    autoComplete="country-name"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="jwso-field">
                  <label htmlFor="signup-document-type" className="jwso-label">
                    Document type
                  </label>
                  <select
                    id="signup-document-type"
                    className="jwso-select"
                    value={documentType}
                    onChange={(event) =>
                      setDocumentType(event.target.value as VendorDocumentType)
                    }
                  >
                    <option value="business_registration">
                      Business registration
                    </option>
                    <option value="tax_certificate">Tax certificate</option>
                    <option value="id_proof">ID proof</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="jwso-field">
                  <label
                    htmlFor="signup-vendor-document"
                    className="jwso-label"
                  >
                    Verification document
                  </label>
                  <input
                    id="signup-vendor-document"
                    className="jwso-input file:mr-3 file:border-0 file:bg-[var(--jwso-brand-soft)] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[var(--jwso-brand)]"
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,image/jpeg,image/png"
                    onChange={(event) =>
                      setSelectedDocument(event.target.files?.[0] ?? null)
                    }
                  />
                  <p className="jwso-help">
                    PDF, Word, JPG or PNG, up to 10 MB.
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="jwso-field">
            <label htmlFor="signup-password" className="jwso-label">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                className="jwso-input !pr-12"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="password-help"
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
            <p id="password-help" className="jwso-help">
              At least 8 characters, including uppercase, lowercase and a
              number.
            </p>
          </div>

          {validationError && (
            <p className="jwso-alert" data-tone="error" role="alert">
              {validationError}
            </p>
          )}
          {activeMutation.isError && (
            <p className="jwso-alert" data-tone="error" role="alert">
              {errorMessage}
            </p>
          )}
          {vendorApplication.isSuccess && (
            <p className="jwso-alert" data-tone="success" role="status">
              Application submitted. Your account remains a customer account
              until vendor access is granted.
            </p>
          )}
          <button
            type="submit"
            disabled={activeMutation.isPending}
            className="jwso-button w-full"
          >
            {activeMutation.isPending
              ? isVendorApplication
                ? "Creating account and applying…"
                : "Creating account…"
              : isVendorApplication
                ? "Create account and apply"
                : "Create account"}
          </button>
        </form>
        <p className="jwso-copy mt-7 border-t border-[var(--jwso-line)] pt-5 text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--jwso-brand)] underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
