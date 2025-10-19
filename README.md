# Client Portal Platform

A comprehensive client portal platform designed for freelancers and service providers to manage project workflows, communication, and deliverables through secure, branded dashboards with advanced access control.

![Project Status](https://img.shields.io/badge/status-active-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)

## 🚀 Features

### For Freelancers
- **Project Management**: Create and manage client projects with detailed tracking
- **Secure Sharing**: Generate unique 90-day share tokens for client access
- **File Management**: Upload, organize, and share deliverables with full CRUD permissions
- **Communication Hub**: Threaded messaging system with priority levels, file attachments, and desktop notifications
- **Invoice Tracking**: Create, manage, and track invoice status
- **Client Feedback**: Monitor ratings and reviews from clients
- **Access Analytics**: View client activity logs and portal usage statistics

### For Clients
- **No-Account Access**: Access projects via secure share links (no signup required)
- **Project Dashboard**: Branded overview with timeline and progress tracking
- **File Downloads**: Access and download completed work and deliverables
- **File Uploads**: Share files and documents with freelancers
- **Direct Communication**: Built-in messaging system with threading support and file attachments (up to 5 files per message, 10MB each)
- **Desktop Notifications**: Receive browser notifications for new messages
- **Invoice Viewing**: Review billing details and payment status
- **Feedback System**: Rate work and provide comments using star ratings

### System Features
- **Advanced Security**: Token-based authentication with role-based permissions, file validation, and brute force protection
- **Unified Messaging**: Professional threaded conversations with status tracking, file attachments, and drag-and-drop upload support
- **File Management**: Secure file uploads with ownership tracking, deletion rights, and hybrid storage (Replit Object Storage + local fallback)
- **Desktop Notifications**: Real-time browser notifications for incoming messages
- **Responsive Design**: Mobile-friendly interface with professional branding
- **Access Control**: Granular permissions for different user types
- **Activity Logging**: Comprehensive audit trail for security and analytics
- **Performance Optimized**: 39+ database indexes for high-traffic queries

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** for modern, responsive styling
- **shadcn/ui** + **Radix UI** for accessible component primitives
- **React Hook Form** + **Zod** for form handling and validation
- **Lucide React** for icons and visual elements

### Backend
- **Express.js** with TypeScript for robust API development
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with connection pooling for data persistence
- **Passport.js** with OpenID Connect for authentication
- **Multer** for secure file upload handling
- **Express Sessions** with PostgreSQL storage
- **JWT** for secure token-based client access

### Infrastructure
- **Replit** hosting and development environment
- **Neon** serverless PostgreSQL database
- **Replit Object Storage** with local filesystem fallback for file uploads

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit account (for authentication)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd client-portal-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Set up your environment variables:
   ```bash
   DATABASE_URL=postgresql://username:password@host:port/database
   SESSION_SECRET=your-secure-session-secret
   REPLIT_CLIENT_ID=your-replit-client-id
   REPLIT_CLIENT_SECRET=your-replit-client-secret
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 🏗️ Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages/routes
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                 # Express backend application
│   ├── db.ts              # Database connection setup
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   └── replitAuth.ts      # Authentication configuration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── uploads/               # File storage directory
```

## 🔧 Usage

### For Freelancers

1. **Login**: Use Replit authentication to access your dashboard
2. **Create Project**: Set up a new client project with details and timeline
3. **Share Access**: Copy the generated share link and send to your client
4. **Manage Files**: Upload deliverables and track client file uploads
5. **Communicate**: Use the messaging system with file attachments to stay in touch with clients
6. **Track Progress**: Monitor project status, client engagement, and receive desktop notifications

### For Clients

1. **Access Portal**: Click the share link provided by your freelancer
2. **View Project**: See project overview, timeline, and progress
3. **Download Files**: Access completed work and deliverables
4. **Upload Files**: Share documents and feedback files via drag-and-drop
5. **Send Messages**: Communicate directly with your freelancer, attach files to messages
6. **Enable Notifications**: Allow desktop notifications to stay updated on new messages
7. **Provide Feedback**: Rate completed work and leave reviews

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user information
- `POST /api/auth/logout` - Logout current user

### Projects (Freelancer Routes)
- `GET /api/projects` - Get all projects for authenticated freelancer
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project details
- `PUT /api/projects/:id` - Update project information

### Client Portal (Token-based Routes)
- `GET /api/client/:shareToken` - Get project data for client
- `POST /api/client/:shareToken/messages` - Send message as client (with optional file attachments)
- `POST /api/client/:shareToken/deliverables` - Upload file as client
- `POST /api/client/:shareToken/feedback` - Submit client feedback

### File Management
- `GET /api/files/:filename` - Download uploaded files
- `DELETE /api/deliverables/:id` - Delete file (owner only)
- `GET /api/message-attachments/:id` - Download message attachment
- `POST /api/messages/:messageId/attachments` - Upload message attachments

### Messaging
- `GET /api/projects/:projectId/messages` - Get all messages for a project
- `POST /api/projects/:projectId/messages` - Send message (with optional file attachments)
- `PATCH /api/messages/:messageId/read` - Mark message as read

## 🛡️ Security Features

- **Token-based Access**: 90-day expiring share tokens for client access
- **Role-based Permissions**: Separate permissions for freelancers and clients
- **File Ownership**: Users can only delete files they uploaded
- **File Validation**: Extension and MIME type validation, secure filename generation
- **Access Logging**: Comprehensive audit trails for security monitoring
- **Session Management**: Secure session handling with PostgreSQL storage
- **Rate Limiting**: Endpoint-specific rate limiting and brute force protection
- **Secure Headers**: HTTP security headers for enhanced protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use the existing component patterns and file structure
- Add proper error handling and validation
- Update documentation for new features
- Test both freelancer and client workflows
- Add `data-testid` attributes for interactive elements
- Maintain consistent code style and formatting

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Freelancer accounts and profiles
- **Projects**: Client projects with metadata, share tokens, and settings
- **Deliverables**: File uploads with ownership and permissions
- **Messages**: Threaded communication system with priority levels
- **Message Attachments**: File attachments for messages (up to 5 per message)
- **Invoices**: Billing and payment tracking
- **Feedback**: Client reviews and ratings
- **Access Logs**: Security and analytics tracking
- **Sessions**: Secure session storage

### Performance Features
- 39+ database indexes for optimized query performance
- Composite indexes for common query patterns
- Efficient relationship mapping with Drizzle ORM

## 🚀 Deployment

The application is designed for deployment on Replit but can be adapted for other platforms:

1. **Production Build**
   ```bash
   npm run build
   ```

2. **Database Migration**
   ```bash
   npm run db:push
   ```

3. **Environment Variables**: Ensure all required environment variables are set

4. **File Storage**: Configure persistent file storage for uploads (Replit Object Storage or local filesystem)

## 🆕 Recent Updates

### October 2025
- **Desktop Notifications**: Added browser notification support for real-time message alerts
- **Notification Management**: Custom `useMessageNotifications` hook with permission handling
- **Smart Notifications**: Auto-close after 5 seconds, focus window on click

### August 2025
- **File Attachments for Messages**: Comprehensive file attachment system for messaging
- **Drag-and-Drop Upload**: Enhanced UX with drag-and-drop support
- **Message Attachment Service**: Dedicated service for secure file operations
- **Attachment Display**: Visual attachment preview and download in message threads

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Check the documentation in `replit.md` for detailed technical information
- Review `SECURITY_IMPLEMENTATION.md` for security features
- Review the code comments for implementation details
- Create an issue for bugs or feature requests

## 🔗 Additional Documentation

- `replit.md` - Comprehensive technical documentation and architecture details
- `SECURITY_IMPLEMENTATION.md` - Security features and implementation guide
- `REFACTOR_PLAN.md` - Development roadmap and refactoring plans

---

Built with ❤️ for freelancers and their clients
