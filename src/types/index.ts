export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = "cash_on_delivery",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum NotificationType {
  NEW_ORDER = "new_order",
  ORDER_CANCELLED = "order_cancelled",
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
  SYSTEM_ERROR = "system_error",
}

export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
}

export interface IProductImage {
  url: string;
  alt?: string;
}

export interface IProductVariant {
  name: string;
  value: string;
  stock: number;
  priceModifier?: number;
}

export interface IProductSpec {
  key: string;
  value: string;
}

export interface ICategory {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    alt?: string;
  };
  displayOrder: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IProduct {
  _id?: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category?: string | ICategory | null;
  images: IProductImage[];
  primaryImageIndex?: number;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock: number;
  variants: IProductVariant[];
  specifications: IProductSpec[];
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IOrderCustomer {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
}

export interface IOrderItem {
  productId: string;
  productName: string;
  sku: string;
  variant?: string;
  image?: string;
  unitPrice: number;
  unitCost?: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface IOrderRevision {
  at: Date;
  note?: string;
  snapshot: any;
}

export interface IOrder {
  _id?: string;
  orderNumber: string;
  customer: IOrderCustomer;
  items: IOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  cancellationReason?: string;
  adminNotes?: string;
  courier?: string;
  trackingNumber?: string;
  source: "website" | "manual";
  accessToken?: string;
  /** Temporary "REQ-" reference for website orders awaiting admin approval. */
  requestRef?: string;
  approvedAt?: string | Date;
  alertAcknowledged: boolean;
  revisions?: IOrderRevision[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ICustomer {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface INotification {
  _id?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  link?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IStoreSettings {
  _id?: string;
  storeName: string;
  logoUrl?: string;
  tagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  deliveryCharge: number;
  freeDeliveryThreshold?: number;
  currency: string;
  paymentMethods: PaymentMethod[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
  policies: {
    returns?: string;
    privacy?: string;
    shipping?: string;
  };
  lowStockThreshold: number;
  isMaintenanceMode: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IAdminUser {
  _id?: string;
  /** Login name (e.g. "admin"). Email login is still accepted. */
  username?: string;
  email: string;
  password?: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
