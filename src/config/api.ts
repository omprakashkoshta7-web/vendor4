export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: "/api/vendor/auth/login",
    mfaVerify: "/api/vendor/auth/mfa/verify",
    logout: "/api/vendor/auth/logout",
    session: "/api/vendor/auth/session",
    verify: "/api/auth/verify",
    me: "/api/auth/me",
  },
  
  // Organization endpoints
  vendor: {
    // Profile
    profile: "/api/vendor/org/profile",
    legal: "/api/vendor/org/legal",
    agreement: "/api/vendor/org/agreement",
    
    // Stores
    storesNearby: "/api/vendor/stores/nearby",
    stores: "/api/vendor/stores",
    storeById: (id: string) => `/api/vendor/stores/${id}`,
    storeStatus: (id: string) => `/api/vendor/stores/${id}/status`,
    storeAvailability: (id: string) => `/api/vendor/stores/${id}/availability`,
    storeCapacity: (id: string) => `/api/vendor/stores/${id}/capacity`,
    storeCapabilities: (id: string) => `/api/vendor/stores/${id}/capabilities`,
    
    // Staff
    staff: "/api/vendor/staff",
    staffById: (id: string) => `/api/vendor/staff/${id}`,
    staffStatus: (id: string) => `/api/vendor/staff/${id}/status`,
    staffAssignStores: (id: string) => `/api/vendor/staff/${id}/assign-stores`,
    
    // Orders
    ordersAssigned: "/api/vendor/orders/assigned",
    orderById: (id: string) => `/api/vendor/orders/${id}`,
    acceptOrder: (id: string) => `/api/vendor/orders/${id}/accept`,
    rejectOrder: (id: string) => `/api/vendor/orders/${id}/reject`,
    updateOrderStatus: (id: string) => `/api/vendor/orders/${id}/status`,
    qcUpload: (id: string) => `/api/vendor/orders/${id}/qc-upload`,
    markReady: (id: string) => `/api/vendor/orders/${id}/ready`,
    
    // Analytics
    performance: "/api/vendor/analytics/performance",
    
    // Finance - Wallet
    walletSummary: "/api/vendor/finance/wallet/summary",
    walletSummaryAlt: "/api/vendor/wallet/summary",
    walletStoreWise: "/api/vendor/finance/wallet/store-wise",
    walletStoreWiseAlt: "/api/vendor/wallet/store-wise",
    walletDeductions: "/api/vendor/finance/wallet/deductions",
    walletDeductionsAlt: "/api/vendor/wallet/deductions",
    
    // Finance - Closure
    closureDaily: "/api/vendor/finance/closure/daily",
    closureDailyAlt: "/api/vendor/closure/daily",
    closureWeekly: "/api/vendor/finance/closure/weekly",
    closureWeeklyAlt: "/api/vendor/closure/weekly",
    closureMonthly: "/api/vendor/finance/closure/monthly",
    closureMonthlyAlt: "/api/vendor/closure/monthly",
    
    // Finance - Payouts
    payoutsSchedule: "/api/vendor/finance/payouts/schedule",
    payoutsScheduleAlt: "/api/vendor/payouts/schedule",
    payoutsHistory: "/api/vendor/finance/payouts/history",
    payoutsHistoryAlt: "/api/vendor/payouts/history",
    
    // Scoring
    rejectionsHistory: "/api/vendor/scoring/rejections/history",
    rejectionsHistoryAlt: "/api/vendor/rejections/history",
    performanceScore: "/api/vendor/scoring/performance-score",
  },
  
  // Tickets (using notification service)
  tickets: {
    list: "/api/notifications/tickets",
    summary: "/api/notifications/tickets/summary",
    helpCenter: "/api/notifications/help-center",
    detail: (id: string) => `/api/notifications/tickets/${id}`,
    reply: (id: string) => `/api/notifications/tickets/${id}/reply`,
    assign: (id: string) => `/api/notifications/tickets/${id}/assign`,
    updateStatus: (id: string) => `/api/notifications/tickets/${id}/status`,
    escalate: (id: string) => `/api/notifications/tickets/${id}/escalate`,
  },
} as const;
