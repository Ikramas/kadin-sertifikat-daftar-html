import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // WebSocket connection
    const ws = new WebSocket(`wss://your-websocket-endpoint?token=${token}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for notifications');
    };

    ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        addNotification(notification);
        
        // Show toast for new notification
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        });
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/backend/api/notifications/list.php', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/backend/api/notifications/mark-read.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/backend/api/notifications/mark-all-read.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch('/backend/api/notifications/delete.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  };
};