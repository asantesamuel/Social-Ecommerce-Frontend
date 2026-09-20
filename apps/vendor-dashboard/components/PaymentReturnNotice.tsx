type PaymentReturnNoticeProps = {
  isSyncingPayment: boolean;
  paymentMessage: string | null;
  paymentReference: string | null;
};

export default function PaymentReturnNotice({
  isSyncingPayment,
  paymentMessage,
  paymentReference,
}: PaymentReturnNoticeProps) {
  return (
    <div className="glass-card border-l-[8px] border-[#111] p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isSyncingPayment ? "bg-[#111] text-white" : "bg-[#ecfdf3] text-[#027a48]"}`}
          >
            {isSyncingPayment ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <span className="text-xl font-black">OK</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#111] lg:text-2xl">
              {isSyncingPayment
                ? "Payment Confirmed, Syncing Status"
                : "Payment Confirmed"}
            </h2>
            <p className="mt-1 text-sm font-medium text-minimal-gray lg:text-base">
              {paymentMessage ||
                "We are updating your vendor access so you can continue onboarding."}
            </p>
            {paymentReference && (
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#777]">
                Reference: {paymentReference}
              </p>
            )}
          </div>
        </div>
        <div className="lg:text-right">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-widest ${isSyncingPayment ? "bg-black text-white" : "bg-[#ecfdf3] text-[#027a48]"}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${isSyncingPayment ? "animate-pulse bg-white" : "bg-[#12b76a]"}`}
            />
            {isSyncingPayment ? "Updating Access" : "Ready To Continue"}
          </div>
        </div>
      </div>
    </div>
  );
}
