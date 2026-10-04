import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  getLocaleFromPath,
  vendorApi,
  type RegisterPayload,
  type VendorDocumentType,
} from "@repo/api";
import { useRouter } from "../i18n/routing";

export type VendorApplicationSignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessName: string;
  registrationNumber: string;
  contactEmail: string;
  country: string;
  document: File;
  documentType: VendorDocumentType;
};

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authApi.login({
        ...credentials,
        locale: getLocaleFromPath(window.location.pathname),
        returnTo: new URLSearchParams(window.location.search).get("returnTo") ?? undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      window.location.assign(data.redirectTo ?? `/${getLocaleFromPath(window.location.pathname)}`);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterPayload) => authApi.register(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.push("/");
    },
  });

  const vendorApplicationMutation = useMutation({
    mutationFn: async ({
      businessName,
      contactEmail,
      country,
      document,
      documentType,
      email,
      firstName,
      lastName,
      password,
      registrationNumber,
    }: VendorApplicationSignupPayload) => {
      await authApi.register({
        firstName,
        lastName,
        email,
        password,
        role: "customer",
      });

      const vendorProfile = await vendorApi.submitApplication({
        businessName,
        registrationNumber,
        contactEmail,
        country,
        documents: [{ file: document, documentType }],
      });

      return vendorProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    login: loginMutation,
    register: registerMutation,
    vendorApplication: vendorApplicationMutation,
  };
};
