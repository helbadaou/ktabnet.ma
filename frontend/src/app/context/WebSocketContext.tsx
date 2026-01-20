import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { wsUrl } from '../config';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: string;
  from?: number;
  to?: number;
  content?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface WebSocketContextType {
  status: WebSocketStatus;
  sendMessage: (message: WebSocketMessage) => boolean;
  lastMessage: WebSocketMessage | null;
  subscribe: (type: string, callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribersRef = useRef<Map<string, Set<(message: WebSocketMessage) => void>>>(new Map());
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting, skipping');
      return;
    }

    // Get auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token, skipping WebSocket connection');
      setStatus('disconnected');
      return;
    }

    // Close existing connection if any
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;
    setStatus('connecting');
    const wsUrlWithAuth = `${wsUrl('/ws')}?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(wsUrlWithAuth);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      isConnectingRef.current = false;
      setStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);

        // Notify subscribers
        const typeSubscribers = subscribersRef.current.get(message.type);
        if (typeSubscribers) {
          typeSubscribers.forEach((callback) => callback(message));
        }

        // Notify wildcard subscribers
        const wildcardSubscribers = subscribersRef.current.get('*');
        if (wildcardSubscribers) {
          wildcardSubscribers.forEach((callback) => callback(message));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      isConnectingRef.current = false;
      setStatus('disconnected');
      wsRef.current = null;

      // Auto-reconnect after 3 seconds if not a normal closure
      if (event.code !== 1000 && event.code !== 1001) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnectingRef.current = false;
      setStatus('error');
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    isConnectingRef.current = false;
    setStatus('disconnected');
  }, []);

  // Connect on mount if we have a token - runs only once
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      connect();
    }

    // Listen for auth changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          connect();
        } else {
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not open, cannot send message');
    return false;
  }, []);

  const subscribe = useCallback((type: string, callback: (message: WebSocketMessage) => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    subscribersRef.current.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const typeSubscribers = subscribersRef.current.get(type);
      if (typeSubscribers) {
        typeSubscribers.delete(callback);
        if (typeSubscribers.size === 0) {
          subscribersRef.current.delete(type);
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ status, sendMessage, lastMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Custom hook for subscribing to specific message types
export function useWebSocketSubscription(
  type: string,
  callback: (message: WebSocketMessage) => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(type, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, type, ...deps]);
}
