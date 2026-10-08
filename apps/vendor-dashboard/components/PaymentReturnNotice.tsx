type Props = {
  isSyncingPayment: boolean;
  paymentMessage: string | null;
  paymentReference: string | null;
};

export default function PaymentReturnNotice({
  isSyncingPayment,
  paymentMessage,
  paymentReference,
}: Props) {
  return (
    <div
      className="jwso-alert"
      data-tone={isSyncingPayment ? "info" : "success"}
      role="status"
    >
      <p className="font-semibold">
        {isSyncingPayment
          ? "Checking payment status"
          : "Payment return received"}
      </p>
      <p className="jwso-copy mt-1 text-sm">
        {paymentMessage || "Your vendor status is being checked."}
      </p>
      {paymentReference && (
        <p className="jwso-meta mt-2">Reference: {paymentReference}</p>
      )}
    </div>
  );
}
