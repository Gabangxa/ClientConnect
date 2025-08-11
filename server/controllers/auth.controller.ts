/**
 * Enhanced Authentication Controller with Security Features
 */

import { Request, Response } from 'express';

export const getCurrentUser = (req: Request, res: Response) => {
  try {
    // Track successful authentication
    if (req.authAttemptTracking) {
      req.authAttemptTracking.recordSuccess();
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      user: req.user,
      authenticated: true,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: "Failed to get user information" });
  }
};

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

export const checkAuthStatus = (req: Request, res: Response) => {
  try {
    const isAuthenticated = !!req.user;
    
    res.json({
      authenticated: isAuthenticated,
      user: isAuthenticated ? req.user : null,
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(500).json({ message: "Failed to check authentication status" });
  }
};