import type { UseMutationResult } from "@tanstack/react-query";
import type { VendorProfile } from "@repo/api";

type RejectedApplicationPanelProps = {
  reapplyMessage: string | null;
  reapplyMutation: UseMutationResult<
    { message?: string },
    unknown,
    void,
    unknown
  >;
  vendorProfile: VendorProfile;
};

export default function RejectedApplicationPanel({
  reapplyMessage,
  reapplyMutation,
  vendorProfile,
}: RejectedApplicationPanelProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="glass-card border-l-[8px] border-[#ff3b30] p-8 shadow-sm">
        <h2 className="mb-4 text-3xl font-black uppercase tracking-tighter text-[#111]">
          Application Rejected
        </h2>
        <p className="mb-6 text-lg font-medium text-minimal-gray">
          Your vendor application was reviewed and needs changes before it can
          be approved.
        </p>
        <div className="rounded-2xl border border-[#f1f1f1] bg-[#fafafa] p-5">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-[#777]">
            Rejection Reason
          </p>
          <p className="font-medium leading-relaxed text-[#111]">
            {vendorProfile.rejectionReason ||
              "No rejection reason was provided."}
          </p>
        </div>
        {vendorProfile.reapplyDeadline && (
          <p className="mt-5 text-sm font-medium text-minimal-gray">
            Reapply window:{" "}
            <strong className="text-[#111]">
              {new Date(vendorProfile.reapplyDeadline).toLocaleDateString()}
            </strong>
          </p>
        )}
      </div>

      <div className="glass-card border border-[#eaeaea] bg-white p-8">
        <h3 className="mb-4 text-xl font-bold uppercase tracking-tight">
          {vendorProfile.canReapplyWithoutFee
            ? "Reopen Application"
            : "Restart Application"}
        </h3>
        <p className="mb-6 text-sm font-medium text-minimal-gray">
          {vendorProfile.canReapplyWithoutFee
            ? "You are still inside the reapply window, so you can continue without paying the onboarding fee again."
            : "Your reapply window has expired. Restarting will move your application back to payment so you can pay the onboarding fee again."}
        </p>

        <button
          onClick={() => reapplyMutation.mutate()}
          disabled={reapplyMutation.isPending}
          className="btn-dopamine w-full py-4 text-lg text-white disabled:opacity-50"
        >
          {reapplyMutation.isPending
            ? "Updating Application..."
            : vendorProfile.canReapplyWithoutFee
              ? "Reapply Without Paying Again"
              : "Restart And Return To Payment"}
        </button>

        {reapplyMessage && (
          <p className="mt-4 text-sm font-medium text-minimal-gray">
            {reapplyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
