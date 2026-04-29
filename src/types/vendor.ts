export type PortalRole = "Owner" | "Manager" | "Staff";

export interface VendorSession {
  userId: string;
  email: string;
  role: PortalRole;
  vendorOrgId: string;
  storeScope: string[];
  permissions: string[];
  token: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive?: boolean;
  vendorOrgId?: string;
  portalRole?: string;
  permissions?: string[];
  storeScope?: string[];
}

export interface VendorProfile {
  _id?: string;
  userId?: string;
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  logo?: string;
  website?: string;
  legalDocuments?: {
    gstCertificate?: string;
    panCard?: string;
    companyRegistrationCertificate?: string;
  };
  legalVerified?: boolean;
  isApproved?: boolean;
  approvedAt?: string | null;
  isSuspended?: boolean;
  suspendedReason?: string | null;
  priority?: number;
  healthScore?: number;
  agreementStatus?: "pending" | "active" | "expired" | "terminated";
  agreementAcceptedAt?: string | null;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorStore {
  _id: string;
  vendorId: string;
  userId: string;
  name: string;
  internalCode?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  location?: {
    lat?: number;
    lng?: number;
  };
  phone?: string;
  email?: string;
  workingHours?: string;
  operatingHours?: { open?: string; close?: string };
  workingDays?: string[];
  capacity?: {
    maxOrdersPerDay?: number;
    currentLoad?: number;
    dailyLimit?: number;
    maxConcurrentOrders?: number;
  };
  supportedFlows?: string[];
  assignmentZones?: string[];
  isActive: boolean;
  isAvailable: boolean;
  availabilityReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorStaff {
  _id: string;
  vendorId: string;
  storeId?: string;
  assignedStoreIds?: string[];
  authUserId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: "manager" | "operator" | "qc";
  permissions?: string[];
  isFinancialAccessEnabled?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorPerformance {
  totalStores: number;
  activeStores: number;
  totalStaff: number;
  capacitySnapshot?: Array<{
    name: string;
    capacity?: {
      maxOrdersPerDay?: number;
      currentLoad?: number;
      dailyLimit?: number;
      maxConcurrentOrders?: number;
    };
    isAvailable?: boolean;
    availabilityReason?: string;
  }>;
}

export interface VendorOrderItem {
  productId?: string;
  productName?: string;
  flowType?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  printConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VendorOrderTimelineEntry {
  status: string;
  note?: string;
  timestamp?: string;
  _id?: string;
}

export interface VendorOrder {
  _id: string;
  orderNumber?: string;
  userId?: string;
  vendorId?: string;
  storeId?: string | null;
  riderId?: string;
  status: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  customerFacingStatus?: string;
  total?: number;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  items?: VendorOrderItem[];
  notes?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  assignedAt?: string;
  acceptedAt?: string;
  productionStartedAt?: string;
  qcAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  timeline?: VendorOrderTimelineEntry[];
  assignmentHistory?: Array<{
    vendorId?: string;
    storeId?: string | null;
    assignedBy?: string;
    reason?: string;
    assignedAt?: string;
    _id?: string;
  }>;
}

export interface PaginatedVendorOrders {
  orders: VendorOrder[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface VendorPayout {
  _id: string;
  vendorId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency?: string;
  status: "pending" | "processing" | "paid" | "failed";
  orderIds?: string[];
  transferId?: string;
  transactionId?: string;
  bankAccount?: string;
  ordersIncluded?: number;
  transferredAt?: string;
  payoutDate?: string;
  failureReason?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  deductions?: {
    platformFee: number;
    gst: number;
    other: number;
  };
  grossAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorWalletSummary {
  balance: number;
  pendingSettlement: number;
  availableForWithdrawal: number;
  // Enhanced fields
  currentBalance?: number;
  pendingEarnings?: number;
  totalEarningsThisMonth?: number;
  totalEarningsAllTime?: number;
  averageOrderValue?: number;
  topPerformingStore?: {
    storeId: string;
    storeName: string;
    earnings: number;
    orderCount: number;
  };
  recentTransactions?: Array<{
    _id: string;
    type: "credit" | "debit";
    category: "order_payment" | "payout" | "payout_deduction";
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    referenceId: string;
    description: string;
    createdAt: string;
  }>;
}

export interface VendorStoreWiseEarnings {
  _id: string;
  earnings: number;
  orderCount: number;
  // Enhanced fields
  storeId?: string;
  storeName?: string;
  totalEarnings?: number;
  ordersCompleted?: number;
  avgOrderValue?: number;
  thisMonthEarnings?: number;
  lastOrderDate?: string;
  performance?: {
    acceptanceRate: number;
    completionRate: number;
    avgDeliveryTime: number;
  };
}

export interface VendorClosureReport {
  period: "daily" | "weekly" | "monthly";
  earnings: number;
  count: number;
  // Enhanced fields
  date?: string;
  weekStart?: string;
  weekEnd?: string;
  month?: string;
  orderCount?: number;
  breakdown?: {
    grossEarnings: number;
    platformFee: number;
    gst: number;
    netEarnings: number;
  };
  ordersByStatus?: {
    completed: number;
    cancelled: number;
    refunded: number;
  };
  storeWise?: Array<{
    storeId: string;
    storeName: string;
    earnings: number;
    orderCount: number;
  }>;
  dailyBreakdown?: Array<{
    date: string;
    earnings: number;
    orders: number;
  }>;
  weeklyBreakdown?: Array<{
    week: string;
    earnings: number;
    orders: number;
  }>;
  categoryWise?: {
    printing: { earnings: number; orders: number };
    gifting: { earnings: number; orders: number };
    shopping: { earnings: number; orders: number };
  };
  topPerformingDay?: {
    date: string;
    earnings: number;
    orders: number;
  };
  topPerformingWeek?: {
    week: string;
    earnings: number;
    orders: number;
  };
}

export interface VendorPayoutSchedule {
  nextPayoutDate: Date | string;
  estimatedAmount: number;
}

export interface VendorFinanceSummary {
  pendingPayout: number;
  totalPaid: number;
  currentMonthEarnings: number;
  lastPayoutDate: string;
  lastPayoutAmount: number;
  totalOrders: number;
  completedOrders: number;
  avgOrderValue: number;
}

export interface SupportReply {
  _id?: string;
  authorId: string;
  authorRole: "vendor" | "admin" | "staff" | "user";
  message: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportTicket {
  _id: string;
  userId: string;
  orderId?: string;
  subject: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdForRole?: string;
  visibilityScope?: string;
  replies: SupportReply[];
  attachments?: string[];
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Support list returns array directly, not wrapped object
export type SupportTicketListResponse = SupportTicket[];

export interface SupportSummaryResponse {
  status_counts: Record<string, number>;
  total?: number;
  recent_tickets?: SupportTicket[];
}
