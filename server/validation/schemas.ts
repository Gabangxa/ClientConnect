import { z } from 'zod';
import { 
  insertProjectSchema, 
  insertMessageSchema, 
  insertInvoiceSchema, 
  insertFeedbackSchema,
  insertDeliverableSchema
} from '@shared/schema';

// Request parameter schemas
export const projectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const shareTokenParamsSchema = z.object({
  shareToken: z.string().min(1),
});

export const deliverableParamsSchema = z.object({
  deliverableId: z.string().uuid(),
});

export const invoiceParamsSchema = z.object({
  invoiceId: z.string().uuid(),
});

// Query parameter schemas
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
});

export const messageQuerySchema = z.object({
  unreadOnly: z.string().optional().transform(val => val === 'true'),
}).merge(paginationQuerySchema);

// Request body schemas - using basic z.object to avoid schema conflicts
export const createProjectBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().optional(),
  status: z.enum(['active', 'completed', 'paused', 'archived']).default('active'),
  progress: z.number().min(0).max(100).default(0),
});

export const updateProjectBodySchema = createProjectBodySchema.partial();

export const createMessageBodySchema = z.object({
  content: z.string().min(1),
  senderName: z.string().min(1),
  senderType: z.enum(['freelancer', 'client']),
  isRead: z.boolean().default(false),
});

export const createInvoiceBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  status: z.enum(['draft', 'sent', 'paid']).default('draft'),
});

export const submitFeedbackBodySchema = z.object({
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  category: z.string().optional(),
});

export const createDeliverableBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['deliverable', 'milestone', 'update']).default('deliverable'),
  uploaderName: z.string().optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});