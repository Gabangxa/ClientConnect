/**
 * JWT Service for Secure Token Management
 * Replaces long-lived database tokens with short-lived JWTs for client share links
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_ISSUER = 'clientconnect-portal';

export interface ShareTokenPayload {
  projectId: string;
  shareToken: string; // Original share token for verification
  clientName: string;
  permissions: string[];
  type: 'client-access';
}

export interface ClientAccessToken {
  token: string;
  expiresAt: Date;
  expiresIn: number; // seconds
}

/**
 * Generate short-lived JWT for client portal access
 */
export const generateClientAccessToken = (
  projectId: string,
  shareToken: string,
  clientName: string,
  expiresInHours: number = 24
): ClientAccessToken => {
  const expiresIn = expiresInHours * 60 * 60; // Convert to seconds
  const expiresAt = new Date(Date.now() + (expiresIn * 1000));

  const payload: ShareTokenPayload = {
    projectId,
    shareToken,
    clientName,
    permissions: ['read_project', 'upload_files', 'send_messages', 'view_invoices', 'create_feedback'],
    type: 'client-access',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: JWT_ISSUER,
    audience: 'client-portal',
    subject: projectId,
    jwtid: crypto.randomUUID(),
  });

  return {
    token,
    expiresAt,
    expiresIn,
  };
};

/**
 * Verify and decode JWT token
 */
export const verifyClientAccessToken = (token: string): ShareTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: 'client-portal',
    }) as ShareTokenPayload;

    if (decoded.type !== 'client-access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

/**
 * Refresh token (generate new one with updated expiry)
 */
export const refreshClientAccessToken = (
  currentToken: string,
  expiresInHours: number = 24
): ClientAccessToken | null => {
  const payload = verifyClientAccessToken(currentToken);
  
  if (!payload) {
    return null;
  }

  return generateClientAccessToken(
    payload.projectId,
    payload.shareToken,
    payload.clientName,
    expiresInHours
  );
};

/**
 * Extract project ID from token without full verification (for routing)
 */
export const extractProjectIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.projectId || decoded?.sub || null;
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded?.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

/**
 * Get token expiry time
 */
export const getTokenExpiry = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded?.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

/**
 * Validate token permissions
 */
export const hasPermission = (token: string, permission: string): boolean => {
  const payload = verifyClientAccessToken(token);
  return payload?.permissions.includes(permission) || false;
};

/**
 * Generate secure API key for webhooks/integrations
 */
export const generateApiKey = (userId: string, scope: string[] = []): string => {
  const payload = {
    userId,
    scope,
    type: 'api-key',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: 'api-access',
    subject: userId,
    // API keys don't expire by default, but can be revoked
  });
};

/**
 * Verify API key
 */
export const verifyApiKey = (apiKey: string): any | null => {
  try {
    const decoded = jwt.verify(apiKey, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: 'api-access',
    });

    return decoded;
  } catch (error) {
    console.error('API key verification failed:', error);
    return null;
  }
};