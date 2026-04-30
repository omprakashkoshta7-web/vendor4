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
    walletStoreWise: "/vendor/finance/wallet/store-wise",
    walletDeductions: "/vendor/finance/wallet/deductions",

    // Finance - Closure
    closureDaily: "/vendor/finance/closure/daily",
    closureWeekly: "/vendor/finance/closure/weekly",
    closureMonthly: "/vendor/finance/closure/monthly",

    // Finance - Payouts
    payoutsSchedule: "/vendor/finance/payouts/schedule",
    payoutsHistory: "/vendor/finance/payouts/history",

    // Finance - Summary (dashboard)
    financeSummary: "/vendor/finance/wallet/summary",

    // Scoring
    rejectionsHistory: "/vendor/scoring/rejections/history",
    performanceScore: "/vendor/scoring/performance-score",

    // Support Tickets — correct endpoint per spec
    supportTickets: "/vendor/support/tickets",
    supportTicketById: (id: string) => `/vendor/support/tickets/${id}`,
    supportTicketReply: (id: string) => `/vendor/support/tickets/${id}/reply`,
    supportTicketSummary: "/vendor/support/tickets/summary",
  },
} as const;
