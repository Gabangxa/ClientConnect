import { Response } from 'express';

// Standardized API response helpers following boilerplate patterns
export class ApiResponse {
  static success(res: Response, data?: any, message = 'Success') {
    return res.json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message = 'Internal Server Error', statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  static validationError(res: Response, errors: any[], message = 'Validation Error') {
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
    });
  }

  static notFound(res: Response, message = 'Not Found') {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  static conflict(res: Response, message = 'Conflict') {
    return res.status(409).json({
      success: false,
      message,
    });
  }

  static tooManyRequests(res: Response, message = 'Too Many Requests') {
    return res.status(429).json({
      success: false,
      message,
    });
  }
}

// Helper function for paginated responses
export function paginatedResponse(data: any[], page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}