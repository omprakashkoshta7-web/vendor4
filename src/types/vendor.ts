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
  website?: string;
  isApproved?: boolean;
  isSuspended?: boolean;
  priority?: number;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
}

export interface VendorStore {
  _id: string;
  vendorId: string;
  userId: string;
  name: string;
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
  workingDays?: string[];
  capacity?: {
    maxOrdersPerDay?: number;
    currentLoad?: number;
  };
  supportedFlows?: string[];
  isActive: boolean;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorStaff {
  _id: string;
  vendorId: string;
  storeId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: "manager" | "operator" | "qc";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorPerformance {
  totalStores: number;
  activeStores: number;
  totalStaff: number;
}

export interface VendorOrderItem {
  productName?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface VendorOrderTimelineEntry {
  status: string;
  note?: string;
  timestamp?: string;
}

export interface VendorOrder {
  _id: string;
  orderNumber?: string;
  vendorId?: string;
  storeId?: string;
  status: string;
  total?: number;
  subtotal?: number;
  items?: VendorOrderItem[];
  notes?: string;
  assignedAt?: string;
  acceptedAt?: string;
  productionStartedAt?: string;
  qcAt?: string;
  readyAt?: string;
  createdAt?: string;
  updatedAt?: string;
  timeline?: VendorOrderTimelineEntry[];
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

export interface VendorFinanceSummary {
  pendingPayout: number;
  totalPaid: number;
  totalPayouts: number;
  platformFeePercent: number;
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
  transferredAt?: string;
  failureReason?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedVendorPayouts {
  payouts: VendorPayout[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface VendorClosureJob {
  id: string;
  type: string;
  storeId: string;
  completedAt: string;
  amount: number;
  customer: string;
  status: "completed" | "delivered";
}

export interface VendorClosureBucket {
  period: string;
  earnings: number;
  jobs: number;
  avgOrderValue: number;
}

export interface VendorClosureBreakdown {
  storeId: string;
  jobs: number;
  earnings: number;
  percentage: number;
}

export interface VendorClosureResponse {
  period: string;
  date: string;
  summary: {
    totalEarnings: number;
    totalJobs: number;
    avgOrderValue: number;
    completedJobs: number;
    deliveredJobs: number;
  };
  chartData: VendorClosureBucket[];
  storeBreakdown: VendorClosureBreakdown[];
  jobs: VendorClosureJob[];
}

export interface VendorScoreMetric {
  label: string;
  value: string;
  target: string;
  status: "good" | "warning";
  desc: string;
  num: number;
}

export interface VendorScoreResponse {
  overallScore: number;
  routingPriority: string;
  acceptanceRate: number;
  slaCompliance: number;
  metrics: VendorScoreMetric[];
  radarData: Array<{ metric: string; score: number; target: number }>;
  scoreTrend: Array<{ week: string; score: number }>;
  rejectionHistory: Array<{ id: string; reason: string; date: string; counted: boolean }>;
  totals: {
    assignedCount: number;
    acceptedCount: number;
    completedCount: number;
    cancelledCount: number;
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
  replies: SupportReply[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface SupportSummaryResponse {
  status_counts: Record<string, number>;
  recent_tickets: SupportTicket[];
}
