// src/components/UI/NotificationsDropdown.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../utils/authUtils';

interface NotificationsDropdownProps {
  isVisible: boolean;
  onClose: () => void;
  onCountUpdate?: (count: number) => void;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'campaign' | 'system' | 'alert';
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isVisible,
  onClose,
  onCountUpdate,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isVisible) {
      loadNotifications();
    }
  }, [isVisible]);

  useEffect(() => {
    if (onCountUpdate) {
      onCountUpdate(unreadCount);
    }
  }, [unreadCount, onCountUpdate]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await authApi.get<NotificationResponse>('/api/notifications?limit=5');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setHasMore(response.data.hasMore || false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await authApi.patch('/api/notifications/read', {});
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      if (onCountUpdate) onCountUpdate(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await authApi.patch('/api/notifications/read', { ids: [id] });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      const wasUnread = notifications.find((n) => n._id === id && !n.read);
      if (wasUnread) {
        const newCount = unreadCount - 1;
        setUnreadCount(newCount);
        if (onCountUpdate) onCountUpdate(newCount);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await authApi.delete('/api/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      if (onCountUpdate) onCountUpdate(0);
    } catch (error) {
      console.error('Error clearing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  if (!isVisible) return null;

  return (
    <div
      className="
        fixed sm:absolute top-0 sm:top-auto right-0 sm:right-0
        w-full sm:w-80 h-full sm:h-auto
        bg-white z-50 shadow-lg overflow-hidden
        flex flex-col rounded-none sm:rounded-md
      "
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="text-xs text-green-600 hover:text-green-800">
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="text-xs text-red-600 hover:text-red-800">
              Clear all
            </button>
          )}
          {/* Close button for mobile */}
          <button onClick={onClose} className="text-gray-500 sm:hidden text-xl font-bold">&times;</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                !notification.read ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-opacity-20 ${
                    notification.type === 'campaign'
                      ? 'bg-green-100 text-green-600'
                      : notification.type === 'alert'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d={
                        notification.type === 'campaign'
                          ? 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'
                          : notification.type === 'alert'
                          ? 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                          : 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      }
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                    <span className="text-xs text-gray-400 ml-2">{formatDate(notification.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">{notification.message}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {notification.link && (
                      <Link
                        to={notification.link}
                        className="text-xs text-green-600 hover:text-green-800"
                        onClick={onClose}
                      >
                        View Details
                      </Link>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {hasMore && (
          <div className="p-3 text-center border-t border-gray-100">
            <Link to="/notifications" className="text-sm text-green-600 hover:text-green-800" onClick={onClose}>
              View all notifications
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
