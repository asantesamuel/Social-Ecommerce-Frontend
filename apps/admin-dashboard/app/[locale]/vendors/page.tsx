'use client';

import React, { useState } from 'react';
import { useAdminPendingVendors, useVendorDocuments, useReviewVendor } from '../../../hooks/useAdmin';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VendorProfile {
  id: string;
  companyName: string;
  companyEstablishedDate: string | null;
  registrationNumber: string;
  contactEmail: string;
  country: string;
  status: string;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface VendorDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: string;
  uploadedAt: string;
}

// ── Document Panel (lazy-loaded per vendor) ───────────────────────────────────

function VendorDocumentsPanel({ vendorId }: { vendorId: string }) {
  const { data: docs, isLoading, isError } = useVendorDocuments(vendorId);

  if (isLoading) {
    return (
      <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
        <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        Loading documents…
      </div>
    );
  }

  if (isError) {
    return <p className="mt-4 text-xs font-bold text-[#ff3b30]">Failed to load documents.</p>;
  }

  if (!docs || docs.length === 0) {
    return (
      <p className="mt-4 text-xs font-medium text-gray-400 italic">
        No documents submitted yet.
      </p>
    );
  }

  const formatDocType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
        Submitted Documents
      </p>
      {docs.map((doc: VendorDocument) => (
        <div
          key={doc.id}
          className="flex items-center justify-between bg-[#f4f4f5] rounded-xl px-4 py-3"
        >
          <div>
            <p className="text-sm font-bold">{formatDocType(doc.documentType)}</p>
            <p className="text-[11px] text-gray-500 font-medium">
              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} ·{' '}
              <span className="capitalize">{doc.verificationStatus}</span>
            </p>
          </div>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-black uppercase tracking-widest text-[#ff3b30] hover:underline"
          >
            View →
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Vendor Card ───────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const reviewVendor = useReviewVendor();

  const handleApprove = () => {
    if (!confirm(`Approve "${vendor.companyName}"? This will grant them vendor access.`)) return;
    reviewVendor.mutate({ vendorId: vendor.id, action: 'approve' });
  };

  const handleReject = () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      alert('Please provide a rejection reason of at least 10 characters.');
      return;
    }
    reviewVendor.mutate({ vendorId: vendor.id, action: 'reject', reason: rejectReason.trim() });
  };

  const isPending = reviewVendor.isPending;

  return (
    <div className="p-6 md:p-8 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black tracking-tighter">{vendor.companyName}</h3>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="text-xs font-medium text-gray-500">{vendor.contactEmail}</span>
            <span className="text-xs font-medium text-gray-400">·</span>
            <span className="text-xs font-medium text-gray-500 uppercase">{vendor.country}</span>
            {vendor.companyEstablishedDate && (
              <>
                <span className="text-xs font-medium text-gray-400">·</span>
                <span className="text-xs font-medium text-gray-500">
                  Est. {new Date(vendor.companyEstablishedDate).getFullYear()}
                </span>
              </>
            )}
            <span className="text-xs font-medium text-gray-400">·</span>
            <span className="text-xs font-medium text-gray-500">
              Applied {new Date(vendor.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="px-4 py-2 border border-[#e4e4e7] rounded-xl text-xs font-black uppercase tracking-widest hover:border-black transition-colors"
          >
            {expanded ? 'Hide Docs' : 'View Docs'}
          </button>
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="px-5 py-2 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectInput((p) => !p)}
            disabled={isPending}
            className="px-5 py-2 border border-[#ff3b30] text-[#ff3b30] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#ff3b30] hover:text-white disabled:opacity-40 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Reject reason input */}
      {showRejectInput && (
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="Reason for rejection (min. 10 characters)…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="flex-1 bg-transparent border border-[#e4e4e7] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ff3b30] transition-colors"
          />
          <button
            onClick={handleReject}
            disabled={isPending}
            className="px-5 py-3 bg-[#ff3b30] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {isPending ? 'Sending…' : 'Confirm Reject'}
          </button>
        </div>
      )}

      {/* Mutation error */}
      {reviewVendor.isError && (
        <p className="text-xs font-bold text-[#ff3b30]">
          Action failed. Please try again.
        </p>
      )}

      {/* Documents panel */}
      {expanded && <VendorDocumentsPanel vendorId={vendor.id} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        LOADING VENDOR QUEUE…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-[#ff3b30] font-black text-2xl">
        FAILED TO FETCH VENDOR APPLICATIONS
      </div>
    );
  }

  const vendors: VendorProfile[] =
    data?.pages.flatMap((page: { data: VendorProfile[] }) => page.data) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-4xl font-black uppercase tracking-tighter">Vendor Applications</h2>
        <p className="text-gray-500 font-medium">
          Review business details and approve or reject vendor registrations.
        </p>
      </header>

      {vendors.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Inbox Zero</h3>
          <p className="text-gray-500 font-medium max-w-sm">
            No vendor applications are awaiting review right now.
          </p>
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden divide-y divide-[#f4f4f5] dark:divide-white/10">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto w-full max-w-sm py-4 border-2 border-black dark:border-white rounded-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load More Applications'}
        </button>
      )}
    </div>
  );
}
