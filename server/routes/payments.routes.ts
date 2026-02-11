import type { Express } from "express";
import { storage } from "../storage";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import type { Response, NextFunction } from "express";

export function registerPaymentRoutes(app: Express) {
  // 💰 POST /api/payments/:invoiceId/process - Process payment
  app.post("/api/payments/:invoiceId/process", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId, notes } = req.body;
      const invoiceId = req.params.invoiceId;

      // Get invoice
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only requester can make payment by default; admin can override  
      if (req.user!.id !== invoice.requesterId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only the requester can process payment" });
      }

      // Invoice must be approved to process payment
      if (invoice.status !== "approved") {
        return res.status(400).json({ message: "Invoice must be approved before processing payment" });
      }

      // Check if payment already exists
      let payment = await storage.getPaymentByInvoiceId(invoiceId);
      if (!payment) {
        // Create payment record if it doesn't exist
        payment = await storage.createPayment(
          invoiceId,
          invoice.jobId,
          invoice.amount.toString(),
          invoice.paymentMethod,
          transactionId
        );
      }

      // Mark payment as paid
      const paidPayment = await storage.markPaymentAsPaid(invoiceId, transactionId);

      // 📧 Send notification to provider
      try {
        const job = await storage.getJob(invoice.jobId);
        if (job) {
          await storage.createNotification({
            recipientId: invoice.providerId,
            jobId: invoice.jobId,
            type: "message_received",
            title: "Payment Received!",
            message: `Payment of BWP ${invoice.amount} has been received for "${job.title}". You can now start the job.`
          });
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      res.json({
        message: "Payment processed successfully",
        payment: paidPayment
      });
    } catch (error: any) {
      console.error("Process payment error:", error);
      res.status(500).json({ message: error.message || "Failed to process payment" });
    }
  });

  // 💰 POST /api/payments/:invoiceId/mark-paid - Mark cash payment as paid (for cash method)
  app.post("/api/payments/:invoiceId/mark-paid", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { notes } = req.body;
      const invoiceId = req.params.invoiceId;

      // Get invoice
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // For cash payments, either requester or provider can confirm (provider received cash)
      if (
        req.user!.id !== invoice.requesterId &&
        req.user!.id !== invoice.providerId &&
        req.user!.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized to confirm payment" });
      }

      // Invoice must be approved
      if (invoice.status !== "approved") {
        return res.status(400).json({ message: "Invoice must be approved before marking as paid" });
      }

      // Only for cash payment method
      if (invoice.paymentMethod !== "cash") {
        return res.status(400).json({ message: "This endpoint is only for cash payments" });
      }

      // Check if payment record exists, create if needed
      let payment = await storage.getPaymentByInvoiceId(invoiceId);
      if (!payment) {
        payment = await storage.createPayment(
          invoiceId,
          invoice.jobId,
          invoice.amount.toString(),
          "cash"
        );
      }

      // Mark payment as paid
      const paidPayment = await storage.markPaymentAsPaid(invoiceId);

      // 📧 Send notification to provider (if requester marked)
      try {
        if (req.user!.id === invoice.requesterId) {
          const job = await storage.getJob(invoice.jobId);
          if (job) {
            await storage.createNotification({
              recipientId: invoice.providerId,
              jobId: invoice.jobId,
              type: "message_received",
              title: "Cash Payment Confirmed!",
              message: `Cash payment of BWP ${invoice.amount} has been confirmed for "${job.title}". You can now start the job.`
            });
          }
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      res.json({
        message: "Payment marked as paid successfully",
        payment: paidPayment
      });
    } catch (error: any) {
      console.error("Mark payment paid error:", error);
      res.status(500).json({ message: error.message || "Failed to mark payment as paid" });
    }
  });

  // 💰 GET /api/payments/:paymentId - Get payment details
  app.get("/api/payments/:paymentId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const payment = await storage.getPayment(req.params.paymentId);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Get invoice to check authorization
      const invoice = await storage.getInvoice(payment.invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Associated invoice not found" });
      }

      // Check authorization
      if (
        req.user!.id !== invoice.providerId &&
        req.user!.id !== invoice.requesterId &&
        req.user!.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized to view this payment" });
      }

      res.json(payment);
    } catch (error: any) {
      console.error("Get payment error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payment" });
    }
  });

  // 💰 GET /api/payments/invoice/:invoiceId - Get payment for specific invoice
  app.get("/api/payments/invoice/:invoiceId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const payment = await storage.getPaymentByInvoiceId(req.params.invoiceId);

      if (!payment) {
        return res.status(404).json({ message: "No payment found for this invoice" });
      }

      res.json(payment);
    } catch (error: any) {
      console.error("Get payment by invoice error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payment" });
    }
  });

  // 💰 GET /api/invoices/:id/payment-status - Get payment status for invoice
  app.get("/api/invoices/:id/payment-status", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const payment = await storage.getPaymentByInvoiceId(req.params.id);
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const paymentStatus = payment?.paymentStatus || "unpaid";
      const canComplete = paymentStatus === "paid";

      res.json({
        paymentStatus,
        canComplete,
        amount: invoice.amount,
        paymentMethod: invoice.paymentMethod,
        paidAt: payment?.paidAt || null
      });
    } catch (error: any) {
      console.error("Get payment status error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payment status" });
    }
  });
}
