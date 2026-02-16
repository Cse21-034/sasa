import type { Express } from "express";
import { storage } from "../storage";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import type { Response, NextFunction } from "express";
import { createInvoiceSchema, updateInvoiceSchema } from "@shared/schema";

export function registerInvoiceRoutes(app: Express) {
  // 💰 POST /api/invoices - Provider creates a new invoice
  app.post("/api/invoices", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { jobId, amount, description, paymentMethod, notes } = req.body;
      const providerId = req.user!.id;

      // Validate input
      const validation = createInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        console.error('Invoice validation errors:', {
          received: req.body,
          errors: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            received: (req.body as any)[e.path[0]]
          }))
        });
        return res.status(400).json({ 
          message: "Invalid invoice data", 
          errors: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      // Check if job exists and provider is selected
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.providerId !== providerId) {
        return res.status(403).json({ message: "You are not the selected provider for this job" });
      }

      if (job.status === "completed" || job.status === "cancelled") {
        return res.status(400).json({ message: "Cannot create invoice for completed or cancelled jobs" });
      }

      // Check if invoice already exists
      const existingInvoice = await storage.getInvoiceByJobId(jobId);
      if (existingInvoice && existingInvoice.status !== "declined" && existingInvoice.status !== "cancelled") {
        return res.status(400).json({ message: "Invoice already exists for this job" });
      }

      // Create invoice
      const invoice = await storage.createInvoice(
        jobId,
        providerId,
        job.requesterId,
        amount,
        description,
        paymentMethod,
        notes
      );

      res.status(201).json({
        message: "Invoice created successfully",
        invoice
      });
    } catch (error: any) {
      console.error("Create invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to create invoice" });
    }
  });

  // 💰 GET /api/invoices/:id - Get invoice details
  app.get("/api/invoices/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check authorization - provider, requester, or admin can view
      if (
        req.user!.id !== invoice.providerId &&
        req.user!.id !== invoice.requesterId &&
        req.user!.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized to view this invoice" });
      }

      res.json(invoice);
    } catch (error: any) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch invoice" });
    }
  });

  // 💰 GET /api/invoices/job/:jobId - Get invoice for a specific job
  app.get("/api/invoices/job/:jobId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoiceByJobId(req.params.jobId);

      if (!invoice) {
        return res.status(404).json({ message: "No invoice found for this job" });
      }

      res.json(invoice);
    } catch (error: any) {
      console.error("Get invoice by job error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch invoice" });
    }
  });

  // 💰 PATCH /api/invoices/:id - Provider updates invoice (only in draft status, or to reset declined)
  app.patch("/api/invoices/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only provider can update
      if (invoice.providerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the provider can update this invoice" });
      }

      // Can only update draft invoices, or reset declined invoices back to draft
      if (invoice.status === "declined") {
        // Reset declined invoice back to draft with cleared reason
        const updated = await storage.updateInvoice(req.params.id, {
          status: "draft",
          declineReason: null,
          amount: req.body.amount,
          description: req.body.description,
          notes: req.body.notes || null,
          updatedAt: new Date()
        });
        return res.json({
          message: "Invoice reset to draft successfully",
          invoice: updated
        });
      } else if (invoice.status !== "draft") {
        return res.status(400).json({ message: `Cannot update invoice in ${invoice.status} status` });
      }

      // Validate partial update
      const validation = updateInvoiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid invoice data", errors: validation.error.errors });
      }

      const updated = await storage.updateInvoice(req.params.id, req.body);

      res.json({
        message: "Invoice updated successfully",
        invoice: updated
      });
    } catch (error: any) {
      console.error("Update invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to update invoice" });
    }
  });

  // 💰 POST /api/invoices/:id/send - Provider sends invoice to requester
  app.post("/api/invoices/:id/send", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only provider can send
      if (invoice.providerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the provider can send this invoice" });
      }

      // Can only send draft invoices
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: `Cannot send invoice in ${invoice.status} status` });
      }

      const updated = await storage.sendInvoice(req.params.id);

      // 📧 Send notification to requester
      try {
        const job = await storage.getJob(invoice.jobId);
        if (job) {
          await storage.createNotification({
            recipientId: invoice.requesterId,
            jobId: invoice.jobId,
            type: "message_received",
            title: "New Invoice Received",
            message: `${req.user!.name} has sent an invoice of BWP ${invoice.amount} for job: ${job.title}`
          });
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      res.json({
        message: "Invoice sent successfully to requester",
        invoice: updated
      });
    } catch (error: any) {
      console.error("Send invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to send invoice" });
    }
  });

  // 💰 POST /api/invoices/:id/approve - Requester approves invoice
  app.post("/api/invoices/:id/approve", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only requester can approve
      if (invoice.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "Only the requester can approve this invoice" });
      }

      // Can only approve sent invoices
      if (invoice.status !== "sent") {
        return res.status(400).json({ message: `Cannot approve invoice in ${invoice.status} status` });
      }

      const updated = await storage.approveInvoice(req.params.id);

      // 🎉 Create payment record for tracking
      if (updated) {
        try {
          await storage.createPayment(
            updated.id,
            updated.jobId,
            updated.amount.toString(),
            updated.paymentMethod
          );
        } catch (paymentError) {
          console.error("Failed to create payment record:", paymentError);
        }
      }

      // 📧 Send notification to provider
      try {
        const job = await storage.getJob(invoice.jobId);
        if (job) {
          await storage.createNotification({
            recipientId: invoice.providerId,
            jobId: invoice.jobId,
            type: "message_received",
            title: "Invoice Approved!",
            message: `Your invoice for "${job.title}" has been approved. Please proceed with the job.`
          });
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      res.json({
        message: "Invoice approved successfully",
        invoice: updated
      });
    } catch (error: any) {
      console.error("Approve invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to approve invoice" });
    }
  });

  // 💰 POST /api/invoices/:id/decline - Requester declines invoice (requests changes)
  app.post("/api/invoices/:id/decline", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { reason } = req.body;
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only requester can decline
      if (invoice.requesterId !== req.user!.id) {
        return res.status(403).json({ message: "Only the requester can decline this invoice" });
      }

      // Can only decline sent invoices
      if (invoice.status !== "sent") {
        return res.status(400).json({ message: `Cannot decline invoice in ${invoice.status} status` });
      }

      console.log(`[Decline] Processing decline for invoice ${req.params.id}`, { 
        currentStatus: invoice.status, 
        reason 
      });

      const updated = await storage.declineInvoice(req.params.id, reason);
      
      // Verify the invoice was actually updated to declined status
      if (!updated) {
        console.error(`[Decline] ERROR: declineInvoice returned undefined for ${req.params.id}`);
        return res.status(500).json({ message: "Failed to decline invoice - update returned no result" });
      }
      
      if (updated.status !== 'declined') {
        console.error(`[Decline] ERROR: Expected status 'declined' but got '${updated.status}' for invoice ${req.params.id}`, {
          invoiceId: updated.id,
          status: updated.status,
          declineReason: updated.declineReason
        });
        return res.status(500).json({ message: `Failed to decline invoice - status is '${updated.status}' instead of 'declined'` });
      }

      console.log(`[Decline] Successfully declined invoice ${req.params.id}`, { 
        newStatus: updated.status,
        invoiceId: updated.id
      });

      // 📧 Send notification to provider
      try {
        await storage.createNotification({
          recipientId: invoice.providerId,
          jobId: invoice.jobId,
          type: "message_received",
          title: "Invoice Declined",
          message: `Your invoice has been declined. ${reason ? `Reason: ${reason}` : "Please review and resubmit with any necessary changes."}`
        });
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      res.json({
        message: "Invoice declined. Provider can edit and resubmit",
        invoice: updated
      });
    } catch (error: any) {
      console.error("Decline invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to decline invoice" });
    }
  });

  // 💰 DELETE /api/invoices/:id - Provider cancels/deletes unsent invoice
  app.delete("/api/invoices/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only provider can delete
      if (invoice.providerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the provider can delete this invoice" });
      }

      // Can only delete draft invoices
      if (invoice.status !== "draft") {
        return res.status(400).json({ message: `Cannot delete invoice in ${invoice.status} status` });
      }

      // Delete by updating to cancelled status
      const updated = await storage.updateInvoice(req.params.id, { status: "cancelled" });

      res.json({
        message: "Invoice deleted successfully",
        invoice: updated
      });
    } catch (error: any) {
      console.error("Delete invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to delete invoice" });
    }
  });

  // 💰 GET /api/jobs/:id/invoice-status - Check invoice status for a job
  app.get("/api/jobs/:jobId/invoice-status", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await storage.getInvoiceByJobId(req.params.jobId);

      if (!invoice) {
        return res.json({
          status: "no_invoice",
          canStart: false,
          invoice: null
        });
      }

      const canStart = invoice.status === "approved";

      res.json({
        status: invoice.status,
        canStart,
        invoice: {
          id: invoice.id,
          amount: invoice.amount,
          paymentMethod: invoice.paymentMethod,
          status: invoice.status,
          expiresAt: invoice.expiresAt
        }
      });
    } catch (error: any) {
      console.error("Get invoice status error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch invoice status" });
    }
  });
}
