/**
 * JWT Middleware for Client Token Authentication
 * Provides secure, short-lived token alternatives to long-lived database tokens
 */

import { Request, Response, NextFunction } from 'express';
import { 
  generateClientAccessToken, 
  verifyClientAccessToken, 
  refreshClientAccessToken,
  isTokenExpired,
  hasPermission 
} from '../services/jwt.service.js';

/**
 * Generate JWT token for client access
 */
export const generateJWTForClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareToken } = req.params;
    const { clientName, expiresInHours = 24 } = req.body;

    if (!shareToken) {
      return res.status(400).json({ error: 'Share token is required' });
    }

    // Verify the original share token exists and is valid
    // This would be done through your existing project service
    const projectId = (req as any).project?.id; // Assuming project is attached by middleware

    if (!projectId) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const accessToken = generateClientAccessToken(
      projectId,
      shareToken,
      clientName || 'Client User',
      expiresInHours
    );

    res.json({
      success: true,
      accessToken: accessToken.token,
      expiresAt: accessToken.expiresAt,
      expiresIn: accessToken.expiresIn,
    });

  } catch (error) {
    console.error('JWT generation error:', error);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
};

/**
 * Middleware to verify JWT tokens for client access
 */
export const verifyJWTToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if token is expired first (faster check)
  if (isTokenExpired(token)) {
    return res.status(401).json({ 
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  const payload = verifyClientAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid access token' });
  }

  // Attach token payload to request for downstream use
  (req as any).clientToken = payload;
  (req as any).project = { id: payload.projectId }; // For compatibility with existing middleware

  next();
};

/**
 * Middleware to refresh expired tokens
 */
export const refreshToken = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const newAccessToken = refreshClientAccessToken(token);

  if (!newAccessToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  res.json({
    success: true,
    accessToken: newAccessToken.token,
    expiresAt: newAccessToken.expiresAt,
    expiresIn: newAccessToken.expiresIn,
  });
};

/**
 * Permission-based access control middleware
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token || !hasPermission(token, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    }

    next();
  };
};

/**
 * Enhanced client authentication that supports both share tokens and JWTs
 */
export const hybridClientAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const jwtToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { shareToken } = req.params;

  // If JWT token provided, use JWT authentication
  if (jwtToken) {
    return verifyJWTToken(req, res, next);
  }

  // If share token provided, use traditional token authentication
  if (shareToken) {
    // This would fall back to your existing share token validation
    return next(); // Let existing middleware handle share token
  }

  return res.status(401).json({ 
    error: 'Authentication required',
    message: 'Provide either Authorization header with JWT or share token in URL'
  });
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      clientToken?: {
        projectId: string;
        shareToken: string;
        clientName: string;
        permissions: string[];
        type: 'client-access';
      };
    }
  }
}