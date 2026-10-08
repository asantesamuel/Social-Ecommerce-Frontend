import type { UseMutationResult } from "@tanstack/react-query";
import { getApiErrorMessage } from "@repo/api";

type Props = {
  currency: string;
  paymentMessage: string | null;
  payFeeMutation: UseMutationResult<
    { fee?: { paymentUrl?: string } },
    unknown,
    void,
    unknown
  >;
  setCurrency: (currency: string) => void;
};

export default function PaymentGate({
  currency,
  paymentMessage,
  payFeeMutation,
  setCurrency,
}: Props) {
  return (
    <section className="max-w-[600px]" aria-labelledby="payment-heading">
      <p className="jwso-kicker mb-2">Onboarding · Payment</p>
      <h2 id="payment-heading" className="jwso-section-title">
        Complete your onboarding fee
      </h2>
      <p className="jwso-copy mt-3">
        Your business application is awaiting payment before the review stage.
        You will be taken to the payment provider to complete this step.
      </p>
      <div className="jwso-field mt-6">
        <label htmlFor="fee-currency" className="jwso-label">
          Payment currency
        </label>
        <select
          id="fee-currency"
          className="jwso-select"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        >
          <option value="GHS">GHS (Ghana cedi)</option>
          <option value="USD">USD (US dollar)</option>
        </select>
      </div>
      {paymentMessage && (
        <p className="jwso-alert mt-4" role="status">
          {paymentMessage}
        </p>
      )}
      {payFeeMutation.isError && (
        <p className="jwso-alert mt-4" data-tone="error" role="alert">
          {getApiErrorMessage(
            payFeeMutation.error,
            "Payment could not be started. Please try again.",
          )}
        </p>
      )}
      <button
        type="button"
        onClick={() => payFeeMutation.mutate()}
        disabled={payFeeMutation.isPending}
        className="jwso-button mt-6"
      >
        {payFeeMutation.isPending
          ? "Connecting to payment provider…"
          : "Continue to payment"}
      </button>
    </section>
  );
}
