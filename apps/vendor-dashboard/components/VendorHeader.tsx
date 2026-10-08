import type { UseMutationResult } from "@tanstack/react-query";
import type { VendorProfile } from "@repo/api";

type Props = {
  logoutMutation: UseMutationResult<void, unknown, void, unknown>;
  vendorProfile: VendorProfile;
};

export default function VendorHeader({ logoutMutation, vendorProfile }: Props) {
  const name =
    vendorProfile.companyName || vendorProfile.businessName || "Your store";
  const tone =
    vendorProfile.status === "approved"
      ? "success"
      : vendorProfile.status === "rejected" ||
          vendorProfile.status === "suspended"
        ? "error"
        : "warning";
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--jwso-line)] pb-6">
      <div>
        <p className="jwso-brand mb-5">
          <span className="jwso-brand__mark">J</span>JWSO{" "}
          <span className="jwso-app-label border-l border-[var(--jwso-line)] pl-3">
            Vendor
          </span>
        </p>
        <p className="jwso-kicker mb-2">Store workspace</p>
        <h1 className="jwso-page-title">{name}</h1>
        <span className="jwso-status mt-3" data-tone={tone}>
          {vendorProfile.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="text-right">
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="jwso-button jwso-button--secondary"
        >
          {logoutMutation.isPending ? "Signing out…" : "Sign out"}
        </button>
        {logoutMutation.isError && (
          <p className="mt-2 text-sm text-[var(--jwso-error)]" role="alert">
            Sign out failed. Try again.
          </p>
        )}
      </div>
    </header>
  );
}
