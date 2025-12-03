import type { Request, Response } from "express";
import { analyticsService } from "../services";

export const analyticsController = {
  async getOverview(req: Request, res: Response) {
    try {
      const user = req.user as { id: string } | undefined;
      if (!user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const overview = await analyticsService.getOverview(user.id);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  },

  async getProjectStats(req: Request, res: Response) {
    try {
      const user = req.user as { id: string } | undefined;
      if (!user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await analyticsService.getProjectStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({ message: "Failed to fetch project stats" });
    }
  },

  async getRevenueStats(req: Request, res: Response) {
    try {
      const user = req.user as { id: string } | undefined;
      if (!user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await analyticsService.getRevenueStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
      res.status(500).json({ message: "Failed to fetch revenue stats" });
    }
  },

  async getActivityStats(req: Request, res: Response) {
    try {
      const user = req.user as { id: string } | undefined;
      if (!user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await analyticsService.getActivityStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ message: "Failed to fetch activity stats" });
    }
  },
};
