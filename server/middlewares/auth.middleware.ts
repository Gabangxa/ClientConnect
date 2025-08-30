/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization middleware functions for securing
 * API routes. Handles both freelancer authentication and client token validation
 * with proper project access control.
 * 
 * Features:
 * - Session-based authentication validation
 * - Role-based project access control
 * - Share token validation for client access
 * - Project ownership verification
 * 
 * @module AuthMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services';

/**
 * Middleware to check if user is authenticated
 * 
 * Validates that the request contains a valid user session.
 * Used to protect freelancer-only routes that require authentication.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Next middleware function
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

/**
 * Project access validation middleware factory
 * 
 * Creates middleware that validates project access based on user role.
 * For freelancers: validates project ownership through authentication
 * For clients: validates access through share token system
 * 
 * @param {string} role - Either 'freelancer' or 'client'
 * @returns {Function} Express middleware function
 */
export const withProjectAccess = (role: 'freelancer' | 'client') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (role === 'freelancer') {
        // For freelancer routes, check project ownership
        const { projectId } = req.params;
        const userId = (req.user as any)?.claims?.sub;
        
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const project = await projectService.getProjectById(projectId);
        if (!project || project.freelancerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        (req as any).project = project;
      } else if (role === 'client') {
        // For client routes, validate share token
        const { shareToken } = req.params;
        
        if (!shareToken) {
          return res.status(400).json({ message: "Share token required" });
        }

        const validation = await projectService.validateShareToken(shareToken);
        if (!validation.valid || !validation.project) {
          return res.status(403).json({ message: "Invalid or expired share token" });
        }

        (req as any).project = validation.project;
      }

      next();
    } catch (error) {
      console.error('Project access validation error:', error);
      res.status(500).json({ message: "Failed to validate project access" });
    }
  };
};