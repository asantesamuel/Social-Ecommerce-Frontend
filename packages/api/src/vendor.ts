import { apiClient } from "./client";
import {
  createMockVendorApplicationDocument,
  createMockVendorProfile,
  getMockVendorProfile,
  submitMockVendorApplication,
} from "./mocks/vendor";
import type {
  PaginatedResponse,
  VendorApplicationDocumentInput,
  VendorApplicationDocumentPayload,
  VendorApplicationPayload,
  VendorApplicationSubmissionPayload,
  VendorDocument,
  VendorDocumentType,
  VendorProfile,
} from "./types";
import { uploadsApi } from "./uploads";

const useMockVendorApplications = () =>
  process.env.NEXT_PUBLIC_VENDOR_APPLICATIONS_SOURCE !== "api";

const uploadApplicationDocument = async ({
  documentType,
  file,
}: VendorApplicationDocumentInput): Promise<VendorApplicationDocumentPayload> => {
  const { fileKey } = await uploadsApi.uploadFile(file, "documents");
  return {
    fileKey,
    documentType,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
};

export const vendorApi = {
  async getMyProfile(): Promise<VendorProfile> {
    if (useMockVendorApplications()) {
      return (
        getMockVendorProfile() ??
        createMockVendorProfile({
          businessName: "Demo Vendor",
          registrationNumber: "MOCK-REG-001",
          contactEmail: "vendor@example.com",
          country: "Ghana",
          documents: [],
        })
      );
    }

    const { data } = await apiClient.get<VendorProfile>("/vendors/me");
    return data;
  },

  async apply(payload: VendorApplicationPayload): Promise<VendorProfile> {
    if (useMockVendorApplications()) {
      return submitMockVendorApplication(payload);
    }

    const { data } = await apiClient.post<VendorProfile>(
      "/vendors/apply",
      payload,
    );
    return data;
  },

  async submitApplication(
    payload: VendorApplicationSubmissionPayload,
  ): Promise<VendorProfile> {
    const documents = useMockVendorApplications()
      ? payload.documents.map(createMockVendorApplicationDocument)
      : await Promise.all(payload.documents.map(uploadApplicationDocument));

    return vendorApi.apply({
      businessName: payload.businessName,
      registrationNumber: payload.registrationNumber,
      contactEmail: payload.contactEmail,
      country: payload.country,
      documents,
    });
  },

  async payOnboardingFee(payload: {
    currency: string;
    callbackUrl: string;
  }): Promise<{ fee?: { paymentUrl?: string } }> {
    const { data } = await apiClient.post<{ fee?: { paymentUrl?: string } }>(
      "/vendors/pay-fee",
      payload,
    );
    return data;
  },

  async reapply(): Promise<{ message?: string }> {
    const { data } = await apiClient.post<{ message?: string }>(
      "/vendors/reapply",
    );
    return data;
  },

  async submitDocument(payload: {
    fileKey: string;
    documentType: VendorDocumentType;
  }): Promise<VendorDocument> {
    const { data } = await apiClient.post<VendorDocument>(
      "/vendors/documents",
      payload,
    );
    return data;
  },

  async listPendingApplications(params: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<VendorProfile>> {
    const { data } = await apiClient.get<PaginatedResponse<VendorProfile>>(
      "/vendors/admin/pending",
      { params },
    );
    return data;
  },

  async listDocuments(vendorId: string): Promise<VendorDocument[]> {
    const { data } = await apiClient.get<VendorDocument[]>(
      `/vendors/${vendorId}/documents`,
    );
    return data;
  },

  async reviewApplication(payload: {
    vendorId: string;
    action: "approve" | "reject";
    reason?: string;
  }): Promise<VendorProfile> {
    if (payload.action === "approve") {
      const { data } = await apiClient.post<VendorProfile>(
        `/vendors/${payload.vendorId}/approve`,
      );
      return data;
    }

    const { data } = await apiClient.post<VendorProfile>(
      `/vendors/${payload.vendorId}/reject`,
      { reason: payload.reason },
    );
    return data;
  },
};
