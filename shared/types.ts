/**
 * Shared TypeScript types and interfaces for the ClientConnect application
 * 
 * This file contains all the custom types, interfaces, and type extensions
 * used across both the client and server sides of the application.
 * 
 * @module SharedTypes
 */

import type { Request } from 'express';
import type { User as DBUser, Project, AccessLog } from './schema';

/**
 * Extended Express Request interface with custom properties
 * Used throughout the application to provide type safety for request extensions
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
  userRole?: 'freelancer' | 'client' | 'guest';
  project?: Project;
  userId?: string;
}

/**
 * API Response wrapper type for consistent response formatting
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  stack?: string; // Only in development
}

/**
 * File upload metadata
 */
export interface FileUploadMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  encoding: string;
}

/**
 * Share token validation result
 */
export interface ShareTokenValidation {
  valid: boolean;
  project?: Project;
  expired?: boolean;
}

/**
 * Client portal data structure
 */
export interface ClientPortalData {
  project: Project;
  deliverables: any[];
  messages: any[];
  invoices: any[];
  feedback: any[];
  unreadCount?: number;
}

/**
 * Message attachment type
 */
export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Feedback statistics
 */
export interface FeedbackStats {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

/**
 * JWT token payload for client access
 */
export interface ClientJWTPayload {
  shareToken: string;
  projectId: string;
  clientName: string;
  role: 'client';
  exp: number;
  iat: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Database service interface pattern
 */
export interface BaseService<T, CreateT> {
  findById(id: string): Promise<T | null>;
  create(data: CreateT): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Security audit log entry
 */
export interface SecurityAuditLog {
  timestamp: Date;
  event: 'login_attempt' | 'file_upload' | 'access_violation' | 'token_validation' | 'rate_limit_exceeded';
  userId?: string;
  clientIp?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Brute force protection tracking
 */
export interface BruteForceAttempt {
  identifier: string; // IP or user ID
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedName?: string;
  detectedMimeType?: string;
}

/**
 * Message thread summary
 */
export interface MessageThread {
  threadId: string;
  latestMessage: {
    id: string;
    content: string;
    senderName: string;
    senderType: 'freelancer' | 'client';
    createdAt: Date;
    status: string;
    priority: string;
  };
  replyCount: number;
  totalMessages: number;
  unreadCount?: number;
}

/**
 * Project analytics data
 */
export interface ProjectAnalytics {
  accessCount: number;
  lastAccessed: Date | null;
  messageCount: number;
  deliverableCount: number;
  feedbackScore: number | null;
  clientEngagementScore: number;
}

/**
 * Environment configuration type
 */
export interface AppConfig {
  NODE_ENV: string;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  REPLIT_CLIENT_ID?: string;
  REPLIT_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  JWT_SECRET: string;
  ISSUER_URL?: string;
  REPL_ID?: string;
  REPLIT_DOMAINS?: string;
  PORT?: string;
}

// Type guards for runtime type checking
export const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return req.user !== undefined;
};

export const isValidProject = (obj: any): obj is Project => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isValidShareToken = (token: any): token is string => {
  return typeof token === 'string' && token.length > 10;
};