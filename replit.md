# Client Portal Application

## Overview

This is a professional client portal application built for freelancers and service providers to share deliverables, track invoices, and communicate with clients through branded dashboards. The application features a full-stack architecture with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Workflows

### Freelancer Workflow
1. **Sign Up & Authentication**: Log in using Replit authentication to access the dashboard
2. **Create Client Projects**: Set up new projects with client information, project details, and timeline
3. **Share Portal Access**: System generates unique share tokens for each project that clients can access without accounts
4. **Manage Deliverables**: Upload files, documents, and completed work with descriptions and status updates
5. **Client Communication**: View and respond to client messages through the dedicated messaging section on dashboard
6. **Invoice Management**: Create and track invoices with status updates (draft, sent, paid)
7. **Monitor Feedback**: Review client ratings and feedback for completed work

### Client Workflow  
1. **Access Portal**: Receive share link from freelancer - no account creation required
2. **View Project Dashboard**: See branded project overview with timeline, deliverables, and communication
3. **Download Deliverables**: Access and download completed work and files shared by freelancer
4. **Send Messages**: Communicate directly with freelancer through built-in messaging system
5. **Review Invoices**: View invoice details, amounts, and payment status
6. **Provide Feedback**: Rate completed work and leave comments using star rating system
7. **Track Progress**: Monitor project status and timeline updates in real-time

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Structure**: RESTful API with organized route handlers
- **File Uploads**: Multer middleware for handling file uploads
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection**: Connection pooling with @neondatabase/serverless

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