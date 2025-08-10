import { Request, Response } from 'express';
import { invoiceService } from '../services';
import { insertInvoiceSchema } from '@shared/schema';

export class InvoiceController {
  async createInvoice(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        projectId,
      });

      const invoice = await invoiceService.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  }

  async getInvoices(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const invoices = await invoiceService.getInvoicesByProject(projectId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  }

  async getInvoice(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  }

  async updateInvoice(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const updates = req.body;

      const invoice = await invoiceService.updateInvoice(invoiceId, updates);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const invoice = await invoiceService.markInvoiceAsPaid(invoiceId);
      res.json(invoice);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      res.status(500).json({ message: "Failed to mark invoice as paid" });
    }
  }
}

export const invoiceController = new InvoiceController();