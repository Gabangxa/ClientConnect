import { Queue } from "bullmq";
import { logger } from '../middlewares/logging.middleware';

// Import individual workers following your pattern
import thumbnailWorker from './thumbnails.worker';
import emailWorker from './email.worker';
import cleanupWorker from './cleanup.worker';

const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };

// Create queues for different job types
export const thumbnailQueue = new Queue("thumbnails", connection);
export const emailQueue = new Queue("email-notifications", connection);
export const cleanupQueue = new Queue("cleanup-tasks", connection);

// Job creation utilities following your pattern
export class JobService {
  // Add thumbnail generation job
  static async addThumbnailJob(data: {
    fileKey: string;
    originalFilename: string;
    projectId: string;
    mimeType: string;
  }) {
    try {
      const job = await thumbnailQueue.add("generate-thumbnail", data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
      
      logger.info({ jobId: job.id, fileKey: data.fileKey }, 'Thumbnail job queued');
      return job;
    } catch (error) {
      logger.error({ error, data }, 'Failed to queue thumbnail job');
      throw error;
    }
  }

  // Add email notification job
  static async addEmailJob(data: {
    type: 'new-message' | 'deliverable-uploaded' | 'invoice-created' | 'feedback-request';
    recipientEmail: string;
    projectId: string;
    data?: any;
  }) {
    try {
      const job = await emailQueue.add("send-notification", data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        delay: 5000, // Wait 5 seconds before sending email
      });
      
      logger.info({ jobId: job.id, type: data.type, recipientEmail: data.recipientEmail }, 'Email job queued');
      return job;
    } catch (error) {
      logger.error({ error, data }, 'Failed to queue email job');
      throw error;
    }
  }

  // Add cleanup job
  static async addCleanupJob(data: {
    task: 'expire-tokens' | 'delete-temp-files' | 'archive-old-data' | 'optimize-storage' | 'generate-analytics';
    data?: any;
  }) {
    try {
      const job = await cleanupQueue.add("cleanup-task", data, {
        attempts: 2,
        delay: 10000, // Wait 10 seconds
      });
      
      logger.info({ jobId: job.id, task: data.task }, 'Cleanup job queued');
      return job;
    } catch (error) {
      logger.error({ error, data }, 'Failed to queue cleanup job');
      throw error;
    }
  }

  // Get queue statistics
  static async getQueueStats() {
    try {
      const [thumbnailStats, emailStats, cleanupStats] = await Promise.all([
        thumbnailQueue.getJobCounts(),
        emailQueue.getJobCounts(),
        cleanupQueue.getJobCounts(),
      ]);

      return {
        thumbnails: thumbnailStats,
        emails: emailStats,
        cleanup: cleanupStats,
        total: {
          waiting: thumbnailStats.waiting + emailStats.waiting + cleanupStats.waiting,
          active: thumbnailStats.active + emailStats.active + cleanupStats.active,
          completed: thumbnailStats.completed + emailStats.completed + cleanupStats.completed,
          failed: thumbnailStats.failed + emailStats.failed + cleanupStats.failed,
        }
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get queue stats');
      return null;
    }
  }

  // Schedule recurring cleanup jobs
  static async scheduleRecurringJobs() {
    try {
      // Schedule daily cleanup at 2 AM
      await cleanupQueue.add("cleanup-task", {
        task: 'expire-tokens'
      }, {
        repeat: { cron: '0 2 * * *' }, // Daily at 2 AM
        removeOnComplete: 5,
        removeOnFail: 5,
      });

      // Schedule weekly file cleanup on Sundays at 3 AM
      await cleanupQueue.add("cleanup-task", {
        task: 'delete-temp-files'
      }, {
        repeat: { cron: '0 3 * * 0' }, // Sundays at 3 AM
        removeOnComplete: 5,
        removeOnFail: 5,
      });

      // Schedule monthly analytics generation on 1st at 4 AM
      await cleanupQueue.add("cleanup-task", {
        task: 'generate-analytics',
        data: { period: 'monthly' }
      }, {
        repeat: { cron: '0 4 1 * *' }, // 1st of month at 4 AM
        removeOnComplete: 5,
        removeOnFail: 5,
      });

      logger.info('Recurring jobs scheduled successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to schedule recurring jobs');
    }
  }
}

// Initialize workers and scheduling only in production or when enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WORKERS === 'true') {
  // Workers are automatically initialized when imported
  logger.info('Background workers initialized', {
    workers: ['thumbnails', 'email-notifications', 'cleanup-tasks']
  });

  // Schedule recurring jobs
  JobService.scheduleRecurringJobs();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down job queues...');
  await Promise.all([
    thumbnailQueue.close(),
    emailQueue.close(),
    cleanupQueue.close(),
  ]);
  process.exit(0);
});

export { thumbnailWorker, emailWorker, cleanupWorker };