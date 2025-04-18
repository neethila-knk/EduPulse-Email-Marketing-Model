import { authApi } from './authUtils';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'campaign' | 'system' | 'alert';
  read: boolean;
  link?: string;
  createdAt: string;
}

export const getNotifications = async (limit = 10, skip = 0) => {
  try {
    const response = await authApi.get(`/api/notifications?limit=${limit}&skip=${skip}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0, hasMore: false };
  }
};

export const markAsRead = async (ids?: string[]) => {
  try {
    const payload = ids ? { ids } : {};
    await authApi.patch('/api/notifications/read', payload);
    return true;
  } catch (error) {
    console.error('Error marking as read:', error);
    return false;
  }
};