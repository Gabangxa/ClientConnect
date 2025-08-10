import { Request, Response } from 'express';
import { StorageService } from '../utils/storage';
import { logger } from '../middlewares/logging.middleware';
import { ApiResponse } from '../utils/response';

class UploadController {
  // Generate signed URL for direct S3 uploads
  static async generateUploadUrl(req: Request, res: Response) {
    try {
      const { filename, mimeType } = req.body;

      if (!filename || !mimeType) {
        return ApiResponse.validationError(res, 
          [{ field: 'filename', message: 'Filename is required' },
           { field: 'mimeType', message: 'MIME type is required' }]);
      }

      // Check if S3 is enabled
      if (!StorageService.isS3Enabled()) {
        return ApiResponse.error(res, 'S3 storage not configured', 503);
      }

      const { uploadUrl, key } = await StorageService.generateUploadURL(filename, mimeType);

      logger.info({ 
        filename, 
        mimeType, 
        key,
        userId: (req as any).user?.claims?.sub 
      }, 'Upload URL generated');

      return ApiResponse.success(res, {
        uploadUrl,
        key,
        expiresIn: 300 // 5 minutes
      }, 'Upload URL generated successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to generate upload URL');
      return ApiResponse.error(res, 'Failed to generate upload URL', 500);
    }
  }

  // Confirm upload completion (save metadata to database)
  static async confirmUpload(req: Request, res: Response) {
    try {
      const { key, originalFilename, size, projectId } = req.body;

      if (!key || !originalFilename || !projectId) {
        return ApiResponse.validationError(res, 
          [{ field: 'key', message: 'S3 key is required' },
           { field: 'originalFilename', message: 'Original filename is required' },
           { field: 'projectId', message: 'Project ID is required' }]);
      }

      // Here you would save the file metadata to your database
      // This confirms the upload was successful and creates the deliverable record
      
      const fileUrl = StorageService.getFileUrl(key, true);

      logger.info({ 
        key, 
        originalFilename, 
        projectId,
        userId: (req as any).user?.claims?.sub 
      }, 'Upload confirmed');

      return ApiResponse.success(res, {
        key,
        url: fileUrl,
        filename: originalFilename,
        size
      }, 'Upload confirmed successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to confirm upload');
      return ApiResponse.error(res, 'Failed to confirm upload', 500);
    }
  }

  // Generate download URL for private S3 files
  static async generateDownloadUrl(req: Request, res: Response) {
    try {
      const { key } = req.params;

      if (!key) {
        return ApiResponse.validationError(res, 
          [{ field: 'key', message: 'File key is required' }]);
      }

      // Check if S3 is enabled
      if (!StorageService.isS3Enabled()) {
        return ApiResponse.error(res, 'S3 storage not configured', 503);
      }

      const downloadUrl = await StorageService.generateSignedUrl(key, 3600);

      logger.info({ 
        key,
        userId: (req as any).user?.claims?.sub 
      }, 'Download URL generated');

      return ApiResponse.success(res, {
        downloadUrl,
        expiresIn: 3600 // 1 hour
      }, 'Download URL generated successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to generate download URL');
      return ApiResponse.error(res, 'Failed to generate download URL', 500);
    }
  }
}

export const uploadController = UploadController;