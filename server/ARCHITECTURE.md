# Backend Architecture Documentation

## Overview

This backend follows a layered architecture pattern with clear separation of concerns, integrating production-ready tools and following modern Express.js best practices.

## Architecture Layers

### 1. Controllers Layer (`/controllers`)
- **Purpose**: Handle HTTP requests/responses and input validation
- **Responsibilities**: 
  - Parse request parameters and body
  - Call appropriate service methods
  - Format responses using standardized patterns
  - Handle HTTP-specific concerns (status codes, headers)

**Example**: `projectController.createProject()` validates input, calls `projectService.createProject()`, and returns formatted response.

### 2. Services Layer (`/services`) 
- **Purpose**: Business logic and database operations
- **Responsibilities**:
  - Core business logic implementation
  - Database queries and data manipulation
  - Data transformation and validation
  - Integration with external services

**Services**:
- `UserService` - Authentication and profile management
- `ProjectService` - Project CRUD, token validation, access logging
- `DeliverableService` - File management and permissions
- `MessageService` - Threading, notifications, read status
- `InvoiceService` - Billing and payment tracking
- `FeedbackService` - Ratings and analytics

### 3. Middlewares Layer (`/middlewares`)
- **Purpose**: Cross-cutting concerns and request processing
- **Responsibilities**:
  - Authentication and authorization
  - Request validation and sanitization
  - Error handling and logging
  - Rate limiting and security

**Middlewares**:
- `auth.middleware` - Authentication checks and project access control
- `validation.middleware` - Zod-based request validation
- `error.middleware` - Centralized error handling with standardized responses
- `logging.middleware` - Pino-based structured logging and rate limiting

### 4. Workers Layer (`/workers`)
- **Purpose**: Background job processing
- **Responsibilities**:
  - Asynchronous task execution
  - Scheduled jobs and maintenance
  - Queue management with BullMQ

**Implementation**: Redis-backed job queue with exponential backoff and retry policies.

### 5. Utils Layer (`/utils`)
- **Purpose**: Shared utilities and helper functions
- **Utilities**:
  - `jwt.ts` - Enhanced JWT token management
  - `storage.ts` - File upload with S3 integration ready
  - `sentry.ts` - Error monitoring and performance tracking
  - `response.ts` - Standardized API response helpers

## Production Features

### Logging (Pino)
- Structured JSON logging in production
- Pretty-printed logs in development
- Request/response logging with timing
- Error tracking with context

### Rate Limiting
- Global rate limiting (100 req/15min)
- Stricter auth rate limiting (5 req/15min)
- IP-based tracking with Redis backend
- Configurable limits per endpoint

### Background Jobs (BullMQ + Redis)
- Email notifications
- File processing
- Cleanup tasks
- Analytics processing

### Error Monitoring (Sentry)
- Exception tracking
- Performance monitoring
- User context capturing
- Environment-specific configuration

### Security Features
- JWT-based authentication
- 90-day share tokens with validation
- Role-based access control
- File upload validation
- CORS and security headers

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Description",
  "data": {...}, // For successful responses
  "errors": [...] // For validation errors
}
```

## Database Layer (Drizzle ORM)
- Type-safe queries with PostgreSQL
- Schema-first approach
- Migration management
- Connection pooling

## File Storage
- Local storage for development
- S3 integration ready for production
- File type validation
- Size limits and security checks

## Environment Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing secret
- `REDIS_HOST/PORT/PASSWORD` - Redis configuration
- `SENTRY_DSN` - Error monitoring (optional)
- `AWS_*` - S3 configuration (optional)

## Future Enhancements

1. **Microservices Migration**: Services can be extracted into separate microservices
2. **API Gateway**: Add Kong or similar for request routing
3. **Caching Layer**: Redis-based caching for frequently accessed data
4. **Message Bus**: Event-driven architecture with message queues
5. **Monitoring**: Prometheus/Grafana for metrics and alerting

## Development Guidelines

1. **Service Methods**: Keep services focused on single responsibilities
2. **Controller Logic**: Minimal logic, delegate to services
3. **Error Handling**: Use centralized error middleware
4. **Validation**: Validate at controller level using Zod schemas
5. **Testing**: Unit tests for services, integration tests for controllers
6. **Documentation**: Update this file when adding new layers or services

This architecture provides a solid foundation for scaling from a monolith to microservices while maintaining clean separation of concerns and professional development practices.