import { apiClient } from "./client";
import type {
  ConfirmUploadPayload,
  ConfirmUploadResponse,
  PresignUploadPayload,
  PresignUploadResponse,
} from "./types";

export const uploadsApi = {
  async presign(payload: PresignUploadPayload): Promise<PresignUploadResponse> {
    const { data } = await apiClient.post<PresignUploadResponse>(
      "/uploads/presign",
      payload,
    );
    return data;
  },

  async confirm(payload: ConfirmUploadPayload): Promise<ConfirmUploadResponse> {
    const { data } = await apiClient.post<ConfirmUploadResponse>(
      "/uploads/confirm",
      payload,
    );
    return data;
  },

  async uploadDirect(uploadUrl: string, file: File, contentType: string) {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Upload to storage failed. Please try again.");
    }
  },

  async uploadFile(file: File, folder: "products" | "documents") {
    const contentType = file.type || "application/octet-stream";
    const { uploadUrl, fileKey } = await uploadsApi.presign({
      filename: file.name,
      contentType,
      fileSize: file.size,
      folder,
    });

    // The API only brokers a short-lived URL; bytes go directly from the browser to S3.
    await uploadsApi.uploadDirect(uploadUrl, file, contentType);

    const confirmation = await uploadsApi.confirm({ fileKey, folder });
    return {
      fileKey,
      url: confirmation.url,
    };
  },
};
