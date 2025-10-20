/**
 * WebSocket Hook
 * 
 * Custom React hook for real-time communication using Socket.IO.
 * Provides real-time messaging, typing indicators, read receipts,
 * and connection status management.
 * 
 * Features:
 * - Automatic connection management with reconnection
 * - Real-time message delivery and updates
 * - Typing indicators with automatic timeout
 * - Live read receipts and status tracking
 * - User presence (online/offline) management
 * - Connection health monitoring
 * 
 * @module useWebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  senderName: string;
  senderType: 'freelancer' | 'client';
  messageType?: string;
  priority?: string;
  status?: string;
  parentMessageId?: string;
  threadId?: string;
  isRead?: boolean;
  createdAt: string;
  readAt?: string;
  editedAt?: string;
  attachments?: any[];
}

interface UserPresence {
  userId: string;
  userType: 'freelancer' | 'client';
  userName: string;
  projectId: string;
  lastSeen: Date;
  socketId: string;
}

interface TypingUser {
  userId: string;
  userType: 'freelancer' | 'client';
  userName: string;
  isTyping: boolean;
}

interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

interface UseWebSocketProps {
  projectId?: string;
  userId?: string;
  userType?: 'freelancer' | 'client';
  userName?: string;
  shareToken?: string; // For client portal access
  enabled?: boolean;
}

interface UseWebSocketReturn {
  // Connection status
  connectionStatus: ConnectionStatus;
  
  // Messages
  sendMessage: (data: {
    content: string;
    parentMessageId?: string;
    threadId?: string;
    priority?: string;
    messageType?: string;
  }) => void;
  
  // Typing indicators
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: TypingUser[];
  
  // Read receipts
  markMessageAsRead: (messageId: string) => void;
  markMessagesAsRead: (senderType: 'freelancer' | 'client') => void;
  
  // Presence
  onlineUsers: UserPresence[];
  
  // Event handlers (for parent components to subscribe to)
  onNewMessage: (callback: (message: Message) => void) => void;
  onMessageRead: (callback: (data: { messageId: string; readBy: string; readByType: string; readAt: Date }) => void) => void;
  onUserJoined: (callback: (user: { userId: string; userType: string; userName: string; joinedAt: Date }) => void) => void;
  onUserLeft: (callback: (user: { userId: string; userType: string; userName: string; leftAt: Date }) => void) => void;
}

export function useWebSocket({
  projectId,
  userId,
  userType,
  userName,
  shareToken,
  enabled = true,
}: UseWebSocketProps): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
  });
  
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  
  // Event callback refs to avoid re-renders
  const messageCallbackRef = useRef<((message: Message) => void) | null>(null);
  const messageReadCallbackRef = useRef<((data: any) => void) | null>(null);
  const userJoinedCallbackRef = useRef<((user: any) => void) | null>(null);
  const userLeftCallbackRef = useRef<((user: any) => void) | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled || !projectId || !userId || !userType || !userName) {
      return;
    }

    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        lastConnected: new Date(),
        reconnectAttempts: 0,
      }));

      // Join the project room
      socket.emit('join_project', {
        projectId,
        userId,
        userType,
        userName,
        shareToken,
      });
    });

    socket.on('disconnect', (reason) => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
      }));
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      setConnectionStatus(prev => ({
        ...prev,
        isReconnecting: true,
        reconnectAttempts: attemptNumber,
      }));
    });

    socket.on('reconnect', () => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0,
      }));
    });

    // Message event handlers
    socket.on('new_message', (message: Message) => {
      if (messageCallbackRef.current) {
        messageCallbackRef.current(message);
      }
    });

    socket.on('message_read', (data: any) => {
      if (messageReadCallbackRef.current) {
        messageReadCallbackRef.current(data);
      }
    });

    socket.on('bulk_messages_read', (data: any) => {
      if (messageReadCallbackRef.current) {
        messageReadCallbackRef.current({ ...data, isBulk: true });
      }
    });

    // Typing indicator handlers
    socket.on('user_typing', (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => 
          !(user.userId === data.userId && user.userType === data.userType)
        );
        
        if (data.isTyping) {
          return [...filtered, data];
        }
        
        return filtered;
      });
    });

    // Presence handlers
    socket.on('presence_update', (data: { users: UserPresence[] }) => {
      setOnlineUsers(data.users);
    });

    socket.on('user_joined', (user: any) => {
      if (userJoinedCallbackRef.current) {
        userJoinedCallbackRef.current(user);
      }
    });

    socket.on('user_left', (user: any) => {
      if (userLeftCallbackRef.current) {
        userLeftCallbackRef.current(user);
      }
    });

    // Error handling
    socket.on('error', (error: any) => {
      // Silent error handling - errors will be logged by server-side middleware
    });

    // Keep connection alive with ping/pong
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    socket.on('pong', () => {
      // Connection is alive
    });

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, projectId, userId, userType, userName, shareToken]);

  // Send message
  const sendMessage = useCallback((data: {
    content: string;
    parentMessageId?: string;
    threadId?: string;
    priority?: string;
    messageType?: string;
  }) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !projectId || !userName || !userType) {
      console.warn('Cannot send message: socket not connected or missing data');
      return;
    }

    socket.emit('send_message', {
      projectId,
      senderName: userName,
      senderType: userType,
      ...data,
    });
  }, [projectId, userName, userType]);

  // Typing indicators
  const startTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !projectId || !userId || !userName || !userType) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing_start', {
      projectId,
      userId,
      userType,
      userName,
    });

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [projectId, userId, userType, userName]);

  const stopTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !projectId || !userId) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit('typing_stop', {
      projectId,
      userId,
    });
  }, [projectId, userId]);

  // Read receipts
  const markMessageAsRead = useCallback((messageId: string) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !projectId || !userId || !userType) {
      return;
    }

    socket.emit('mark_message_read', {
      messageId,
      projectId,
      userId,
      userType,
    });
  }, [projectId, userId, userType]);

  const markMessagesAsRead = useCallback((senderType: 'freelancer' | 'client') => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !projectId || !userId || !userType) {
      return;
    }

    socket.emit('mark_messages_read', {
      projectId,
      userId,
      userType,
      senderType,
    });
  }, [projectId, userId, userType]);

  // Event subscription methods
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  const onMessageRead = useCallback((callback: (data: any) => void) => {
    messageReadCallbackRef.current = callback;
  }, []);

  const onUserJoined = useCallback((callback: (user: any) => void) => {
    userJoinedCallbackRef.current = callback;
  }, []);

  const onUserLeft = useCallback((callback: (user: any) => void) => {
    userLeftCallbackRef.current = callback;
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
    markMessageAsRead,
    markMessagesAsRead,
    onlineUsers,
    onNewMessage,
    onMessageRead,
    onUserJoined,
    onUserLeft,
  };
}