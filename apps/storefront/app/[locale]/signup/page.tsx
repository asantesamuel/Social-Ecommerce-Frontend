"use client";

import { useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "../../../i18n/routing";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage, type VendorDocumentType } from "@repo/api";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || activeMutation.isPending) {
      return;
    }

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

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passRegex.test(password)) {
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

  const registerErrorMessage = getApiErrorMessage(
    activeMutation.error,
    isVendorApplication
      ? "Vendor application failed. Please try again."
      : "Registration failed. Please try again.",
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-28">
      <div className="w-full max-w-2xl rounded-[8px] border border-[#ded7ca] bg-[#fffdf8]/88 p-6 shadow-[0_28px_90px_rgba(17,16,14,0.12)] backdrop-blur-xl sm:p-10">
        <p className="eyebrow text-center">
          {isVendorApplication ? "Vendor Application" : "Customer Access"}
        </p>
        <h1 className="mb-3 mt-3 text-center text-4xl font-black uppercase leading-none tracking-[-0.03em] text-[#11100e]">
          {isVendorApplication ? "Apply to Sell" : "Create Account"}
        </h1>
        <p className="mb-8 text-center font-medium leading-6 text-[#706b63]">
          {isVendorApplication
            ? "Vendors start with a customer account. We will create your login, submit your business application, and move you into review and payment onboarding."
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

          {isVendorApplication && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signup-business-name"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Business Name
                </label>
                <input
                  id="signup-business-name"
                  type="text"
                  required={isVendorApplication}
                  autoComplete="organization"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="premium-input"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label
                  htmlFor="signup-registration-number"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Registration Number
                </label>
                <input
                  id="signup-registration-number"
                  type="text"
                  required={isVendorApplication}
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="premium-input"
                  placeholder="BRN-123456"
                />
              </div>
              <div>
                <label
                  htmlFor="signup-contact-email"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Business Contact Email
                </label>
                <input
                  id="signup-contact-email"
                  type="email"
                  required={isVendorApplication}
                  autoComplete="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="premium-input"
                  placeholder="seller@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="signup-country"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Country
                </label>
                <input
                  id="signup-country"
                  type="text"
                  required={isVendorApplication}
                  autoComplete="country-name"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="premium-input"
                  placeholder="Ghana"
                />
              </div>
            </div>
          )}

          {isVendorApplication && (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div>
                <label
                  htmlFor="signup-document-type"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Document Type
                </label>
                <select
                  id="signup-document-type"
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(event.target.value as VendorDocumentType)
                  }
                  className="premium-input"
                >
                  <option value="business_registration">
                    Business Registration
                  </option>
                  <option value="tax_certificate">Tax Certificate</option>
                  <option value="id_proof">ID Proof</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="signup-vendor-document"
                  className="mb-2 block text-sm font-bold text-[#11100e]"
                >
                  Verification Document
                </label>
                <input
                  id="signup-vendor-document"
                  type="file"
                  required={isVendorApplication}
                  accept=".pdf,.doc,.docx,image/jpeg,image/png"
                  onChange={(event) =>
                    setSelectedDocument(event.target.files?.[0] ?? null)
                  }
                  className="block w-full rounded-[8px] border border-[#ded7ca] bg-white/80 px-4 py-3 text-sm font-medium text-[#706b63] file:mr-4 file:rounded-[8px] file:border-0 file:bg-[#11100e] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />
                <p className="mt-2 text-xs font-medium text-[#706b63]">
                  Upload a PDF, Word document, JPG, or PNG up to 10MB.
                </p>
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
            disabled={activeMutation.isPending}
            className="btn-dopamine mt-6 w-full py-4 disabled:opacity-50"
          >
            {activeMutation.isPending
              ? isVendorApplication
                ? "Creating account and applying..."
                : "Signing up..."
              : isVendorApplication
                ? "Create Account & Apply"
                : "Create Account"}
          </button>

          {validationError && (
            <p className="text-center text-sm font-bold text-[#c83a2d]">
              {validationError}
            </p>
          )}
          {activeMutation.isError && (
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
