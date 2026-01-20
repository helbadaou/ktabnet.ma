import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { apiUrl } from '../config';
import { authFetch } from '../utils/api';
import { useWebSocket, useWebSocketSubscription, WebSocketMessage } from './WebSocketContext';
import { useAuth } from './AuthContext';

// Notification types matching backend
export const NotificationTypes = {
  FOLLOW_REQUEST: 'follow_request',
  FOLLOW_ACCEPT: 'follow_accept',
  NEW_MESSAGE: 'new_message',
  COMMENT: 'comment',
  BOOK_REQUEST: 'book_request',
  BOOK_ACCEPTED: 'book_accepted',
  LIKE: 'like',
} as const;

export interface Notification {
  id: number;
  sender_id: number;
  sender_nickname: string;
  sender_avatar?: string;
  type: string;
  message: string;
  seen: boolean;
  created_at: string;
  group_id?: number;
  event_id?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  unreadPerConversation: Record<number, number>;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  markNotificationAsSeen: (id: number) => Promise<void>;
  markAllNotificationsAsSeen: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  markMessagesAsRead: (senderId: number) => Promise<void>;
  playNotificationSound: () => void;
  requestBrowserPermission: () => Promise<boolean>;
  showBrowserNotification: (title: string, body: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification sound URL - we'll create this file
const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadPerConversation, setUnreadPerConversation] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { status } = useWebSocket();
  const { user } = useAuth();

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, []);

  // Request browser notification permission
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    // Only show if tab is not focused
    if (document.hidden) {
      new Notification(title, {
        body,
        icon: '/logo.png',
        tag: 'ktabnet-notification',
      });
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(apiUrl('/api/notifications'));
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
        setUnreadNotificationCount(data?.filter((n: Notification) => !n.seen).length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const [notifRes, msgRes, convRes] = await Promise.all([
        authFetch(apiUrl('/api/notifications/unread-count')),
        authFetch(apiUrl('/api/chat/unread-count')),
        authFetch(apiUrl('/api/chat/unread-per-conversation')),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setUnreadNotificationCount(data.count || 0);
      }
      if (msgRes.ok) {
        const data = await msgRes.json();
        setUnreadMessageCount(data.count || 0);
      }
      if (convRes.ok) {
        const data = await convRes.json();
        setUnreadPerConversation(data || {});
      }
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
    }
  }, []);

  // Mark single notification as seen
  const markNotificationAsSeen = useCallback(async (id: number) => {
    try {
      const res = await authFetch(apiUrl('/api/notifications/seen'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id, mark_all: false }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, seen: true } : n))
        );
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as seen:', err);
    }
  }, []);

  // Mark all notifications as seen
  const markAllNotificationsAsSeen = useCallback(async () => {
    try {
      const res = await authFetch(apiUrl('/api/notifications/seen'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
        setUnreadNotificationCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as seen:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: number) => {
    try {
      const res = await authFetch(apiUrl('/api/notifications/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
      if (res.ok) {
        setNotifications((prev) => {
          const notif = prev.find((n) => n.id === id);
          if (notif && !notif.seen) {
            setUnreadNotificationCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== id);
        });
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // Mark messages from a sender as read
  const markMessagesAsRead = useCallback(async (senderId: number) => {
    try {
      const res = await authFetch(apiUrl('/api/chat/mark-read'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: senderId }),
      });
      if (res.ok) {
        setUnreadPerConversation((prev) => {
          const count = prev[senderId] || 0;
          setUnreadMessageCount((c) => Math.max(0, c - count));
          const newCounts = { ...prev };
          delete newCounts[senderId];
          return newCounts;
        });
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, []);

  // Handle incoming WebSocket notifications
  const handleNotification = useCallback((message: WebSocketMessage) => {
    // Check if it's a notification type message
    const notificationTypeValues = Object.values(NotificationTypes) as string[];
    if (message.type && notificationTypeValues.includes(message.type)) {
      const newNotif: Notification = {
        id: (message.id as number) || Date.now(),
        sender_id: message.sender_id as number,
        sender_nickname: message.sender_nickname as string || 'Someone',
        type: message.type,
        message: message.message as string || '',
        seen: false,
        created_at: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);
      playNotificationSound();
      showBrowserNotification('KtabNet.ma', newNotif.message);
    }
  }, [playNotificationSound, showBrowserNotification]);

  // Handle incoming private messages
  const handlePrivateMessage = useCallback((message: WebSocketMessage) => {
    const senderId = message.from as number;
    const currentUserId = user?.id;
    
    // Skip notification if this is our own message (we sent it)
    if (!senderId || senderId === currentUserId) {
      return;
    }
    
    setUnreadMessageCount((prev) => prev + 1);
    setUnreadPerConversation((prev) => ({
      ...prev,
      [senderId]: (prev[senderId] || 0) + 1,
    }));
    playNotificationSound();
    showBrowserNotification('New Message', message.content as string || 'You have a new message');
  }, [playNotificationSound, showBrowserNotification, user?.id]);

  // Subscribe to WebSocket messages
  useWebSocketSubscription('*', handleNotification, [handleNotification]);
  useWebSocketSubscription('private', handlePrivateMessage, [handlePrivateMessage]);

  // Fetch initial data when connected
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchNotifications();
      fetchUnreadCounts();
      requestBrowserPermission();
    }
  }, [status, fetchNotifications, fetchUnreadCounts, requestBrowserPermission]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadNotificationCount,
        unreadMessageCount,
        unreadPerConversation,
        isLoading,
        fetchNotifications,
        fetchUnreadCounts,
        markNotificationAsSeen,
        markAllNotificationsAsSeen,
        deleteNotification,
        markMessagesAsRead,
        playNotificationSound,
        requestBrowserPermission,
        showBrowserNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
