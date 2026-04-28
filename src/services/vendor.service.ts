import { API_ENDPOINTS } from "../config/api";
import { apiRequest } from "./api";
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

export async function updateVendorStoreAvailability(id: string, isAvailable: boolean) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeAvailability(id), {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });
}

export async function updateVendorStoreCapacity(
  id: string,
  capacity: { maxOrdersPerDay: number; currentLoad?: number }
) {
  return apiRequest<ApiEnvelope<VendorStore>>(API_ENDPOINTS.vendor.storeCapacity(id), {
    method: "PUT",
    body: JSON.stringify(capacity),
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

export async function createVendorStaff(payload: Partial<VendorStaff>) {
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
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<ApiEnvelope<PaginatedVendorOrders>>(
    `${API_ENDPOINTS.vendor.ordersAssigned}${query}`
  );
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
    balance: number;
    pendingSettlement: number;
    availableForWithdrawal: number;
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
  return apiRequest<ApiEnvelope<{ period: string; earnings: number; count: number }>>(
    `${API_ENDPOINTS.vendor.closureDaily}${query}`
  );
}

export async function getVendorClosureWeekly(date?: string) {
  const query = date ? `?date=${date}` : "";
  return apiRequest<ApiEnvelope<{ period: string; earnings: number; count: number }>>(
    `${API_ENDPOINTS.vendor.closureWeekly}${query}`
  );
}

export async function getVendorClosureMonthly(date?: string) {
  const query = date ? `?date=${date}` : "";
  return apiRequest<ApiEnvelope<{ period: string; earnings: number; count: number }>>(
    `${API_ENDPOINTS.vendor.closureMonthly}${query}`
  );
}

// ============================================
// FINANCE APIs - Payouts
// ============================================

export async function getVendorPayoutsSchedule() {
  return apiRequest<ApiEnvelope<{ nextPayoutDate: Date; estimatedAmount: number }>>(
    API_ENDPOINTS.vendor.payoutsSchedule
  );
}

export async function getVendorPayoutHistory() {
  return apiRequest<ApiEnvelope<{ payouts: any[] }>>(
    API_ENDPOINTS.vendor.payoutsHistory
  );
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
// SUPPORT TICKETS APIs
// ============================================

export async function getSupportTickets(status?: string) {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<ApiEnvelope<SupportTicketListResponse>>(`${API_ENDPOINTS.tickets.list}${query}`);
}

export async function getSupportSummary() {
  return apiRequest<ApiEnvelope<SupportSummaryResponse>>(API_ENDPOINTS.tickets.summary);
}

export async function getHelpCenter() {
  return apiRequest<ApiEnvelope<any>>(API_ENDPOINTS.tickets.helpCenter);
}

export async function getSupportTicket(id: string) {
  return apiRequest<ApiEnvelope<SupportTicket>>(API_ENDPOINTS.tickets.detail(id));
}

export async function createSupportTicket(payload: {
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  orderId?: string;
}) {
  return apiRequest<ApiEnvelope<SupportTicket>>(API_ENDPOINTS.tickets.list, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function replySupportTicket(id: string, message: string, attachments?: string[]) {
  return apiRequest<ApiEnvelope<SupportTicket>>(API_ENDPOINTS.tickets.reply(id), {
    method: "POST",
    body: JSON.stringify({ message, attachments: attachments || [] }),
  });
}

// Legacy compatibility - keeping old function names
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

// Deprecated - use updateOrderStatus instead
export async function startVendorProduction(id: string) {
  return updateOrderStatus(id, "in_production", "Production started");
}

export async function markVendorQcPending(id: string) {
  return updateOrderStatus(id, "qc_pending", "QC review pending");
}

export async function markVendorReadyForPickup(id: string) {
  return markOrderReady(id);
}
