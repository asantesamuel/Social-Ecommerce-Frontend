import type { UseMutationResult } from "@tanstack/react-query";
import type { VendorDocument, VendorDocumentType } from "@repo/api";

type DocumentUploadPanelProps = {
  documentType: VendorDocumentType;
  selectedFile: File | null;
  setDocumentType: (documentType: VendorDocumentType) => void;
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
}: DocumentUploadPanelProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="glass-card flex h-full min-h-[300px] flex-col items-center justify-center p-8 shadow-sm">
        <h2 className="text-center text-3xl font-black uppercase tracking-tighter">
          Awaiting Validation
        </h2>
        <p className="mt-4 text-center text-lg font-medium text-minimal-gray">
          Our team is reviewing your profile. In the meantime, upload your
          business documents.
        </p>
      </div>

      <div className="glass-card border border-[#eaeaea] bg-white p-8">
        <h3 className="mb-6 text-xl font-bold uppercase tracking-tight">
          Upload Verification Doc
        </h3>
        <p className="mb-6 text-sm font-medium text-minimal-gray">
          Must be a business registration, tax certificate, ID proof, or
          supporting document.
        </p>

        <select
          value={documentType}
          onChange={(event) =>
            setDocumentType(event.target.value as VendorDocumentType)
          }
          className="mb-4 w-full rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] px-4 py-4 font-medium outline-none"
        >
          <option value="business_registration">Business Registration</option>
          <option value="tax_certificate">Tax Certificate</option>
          <option value="id_proof">ID Proof</option>
          <option value="other">Other</option>
        </select>

        <input
          type="file"
          accept=".pdf,.doc,.docx,image/jpeg,image/png"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
            setUploadMessage(null);
          }}
          className="mb-6 block w-full rounded-xl border border-[#e4e4e7] bg-gray-50 px-4 py-4 text-sm text-slate-500 transition-all file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-black file:px-6 file:py-3 file:text-sm file:font-semibold file:text-white"
        />

        <button
          onClick={() => uploadDocMutation.mutate()}
          disabled={!selectedFile || uploadDocMutation.isPending}
          className="w-full rounded-xl bg-black py-4 font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        >
          {uploadDocMutation.isPending ? "Uploading..." : "Submit Document"}
        </button>

        {uploadMessage && (
          <p className="mt-4 text-sm font-medium text-minimal-gray">
            {uploadMessage}
          </p>
        )}
      </div>
    </div>
  );
}
