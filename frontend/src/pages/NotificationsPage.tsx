// src/pages/NotificationsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import { getNotifications, markAsRead, Notification } from '../utils/notificationService';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    document.title = "Notifications | EduPulse";
    loadNotifications();
  }, []);

  interface NotificationResult {
    notifications: Notification[];
    hasMore: boolean;
  }
  
  const loadNotifications = async (reset = true) => {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const skip = currentPage * pageSize;
      
      const result = await getNotifications(pageSize, skip) as NotificationResult;
    
    if (reset) {
      setNotifications(result.notifications);
    } else {
      setNotifications([...notifications, ...result.notifications]);
    }
    
    setHasMore(result.hasMore);
    setPage(reset ? 1 : page + 1);
    setLoading(false);
  };

  const handleLoadMore = () => {
    loadNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAsRead();
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead([id]);
    setNotifications(
      notifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Format the date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()] + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups: any, notification) => {
    const date = new Date(notification.createdAt);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: formatDate(notification.createdAt),
        items: []
      };
    }
    
    groups[dateKey].items.push(notification);
    return groups;
  }, {});

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <Button 
            variant="secondary" 
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            Mark all as read
          </Button>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No notifications yet</h3>
            <p className="text-gray-600 mb-6">You're all caught up! We'll notify you when there's new activity.</p>
            <Button variant="primary" onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {Object.values(groupedNotifications).map((group: any, groupIndex: number) => (
              <div key={groupIndex} className="border-b border-gray-200 last:border-b-0">
                <div className="bg-gray-50 px-6 py-3">
                  <h3 className="text-sm font-medium text-gray-500">{group.date}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {group.items.map((notification: Notification) => (
                    <div 
                      key={notification._id}
                      className={`px-6 py-4 ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                          {notification.type === 'campaign' ? (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </div>
                          ) : notification.type === 'alert' ? (
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="text-base font-medium text-gray-900">{notification.title}</h4>
                            <p className="ml-2 text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                          <div className="mt-2 flex">
                            {notification.link && (
                              <Link to={notification.link} className="text-sm text-blue-600 hover:text-blue-800 mr-4">
                                View Details
                              </Link>
                            )}
                            {!notification.read && (
                              <button 
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="px-6 py-4 bg-gray-50 text-center">
                <Button 
                  variant="secondary" 
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;