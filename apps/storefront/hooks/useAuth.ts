import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  getLocaleFromPath,
  getRoleLandingUrl,
  persistAuthSession,
  setApiAuthorizationHeader,
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
    mutationFn: authApi.login,
    onSuccess: (data) => {
      persistAuthSession(data);
      queryClient.invalidateQueries();

      const role = data.user?.role;
      if (role === "admin") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else if (role === "vendor") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else {
        router.push("/");
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterPayload) => authApi.register(credentials),
    onSuccess: (data) => {
      persistAuthSession(data);
      queryClient.invalidateQueries();

      const role = data.user?.role;
      if (role === "admin") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else if (role === "vendor") {
        window.location.href = getRoleLandingUrl(
          role,
          getLocaleFromPath(window.location.pathname),
        );
      } else {
        router.push("/");
      }
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
      const session = await authApi.register({
        firstName,
        lastName,
        email,
        password,
        role: "customer",
      });

      setApiAuthorizationHeader(session.accessToken);

      const vendorProfile = await vendorApi.submitApplication({
        businessName,
        registrationNumber,
        contactEmail,
        country,
        documents: [{ file: document, documentType }],
      });

      return { session, vendorProfile };
    },
    onSuccess: ({ session }) => {
      persistAuthSession(session, "vendor");
      queryClient.invalidateQueries();
      window.location.href = getRoleLandingUrl(
        "vendor",
        getLocaleFromPath(window.location.pathname),
      );
    },
    onError: () => {
      setApiAuthorizationHeader();
    },
  });

  return {
    login: loginMutation,
    register: registerMutation,
    vendorApplication: vendorApplicationMutation,
  };
};
