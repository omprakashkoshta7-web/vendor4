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
  platformFee?: number;
  netAmount?: number;
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
  breakdown?: {
    platformFee: number;
    gst: number;
    other?: number;
    grossAmount?: number;
    netAmount?: number;
  };
  grossAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
}

export interface VendorWalletSummary {
  _id: string;
  userId: string;
  userType: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  pendingSettlement?: number;
  availableForWithdrawal?: number;
}

export interface VendorStoreWiseEarnings {
  _id: string;
  earnings: number;
  orderCount: number;
}

export interface VendorDeduction {
  _id: string;
  walletId: string;
  userId: string;
  type: "debit" | "credit";
  category: "payout_deduction" | "refund" | "platform_fee" | "gst" | "other";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  referenceType: "payout" | "order" | "other";
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface VendorClosureDaily {
  period: "daily";
  date: string;
  earnings: number;
  count: number;
  breakdown: {
    orders: Array<{
      orderId: string;
      orderNumber: string;
      amount: number;
      status: string;
      completedAt: string;
    }>;
  };
}

export interface VendorClosureWeekly {
  period: "weekly";
  weekStart: string;
  weekEnd: string;
  totalEarnings: number;
  totalOrders: number;
  dailyBreakdown: Array<{
    date: string;
    earnings: number;
    orders: number;
    avgOrderValue: number;
  }>;
  stats: {
    avgDailyEarnings: number;
    maxDailyEarnings: number;
    minDailyEarnings: number;
    bestDay: string;
    worstDay: string;
  };
}

export interface VendorClosureMonthly {
  period: "monthly";
  month: string;
  totalEarnings: number;
  totalOrders: number;
  weeklyBreakdown: Array<{
    week: string;
    earnings: number;
    orders: number;
    avgOrderValue: number;
  }>;
  categoryWise: {
    printing: { earnings: number; orders: number; percentage: number; avgOrderValue: number };
    gifting: { earnings: number; orders: number; percentage: number; avgOrderValue: number };
    shopping: { earnings: number; orders: number; percentage: number; avgOrderValue: number };
  };
  stats: {
    avgDailyEarnings: number;
    maxDailyEarnings: number;
    minDailyEarnings: number;
    bestWeek: string;
    bestDay: string;
    totalDaysActive: number;
  };
}

export interface VendorPayoutSchedule {
  nextPayoutDate: string;
  estimatedAmount: number;
  lastPayoutDate: string;
  lastPayoutAmount: number;
  payoutFrequency: string;
  payoutMethod: string;
  bankAccount: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  estimatedDeductions: {
    platformFee: number;
    gst: number;
    other: number;
  };
  estimatedNetAmount: number;
}

export interface VendorPayoutRecord {
  _id: string;
  vendorId: string;
  payoutDate: string;
  amount: number;
  status: "paid" | "pending" | "processing" | "failed";
  transactionId: string;
  bankAccount: string;
  ordersIncluded: number;
  periodStart: string;
  periodEnd: string;
  breakdown: {
    grossAmount: number;
    platformFee: number;
    gst: number;
    netAmount: number;
  };
  paidAt: string;
}

export interface VendorPayoutHistory {
  payouts: VendorPayoutRecord[];
  summary: {
    totalPayouts: number;
    totalAmount: number;
    avgPayoutAmount: number;
    lastPayoutDate: string;
  };
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
