# Client Portal Application

## Overview

This is a professional client portal application built for freelancers and service providers to share deliverables, track invoices, and communicate with clients through branded dashboards. The application features a full-stack architecture with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Workflows

### Freelancer Workflow (Authenticated Dashboard)
1. **Sign Up & Authentication**: Log in using Replit authentication to access the dashboard
2. **Create Client Projects**: Set up new projects with client information, project details, and timeline
3. **Share Portal Access**: System generates unique 90-day share tokens for each project that clients can access without accounts
4. **Manage Deliverables**: Upload files, documents, and completed work with full CRUD permissions
5. **Client Communication**: View and respond to client messages through the dedicated messaging section on dashboard
6. **Invoice Management**: Create, edit, and track invoices with status updates (draft, sent, paid)
7. **Monitor Feedback**: Review client ratings and feedback for completed work
8. **Security Controls**: Regenerate share tokens, view access logs, and track client activity
9. **Manage Client Portals**: Access client portals with authenticated freelancer view to monitor activity and manage content

### Client Workflow (Share Link Access)
1. **Access Portal**: Receive share link from freelancer - no account creation required (90-day token validity)
2. **View Project Dashboard**: See branded project overview with timeline, deliverables, and communication
3. **Download Deliverables**: Access and download completed work and files shared by freelancer
4. **Upload Files**: Share files and documents with freelancer (with deletion rights for own uploads)
5. **Send Messages**: Communicate directly with freelancer through built-in messaging system
6. **Review Invoices**: View invoice details, amounts, and payment status (read-only)
7. **Provide Feedback**: Rate completed work and leave comments using star rating system
8. **Track Progress**: Monitor project status and timeline updates in real-time

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Progress (Phase 3 Complete - July 29, 2025)

✅ **Phase 1**: Security Foundation
- 90-day token expiration system
- Access logging with timestamps and IP tracking
- File ownership tracking (uploaderId, uploaderType)

✅ **Phase 2**: Permission System
- Role-based permission middleware (freelancer/client/guest)
- Dual API endpoint structure:
  - Freelancer: `/api/projects/{id}/...` (authenticated)
  - Client: `/api/client/{shareToken}/...` (token-based)
- Permission rules implemented:
  - Deliverables: Both can upload, only uploaders can delete
  - Messages: Both can send/receive
  - Invoices: Freelancers create/edit, clients view-only
  - Feedback: Clients create, both view
- File ownership validation for deletions

✅ **Phase 3**: Client Interface Complete
- Distinct client portal interface with client-focused design
- Client-specific components: ClientSidebar, ClientHeader, ClientStatusCards
- Client-oriented messaging and branding ("Client Portal", "Your Deliverables", etc.)
- Simplified navigation without freelancer-specific features
- Professional client experience with progress tracking and communication tools
- Clear separation between freelancer dashboard and client portal spaces

✅ **Phase 4**: Dual-Access System (Completed - August 3, 2025)
- Implemented freelancer authenticated view of client portals
- Created `/project/:projectId/client-view` route for freelancers to manage portals
- Added FreelancerClientView component showing portal management perspective
- Updated all dashboard links to use authenticated freelancer routes
- Enhanced backend API endpoints with proper role-based access control
- Freelancers maintain authenticated status while viewing client portals
- Clear visual distinction between freelancer management view and client view

✅ **Phase 5**: Unified Messaging System (Completed - August 9, 2025)
- Enhanced database schema with message threading (parentMessageId, threadId)
- Added message status tracking, priority levels, and messageType fields
- Created shared MessageThread and MessageComposer components for consistent UX
- Implemented proper reply threading with visual indicators
- Integrated unified messaging interface into both client portal and freelancer dashboard
- Replaced old dialog-based messaging with modern threaded conversation view
- Added priority settings (low, normal, high, urgent) for message organization
- Fixed all TypeScript errors and removed legacy form references
- Professional messaging experience with industry-standard threading patterns

✅ **Phase 6**: Backend Architecture Refactoring (Completed - August 10, 2025)
- Implemented complete backend restructuring with separation of concerns
- Created layered architecture: Controllers, Services, Middlewares, Workers
- Moved from monolithic storage to service-oriented architecture
- Enhanced error handling with centralized error middleware
- Improved security with dedicated authentication and authorization middlewares
- Added request logging and rate limiting capabilities
- Maintained API compatibility while improving maintainability
- Prepared foundation for future scalability and microservices migration

✅ **Phase 7**: Hybrid Storage System (Completed - August 11, 2025)
- Integrated Replit Object Storage with graceful local storage fallback
- Created hybrid storage service that automatically detects available storage
- Implemented smart file path generation for organized object storage
- Added unified download URL system for both storage types
- Maintained backward compatibility with existing local files
- Prepared infrastructure for seamless cloud storage scaling
- Zero-downtime deployment with automatic storage type detection

✅ **Phase 8**: Database Layer Optimization & CI/CD Automation (Completed - August 11, 2025)
- Implemented comprehensive database indexing strategy for high-traffic tables
- Added 39 performance indexes across all tables (projects, messages, deliverables, invoices, feedback, access logs, users)
- Created automated migration system with CI/CD integration
- Built database health monitoring and performance analysis tools
- Established backup and rollback capabilities for production deployments
- Implemented GitHub Actions workflow for automated schema validation and deployment
- Enhanced query performance for freelancer dashboards, message threading, and file access patterns

✅ **Phase 9**: Security Implementation & File Upload Protection (Completed - August 11, 2025)
- Implemented comprehensive file upload security with extension/MIME type validation
- Added secure filename generation to prevent file overwriting and path traversal
- Created JWT-based token system for client access (replaces long-lived database tokens)
- Implemented endpoint-specific rate limiting (login, file upload, messaging)
- Enhanced brute force protection with IP-based tracking and progressive blocking
- Added secure HTTP headers (CSP, XSS protection, clickjacking prevention)
- Upgraded session security with httpOnly, secure, sameSite cookies
- Applied security middleware across all critical endpoints
- Created comprehensive security monitoring and logging system

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript in layered architecture
- **Runtime**: Node.js with ES modules
- **API Structure**: RESTful API with Controllers, Services, and Middlewares
- **Controllers**: Handle HTTP requests/responses and validation
- **Services**: Business logic and database operations (User, Project, Deliverable, Message, Invoice, Feedback)
- **Middlewares**: Authentication, authorization, validation, error handling, logging
- **Workers**: Background job processing (prepared for future implementation)
- **File Uploads**: Multer middleware with hybrid storage system (Object Storage + local fallback)
- **Storage Service**: Replit Object Storage integration with automatic local storage fallback
- **Session Management**: Express sessions with PostgreSQL storage
- **Error Handling**: Centralized error middleware with proper status codes and logging

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless) with comprehensive indexing
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Strategy**: Hybrid approach - Drizzle Kit push for development, automated migrations for CI/CD
- **Connection**: Connection pooling with @neondatabase/serverless
- **Performance**: 39 optimized indexes for high-traffic query patterns
- **Monitoring**: Database health checks and performance analysis tools
- **CI/CD**: Automated migration deployment with backup and rollback capabilities

## Key Components

### Authentication System
- **Provider**: Replit Auth (OpenID Connect)
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Mandatory user table structure for Replit Auth compatibility

### Project Management
- **Project Creation**: Form-based project setup with client information
- **Share Tokens**: Unique tokens for client portal access without authentication
- **Status Tracking**: Project progress and status management
- **File Management**: Upload and share deliverables with clients

### Client Portal Features
- **Branded Interface**: Professional dashboard with customizable branding
- **File Access**: Download deliverables shared by freelancers
- **Communication**: Message system between clients and freelancers
- **Invoice Tracking**: View and track invoice status
- **Feedback System**: Star ratings and comments for completed work

### Data Models
- **Users**: Freelancer accounts with profile information
- **Projects**: Client projects with metadata and status
- **Deliverables**: File uploads with descriptions and status
- **Messages**: Communication threads per project
- **Invoices**: Billing and payment tracking
- **Feedback**: Client reviews and ratings

## Data Flow

### Authentication Flow
1. User accesses protected routes
2. Replit Auth middleware validates session
3. User information stored/retrieved from PostgreSQL
4. Session maintained across requests

### Project Workflow
1. Freelancer creates project with client details
2. System generates unique share token
3. Client accesses portal via share link
4. Bidirectional communication and file sharing
5. Progress tracking and invoice management

### File Upload Process
1. Multer middleware handles multipart uploads
2. Files stored in local uploads directory
3. Metadata saved to database with project association
4. Client notified of new deliverables

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library

### Data and API
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **date-fns**: Date manipulation utilities

### Backend Services
- **Express Session**: Session management
- **Passport**: Authentication middleware
- **Multer**: File upload handling
- **OpenID Client**: OAuth/OIDC integration

### Database
- **Drizzle ORM**: Type-safe database queries
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement and fast builds
- **Express Server**: API development with live reload
- **TypeScript**: Development-time type checking
- **Replit Integration**: Built-in development environment support

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations for schema deployment
- **Static Assets**: Express serves built frontend from dist directory

### Environment Configuration
- **Database URL**: PostgreSQL connection string from environment
- **Session Secret**: Secure session encryption key
- **Replit Auth**: OIDC configuration for authentication
- **File Storage**: Local filesystem with configurable upload directory

The application follows a monorepo structure with clear separation between client, server, and shared code, making it maintainable and scalable for professional client portal needs.