# Client Portal Application

## Overview
This project is a professional client portal application designed for freelancers and service providers. It enables them to share deliverables, track invoices, and communicate with clients through branded dashboards. The application aims to streamline client interactions, enhance professionalism, and provide a secure, centralized platform for project management. It features a full-stack architecture with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features distinct interfaces for freelancers and clients. The client portal is designed with a client-focused, branded experience, including `ClientSidebar`, `ClientHeader`, and `ClientStatusCards` components, emphasizing simplicity and clear progress tracking. The freelancer dashboard provides comprehensive management tools. Both interfaces utilize shared components like `MessageThread` and `MessageComposer` for a consistent messaging experience. Styling is handled with Tailwind CSS and `shadcn/ui` components for a modern, professional look.

### Technical Implementations

#### Frontend
- **Framework**: React with TypeScript.
- **Build Tool**: Vite.
- **Routing**: Wouter.
- **State Management**: TanStack Query (React Query) for server state.
- **UI Components**: Radix UI primitives with `shadcn/ui`.
- **Styling**: Tailwind CSS with CSS variables.
- **Form Handling**: React Hook Form with Zod validation.

#### Backend
- **Framework**: Express.js with TypeScript, following a layered architecture (Controllers, Services, Middlewares).
- **Runtime**: Node.js.
- **API Structure**: RESTful API.
- **Business Logic**: Encapsulated in Services (User, Project, Deliverable, Message, Invoice, Feedback).
- **Middleware**: Dedicated for authentication, authorization, validation, error handling, and logging.
- **File Uploads**: Multer middleware supporting a hybrid storage system (Replit Object Storage + local fallback).
- **Session Management**: Express sessions with PostgreSQL storage.

#### Database
- **Database**: PostgreSQL (configured for Neon serverless).
- **ORM**: Drizzle ORM with a schema-first approach.
- **Migrations**: Drizzle Kit for development, automated migrations for CI/CD.
- **Performance**: Extensive indexing (39 indexes) for high-traffic tables.
- **Session Storage**: `connect-pg-simple` for PostgreSQL-backed sessions.

### Feature Specifications
- **Security Foundation**: 90-day token expiration, access logging, file ownership tracking.
- **Permission System**: Role-based access control (freelancer/client/guest) with dual API endpoints (`/api/projects` for freelancers, `/api/client` for token-based client access). Granular permissions for deliverables, messages, invoices, and feedback.
- **Client Interface**: Dedicated client portal with no account creation needed, accessible via share link. Allows clients to view project dashboards, download/upload files, send messages, review invoices (read-only), and provide feedback.
- **Dual-Access System**: Freelancers can view client portals with an authenticated management view (`/project/:projectId/client-view`).
- **Unified Messaging System**: Threaded messaging with `parentMessageId` and `threadId`, message status, priority levels, and shared `MessageThread`/`MessageComposer` components. Includes comprehensive file attachment support with drag-and-drop upload, download functionality, and proper security validation. Desktop notifications for incoming messages from the other party (freelancer sees client message notifications, client sees freelancer message notifications).
- **Hybrid Storage System**: Integrates Replit Object Storage with graceful local storage fallback for file uploads.
- **Security Implementation**: Comprehensive file upload validation (extension/MIME type, secure filename generation), JWT-based tokens for client access, endpoint-specific rate limiting, brute force protection, secure HTTP headers, and upgraded session security.

### Recent Changes
**Project Templates & Analytics Dashboard (December 2025)**: Added two major feature additions:
1. **Project Templates System**: Full CRUD for reusable project templates with nested deliverables. Templates can be created, edited, and deleted from a dedicated `/templates` page. When creating a new project, users can select a template to auto-populate project details and automatically create associated deliverables. Template system includes `project_templates` and `template_deliverables` database tables with proper relations, ownership verification, and `dueDaysOffset` for flexible scheduling.
2. **Analytics Dashboard**: New `/analytics` page with comprehensive business metrics. Features 8 KPI cards (total projects, revenue, deliverables, messages, ratings), revenue bar charts, project status pie charts, and message activity line charts. Uses Recharts library for visualizations. Backend includes analytics service with aggregation queries for overview stats, project stats, revenue stats, and activity stats.

**Project Search, Filtering, Archiving & Onboarding (December 2025)**: Added three major improvements to the freelancer dashboard:
1. **Project Search & Filtering**: Search projects by name, client name, or description with real-time filtering. Status filter dropdown allows filtering by active, completed, or paused projects.
2. **Project Archiving & Deletion**: Projects can now be archived (hidden from main view but restorable) or permanently deleted with all associated data (deliverables, messages, invoices, feedback, access logs, and files). Confirmation dialogs protect against accidental actions.
3. **Onboarding Wizard**: New users with no projects see a welcome wizard that guides them through the platform features: creating projects, sharing portal links, uploading deliverables, and communicating with clients. Progress is tracked with localStorage to only show once.

**Desktop Notifications for Messaging (October 2025)**: Added desktop notification support for incoming messages. Created `useMessageNotifications` custom hook that requests browser notification permission, tracks message history, and displays notifications when new messages arrive from the other party. Integrated into both freelancer client view and client portal with proper React hooks ordering to prevent rendering issues. Notifications show sender name and message preview, auto-close after 5 seconds, and focus the window when clicked.

**File Attachment System for Messaging (August 2025)**: Implemented comprehensive file attachment functionality for the messaging system. Added `message_attachments` table with proper indexing and relations, created `MessageAttachmentService` for file operations, extended message API endpoints with secure file upload/download, and updated `MessageComposer` and `MessageThread` components with drag-and-drop support, attachment display, and download functionality. System supports up to 5 attachments per message with 10MB size limit per file and proper security validation.

### System Design Choices
The application adopts a monorepo structure, separating client, server, and shared code for maintainability and scalability. A service-oriented architecture is used for the backend to promote separation of concerns. Error handling is centralized, and comprehensive documentation (JSDoc, component docs) is provided for developer onboarding.

## External Dependencies

### UI and Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Pre-built component library.
- **Lucide React**: Icon library.

### Data and API
- **TanStack Query**: Server state management and caching.
- **React Hook Form**: Form handling and validation.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation utilities.
- **Recharts**: Charting library for analytics visualizations.

### Backend Services
- **Express Session**: Session management.
- **Passport**: Authentication middleware.
- **Multer**: File upload handling.
- **OpenID Client**: OAuth/OIDC integration (specifically for Replit Auth).

### Database
- **Drizzle ORM**: Type-safe database queries.
- **@neondatabase/serverless**: Serverless PostgreSQL driver.
- **connect-pg-simple**: PostgreSQL session store.