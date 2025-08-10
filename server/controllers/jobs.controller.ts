import { Request, Response } from 'express';
import { JobService } from '../workers';
import { ApiResponse } from '../utils/response';
import { logger } from '../middlewares/logging.middleware';

class JobsController {
  // Get queue statistics
  static async getQueueStats(req: Request, res: Response) {
    try {
      const stats = await JobService.getQueueStats();
      
      if (!stats) {
        return ApiResponse.error(res, 'Failed to retrieve queue statistics', 500);
      }

      return ApiResponse.success(res, stats, 'Queue statistics retrieved successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to get queue stats');
      return ApiResponse.error(res, 'Failed to retrieve queue statistics', 500);
    }
  }

  // Manually trigger thumbnail generation
  static async createThumbnailJob(req: Request, res: Response) {
    try {
      const { fileKey, originalFilename, projectId, mimeType } = req.body;

      if (!fileKey || !originalFilename || !projectId) {
        return ApiResponse.validationError(res, [
          { field: 'fileKey', message: 'File key is required' },
          { field: 'originalFilename', message: 'Original filename is required' },
          { field: 'projectId', message: 'Project ID is required' }
        ]);
      }

      const job = await JobService.addThumbnailJob({
        fileKey,
        originalFilename,
        projectId,
        mimeType: mimeType || 'application/octet-stream'
      });

      return ApiResponse.success(res, {
        jobId: job.id,
        status: 'queued'
      }, 'Thumbnail job created successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to create thumbnail job');
      return ApiResponse.error(res, 'Failed to create thumbnail job', 500);
    }
  }

  // Manually trigger email notification
  static async createEmailJob(req: Request, res: Response) {
    try {
      const { type, recipientEmail, projectId, data } = req.body;

      if (!type || !recipientEmail || !projectId) {
        return ApiResponse.validationError(res, [
          { field: 'type', message: 'Email type is required' },
          { field: 'recipientEmail', message: 'Recipient email is required' },
          { field: 'projectId', message: 'Project ID is required' }
        ]);
      }

      const validTypes = ['new-message', 'deliverable-uploaded', 'invoice-created', 'feedback-request'];
      if (!validTypes.includes(type)) {
        return ApiResponse.validationError(res, [
          { field: 'type', message: `Type must be one of: ${validTypes.join(', ')}` }
        ]);
      }

      const job = await JobService.addEmailJob({
        type,
        recipientEmail,
        projectId,
        data
      });

      return ApiResponse.success(res, {
        jobId: job.id,
        status: 'queued'
      }, 'Email job created successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to create email job');
      return ApiResponse.error(res, 'Failed to create email job', 500);
    }
  }

  // Manually trigger cleanup job
  static async createCleanupJob(req: Request, res: Response) {
    try {
      const { task, data } = req.body;

      if (!task) {
        return ApiResponse.validationError(res, [
          { field: 'task', message: 'Cleanup task is required' }
        ]);
      }

      const validTasks = ['expire-tokens', 'delete-temp-files', 'archive-old-data', 'optimize-storage', 'generate-analytics'];
      if (!validTasks.includes(task)) {
        return ApiResponse.validationError(res, [
          { field: 'task', message: `Task must be one of: ${validTasks.join(', ')}` }
        ]);
      }

      const job = await JobService.addCleanupJob({ task, data });

      return ApiResponse.success(res, {
        jobId: job.id,
        status: 'queued'
      }, 'Cleanup job created successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to create cleanup job');
      return ApiResponse.error(res, 'Failed to create cleanup job', 500);
    }
  }
}

export const jobsController = JobsController;