import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { Request } from 'express';
import { logger } from '../middlewares/logging.middleware';

// AWS S3 configuration (prepared for future use)
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
};

const s3 = new AWS.S3(s3Config);
const bucketName = process.env.S3_BUCKET_NAME || 'client-portal-files';

// File upload configuration
const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

// S3 upload configuration (for future use)
export const s3Upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => {
      cb(null, {
        fieldName: file.fieldname,
        uploadedBy: (req as any).user?.claims?.sub || 'anonymous',
        uploadedAt: new Date().toISOString(),
      });
    },
    key: (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, `uploads/${fileName}`);
    },
  }),
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Local storage configuration (current implementation)
export const localStorage = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// Storage service for managing file operations
export class StorageService {
  static async uploadToS3(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      const params = {
        Bucket: bucketName,
        Key: `uploads/${fileName}`,
        Body: buffer,
        ContentType: contentType,
        ACL: 'private', // Files are private by default
      };

      const result = await s3.upload(params).promise();
      logger.info({ fileName, location: result.Location }, 'File uploaded to S3');
      return result.Location;
    } catch (error) {
      logger.error({ error, fileName }, 'Failed to upload file to S3');
      throw new Error('File upload failed');
    }
  }

  static async deleteFromS3(fileName: string): Promise<void> {
    try {
      const params = {
        Bucket: bucketName,
        Key: `uploads/${fileName}`,
      };

      await s3.deleteObject(params).promise();
      logger.info({ fileName }, 'File deleted from S3');
    } catch (error) {
      logger.error({ error, fileName }, 'Failed to delete file from S3');
      throw new Error('File deletion failed');
    }
  }

  static async generateSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: bucketName,
        Key: `uploads/${fileName}`,
        Expires: expiresIn, // 1 hour by default
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      logger.info({ fileName, expiresIn }, 'Generated signed URL');
      return url;
    } catch (error) {
      logger.error({ error, fileName }, 'Failed to generate signed URL');
      throw new Error('URL generation failed');
    }
  }

  static isS3Enabled(): boolean {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME);
  }
}

// Export the appropriate upload middleware based on configuration
export const fileUpload = StorageService.isS3Enabled() ? s3Upload : localStorage;