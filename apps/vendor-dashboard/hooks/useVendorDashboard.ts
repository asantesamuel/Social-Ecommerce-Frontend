"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import {
  authApi,
  buildLocalizedAppUrl,
  catalogApi,
  getApiErrorMessage,
  uploadsApi,
  vendorApi,
  type CreateProductPayload,
  type VendorDocumentType,
} from "@repo/api";

export type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
};

const emptyProductForm: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stockQuantity: "",
  categoryId: "",
};

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const useVendorDashboard = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currency, setCurrency] = useState("GHS");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<VendorDocumentType>(
    "business_registration",
  );
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [reapplyMessage, setReapplyMessage] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);

  const paymentReference =
    searchParams.get("reference") || searchParams.get("trxref");
  const paystackReturnDetected = Boolean(paymentReference);

  const vendorQuery = useQuery({
    queryKey: ["vendorProfile"],
    queryFn: vendorApi.getMyProfile,
    retry: false,
  });
  const { refetch: refetchVendorProfile } = vendorQuery;

  const dashboardCallbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  useEffect(() => {
    if (!paystackReturnDetected) {
      return;
    }

    setPaymentMessage("Payment received. Syncing your vendor status...");
    setIsSyncingPayment(true);

    const interval = window.setInterval(async () => {
      const result = await refetchVendorProfile();
      const nextStatus = result.data?.status;

      if (nextStatus && nextStatus !== "pending_payment") {
        setPaymentMessage(
          nextStatus === "pending_review"
            ? "Payment confirmed. You can now upload your verification documents."
            : "Payment confirmed and dashboard refreshed.",
        );
        setIsSyncingPayment(false);
        window.clearInterval(interval);
      }
    }, 2500);

    return () => {
      setIsSyncingPayment(false);
      window.clearInterval(interval);
    };
  }, [paystackReturnDetected, refetchVendorProfile]);

  const categoriesQuery = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: catalogApi.listCategories,
    enabled: vendorQuery.data?.status === "approved",
  });

  const vendorProductsQuery = useQuery({
    queryKey: ["vendor-products"],
    queryFn: () => catalogApi.listVendorProducts({ limit: 20 }),
    enabled: vendorQuery.data?.status === "approved",
  });

  const payFeeMutation = useMutation({
    mutationFn: () =>
      vendorApi.payOnboardingFee({
        currency,
        callbackUrl: dashboardCallbackUrl,
      }),
    onSuccess: (data) => {
      if (data.fee?.paymentUrl) {
        window.location.href = data.fee.paymentUrl;
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      const currentLocale = pathname.match(/^\/(en|es|fr)(\/|$)/)?.[1] ?? "en";
      window.location.href = buildLocalizedAppUrl(
        "storefront",
        "/login",
        currentLocale,
      );
    },
  });

  const reapplyMutation = useMutation({
    mutationFn: vendorApi.reapply,
    onSuccess: (data) => {
      setReapplyMessage(data.message || "Vendor application updated.");
      queryClient.invalidateQueries({ queryKey: ["vendorProfile"] });
    },
    onError: (error: unknown) => {
      setReapplyMessage(
        getApiErrorMessage(error, "Unable to update vendor application."),
      );
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Please select a document to upload.");
      }

      const { fileKey } = await uploadsApi.uploadFile(
        selectedFile,
        "documents",
      );
      return vendorApi.submitDocument({ fileKey, documentType });
    },
    onSuccess: () => {
      setUploadMessage(
        "Document uploaded successfully and submitted for review.",
      );
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["vendorProfile"] });
    },
    onError: (error: unknown) => {
      setUploadMessage(getApiErrorMessage(error, "Document upload failed."));
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      const imageUrls: string[] = [];

      if (productImage) {
        const uploadedImage = await uploadsApi.uploadFile(
          productImage,
          "products",
        );
        if (uploadedImage.url) {
          imageUrls.push(uploadedImage.url);
        }
      }

      const payload: CreateProductPayload = {
        name: productForm.name.trim(),
        slug: productForm.slug.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        categoryId: productForm.categoryId || undefined,
        imageUrls,
      };

      return catalogApi.createProduct(payload);
    },
    onSuccess: () => {
      setProductMessage("Product created and sent for review.");
      setProductImage(null);
      setProductForm(emptyProductForm);
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
    },
    onError: (error: unknown) => {
      setProductMessage(getApiErrorMessage(error, "Product creation failed."));
    },
  });

  const handleProductFieldChange = (
    field: keyof ProductFormState,
    value: string,
  ) => {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNameChange = (value: string) => {
    setProductForm((current) => {
      const currentGeneratedSlug = createSlug(current.name);
      const shouldRegenerateSlug =
        current.slug === "" || current.slug === currentGeneratedSlug;

      return {
        ...current,
        name: value,
        slug: shouldRegenerateSlug ? createSlug(value) : current.slug,
      };
    });
  };

  return {
    categories: categoriesQuery.data ?? [],
    createProductMutation,
    currency,
    documentType,
    handleNameChange,
    handleProductFieldChange,
    isSyncingPayment,
    logoutMutation,
    paymentMessage,
    paymentReference,
    payFeeMutation,
    paystackReturnDetected,
    productForm,
    productImage,
    productMessage,
    reapplyMessage,
    reapplyMutation,
    selectedFile,
    setCurrency,
    setDocumentType,
    setProductImage,
    setProductMessage,
    setSelectedFile,
    setUploadMessage,
    uploadDocMutation,
    uploadMessage,
    vendorProducts: vendorProductsQuery.data?.data ?? [],
    vendorQuery,
  };
};
