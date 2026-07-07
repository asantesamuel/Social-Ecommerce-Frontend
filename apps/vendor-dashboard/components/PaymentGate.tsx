import type { UseMutationResult } from "@tanstack/react-query";

type PaymentGateProps = {
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
}: PaymentGateProps) {
  return (
    <div className="glass-card mx-auto mb-8 mt-12 max-w-2xl border-l-[8px] border-[#ff3b30] p-8 shadow-2xl lg:p-12">
      <h2 className="mb-4 text-center text-4xl font-black uppercase tracking-tighter">
        Access Denied
      </h2>
      <p className="mb-10 text-center text-lg font-medium text-[#555]">
        Your onboarding fee must be cleared before you can unlock the command
        center.
      </p>
      {paymentMessage && (
        <p className="mb-6 text-center text-sm font-bold text-[#111]">
          {paymentMessage}
        </p>
      )}
      <div className="flex flex-col gap-4">
        <select
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className="w-full rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none"
        >
          <option value="GHS">GHS (Ghana Cedis)</option>
          <option value="USD">USD (US Dollars)</option>
        </select>
        <button
          onClick={() => payFeeMutation.mutate()}
          disabled={payFeeMutation.isPending}
          className="btn-dopamine w-full py-5 text-lg text-white"
        >
          {payFeeMutation.isPending
            ? "Connecting to Gateway..."
            : "Pay Gateway Fee"}
        </button>
      </div>
    </div>
  );
}
