export type UserRole = "customer" | "vendor" | "admin";

export type VendorStatus =
  | "pending_payment"
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended";

export type ProductApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "flagged";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "refunded"
  | "cancelled";

export type VendorDocumentType =
  | "business_registration"
  | "tax_certificate"
  | "id_proof"
  | "other";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type MoneyValue = number | string;

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  totalPages: number;
  total?: number;
};

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive?: boolean;
};

export type AuthenticatedUser = User;

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user?: AuthenticatedUser;
};

export type BrowserAuthResponse = {
  user: AuthenticatedUser;
  redirectTo?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  firstName?: string;
  lastName?: string;
  role?: "customer";
};

export type Category = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
};

export type VendorSummary = {
  id?: string;
  businessName?: string;
  companyName?: string;
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: MoneyValue;
  stockQuantity?: number;
  imageUrls?: string[];
  approvalStatus?: ProductApprovalStatus;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  vendor?: VendorSummary | null;
};

export type ProductQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

export type CreateProductPayload = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId?: string;
  imageUrls: string[];
};

export type CartItem = {
  id: string;
  quantity: number;
  unitPrice: MoneyValue;
  productName?: string;
  product?: Pick<Product, "id" | "name" | "imageUrls">;
};

export type Cart = {
  id?: string;
  items?: CartItem[];
  subtotal?: MoneyValue;
};

export type Order = {
  id: string;
  customer?: string;
  placedAt: string;
  itemCount?: number;
  total: MoneyValue;
  status: OrderStatus | string;
};

export type AdminAnalytics = {
  overview: {
    totalRevenue: MoneyValue;
    totalOrders: number;
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
  };
  orders: Record<string, number>;
  recentOrders: Array<{
    id: string;
    customer: string;
    placedAt: string;
    total: MoneyValue;
    status: OrderStatus | string;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: MoneyValue;
    totalSold: number;
  }>;
};

export type InventoryAlert = {
  productId: string;
  stockQuantity: number;
  productName: string;
  vendorName: string;
};

export type InventoryAlertsResponse = {
  alerts: InventoryAlert[];
};

export type VendorProfile = {
  id: string;
  businessName?: string;
  companyName?: string;
  companyEstablishedDate?: string | null;
  registrationNumber?: string;
  contactEmail?: string;
  country?: string;
  status: VendorStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  canReapplyWithoutFee?: boolean;
  requiresNewFee?: boolean;
  reapplyDeadline?: string | null;
};

export type VendorDocument = {
  id: string;
  documentType: VendorDocumentType | string;
  fileUrl: string;
  verificationStatus: VerificationStatus | string;
  uploadedAt: string;
};

export type VendorApplicationDocumentPayload = {
  fileKey: string;
  documentType: VendorDocumentType;
  filename?: string;
  contentType?: string;
  fileSize?: number;
};

export type VendorApplicationPayload = {
  businessName: string;
  registrationNumber: string;
  contactEmail: string;
  country: string;
  documents: VendorApplicationDocumentPayload[];
};

export type VendorApplicationDocumentInput = {
  file: File;
  documentType: VendorDocumentType;
};

export type VendorApplicationSubmissionPayload = Omit<
  VendorApplicationPayload,
  "documents"
> & {
  documents: VendorApplicationDocumentInput[];
};

export type PresignUploadPayload = {
  filename: string;
  contentType: string;
  fileSize?: number;
  folder: "products" | "documents";
};

export type PresignUploadResponse = {
  uploadUrl: string;
  fileKey: string;
};

export type ConfirmUploadPayload = {
  fileKey: string;
  folder: "products" | "documents";
};

export type ConfirmUploadResponse = {
  url?: string;
  fileKey?: string;
};
