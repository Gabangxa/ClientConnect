import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services';

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to validate project access for freelancers
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