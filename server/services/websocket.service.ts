/**
 * WebSocket Service
 * 
 * Real-time communication service using Socket.IO for instant messaging,
 * typing indicators, read receipts, and presence management between
 * freelancers and clients.
 * 
 * Features:
 * - Real-time message delivery
 * - Typing indicators with automatic timeout
 * - Live read receipts and status updates
 * - User presence (online/offline) tracking
 * - Project-based room management
 * - Connection health monitoring
 * 
 * @module WebSocketService
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { messageService } from './message.service';
import { websocket, error as logError } from '@shared/logger';

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
  projectId: string;
  startTime: Date;
}

interface MessageData {
  projectId: string;
  content: string;
  senderType: 'freelancer' | 'client';
  senderName: string;
  parentMessageId?: string;
  threadId?: string;
  priority?: string;
  messageType?: string;
}

interface ReadReceiptData {
  messageId: string;
  projectId: string;
  readBy: string;
  readByType: 'freelancer' | 'client';
  readAt: Date;
}

/**
 * WebSocket Service for real-time communication
 */
export class WebSocketService {
  private io: SocketIOServer;
  private userPresence: Map<string, UserPresence> = new Map();
  private typingUsers: Map<string, TypingUser> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL || 'https://your-domain.com'] 
          : ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ['websocket', 'polling'], // Support both for reliability
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      // User authentication and room joining
      socket.on('join_project', (data: {
        projectId: string;
        userId: string;
        userType: 'freelancer' | 'client';
        userName: string;
        shareToken?: string; // For client portal access
      }) => {
        this.handleUserJoin(socket, data);
      });

      // Real-time message sending
      socket.on('send_message', async (data: MessageData) => {
        await this.handleMessageSend(socket, data);
      });

      // Typing indicators
      socket.on('typing_start', (data: {
        projectId: string;
        userId: string;
        userType: 'freelancer' | 'client';
        userName: string;
      }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: { projectId: string; userId: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Read receipts
      socket.on('mark_message_read', async (data: {
        messageId: string;
        projectId: string;
        userId: string;
        userType: 'freelancer' | 'client';
      }) => {
        await this.handleMessageRead(socket, data);
      });

      // Bulk mark messages as read
      socket.on('mark_messages_read', async (data: {
        projectId: string;
        userId: string;
        userType: 'freelancer' | 'client';
        senderType: 'freelancer' | 'client'; // Messages from this sender type to mark as read
      }) => {
        await this.handleBulkMessageRead(socket, data);
      });

      // Connection status updates
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnections
      socket.on('disconnect', (reason) => {
        websocket(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.handleUserDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        logError(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  private async handleUserJoin(socket: any, data: {
    projectId: string;
    userId: string;
    userType: 'freelancer' | 'client';
    userName: string;
    shareToken?: string;
  }): Promise<void> {
    try {
      const { projectId, userId, userType, userName } = data;
      const roomName = `project_${projectId}`;

      // Join project room
      await socket.join(roomName);
      
      // Store user presence
      const userKey = `${projectId}_${userId}_${userType}`;
      const presence: UserPresence = {
        userId,
        userType,
        userName,
        projectId,
        lastSeen: new Date(),
        socketId: socket.id,
      };
      
      this.userPresence.set(userKey, presence);
      socket.userKey = userKey; // Store for cleanup on disconnect

      // Notify other users about presence
      socket.to(roomName).emit('user_joined', {
        userId,
        userType,
        userName,
        joinedAt: new Date(),
      });

      // Send current presence list to the new user
      const currentUsers = this.getProjectUsers(projectId);
      socket.emit('presence_update', { users: currentUsers });

      console.log(`User ${userName} (${userType}) joined project ${projectId}`);
    } catch (error) {
      console.error('Error handling user join:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  }

  private async handleMessageSend(socket: any, data: MessageData): Promise<void> {
    try {
      // Validate and create message in database
      const messageData = {
        projectId: data.projectId,
        senderName: data.senderName,
        senderType: data.senderType,
        content: data.content,
        parentMessageId: data.parentMessageId,
        threadId: data.threadId,
        messageType: data.messageType || 'text',
        priority: data.priority || 'normal',
        status: 'delivered', // Mark as delivered since we're sending in real-time
      };

      const newMessage = await messageService.createMessage(messageData);
      
      // Broadcast to all users in the project room
      const roomName = `project_${data.projectId}`;
      this.io.to(roomName).emit('new_message', {
        ...newMessage,
        attachments: [], // Attachments handled separately for now
      });

      console.log(`Message sent in project ${data.projectId} by ${data.senderName}`);
    } catch (error) {
      console.error('Error handling message send:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleTypingStart(socket: any, data: {
    projectId: string;
    userId: string;
    userType: 'freelancer' | 'client';
    userName: string;
  }): void {
    const { projectId, userId, userType, userName } = data;
    const typingKey = `${projectId}_${userId}_${userType}`;
    const roomName = `project_${projectId}`;

    // Store typing user
    this.typingUsers.set(typingKey, {
      userId,
      userType,
      userName,
      projectId,
      startTime: new Date(),
    });

    // Clear existing timeout for this user
    if (this.typingTimeouts.has(typingKey)) {
      clearTimeout(this.typingTimeouts.get(typingKey)!);
    }

    // Auto-stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      this.handleTypingStop(socket, { projectId, userId });
    }, 3000);
    
    this.typingTimeouts.set(typingKey, timeout);

    // Broadcast typing indicator to others in the room (exclude sender)
    socket.to(roomName).emit('user_typing', {
      userId,
      userType,
      userName,
      isTyping: true,
    });
  }

  private handleTypingStop(socket: any, data: { projectId: string; userId: string }): void {
    const { projectId, userId } = data;
    const roomName = `project_${projectId}`;
    
    // Find and remove typing user
    let typingUser: TypingUser | undefined;
    for (const [key, user] of this.typingUsers.entries()) {
      if (user.projectId === projectId && user.userId === userId) {
        typingUser = user;
        this.typingUsers.delete(key);
        
        // Clear timeout
        if (this.typingTimeouts.has(key)) {
          clearTimeout(this.typingTimeouts.get(key)!);
          this.typingTimeouts.delete(key);
        }
        break;
      }
    }

    if (typingUser) {
      // Broadcast typing stop to others in the room
      socket.to(roomName).emit('user_typing', {
        userId: typingUser.userId,
        userType: typingUser.userType,
        userName: typingUser.userName,
        isTyping: false,
      });
    }
  }

  private async handleMessageRead(socket: any, data: {
    messageId: string;
    projectId: string;
    userId: string;
    userType: 'freelancer' | 'client';
  }): Promise<void> {
    try {
      const { messageId, projectId, userId, userType } = data;
      
      // Mark message as read in database
      await messageService.markMessageAsRead(messageId);
      
      const roomName = `project_${projectId}`;
      const readReceipt: ReadReceiptData = {
        messageId,
        projectId,
        readBy: userId,
        readByType: userType,
        readAt: new Date(),
      };

      // Broadcast read receipt to others in the room
      socket.to(roomName).emit('message_read', readReceipt);
      
      console.log(`Message ${messageId} marked as read by ${userType} ${userId}`);
    } catch (error) {
      console.error('Error handling message read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  private async handleBulkMessageRead(socket: any, data: {
    projectId: string;
    userId: string;
    userType: 'freelancer' | 'client';
    senderType: 'freelancer' | 'client';
  }): Promise<void> {
    try {
      const { projectId, userId, userType, senderType } = data;
      
      // Mark messages as read in database
      await messageService.markMessagesAsRead(projectId, senderType, userId);
      
      const roomName = `project_${projectId}`;
      
      // Broadcast bulk read receipt to others in the room
      socket.to(roomName).emit('bulk_messages_read', {
        projectId,
        readBy: userId,
        readByType: userType,
        senderType, // Which sender type's messages were marked as read
        readAt: new Date(),
      });
      
      console.log(`Bulk messages from ${senderType} in project ${projectId} marked as read by ${userType} ${userId}`);
    } catch (error) {
      console.error('Error handling bulk message read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  private handleUserDisconnect(socket: any): void {
    const userKey = socket.userKey;
    if (!userKey) return;

    const presence = this.userPresence.get(userKey);
    if (presence) {
      const roomName = `project_${presence.projectId}`;
      
      // Notify other users about disconnection
      socket.to(roomName).emit('user_left', {
        userId: presence.userId,
        userType: presence.userType,
        userName: presence.userName,
        leftAt: new Date(),
      });
      
      // Clean up presence
      this.userPresence.delete(userKey);
      
      // Clean up typing indicators for this user
      for (const [key, typingUser] of this.typingUsers.entries()) {
        if (typingUser.userId === presence.userId && typingUser.projectId === presence.projectId) {
          this.typingUsers.delete(key);
          
          if (this.typingTimeouts.has(key)) {
            clearTimeout(this.typingTimeouts.get(key)!);
            this.typingTimeouts.delete(key);
          }
          
          // Notify others that user stopped typing
          socket.to(roomName).emit('user_typing', {
            userId: typingUser.userId,
            userType: typingUser.userType,
            userName: typingUser.userName,
            isTyping: false,
          });
        }
      }
      
      console.log(`User ${presence.userName} (${presence.userType}) disconnected from project ${presence.projectId}`);
    }
  }

  private getProjectUsers(projectId: string): UserPresence[] {
    const users: UserPresence[] = [];
    for (const presence of this.userPresence.values()) {
      if (presence.projectId === projectId) {
        users.push(presence);
      }
    }
    return users;
  }

  /**
   * Get current typing users for a project
   */
  getTypingUsers(projectId: string): TypingUser[] {
    const users: TypingUser[] = [];
    for (const typingUser of this.typingUsers.values()) {
      if (typingUser.projectId === projectId) {
        users.push(typingUser);
      }
    }
    return users;
  }

  /**
   * Send a message to all users in a project room
   */
  sendToProject(projectId: string, event: string, data: any): void {
    const roomName = `project_${projectId}`;
    this.io.to(roomName).emit(event, data);
  }

  /**
   * Get connection health statistics
   */
  getHealthStats(): {
    connectedUsers: number;
    typingUsers: number;
    projectRooms: Set<string>;
  } {
    const projectRooms = new Set<string>();
    for (const presence of this.userPresence.values()) {
      projectRooms.add(presence.projectId);
    }

    return {
      connectedUsers: this.userPresence.size,
      typingUsers: this.typingUsers.size,
      projectRooms,
    };
  }

  /**
   * Cleanup resources on service shutdown
   */
  shutdown(): void {
    console.log('Shutting down WebSocket service...');
    
    // Clear all typing timeouts
    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.typingTimeouts.clear();
    
    // Clear presence data
    this.userPresence.clear();
    this.typingUsers.clear();
    
    // Close Socket.IO server
    this.io.close();
    
    console.log('WebSocket service shutdown complete');
  }
}

export let webSocketService: WebSocketService;

/**
 * Initialize WebSocket service with HTTP server
 */
export const initializeWebSocket = (httpServer: HTTPServer): WebSocketService => {
  webSocketService = new WebSocketService(httpServer);
  return webSocketService;
};