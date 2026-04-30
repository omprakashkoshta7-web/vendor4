import { API_ENDPOINTS } from "../config/api";
import { apiRequest, ApiError, getAuthToken } from "./api";
import { API_BASE_URL } from "../config/api";
import type {
  ApiEnvelope,
  AuthUser,
  PaginatedVendorOrders,
  VendorOrder,
  VendorPerformance,
  VendorProfile,
  VendorStaff,
  VendorStore,
  SupportSummaryResponse,
  SupportTicket,
  SupportTicketListResponse,
} from "../types/vendor";

export const OWNER_PERMISSIONS = [
  "view_all",
  "edit_all",
  "financial_access",
  "user_management",
  "org_settings",
  "store_management",
  "staff_management",
  "edit_operations",
  "edit_production",
  "job_management",
] as const;

// ============================================
// AUTH APIs
// ============================================

export async function loginVendor(email: string, password: string) {
  return apiRequest<ApiEnvelope<{ user: AuthUser; token: string }>>(
    API_ENDPOINTS.auth.login,
    {
      method: "POST",
      body: JSON.stringify({ email, password, role: "vendor" }),
    }
  );
}

export async function verifyMfa(code: string) {
  return apiRequest<ApiEnvelope<{ verified: boolean }>>(
    API_ENDPOINTS.auth.mfaVerify,
    {
      method: "POST",
      body: JSON.stringify({ code }),
    }
  );
}

export async function logoutVendor() {
  return apiRequest<ApiEnvelope<null>>(API_ENDPOINTS.auth.logout, {
    method: "POST",
  });
}

export async function getVendorSession() {
  return apiRequest<ApiEnvelope<{ user: AuthUser }>>(API_ENDPOINTS.auth.session);
}

export async function verifyVendorFirebaseToken(idToken: string) {
  return apiRequest<
    ApiEnvelope<{
      user: AuthUser;
    }>
  >(API_ENDPOINTS.auth.verify, {
    method: "POST",
    body: JSON.stringify({ idToken, role: "vendor" }),
  });
}

export async function getCurrentUser() {
  return apiRequest<ApiEnvelope<{ user: AuthUser }>>(API_ENDPOINTS.auth.me);
}

// ============================================
// ORGANIZATION APIs
// ============================================

export async function getVendorProfile() {
  return apiRequest<ApiEnvelope<VendorProfile>>(API_ENDPOINTS.vendor.profile);
}

export async function updateVendorProfile(payload: Partial<VendorProfile>) {
  return apiRequest<ApiEnvelope<VendorProfile>>(API_ENDPOINTS.vendor.profile, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getLegalDocs() {
  return apiRequest<ApiEnvelope<any>>(API_ENDPOINTS.vendor.legal);
}

export async function uploadLegalDocs(payload: any) {
  return apiRequest<ApiEnvelope<any>>(API_ENDPOINTS.vendor.legal, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAgreement() {
  return apiRequest<ApiEnvelope<any>>(API_ENDPOINTS.vendor.agreement);
}

// ============================================
// STORES APIs
// ============================================

export async function getNearbyStores(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  pincode?: string;
}) {
  const query = new URLSearchParams();
  if (params?.lat) query.set("lat", params.lat.toString());
  if (params?.lng) query.set("lng", params.lng.toString());
  if (params?.radius) query.set("radius", params.radius.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.pincode) query.set("pincode", params.pincode);
  
  return apiRequest<ApiEnvelope<VendorStore[]>>(
    `${API_ENDPOINTS.vendor.storesNearby}?${query.toString()}`
  );
}

export async function getVendorStores() {
  return apiRequest<ApiEnvelope<VendorStore[]>>(API_ENDPOINTS.vendor.stores);
}

export async function getVendorStore(id: string) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeById(id));
}

export async function createVendorStore(payload: Partial<VendorStore>) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.stores, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVendorStore(id: string, payload: Partial<VendorStore>) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeById(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateVendorStoreStatus(id: string, isActive: boolean) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function updateVendorStoreAvailability(id: string, isAvailable: boolean, reason?: string) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeAvailability(id), {
    method: "PATCH",
    body: JSON.stringify({ isAvailable, ...(reason && { availabilityReason: reason }) }),
  });
}

export async function updateVendorStoreCapacity(
  id: string,
  capacity: {
    maxOrdersPerDay?: number;
    currentLoad?: number;
    dailyLimit?: number;
    maxConcurrentOrders?: number;
  }
) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeCapacity(id), {
    method: "PUT",
    body: JSON.stringify({ capacity }),
  });
}

export async function getStoreCapabilities(id: string) {
  return apiRequest<ApiEnvelope<{
    supportedFlows: string[];
    maxOrdersPerDay: number;
    currentLoad: number;
  }>>(API_ENDPOINTS.vendor.storeCapabilities(id));
}

// ============================================
// STAFF APIs
// ============================================

export async function getVendorStaff() {
  return apiRequest<ApiEnvelope<VendorStaff[]>>(API_ENDPOINTS.vendor.staff);
}

export async function createVendorStaff(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "manager" | "operator" | "qc";
  storeId?: string;
  assignedStoreIds?: string[];
}) {
  return apiRequest<ApiEnvelope<VendorStaff>>(API_ENDPOINTS.vendor.staff, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVendorStaff(id: string, payload: Partial<VendorStaff>) {
  return apiRequest<ApiEnvelope<VendorStaff>>(API_ENDPOINTS.vendor.staffById(id), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateVendorStaffStatus(id: string, isActive: boolean) {
  return apiRequest<ApiEnvelope<VendorStaff>>(API_ENDPOINTS.vendor.staffStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function assignStaffStores(id: string, assignedStoreIds: string[]) {
  return apiRequest<ApiEnvelope<VendorStaff>>(API_ENDPOINTS.vendor.staffAssignStores(id), {
    method: "PATCH",
    body: JSON.stringify({ assignedStoreIds }),
  });
}

// ============================================
// ORDERS APIs
// ============================================

export async function getVendorOrders(status?: string) {
  // If a specific status is requested, fetch only that
  if (status && status !== "all") {
    return apiRequest<ApiEnvelope<PaginatedVendorOrders>>(
      `${API_ENDPOINTS.vendor.ordersAssigned}?status=${encodeURIComponent(status)}`
    );
  }

  // Fetch active + delivered + cancelled in parallel and merge
  const activeStatuses = [
    "assigned_vendor",
    "vendor_accepted",
    "in_production",
    "qc_pending",
    "ready_for_pickup",
    "out_for_delivery",
  ];
  const terminalStatuses = ["delivered", "cancelled"];

  const [activeRes, ...terminalRes] = await Promise.all([
    // Active orders (no filter = all active)
    apiRequest<ApiEnvelope<PaginatedVendorOrders>>(API_ENDPOINTS.vendor.ordersAssigned),
    // Terminal status orders
    ...terminalStatuses.map(s =>
      apiRequest<ApiEnvelope<PaginatedVendorOrders>>(
        `${API_ENDPOINTS.vendor.ordersAssigned}?status=${s}`
      ).catch(() => ({ success: true, message: "", data: { orders: [], meta: {} } } as unknown as ApiEnvelope<PaginatedVendorOrders>))
    ),
  ]);

  // Merge all orders, deduplicate by _id
  const allOrders = [
    ...(activeRes.data.orders || []),
    ...terminalRes.flatMap(r => r.data.orders || []),
  ];
  const seen = new Set<string>();
  const uniqueOrders = allOrders.filter(o => {
    if (seen.has(o._id)) return false;
    seen.add(o._id);
    return true;
  });

  // Sort: active first (by createdAt desc), then terminal
  const activeSet = new Set(activeStatuses);
  uniqueOrders.sort((a, b) => {
    const aActive = activeSet.has(a.status) ? 0 : 1;
    const bActive = activeSet.has(b.status) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return {
    ...activeRes,
    data: {
      ...activeRes.data,
      orders: uniqueOrders,
      meta: { ...activeRes.data.meta, total: uniqueOrders.length },
    },
  };
}

export async function getVendorOrder(id: string) {
  return apiRequest<ApiEnvelope<VendorOrder>>(API_ENDPOINTS.vendor.orderById(id));
}

export async function acceptVendorOrder(id: string) {
  return apiRequest<ApiEnvelope<VendorOrder>>(API_ENDPOINTS.vendor.acceptOrder(id), {
    method: "POST",
  });
}

export async function rejectVendorOrder(id: string, reason: string) {
  return apiRequest<ApiEnvelope<VendorOrder>>(API_ENDPOINTS.vendor.rejectOrder(id), {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function updateOrderStatus(id: string, status: string, note?: string) {
  return apiRequest<ApiEnvelope<VendorOrder>>(API_ENDPOINTS.vendor.updateOrderStatus(id), {
    method: "POST",
    body: JSON.stringify({ status, note }),
  });
}

export async function uploadQcImages(id: string, images: string[], note?: string) {
  return apiRequest<ApiEnvelope<VendorOrder>>(API_ENDPOINTS.vendor.qcUpload(id), {
    method: "POST",
    body: JSON.stringify({ images, note }),
  });
}

export async function uploadQcImagesMultipart(id: string, files: File[], note?: string) {
  const formData = new FormData();
  
  // Add files
  files.forEach((file) => {
    formData.append(`images`, file);
  });
  
  // Add note if provided
  if (note) {
    formData.append("note", note);
  }

  const token = getAuthToken();
  const headers = new Headers();
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.vendor.qcUpload(id)}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(message, response.status);
  }

  if (payload == null) {
    throw new ApiError("Empty or invalid server response", response.status || 500);
  }

  return payload as ApiEnvelope<VendorOrder>;
}

export async function markOrderReady(id: string) {
  return apiRequest<ApiEnvelope<VendorOrder>>(API_ENDPOINTS.vendor.markReady(id), {
    method: "POST",
  });
}

// ============================================
// ANALYTICS APIs
// ============================================

export async function getVendorPerformance() {
  return apiRequest<ApiEnvelope<VendorPerformance>>(API_ENDPOINTS.vendor.performance);
}

// ============================================
// FINANCE APIs - Wallet
// ============================================

export async function getVendorWalletSummary() {
  return apiRequest<ApiEnvelope<{
    _id: string;
    userId: string;
    userType: string;
    balance: number;
    currency: string;
    isActive: boolean;
    pendingSettlement?: number;
    availableForWithdrawal?: number;
    createdAt: string;
    updatedAt: string;
  }>>(API_ENDPOINTS.vendor.walletSummary);
}

export async function getVendorWalletStoreWise() {
  return apiRequest<ApiEnvelope<Array<{
    _id: string;
    earnings: number;
    orderCount: number;
  }>>>(API_ENDPOINTS.vendor.walletStoreWise);
}

export async function getVendorWalletDeductions() {
  return apiRequest<ApiEnvelope<{ deductions: any[] }>>(
    API_ENDPOINTS.vendor.walletDeductions
  );
}

// ============================================
// FINANCE APIs - Closure
// ============================================

export async function getVendorClosureDaily(date?: string) {
  const query = date ? `?date=${date}` : "";
  return apiRequest<ApiEnvelope<{
    period: string;
    date: string;
    earnings: number;
    count: number;
    totalEarnings?: number;
    totalOrders?: number;
    breakdown?: any;
  }>>(`${API_ENDPOINTS.vendor.closureDaily}${query}`);
}

export async function getVendorClosureWeekly(date?: string) {
  const query = date ? `?date=${date}` : "";
  return apiRequest<ApiEnvelope<{
    period: string;
    weekStart: string;
    weekEnd: string;
    earnings?: number;
    count?: number;
    totalEarnings?: number;
    totalOrders?: number;
    dailyBreakdown?: any[];
    stats?: any;
  }>>(`${API_ENDPOINTS.vendor.closureWeekly}${query}`);
}

export async function getVendorClosureMonthly(date?: string) {
  const query = date ? `?date=${date}` : "";
  return apiRequest<ApiEnvelope<{
    period: string;
    month: string;
    earnings?: number;
    count?: number;
    totalEarnings?: number;
    totalOrders?: number;
    weeklyBreakdown?: any[];
    categoryWise?: any;
    stats?: any;
  }>>(`${API_ENDPOINTS.vendor.closureMonthly}${query}`);
}

// ============================================
// FINANCE APIs - Payouts
// ============================================

export async function getVendorPayoutsSchedule() {
  return apiRequest<ApiEnvelope<{
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
  }>>(API_ENDPOINTS.vendor.payoutsSchedule);
}

export async function getVendorPayoutHistory() {
  return apiRequest<ApiEnvelope<{
    payouts: Array<{
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
    }>;
    summary: {
      totalPayouts: number;
      totalAmount: number;
      avgPayoutAmount: number;
      lastPayoutDate: string;
    };
  }>>(API_ENDPOINTS.vendor.payoutsHistory);
}

// ============================================
// SCORING APIs
// ============================================

export async function getVendorRejectionsHistory() {
  return apiRequest<ApiEnvelope<any[]>>(API_ENDPOINTS.vendor.rejectionsHistory);
}

export async function getVendorPerformanceScore() {
  return apiRequest<ApiEnvelope<{
    acceptanceRate: number;
    completionRate: number;
    overallScore: number;
  }>>(API_ENDPOINTS.vendor.performanceScore);
}

// ============================================
// SUPPORT TICKETS APIs — /vendor/support/tickets
// ============================================

export async function getSupportTickets(status?: string) {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<ApiEnvelope<SupportTicketListResponse>>(
    `${API_ENDPOINTS.vendor.supportTickets}${query}`
  );
}

export async function getSupportSummary() {
  return apiRequest<ApiEnvelope<SupportSummaryResponse>>(
    API_ENDPOINTS.vendor.supportTicketSummary
  );
}

export async function getSupportTicket(id: string) {
  return apiRequest<ApiEnvelope<SupportTicket>>(
    API_ENDPOINTS.vendor.supportTicketById(id)
  );
}

export async function createSupportTicket(payload: {
  subject: string;
  description: string;
  category?: string;
  orderId?: string;
}) {
  return apiRequest<ApiEnvelope<SupportTicket>>(API_ENDPOINTS.vendor.supportTickets, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function replySupportTicket(id: string, message: string) {
  return apiRequest<ApiEnvelope<SupportTicket>>(
    API_ENDPOINTS.vendor.supportTicketReply(id),
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );
}

// ============================================
// Legacy compatibility
// ============================================

export async function getVendorFinanceSummary() {
  return getVendorWalletSummary();
}

export async function getVendorScore() {
  return getVendorPerformanceScore();
}

export async function getVendorClosure(period = "daily", date?: string) {
  if (period === "weekly") return getVendorClosureWeekly(date);
  if (period === "monthly") return getVendorClosureMonthly(date);
  return getVendorClosureDaily(date);
}

export async function startVendorProduction(id: string) {
  return updateOrderStatus(id, "in_production", "Production started");
}

export async function markVendorQcPending(id: string) {
  return updateOrderStatus(id, "qc_pending", "QC review pending");
}

export async function markVendorReadyForPickup(id: string) {
  return markOrderReady(id);
}
