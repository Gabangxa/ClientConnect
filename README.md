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
- **Communication Hub**: Threaded messaging system with priority levels
- **Invoice Tracking**: Create, manage, and track invoice status
- **Client Feedback**: Monitor ratings and reviews from clients
- **Access Analytics**: View client activity logs and portal usage statistics

### For Clients
- **No-Account Access**: Access projects via secure share links (no signup required)
- **Project Dashboard**: Branded overview with timeline and progress tracking
- **File Downloads**: Access and download completed work and deliverables
- **File Uploads**: Share files and documents with freelancers
- **Direct Communication**: Built-in messaging system with threading support
- **Invoice Viewing**: Review billing details and payment status
- **Feedback System**: Rate work and provide comments using star ratings

### System Features
- **Advanced Security**: Token-based authentication with role-based permissions
- **Unified Messaging**: Professional threaded conversations with status tracking
- **File Management**: Secure file uploads with ownership tracking and deletion rights
- **Responsive Design**: Mobile-friendly interface with professional branding
- **Access Control**: Granular permissions for different user types
- **Activity Logging**: Comprehensive audit trail for security and analytics

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** for modern, responsive styling
- **shadcn/ui** + **Radix UI** for accessible component primitives
- **React Hook Form** + **Zod** for form handling and validation

### Backend
- **Express.js** with TypeScript for robust API development
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** with connection pooling for data persistence
- **Passport.js** with OpenID Connect for authentication
- **Multer** for secure file upload handling
- **Express Sessions** with PostgreSQL storage

### Infrastructure
- **Replit** hosting and development environment
- **Neon** serverless PostgreSQL database
- **File System** storage for uploaded documents

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
│   │   └── lib/           # Utilities and configurations
├── server/                 # Express backend application
│   ├── db.ts              # Database connection setup
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
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
5. **Communicate**: Use the messaging system to stay in touch with clients
6. **Track Progress**: Monitor project status and client engagement

### For Clients

1. **Access Portal**: Click the share link provided by your freelancer
2. **View Project**: See project overview, timeline, and progress
3. **Download Files**: Access completed work and deliverables
4. **Upload Files**: Share documents and feedback files
5. **Send Messages**: Communicate directly with your freelancer
6. **Provide Feedback**: Rate completed work and leave reviews

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
- `POST /api/client/:shareToken/messages` - Send message as client
- `POST /api/client/:shareToken/deliverables` - Upload file as client
- `POST /api/client/:shareToken/feedback` - Submit client feedback

### File Management
- `GET /api/files/:filename` - Download uploaded files
- `DELETE /api/deliverables/:id` - Delete file (owner only)

## 🛡️ Security Features

- **Token-based Access**: 90-day expiring share tokens for client access
- **Role-based Permissions**: Separate permissions for freelancers and clients
- **File Ownership**: Users can only delete files they uploaded
- **Access Logging**: Comprehensive audit trails for security monitoring
- **Session Management**: Secure session handling with PostgreSQL storage

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

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Freelancer accounts and profiles
- **Projects**: Client projects with metadata and settings
- **Deliverables**: File uploads with ownership and permissions
- **Messages**: Threaded communication system
- **Invoices**: Billing and payment tracking
- **Feedback**: Client reviews and ratings
- **Access Logs**: Security and analytics tracking

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

4. **File Storage**: Configure persistent file storage for uploads

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Check the documentation in `replit.md` for detailed technical information
- Review the code comments for implementation details
- Create an issue for bugs or feature requests

---

Built with ❤️ for freelancers and their clients