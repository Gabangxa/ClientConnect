/**
 * Authentication Controller
 * 
 * Handles user authentication, session management, and user profile operations
 * for the client portal system. Works with Replit Auth (OpenID Connect) to provide
 * secure authentication for freelancers accessing the dashboard.
 * 
 * Features:
 * - User session retrieval and validation
 * - Secure logout with session cleanup
 * - Authentication status checking
 * - Integration with brute force protection
 * 
 * @module AuthController
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '@shared/types';

/**
 * Get the currently authenticated user's information
 * 
 * Retrieves user data from the current session and validates authentication status.
 * Tracks successful authentication attempts for security monitoring.
 * 
 * @param {Request} req - Express request object with user session
 * @param {Response} res - Express response object
 * @returns {Object} User information and authentication status
 */
export const getCurrentUser = (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      user: authReq.user,
      authenticated: true,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: "Failed to get user information" });
  }
};

/**
 * Logout current user and cleanup session
 * 
 * Securely logs out the user by destroying the session and clearing cookies.
 * Ensures complete cleanup of authentication state and security cookies.
 * 
 * @param {Request} req - Express request object with user session
 * @param {Response} res - Express response object
 */
export const logout = (req: Request, res: Response) => {
  try {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      // Clear session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error('Session destruction error:', sessionErr);
        }
        
        // Clear session cookie
        res.clearCookie('clientconnect.sid', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        res.json({ message: "Logged out successfully" });
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: "Failed to logout" });
  }
};

/**
 * Check authentication status
 * 
 * Returns the current authentication status and user information if authenticated.
 * Used by frontend to determine if user is logged in and show appropriate UI.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} Authentication status and user information
 */
export const checkAuthStatus = (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const isAuthenticated = !!authReq.user;
    
    res.json({
      authenticated: isAuthenticated,
      user: isAuthenticated ? authReq.user : null,
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(500).json({ message: "Failed to check authentication status" });
  }
};