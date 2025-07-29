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
});

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
  status: varchar("status").notNull().default("active"), // active, completed, paused
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
});

// Access log table for tracking client portal visits
export const accessLogs = pgTable("access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  shareToken: varchar("share_token").notNull(),
  clientIp: varchar("client_ip"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  senderName: varchar("sender_name").notNull(),
  senderType: varchar("sender_type").notNull(), // freelancer, client
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

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
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  clientName: varchar("client_name").notNull(),
  rating: integer("rating"), // 1-5 stars
  comment: text("comment"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
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

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
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
