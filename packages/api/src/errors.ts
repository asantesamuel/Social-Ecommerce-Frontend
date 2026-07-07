import axios from "axios";

type ApiErrorBody = {
  message?: string;
  error?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return (
      error.response?.data?.message ?? error.response?.data?.error ?? fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
