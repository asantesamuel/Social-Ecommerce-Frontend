import type {
  VendorApplicationDocumentInput,
  VendorApplicationDocumentPayload,
  VendorApplicationPayload,
  VendorDocument,
  VendorProfile,
} from "../types";

const MOCK_VENDOR_APPLICATION_DELAY_MS = 350;
const MOCK_VENDOR_PROFILE_STORAGE_KEY = "ecom.mock.vendorProfile";

const delay = (duration: number) =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, duration);
  });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createMockId = (prefix: string, seed: string) =>
  `${prefix}_${slugify(seed) || "draft"}_${Date.now().toString(36)}`;

export const createMockVendorApplicationDocument = ({
  documentType,
  file,
}: VendorApplicationDocumentInput): VendorApplicationDocumentPayload => ({
  fileKey: `mock/vendor-applications/${Date.now().toString(36)}-${slugify(file.name) || "document"}`,
  documentType,
  filename: file.name,
  contentType: file.type || "application/octet-stream",
  fileSize: file.size,
});

export const createMockVendorProfile = (
  payload: VendorApplicationPayload,
): VendorProfile => ({
  id: createMockId("vendor", payload.businessName),
  businessName: payload.businessName,
  companyName: payload.businessName,
  registrationNumber: payload.registrationNumber,
  contactEmail: payload.contactEmail,
  country: payload.country,
  status: "pending_payment",
  createdAt: new Date().toISOString(),
  approvedAt: null,
  rejectionReason: null,
  canReapplyWithoutFee: false,
  requiresNewFee: true,
  reapplyDeadline: null,
});

const getStorage = () =>
  typeof window === "undefined" ? undefined : window.localStorage;

export const saveMockVendorProfile = (profile: VendorProfile) => {
  getStorage()?.setItem(
    MOCK_VENDOR_PROFILE_STORAGE_KEY,
    JSON.stringify(profile),
  );
};

export const getMockVendorProfile = (): VendorProfile | undefined => {
  const storedProfile = getStorage()?.getItem(MOCK_VENDOR_PROFILE_STORAGE_KEY);
  if (!storedProfile) {
    return undefined;
  }

  try {
    return JSON.parse(storedProfile) as VendorProfile;
  } catch {
    return undefined;
  }
};

export const createMockVendorDocuments = (
  payload: VendorApplicationPayload,
  vendorId: string,
): VendorDocument[] =>
  payload.documents.map((document, index) => ({
    id: createMockId("document", `${vendorId}-${document.fileKey}-${index}`),
    documentType: document.documentType,
    fileUrl: `mock://${document.fileKey}`,
    verificationStatus: "pending",
    uploadedAt: new Date().toISOString(),
  }));

export const submitMockVendorApplication = async (
  payload: VendorApplicationPayload,
): Promise<VendorProfile> => {
  await delay(MOCK_VENDOR_APPLICATION_DELAY_MS);
  const profile = createMockVendorProfile(payload);
  saveMockVendorProfile(profile);
  return profile;
};
