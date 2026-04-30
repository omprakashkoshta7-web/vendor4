import { apiRequest } from "./api";

export interface PortalNotification {
  _id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationSummary {
  unread_count: number;
  recent_notifications: PortalNotification[];
  category_counts: Record<string, number>;
}

export const notificationService = {
  getSummary() {
    return apiRequest<{ data: NotificationSummary }>("/vendor/notifications/summary");
  },
  getRecent(limit = 8) {
    return apiRequest<{ data: { notifications: PortalNotification[] } }>(`/vendor/notifications?limit=${limit}`);
  },
};
