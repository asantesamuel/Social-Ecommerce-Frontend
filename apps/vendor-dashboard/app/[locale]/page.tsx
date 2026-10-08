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

  if (vendorQuery.isLoading)
    return (
      <main className="jwso-container jwso-page">
        <div
          className="jwso-skeleton h-40 rounded-[6px]"
          aria-label="Loading vendor workspace"
        />
      </main>
    );
  if (vendorQuery.isError || !vendorQuery.data)
    return (
      <main className="jwso-container jwso-page">
        <div className="jwso-empty" role="alert">
          <h1 className="jwso-section-title">Vendor profile unavailable</h1>
          <p>
            We could not load your vendor profile. Please check your account or
            try again.
          </p>
          <button
            type="button"
            onClick={() => vendorQuery.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      </main>
    );

  const status = vendorQuery.data.status;
  return (
    <main className="jwso-container jwso-page grid gap-7">
      <VendorHeader
        logoutMutation={dashboard.logoutMutation}
        vendorProfile={vendorQuery.data}
      />
      {dashboard.paystackReturnDetected && (
        <PaymentReturnNotice
          isSyncingPayment={dashboard.isSyncingPayment}
          paymentMessage={dashboard.paymentMessage}
          paymentReference={dashboard.paymentReference}
        />
      )}
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
          vendorProfile={vendorQuery.data}
        />
      )}
      {status === "suspended" && (
        <div className="jwso-alert" data-tone="warning" role="status">
          <h2 className="jwso-section-title">Vendor access suspended</h2>
          <p className="jwso-copy mt-2">
            Your vendor workspace is currently unavailable. Please contact
            marketplace support for help with your account.
          </p>
        </div>
      )}
      {status === "approved" && (
        <ApprovedVendorWorkspace
          categories={dashboard.categories}
          categoriesError={dashboard.categoriesQuery.isError}
          createProductMutation={dashboard.createProductMutation}
          handleNameChange={dashboard.handleNameChange}
          handleProductFieldChange={dashboard.handleProductFieldChange}
          productForm={dashboard.productForm}
          productImage={dashboard.productImage}
          productMessage={dashboard.productMessage}
          setProductImage={dashboard.setProductImage}
          setProductMessage={dashboard.setProductMessage}
          vendorProducts={dashboard.vendorProducts}
          productsLoading={dashboard.vendorProductsQuery.isLoading}
          productsError={dashboard.vendorProductsQuery.isError}
          hasMoreProducts={Boolean(dashboard.vendorProductsQuery.hasNextPage)}
          loadingMoreProducts={dashboard.vendorProductsQuery.isFetchingNextPage}
          loadMoreProducts={() => dashboard.vendorProductsQuery.fetchNextPage()}
          retryProducts={() => dashboard.vendorProductsQuery.refetch()}
        />
      )}
    </main>
  );
}
