import type { UseMutationResult } from "@tanstack/react-query";
import type { VendorDocument, VendorDocumentType } from "@repo/api";

type Props = {
  documentType: VendorDocumentType;
  selectedFile: File | null;
  setDocumentType: (type: VendorDocumentType) => void;
  setSelectedFile: (file: File | null) => void;
  setUploadMessage: (message: string | null) => void;
  uploadDocMutation: UseMutationResult<VendorDocument, unknown, void, unknown>;
  uploadMessage: string | null;
};

export default function DocumentUploadPanel({
  documentType,
  selectedFile,
  setDocumentType,
  setSelectedFile,
  setUploadMessage,
  uploadDocMutation,
  uploadMessage,
}: Props) {
  return (
    <section className="max-w-[650px]" aria-labelledby="review-heading">
      <p className="jwso-kicker mb-2">Onboarding · Review</p>
      <h2 id="review-heading" className="jwso-section-title">
        Application under review
      </h2>
      <p className="jwso-copy mt-3">
        The JWSO team is reviewing your business. You can submit supporting
        documents below.
      </p>
      <div className="mt-7 grid gap-5">
        <div className="jwso-field">
          <label htmlFor="document-type" className="jwso-label">
            Document type
          </label>
          <select
            id="document-type"
            className="jwso-select"
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value as VendorDocumentType)
            }
          >
            <option value="business_registration">Business registration</option>
            <option value="tax_certificate">Tax certificate</option>
            <option value="id_proof">ID proof</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="jwso-field">
          <label htmlFor="verification-file" className="jwso-label">
            Verification document
          </label>
          <input
            id="verification-file"
            type="file"
            accept=".pdf,.doc,.docx,image/jpeg,image/png"
            className="jwso-input file:mr-3 file:border-0 file:bg-[var(--jwso-brand-soft)] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[var(--jwso-brand)]"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] || null);
              setUploadMessage(null);
            }}
          />
          <p className="jwso-help">PDF, Word, JPG or PNG.</p>
        </div>
        <button
          type="button"
          onClick={() => uploadDocMutation.mutate()}
          disabled={!selectedFile || uploadDocMutation.isPending}
          className="jwso-button w-fit"
        >
          {uploadDocMutation.isPending ? "Uploading…" : "Submit document"}
        </button>
        {uploadMessage && (
          <p
            className="jwso-alert"
            data-tone={uploadDocMutation.isError ? "error" : "success"}
            role="status"
          >
            {uploadMessage}
          </p>
        )}
      </div>
    </section>
  );
}
