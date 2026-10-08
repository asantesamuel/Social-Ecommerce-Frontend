import type { UseMutationResult } from "@tanstack/react-query";
import type { VendorProfile } from "@repo/api";

type Props = {
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
}: Props) {
  return (
    <section className="max-w-[650px]" aria-labelledby="rejected-heading">
      <p className="jwso-kicker mb-2">Onboarding · Decision</p>
      <h2 id="rejected-heading" className="jwso-section-title">
        Your application needs changes
      </h2>
      <p className="jwso-copy mt-3">
        Your vendor application was reviewed but cannot be approved in its
        current form.
      </p>
      <div className="jwso-alert mt-6" data-tone="error">
        <p className="jwso-label">Reason</p>
        <p className="jwso-copy mt-1">
          {vendorProfile.rejectionReason || "No reason was provided."}
        </p>
      </div>
      {vendorProfile.reapplyDeadline && (
        <p className="jwso-copy mt-4 text-sm">
          Reapply by{" "}
          {new Date(vendorProfile.reapplyDeadline).toLocaleDateString()} to use
          the current reapplication window.
        </p>
      )}
      <p className="jwso-copy mt-5 text-sm">
        {vendorProfile.canReapplyWithoutFee
          ? "You can resubmit without another onboarding payment during this window."
          : "Your reapplication window has ended. Restarting will return you to the payment step."}
      </p>
      <button
        type="button"
        onClick={() => reapplyMutation.mutate()}
        disabled={reapplyMutation.isPending}
        className="jwso-button mt-5"
      >
        {reapplyMutation.isPending
          ? "Updating application…"
          : vendorProfile.canReapplyWithoutFee
            ? "Reapply without payment"
            : "Restart application"}
      </button>
      {reapplyMessage && (
        <p
          className="jwso-alert mt-4"
          data-tone={reapplyMutation.isError ? "error" : "success"}
          role="status"
        >
          {reapplyMessage}
        </p>
      )}
    </section>
  );
}
