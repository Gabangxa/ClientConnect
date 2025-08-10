import {
  invoices,
  type Invoice,
  type InsertInvoice,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";

export class InvoiceService {
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoicesByProject(projectId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.projectId, projectId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async markInvoiceAsPaid(id: string): Promise<Invoice> {
    return await this.updateInvoice(id, {
      status: 'paid',
      updatedAt: new Date(),
    });
  }

  async markInvoiceAsOverdue(id: string): Promise<Invoice> {
    return await this.updateInvoice(id, {
      status: 'overdue',
      updatedAt: new Date(),
    });
  }
}

export const invoiceService = new InvoiceService();