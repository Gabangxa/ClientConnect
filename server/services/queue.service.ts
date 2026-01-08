import { db } from "../db";
import { backgroundJobs } from "@shared/schema";
import { eq, lt, and, or, asc } from "drizzle-orm";

type JobHandler = (payload: any) => Promise<void>;

export class QueueService {
  private static instance: QueueService;
  private handlers: Map<string, JobHandler> = new Map();
  private isPolling: boolean = false;
  private pollIntervalMs: number = 5000; // Poll every 5 seconds

  private constructor() {}

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Register a handler for a specific job type.
   */
  registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
    console.log(`[Queue] Registered handler for job type: ${type}`);
  }

  /**
   * Add a job to the queue.
   */
  async addJob(type: string, payload: any, delaySeconds: number = 0) {
    try {
      const nextRunAt = new Date(Date.now() + delaySeconds * 1000);
      await db.insert(backgroundJobs).values({
        type,
        payload,
        status: "pending",
        nextRunAt,
      });
      console.log(`[Queue] Added job ${type} to queue`);
    } catch (error) {
      console.error(`[Queue] Error adding job ${type}:`, error);
      throw error;
    }
  }

  /**
   * Start the polling worker.
   */
  start() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log("[Queue] Starting worker...");
    this.poll();
  }

  private async poll() {
    if (!this.isPolling) return;

    try {
      // Fetch next pending job
      const now = new Date();
      const job = await db.query.backgroundJobs.findFirst({
        where: and(
          or(eq(backgroundJobs.status, "pending"), eq(backgroundJobs.status, "retry")),
          lt(backgroundJobs.nextRunAt, now)
        ),
        orderBy: [asc(backgroundJobs.nextRunAt)],
      });

      if (job) {
        await this.processJob(job);
        // If we found a job, poll again immediately to check for more
        setImmediate(() => this.poll());
      } else {
        // No jobs, wait for interval
        setTimeout(() => this.poll(), this.pollIntervalMs);
      }
    } catch (error) {
      console.error("[Queue] Polling error:", error);
      setTimeout(() => this.poll(), this.pollIntervalMs);
    }
  }

  private async processJob(job: typeof backgroundJobs.$inferSelect) {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      console.error(`[Queue] No handler found for job type: ${job.type}`);
      await db
        .update(backgroundJobs)
        .set({ status: "failed", lastError: "No handler registered" })
        .where(eq(backgroundJobs.id, job.id));
      return;
    }

    // Mark as processing
    await db
      .update(backgroundJobs)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(backgroundJobs.id, job.id));

    try {
      await handler(job.payload);

      // Mark as completed
      await db
        .update(backgroundJobs)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(backgroundJobs.id, job.id));

    } catch (error: any) {
      console.error(`[Queue] Job ${job.id} failed:`, error);

      const maxRetries = 3;
      const attempts = (job.attempts || 0) + 1;

      if (attempts >= maxRetries) {
        // Fail permanently
        await db
          .update(backgroundJobs)
          .set({
            status: "failed",
            attempts,
            lastError: error.message || "Unknown error",
            updatedAt: new Date()
          })
          .where(eq(backgroundJobs.id, job.id));
      } else {
        // Schedule retry (exponential backoff)
        const delaySeconds = Math.pow(2, attempts) * 30; // 30s, 60s, 120s...
        const nextRunAt = new Date(Date.now() + delaySeconds * 1000);

        await db
          .update(backgroundJobs)
          .set({
            status: "retry",
            attempts,
            lastError: error.message || "Unknown error",
            nextRunAt,
            updatedAt: new Date()
          })
          .where(eq(backgroundJobs.id, job.id));
      }
    }
  }
}

export const queueService = QueueService.getInstance();
