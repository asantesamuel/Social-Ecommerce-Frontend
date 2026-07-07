import type { UseMutationResult } from "@tanstack/react-query";
import type { VendorProfile } from "@repo/api";

type VendorHeaderProps = {
  logoutMutation: UseMutationResult<void, unknown, void, unknown>;
  vendorProfile: VendorProfile;
};

export default function VendorHeader({
  logoutMutation,
  vendorProfile,
}: VendorHeaderProps) {
  const vendorName =
    vendorProfile.companyName || vendorProfile.businessName || "Vendor";

  return (
    <header className="glass-card flex items-center justify-between p-6 shadow-sm">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-[#111]">
          Command Center
        </h1>
        <p className="font-medium text-minimal-gray">{vendorName}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-[#111] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
          STATUS: {vendorProfile.status}
        </span>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="rounded-full border border-[#e4e4e7] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#111] transition-colors hover:bg-[#f4f4f5] disabled:opacity-50"
        >
          {logoutMutation.isPending ? "Signing Out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
