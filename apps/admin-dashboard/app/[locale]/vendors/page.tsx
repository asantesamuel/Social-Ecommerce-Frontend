"use client";

import React, { useState } from "react";
import {
  useAdminPendingVendors,
  useReviewVendor,
  useVendorDocuments,
} from "../../../hooks/useAdmin";
import type {
  PaginatedResponse,
  VendorDocument,
  VendorProfile,
} from "@repo/api";

const getVendorName = (vendor: VendorProfile) =>
  vendor.companyName || vendor.businessName || "Unnamed vendor";

const formatDocType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

function VendorDocumentsPanel({ vendorId }: { vendorId: string }) {
  const { data: docs, isLoading, isError } = useVendorDocuments(vendorId);

  if (isLoading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        Loading documents...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="mt-4 text-xs font-bold text-[#ff3b30]">
        Failed to load documents.
      </p>
    );
  }

  if (!docs || docs.length === 0) {
    return (
      <p className="mt-4 text-xs font-medium italic text-gray-400">
        No documents submitted yet.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="mb-1 text-xs font-black uppercase tracking-widest text-gray-400">
        Submitted Documents
      </p>
      {docs.map((doc: VendorDocument) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-xl bg-[#f4f4f5] px-4 py-3"
        >
          <div>
            <p className="text-sm font-bold">
              {formatDocType(doc.documentType)}
            </p>
            <p className="text-[11px] font-medium text-gray-500">
              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} -{" "}
              <span className="capitalize">{doc.verificationStatus}</span>
            </p>
          </div>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-black uppercase tracking-widest text-[#ff3b30] hover:underline"
          >
            View
          </a>
        </div>
      ))}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const reviewVendor = useReviewVendor();
  const vendorName = getVendorName(vendor);

  const handleApprove = () => {
    if (
      !confirm(`Approve "${vendorName}"? This will grant them vendor access.`)
    ) {
      return;
    }

    reviewVendor.mutate({ vendorId: vendor.id, action: "approve" });
  };

  const handleReject = () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      alert("Please provide a rejection reason of at least 10 characters.");
      return;
    }

    reviewVendor.mutate({
      vendorId: vendor.id,
      action: "reject",
      reason: rejectReason.trim(),
    });
  };

  const isPending = reviewVendor.isPending;

  return (
    <div className="flex flex-col gap-4 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-2xl font-black tracking-tighter">{vendorName}</h3>
          <div className="mt-1 flex flex-wrap gap-3">
            <span className="text-xs font-medium text-gray-500">
              {vendor.contactEmail || "No contact email"}
            </span>
            <span className="text-xs font-medium text-gray-400">-</span>
            <span className="text-xs font-medium uppercase text-gray-500">
              {vendor.country || "N/A"}
            </span>
            {vendor.companyEstablishedDate && (
              <>
                <span className="text-xs font-medium text-gray-400">-</span>
                <span className="text-xs font-medium text-gray-500">
                  Est. {new Date(vendor.companyEstablishedDate).getFullYear()}
                </span>
              </>
            )}
            {vendor.createdAt && (
              <>
                <span className="text-xs font-medium text-gray-400">-</span>
                <span className="text-xs font-medium text-gray-500">
                  Applied {new Date(vendor.createdAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <button
            onClick={() => setExpanded((current) => !current)}
            className="rounded-xl border border-[#e4e4e7] px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors hover:border-black"
          >
            {expanded ? "Hide Docs" : "View Docs"}
          </button>
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-xl bg-black px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectInput((current) => !current)}
            disabled={isPending}
            className="rounded-xl border border-[#ff3b30] px-5 py-2 text-xs font-black uppercase tracking-widest text-[#ff3b30] transition-colors hover:bg-[#ff3b30] hover:text-white disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      </div>

      {showRejectInput && (
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            placeholder="Reason for rejection (min. 10 characters)..."
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="flex-1 rounded-xl border border-[#e4e4e7] bg-transparent px-4 py-3 text-sm transition-colors focus:border-[#ff3b30] focus:outline-none"
          />
          <button
            onClick={handleReject}
            disabled={isPending}
            className="rounded-xl bg-[#ff3b30] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {isPending ? "Sending..." : "Confirm Reject"}
          </button>
        </div>
      )}

      {reviewVendor.isError && (
        <p className="text-xs font-bold text-[#ff3b30]">
          Action failed. Please try again.
        </p>
      )}

      {expanded && <VendorDocumentsPanel vendorId={vendor.id} />}
    </div>
  );
}

export default function VendorReviewPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminPendingVendors();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-2xl font-black">
        LOADING VENDOR QUEUE...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-2xl font-black text-[#ff3b30]">
        FAILED TO FETCH VENDOR APPLICATIONS
      </div>
    );
  }

  const vendors =
    data?.pages.flatMap(
      (page: PaginatedResponse<VendorProfile>) => page.data,
    ) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-4xl font-black uppercase tracking-tighter">
          Vendor Applications
        </h2>
        <p className="font-medium text-gray-500">
          Review business details and approve or reject vendor registrations.
        </p>
      </header>

      {vendors.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <h3 className="mb-2 text-2xl font-black uppercase tracking-tighter">
            Inbox Zero
          </h3>
          <p className="max-w-sm font-medium text-gray-500">
            No vendor applications are awaiting review right now.
          </p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-[#f4f4f5] overflow-hidden p-0 dark:divide-white/10">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto w-full max-w-sm rounded-2xl border-2 border-black py-4 font-black uppercase tracking-widest transition-colors hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
        >
          {isFetchingNextPage ? "Loading..." : "Load More Applications"}
        </button>
      )}
    </div>
  );
}
