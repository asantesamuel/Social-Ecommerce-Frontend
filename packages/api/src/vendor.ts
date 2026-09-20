import { apiClient } from "./client";
import type {
  PaginatedResponse,
  VendorDocument,
  VendorDocumentType,
  VendorProfile,
} from "./types";

export const vendorApi = {
  async getMyProfile(): Promise<VendorProfile> {
    const { data } = await apiClient.get<VendorProfile>("/vendors/me");
    return data;
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
