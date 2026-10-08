"use client";

import { useState } from "react";
import { getApiErrorMessage, type VendorProfile } from "@repo/api";
import {
  useAdminPendingVendors,
  useReviewVendor,
  useVendorDocuments,
} from "../../../hooks/useAdmin";

const vendorName = (vendor: VendorProfile) =>
  vendor.companyName || vendor.businessName || "Unnamed vendor";
const humanize = (value: string) => value.replace(/_/g, " ");

function Documents({ vendorId }: { vendorId: string }) {
  const query = useVendorDocuments(vendorId);
  if (query.isLoading)
    return <p className="jwso-meta mt-4">Loading documents…</p>;
  if (query.isError)
    return (
      <p className="jwso-alert mt-4" data-tone="error" role="alert">
        Documents could not be loaded.{" "}
        <button
          type="button"
          onClick={() => query.refetch()}
          className="font-semibold underline"
        >
          Retry
        </button>
      </p>
    );
  if (!query.data?.length)
    return <p className="jwso-copy mt-4 text-sm">No documents submitted.</p>;
  return (
    <div className="jwso-table-wrap mt-4">
      <table className="jwso-table">
        <thead>
          <tr>
            <th scope="col">Document</th>
            <th scope="col">Uploaded</th>
            <th scope="col">Verification</th>
            <th scope="col" className="jwso-table__right">
              File
            </th>
          </tr>
        </thead>
        <tbody>
          {query.data.map((doc) => (
            <tr key={doc.id}>
              <td className="capitalize font-semibold">
                {humanize(doc.documentType)}
              </td>
              <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
              <td>
                <span className="jwso-status">{doc.verificationStatus}</span>
              </td>
              <td className="jwso-table__right">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--jwso-brand)] underline underline-offset-4"
                >
                  View document
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VendorReview({ vendor }: { vendor: VendorProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [validation, setValidation] = useState("");
  const review = useReviewVendor();

  const approve = () => {
    if (
      window.confirm(
        `Approve "${vendorName(vendor)}"? This will grant vendor access.`,
      )
    )
      review.mutate({ vendorId: vendor.id, action: "approve" });
  };
  const reject = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setValidation("Provide a reason of at least 10 characters.");
      return;
    }
    setValidation("");
    review.mutate({ vendorId: vendor.id, action: "reject", reason: trimmed });
  };

  return (
    <article className="border-b border-[var(--jwso-line)] py-6 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h2 className="jwso-section-title">{vendorName(vendor)}</h2>
          <p className="jwso-copy mt-2 text-sm">
            {vendor.contactEmail || "Contact email unavailable"} ·{" "}
            {vendor.country || "Country unavailable"}
          </p>
          <p className="jwso-meta mt-1">
            {vendor.registrationNumber && (
              <>Registration {vendor.registrationNumber} · </>
            )}
            {vendor.createdAt && (
              <>Applied {new Date(vendor.createdAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="jwso-button jwso-button--secondary"
            aria-expanded={expanded}
          >
            {expanded ? "Hide documents" : "View documents"}
          </button>
          <button
            type="button"
            onClick={approve}
            disabled={review.isPending}
            className="jwso-button"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setShowReject(!showReject)}
            disabled={review.isPending}
            className="jwso-button jwso-button--danger"
            aria-expanded={showReject}
          >
            Reject
          </button>
        </div>
      </div>
      {showReject && (
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="jwso-field min-w-[220px] flex-1">
            <label htmlFor={`reject-${vendor.id}`} className="jwso-label">
              Reason for rejection
            </label>
            <input
              id={`reject-${vendor.id}`}
              className="jwso-input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={Boolean(validation)}
            />
          </div>
          <button
            type="button"
            onClick={reject}
            disabled={review.isPending}
            className="jwso-button jwso-button--danger"
          >
            Confirm rejection
          </button>
        </div>
      )}
      {validation && (
        <p className="mt-2 text-sm text-[var(--jwso-error)]" role="alert">
          {validation}
        </p>
      )}
      {review.isError && (
        <p className="jwso-alert mt-4" data-tone="error" role="alert">
          {getApiErrorMessage(
            review.error,
            "Review could not be saved. Please try again.",
          )}
        </p>
      )}
      {expanded && <Documents vendorId={vendor.id} />}
    </article>
  );
}

export default function VendorReviewPage() {
  const vendorsQuery = useAdminPendingVendors();
  const vendors = vendorsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <div className="grid gap-6">
      <header>
        <p className="jwso-kicker mb-2">Seller onboarding</p>
        <h1 className="jwso-page-title">Vendor applications</h1>
        <p className="jwso-copy mt-2">
          Review business details and submitted documents before granting
          access.
        </p>
      </header>
      {vendorsQuery.isLoading ? (
        <div
          className="jwso-skeleton h-52 rounded-[6px]"
          aria-label="Loading vendor applications"
        />
      ) : vendorsQuery.isError ? (
        <div className="jwso-empty" role="alert">
          <h2 className="jwso-section-title">Applications unavailable</h2>
          <p>Vendor applications could not be loaded.</p>
          <button
            type="button"
            onClick={() => vendorsQuery.refetch()}
            className="jwso-button"
          >
            Retry
          </button>
        </div>
      ) : vendors.length === 0 ? (
        <div className="jwso-empty">
          <h2 className="jwso-section-title">
            No applications awaiting review
          </h2>
          <p>New vendor applications will appear here.</p>
        </div>
      ) : (
        <section
          aria-label="Applications"
          className="border-t border-[var(--jwso-line)]"
        >
          {vendors.map((vendor) => (
            <VendorReview key={vendor.id} vendor={vendor} />
          ))}
        </section>
      )}
      {vendorsQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => vendorsQuery.fetchNextPage()}
          disabled={vendorsQuery.isFetchingNextPage}
          className="jwso-button jwso-button--secondary mx-auto"
        >
          {vendorsQuery.isFetchingNextPage
            ? "Loading…"
            : "Load more applications"}
        </button>
      )}
    </div>
  );
}
