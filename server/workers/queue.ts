import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../middlewares/logging.middleware';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
};

// Create Redis connection
export const redis = new IORedis(redisConfig);

// Queue for background jobs
export const backgroundQueue = new Queue('background-jobs', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job types
export interface EmailJobData {
  type: 'email';
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface FileProcessingJobData {
  type: 'file-processing';
  filePath: string;
  projectId: string;
  deliverableId: string;
}

export interface CleanupJobData {
  type: 'cleanup';
  target: 'expired-tokens' | 'old-files' | 'logs';
  olderThan?: Date;
}

export type JobData = EmailJobData | FileProcessingJobData | CleanupJobData;

// Queue management functions
export class QueueService {
  static async addEmailJob(data: Omit<EmailJobData, 'type'>) {
    try {
      const job = await backgroundQueue.add('email', { ...data, type: 'email' });
      logger.info({ jobId: job.id }, 'Email job queued');
      return job;
    } catch (error) {
      logger.error({ error }, 'Failed to queue email job');
      throw error;
    }
  }

  static async addFileProcessingJob(data: Omit<FileProcessingJobData, 'type'>) {
    try {
      const job = await backgroundQueue.add('file-processing', { ...data, type: 'file-processing' });
      logger.info({ jobId: job.id }, 'File processing job queued');
      return job;
    } catch (error) {
      logger.error({ error }, 'Failed to queue file processing job');
      throw error;
    }
  }

  static async addCleanupJob(data: Omit<CleanupJobData, 'type'>) {
    try {
      const job = await backgroundQueue.add('cleanup', { ...data, type: 'cleanup' }, {
        delay: 5000, // Wait 5 seconds before processing
      });
      logger.info({ jobId: job.id }, 'Cleanup job queued');
      return job;
    } catch (error) {
      logger.error({ error }, 'Failed to queue cleanup job');
      throw error;
    }
  }

  static async getQueueStats() {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        backgroundQueue.getWaiting(),
        backgroundQueue.getActive(),
        backgroundQueue.getCompleted(),
        backgroundQueue.getFailed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get queue stats');
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
  }
}

// Initialize worker when in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WORKERS === 'true') {
  const worker = new Worker('background-jobs', async (job: Job<JobData>) => {
    logger.info({ jobId: job.id, jobType: job.data.type }, 'Processing job');
    
    switch (job.data.type) {
      case 'email':
        // TODO: Implement email sending logic
        logger.info({ jobId: job.id }, 'Email job processed (stub)');
        break;
        
      case 'file-processing':
        // TODO: Implement file processing logic
        logger.info({ jobId: job.id }, 'File processing job processed (stub)');
        break;
        
      case 'cleanup':
        // TODO: Implement cleanup logic
        logger.info({ jobId: job.id }, 'Cleanup job processed (stub)');
        break;
        
      default:
        throw new Error(`Unknown job type: ${(job.data as any).type}`);
    }
  }, {
    connection: redis,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Job failed');
  });

  logger.info('Background worker initialized');
}