import {
  feedback,
  type Feedback,
  type InsertFeedback,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

export class FeedbackService {
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }

  async getFeedbackByProject(projectId: string): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .where(eq(feedback.projectId, projectId))
      .orderBy(desc(feedback.createdAt));
  }

  async getFeedbackById(id: string): Promise<Feedback | undefined> {
    const [feedbackItem] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id));
    return feedbackItem;
  }

  async getAverageRating(projectId: string): Promise<number> {
    const result = await db
      .select()
      .from(feedback)
      .where(eq(feedback.projectId, projectId));
    
    if (result.length === 0) return 0;
    
    const totalRating = result.reduce((sum, item) => sum + (item.rating || 0), 0);
    return Math.round((totalRating / result.length) * 10) / 10; // Round to 1 decimal
  }

  async getFeedbackStats(projectId: string): Promise<{
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  }> {
    const feedbackList = await this.getFeedbackByProject(projectId);
    const totalFeedback = feedbackList.length;
    const averageRating = await this.getAverageRating(projectId);
    
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackList.forEach(item => {
      if (item.rating) {
        ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
      }
    });

    return {
      totalFeedback,
      averageRating,
      ratingDistribution,
    };
  }
}

export const feedbackService = new FeedbackService();