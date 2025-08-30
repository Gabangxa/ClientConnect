/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the Express application.
 * Provides consistent error response formatting and proper HTTP status codes
 * for different types of errors including validation, database, and file upload errors.
 * 
 * Features:
 * - Zod validation error formatting
 * - Database constraint error handling
 * - File upload error processing
 * - Structured error responses
 * 
 * @module ErrorMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Global error handler middleware
 * 
 * Catches all unhandled errors in the Express application and formats them
 * into consistent JSON responses with appropriate HTTP status codes.
 * 
 * @param {any} error - The error object from Express
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Next middleware function
 */
export const errorHandler = (
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error('Error occurred:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      message: "Resource already exists",
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      message: "Invalid reference to related resource",
    });
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      message: "File too large. Maximum size is 10MB",
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: "Unexpected file field",
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
  });
};