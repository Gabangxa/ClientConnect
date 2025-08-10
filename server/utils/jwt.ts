import jwt from 'jsonwebtoken';
import { logger } from '../middlewares/logging.middleware';

// JWT utility functions for enhanced token management
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  projectId?: string;
  iat?: number;
  exp?: number;
}

export class JWTService {
  static generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'client-portal',
        audience: 'client-portal-users'
      });
    } catch (error) {
      logger.error({ error }, 'Failed to generate JWT token');
      throw new Error('Token generation failed');
    }
  }

  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'client-portal',
        audience: 'client-portal-users'
      }) as TokenPayload;
    } catch (error) {
      logger.warn({ error }, 'JWT token verification failed');
      throw new Error('Invalid token');
    }
  }

  static generateShareToken(projectId: string, clientEmail?: string): string {
    try {
      const payload = {
        projectId,
        role: 'client',
        email: clientEmail,
        type: 'share-token'
      };
      
      return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: '90d', // 90 days for share tokens
        issuer: 'client-portal',
        audience: 'client-portal-share'
      });
    } catch (error) {
      logger.error({ error, projectId }, 'Failed to generate share token');
      throw new Error('Share token generation failed');
    }
  }

  static verifyShareToken(token: string): { projectId: string; email?: string } {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: 'client-portal',
        audience: 'client-portal-share'
      }) as any;
      
      return {
        projectId: payload.projectId,
        email: payload.email
      };
    } catch (error) {
      logger.warn({ error }, 'Share token verification failed');
      throw new Error('Invalid share token');
    }
  }

  static refreshToken(token: string): string {
    try {
      const payload = this.verifyToken(token);
      // Remove timestamp fields before regenerating
      const { iat, exp, ...newPayload } = payload;
      return this.generateToken(newPayload);
    } catch (error) {
      logger.error({ error }, 'Failed to refresh token');
      throw new Error('Token refresh failed');
    }
  }

  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      logger.warn({ error }, 'Failed to decode token expiry');
      return null;
    }
  }
}