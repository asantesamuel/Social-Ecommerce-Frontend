"use client";

import ApprovedVendorWorkspace from "../../components/ApprovedVendorWorkspace";
import DocumentUploadPanel from "../../components/DocumentUploadPanel";
import PaymentGate from "../../components/PaymentGate";
import PaymentReturnNotice from "../../components/PaymentReturnNotice";
import RejectedApplicationPanel from "../../components/RejectedApplicationPanel";
import VendorHeader from "../../components/VendorHeader";
import { useVendorDashboard } from "../../hooks/useVendorDashboard";

export default function VendorDashboardPage() {
  const dashboard = useVendorDashboard();
  const { vendorQuery } = dashboard;

  if (vendorQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-2xl font-black">
        LOADING COMMAND CENTER...
      </div>
    );
  }

  if (vendorQuery.isError || !vendorQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-[#ff3b30]">
        <h2 className="text-4xl font-black">UNAUTHORIZED</h2>
        <p className="mt-4 text-minimal-gray">
          No vendor profile found for this user.
        </p>
      </div>
    );
  }

  const vendorProfile = vendorQuery.data;
  const status = vendorProfile.status;

  return (
    <div className="min-h-screen bg-[#fafafa] p-8 lg:p-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {dashboard.paystackReturnDetected && (
          <PaymentReturnNotice
            isSyncingPayment={dashboard.isSyncingPayment}
            paymentMessage={dashboard.paymentMessage}
            paymentReference={dashboard.paymentReference}
          />
        )}

        <VendorHeader
          logoutMutation={dashboard.logoutMutation}
          vendorProfile={vendorProfile}
        />

        {status === "pending_payment" && (
          <PaymentGate
            currency={dashboard.currency}
            paymentMessage={dashboard.paymentMessage}
            payFeeMutation={dashboard.payFeeMutation}
            setCurrency={dashboard.setCurrency}
          />
        )}

        {status === "pending_review" && (
          <DocumentUploadPanel
            documentType={dashboard.documentType}
            selectedFile={dashboard.selectedFile}
            setDocumentType={dashboard.setDocumentType}
            setSelectedFile={dashboard.setSelectedFile}
            setUploadMessage={dashboard.setUploadMessage}
            uploadDocMutation={dashboard.uploadDocMutation}
            uploadMessage={dashboard.uploadMessage}
          />
        )}

        {status === "rejected" && (
          <RejectedApplicationPanel
            reapplyMessage={dashboard.reapplyMessage}
            reapplyMutation={dashboard.reapplyMutation}
            vendorProfile={vendorProfile}
          />
        )}

        {status === "approved" && (
          <ApprovedVendorWorkspace
            categories={dashboard.categories}
            createProductMutation={dashboard.createProductMutation}
            handleNameChange={dashboard.handleNameChange}
            handleProductFieldChange={dashboard.handleProductFieldChange}
            productForm={dashboard.productForm}
            productImage={dashboard.productImage}
            productMessage={dashboard.productMessage}
            setProductImage={dashboard.setProductImage}
            setProductMessage={dashboard.setProductMessage}
            vendorProducts={dashboard.vendorProducts}
          />
        )}
      </div>
    </div>
  );
}
