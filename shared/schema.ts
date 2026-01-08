import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  businessName: varchar("business_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for user queries
  index("idx_users_email").on(table.email),
  index("idx_users_created_at").on(table.createdAt),
]);

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  freelancerId: varchar("freelancer_id").notNull().references(() => users.id),
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  shareToken: varchar("share_token").notNull().unique(),
  tokenExpiry: timestamp("token_expiry").notNull().default(sql`NOW() + INTERVAL '90 days'`), // When share token expires
  accessCount: integer("access_count").default(0), // How many times client accessed
  lastAccessed: timestamp("last_accessed"), // Last client access time
  status: varchar("status").notNull().default("active"), // active, completed, paused, archived
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for high-traffic queries
  index("idx_projects_freelancer_id").on(table.freelancerId),
  index("idx_projects_share_token").on(table.shareToken),
  index("idx_projects_status").on(table.status),
  index("idx_projects_created_at").on(table.createdAt),
  index("idx_projects_last_accessed").on(table.lastAccessed),
  // Composite index for freelancer projects by status
  index("idx_projects_freelancer_status").on(table.freelancerId, table.status),
]);

export const deliverables = pgTable("deliverables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  title: varchar("title").notNull(),
  description: text("description"),
  filePath: varchar("file_path"),
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  uploaderId: varchar("uploader_id"), // ID of who uploaded (freelancer user ID or client identifier)
  uploaderType: varchar("uploader_type").notNull().default("freelancer"), // freelancer, client
  uploaderName: varchar("uploader_name"), // Display name of uploader
  type: varchar("type").notNull().default("deliverable"), // deliverable, milestone, update
  status: varchar("status").notNull().default("completed"), // draft, completed, approved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for file queries and project deliverables
  index("idx_deliverables_project_id").on(table.projectId),
  index("idx_deliverables_uploader_type").on(table.uploaderType),
  index("idx_deliverables_status").on(table.status),
  index("idx_deliverables_created_at").on(table.createdAt),
  index("idx_deliverables_file_path").on(table.filePath),
  // Composite index for project deliverables by type
  index("idx_deliverables_project_type").on(table.projectId, table.type),
]);

// Access log table for tracking client portal visits
export const accessLogs = pgTable("access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  shareToken: varchar("share_token").notNull(),
  clientIp: varchar("client_ip"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").defaultNow(),
}, (table) => [
  // Indexes for access tracking and analytics
  index("idx_access_logs_project_id").on(table.projectId),
  index("idx_access_logs_share_token").on(table.shareToken),
  index("idx_access_logs_accessed_at").on(table.accessedAt),
  index("idx_access_logs_client_ip").on(table.clientIp),
  // Composite index for project access tracking
  index("idx_access_logs_project_accessed").on(table.projectId, table.accessedAt),
  // Additional composite index for filtering logs by project and token
  index("idx_access_logs_project_token").on(table.projectId, table.shareToken),
]);

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  parentMessageId: varchar("parent_message_id"), // For threading/replies
  threadId: varchar("thread_id"), // For conversation grouping
  senderName: varchar("sender_name").notNull(),
  senderType: varchar("sender_type").notNull(), // freelancer, client
  messageType: varchar("message_type").notNull().default("text"), // text, file, system, notification
  content: text("content").notNull(),
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  status: varchar("status").notNull().default("sent"), // sent, delivered, read
  isRead: boolean("is_read").default(false), // Keep for backward compatibility
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  editedAt: timestamp("edited_at"),
  metadata: text("metadata"), // JSON string for extensible data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for message queries and threading
  index("idx_messages_project_id").on(table.projectId),
  index("idx_messages_thread_id").on(table.threadId),
  index("idx_messages_parent_message_id").on(table.parentMessageId),
  index("idx_messages_sender_type").on(table.senderType),
  index("idx_messages_is_read").on(table.isRead),
  index("idx_messages_created_at").on(table.createdAt),
  index("idx_messages_priority").on(table.priority),
  // Composite indexes for common query patterns
  index("idx_messages_project_unread").on(table.projectId, table.isRead),
  index("idx_messages_project_created").on(table.projectId, table.createdAt),
  // Additional composite index for project sender filtering
  index("idx_messages_project_sender").on(table.projectId, table.senderType),
]);

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  invoiceNumber: varchar("invoice_number").notNull(),
  amount: integer("amount").notNull(), // amount in cents
  description: text("description"),
  status: varchar("status").notNull().default("pending"), // pending, paid, overdue
  dueDate: timestamp("due_date"),
  filePath: varchar("file_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for invoice queries and reporting
  index("idx_invoices_project_id").on(table.projectId),
  index("idx_invoices_status").on(table.status),
  index("idx_invoices_due_date").on(table.dueDate),
  index("idx_invoices_created_at").on(table.createdAt),
  index("idx_invoices_invoice_number").on(table.invoiceNumber),
  // Composite index for project invoices by status
  index("idx_invoices_project_status").on(table.projectId, table.status),
]);

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  clientName: varchar("client_name").notNull(),
  rating: integer("rating"), // 1-5 stars
  comment: text("comment"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Indexes for feedback queries and analytics
  index("idx_feedback_project_id").on(table.projectId),
  index("idx_feedback_rating").on(table.rating),
  index("idx_feedback_is_public").on(table.isPublic),
  index("idx_feedback_created_at").on(table.createdAt),
  // Composite index for project feedback analytics
  index("idx_feedback_project_rating").on(table.projectId, table.rating),
]);

export const messageAttachments = pgTable("message_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: 'cascade' }),
  filePath: varchar("file_path").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  // Indexes for attachment queries
  index("idx_message_attachments_message_id").on(table.messageId),
  index("idx_message_attachments_uploaded_at").on(table.uploadedAt),
  index("idx_message_attachments_file_path").on(table.filePath),
  // Composite index for message attachments by upload time
  index("idx_message_attachments_message_uploaded").on(table.messageId, table.uploadedAt),
]);

// Project Templates - reusable project blueprints
export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  freelancerId: varchar("freelancer_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  defaultStatus: varchar("default_status").notNull().default("active"),
  category: varchar("category"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_templates_freelancer_id").on(table.freelancerId),
  index("idx_project_templates_category").on(table.category),
  index("idx_project_templates_created_at").on(table.createdAt),
]);

// Template Deliverables - predefined deliverables for templates
export const templateDeliverables = pgTable("template_deliverables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => projectTemplates.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull().default("deliverable"),
  sortOrder: integer("sort_order").default(0),
  dueDaysOffset: integer("due_days_offset"),
}, (table) => [
  index("idx_template_deliverables_template_id").on(table.templateId),
  index("idx_template_deliverables_sort_order").on(table.sortOrder),
]);

// Cache table for Postgres-based caching
export const appCache = pgTable("app_cache", {
  key: varchar("key").primaryKey(),
  value: jsonb("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_app_cache_expires_at").on(table.expiresAt),
]);

// Background jobs table for async processing
export const backgroundJobs = pgTable("background_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // e.g., 'send_email', 'process_file'
  payload: jsonb("payload").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  attempts: integer("attempts").default(0),
  lastError: text("last_error"),
  nextRunAt: timestamp("next_run_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_background_jobs_status_next_run").on(table.status, table.nextRunAt),
  index("idx_background_jobs_type").on(table.type),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  projectTemplates: many(projectTemplates),
}));

export const projectTemplatesRelations = relations(projectTemplates, ({ one, many }) => ({
  freelancer: one(users, {
    fields: [projectTemplates.freelancerId],
    references: [users.id],
  }),
  deliverables: many(templateDeliverables),
}));

export const templateDeliverablesRelations = relations(templateDeliverables, ({ one }) => ({
  template: one(projectTemplates, {
    fields: [templateDeliverables.templateId],
    references: [projectTemplates.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  freelancer: one(users, {
    fields: [projects.freelancerId],
    references: [users.id],
  }),
  deliverables: many(deliverables),
  messages: many(messages),
  invoices: many(invoices),
  feedback: many(feedback),
  accessLogs: many(accessLogs),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  project: one(projects, {
    fields: [accessLogs.projectId],
    references: [projects.id],
  }),
}));

export const deliverablesRelations = relations(deliverables, ({ one }) => ({
  project: one(projects, {
    fields: [deliverables.projectId],
    references: [projects.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
  }),
  replies: many(messages),
  attachments: many(messageAttachments),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  project: one(projects, {
    fields: [feedback.projectId],
    references: [projects.id],
  }),
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
  message: one(messages, {
    fields: [messageAttachments.messageId],
    references: [messages.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  shareToken: true,
  tokenExpiry: true,
  accessCount: true,
  lastAccessed: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  description: z.string().nullable().optional(),
  clientEmail: z.string().nullable().optional(),
});

export const insertDeliverableSchema = createInsertSchema(deliverables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  accessedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
  readAt: true,
  editedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertMessageAttachmentSchema = createInsertSchema(messageAttachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateDeliverableSchema = createInsertSchema(templateDeliverables).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Deliverable = typeof deliverables.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertMessageAttachment = z.infer<typeof insertMessageAttachmentSchema>;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertTemplateDeliverable = z.infer<typeof insertTemplateDeliverableSchema>;
export type TemplateDeliverable = typeof templateDeliverables.$inferSelect;
