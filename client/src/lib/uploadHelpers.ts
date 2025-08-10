// Frontend helpers for S3 direct uploads
import { apiRequest } from './queryClient';

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface UploadConfirmRequest {
  key: string;
  originalFilename: string;
  size: number;
  projectId: string;
}

// Generate signed URL for direct S3 upload
export async function generateUploadUrl(filename: string, mimeType: string): Promise<UploadUrlResponse> {
  const response = await apiRequest('/api/upload/signed-url', {
    method: 'POST',
    body: JSON.stringify({ filename, mimeType }),
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to generate upload URL');
  }

  return response.data;
}

// Upload file directly to S3
export async function uploadToS3(file: File, uploadUrl: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

// Confirm upload completion with backend
export async function confirmUpload(data: UploadConfirmRequest): Promise<any> {
  const response = await apiRequest('/api/upload/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to confirm upload');
  }

  return response.data;
}

// Complete S3 upload flow
export async function uploadFileToS3(file: File, projectId: string): Promise<any> {
  try {
    // Step 1: Generate signed URL
    const { uploadUrl, key } = await generateUploadUrl(file.name, file.type);

    // Step 2: Upload directly to S3
    await uploadToS3(file, uploadUrl);

    // Step 3: Confirm upload with backend
    const result = await confirmUpload({
      key,
      originalFilename: file.name,
      size: file.size,
      projectId,
    });

    return result;
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw error;
  }
}

// Generate download URL for private S3 files
export async function generateDownloadUrl(key: string): Promise<string> {
  const response = await apiRequest(`/api/download/${encodeURIComponent(key)}`, {
    method: 'GET',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to generate download URL');
  }

  return response.data.downloadUrl;
}

// Hook for S3 upload with progress tracking
export function useS3Upload() {
  const uploadFile = async (
    file: File, 
    projectId: string,
    onProgress?: (progress: number) => void
  ) => {
    try {
      if (onProgress) onProgress(10); // Starting

      const { uploadUrl, key } = await generateUploadUrl(file.name, file.type);
      if (onProgress) onProgress(30); // URL generated

      // Create XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = 30 + (e.loaded / e.total) * 60; // 30-90%
            onProgress(Math.round(progress));
          }
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      if (onProgress) onProgress(95); // Upload complete

      const result = await confirmUpload({
        key,
        originalFilename: file.name,
        size: file.size,
        projectId,
      });

      if (onProgress) onProgress(100); // Complete
      return result;

    } catch (error) {
      console.error('S3 upload failed:', error);
      throw error;
    }
  };

  return { uploadFile };
}