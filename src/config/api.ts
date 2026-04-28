export const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api`;

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: "/vendor/auth/login",
    mfaVerify: "/vendor/auth/mfa/verify",
    logout: "/vendor/auth/logout",
    session: "/vendor/auth/session",
    verify: "/auth/verify",
    me: "/auth/me",
  },
  
  // Organization endpoints
  vendor: {
    // Profile
    profile: "/vendor/org/profile",
    legal: "/vendor/org/legal",
    agreement: "/vendor/org/agreement",
    
    // Stores
    storesNearby: "/vendor/stores/nearby",
    stores: "/vendor/stores",
    storeById: (id: string) => `/vendor/stores/${id}`,
    storeStatus: (id: string) => `/vendor/stores/${id}/status`,
    storeAvailability: (id: string) => `/vendor/stores/${id}/availability`,
    storeCapacity: (id: string) => `/vendor/stores/${id}/capacity`,
    storeCapabilities: (id: string) => `/vendor/stores/${id}/capabilities`,
    
    // Staff
    staff: "/vendor/staff",
    staffById: (id: string) => `/vendor/staff/${id}`,
    staffStatus: (id: string) => `/vendor/staff/${id}/status`,
    staffAssignStores: (id: string) => `/vendor/staff/${id}/assign-stores`,
    
    // Orders
    ordersAssigned: "/vendor/orders/assigned",
    orderById: (id: string) => `/vendor/orders/${id}`,
    acceptOrder: (id: string) => `/vendor/orders/${id}/accept`,
    rejectOrder: (id: string) => `/vendor/orders/${id}/reject`,
    updateOrderStatus: (id: string) => `/vendor/orders/${id}/status`,
    qcUpload: (id: string) => `/vendor/orders/${id}/qc-upload`,
    markReady: (id: string) => `/vendor/orders/${id}/ready`,
    
    // Analytics
    performance: "/vendor/analytics/performance",
    
    // Finance - Wallet
    walletSummary: "/vendor/finance/wallet/summary",
    walletSummaryAlt: "/vendor/wallet/summary",
    walletStoreWise: "/vendor/finance/wallet/store-wise",
    walletStoreWiseAlt: "/vendor/wallet/store-wise",
    walletDeductions: "/vendor/finance/wallet/deductions",
    walletDeductionsAlt: "/vendor/wallet/deductions",
    
    // Finance - Closure
    closureDaily: "/vendor/finance/closure/daily",
    closureDailyAlt: "/vendor/closure/daily",
    closureWeekly: "/vendor/finance/closure/weekly",
    closureWeeklyAlt: "/vendor/closure/weekly",
    closureMonthly: "/vendor/finance/closure/monthly",
    closureMonthlyAlt: "/vendor/closure/monthly",
    
    // Finance - Payouts
    payoutsSchedule: "/vendor/finance/payouts/schedule",
    payoutsScheduleAlt: "/vendor/payouts/schedule",
    payoutsHistory: "/vendor/finance/payouts/history",
    payoutsHistoryAlt: "/vendor/payouts/history",
    
    // Scoring
    rejectionsHistory: "/vendor/scoring/rejections/history",
    rejectionsHistoryAlt: "/vendor/rejections/history",
    performanceScore: "/vendor/scoring/performance-score",
  },
  
  // Tickets (using notification service)
  tickets: {
    list: "/notifications/tickets",
    summary: "/notifications/tickets/summary",
    helpCenter: "/notifications/help-center",
    detail: (id: string) => `/notifications/tickets/${id}`,
    reply: (id: string) => `/notifications/tickets/${id}/reply`,
    assign: (id: string) => `/notifications/tickets/${id}/assign`,
    updateStatus: (id: string) => `/notifications/tickets/${id}/status`,
    escalate: (id: string) => `/notifications/tickets/${id}/escalate`,
  },
} as const;
