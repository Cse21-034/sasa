import type { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { payGate } from '../lib/paygate';

// Derive the base URL from the request (works on Vercel + local)
function getBaseUrl(req: Request): string {
  return (
    process.env.SERVER_URL ||
    `${req.protocol}://${req.get('host')}`
  );
}

export function registerPayGateRoutes(app: Express) {

  // ── STEP 1: Build signed params + create pending payment record ──────────
  // Called by browser when requester clicks "Pay with Card (PayGate)"
  app.post('/api/paygate/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { invoiceId } = req.body;
      if (!invoiceId) return res.status(400).json({ message: 'invoiceId required' });

      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

      if (req.user!.id !== invoice.requesterId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Only the requester can initiate payment' });
      }
      if (invoice.status !== 'approved') {
        return res.status(400).json({ message: 'Invoice must be approved before payment' });
      }

      // Get requester email for PayGate
      const requester = await storage.getUser(req.user!.id);
      if (!requester?.email) return res.status(400).json({ message: 'User email not found' });

      // Unique reference: JTS_PAY_<invoiceId>_<timestamp>
      const reference = `JTS_PAY_${invoiceId}_${Date.now()}`;
      const amountInCents = Math.round(Number(invoice.amount) * 100);

      const base = getBaseUrl(req);

      const params = payGate.buildInitiateParams({
        reference,
        amount: amountInCents,
        currency: 'BWP',
        email: requester.email,
        returnUrl:  `${base}/api/paygate/return`,
        notifyUrl:  `${base}/api/paygate/callback`,
      });

      // Ensure payment record exists (approveInvoice may have created one already)
      let payment = await storage.getPaymentByInvoiceId(invoiceId);
      if (!payment) {
        payment = await storage.createPayment(
          invoiceId,
          invoice.jobId,
          invoice.amount.toString(),
          'card',
          reference
        );
      } else {
        // Update transactionId with the new reference so we can look it up in callback
        await storage.savePayRequestId(invoiceId, ''); // clear stale payRequestId
      }

      // Store reference in transactionId field so callback can find this payment
      await storage.markPaymentReference(invoiceId, reference);

      return res.json({
        success: true,
        checkout: {
          initiateUrl: payGate.INITIATE_URL,
          processUrl:  payGate.PROCESS_URL,
          params,
          reference,
        },
      });
    } catch (err: any) {
      console.error('[PayGate checkout]', err);
      return res.status(500).json({ message: err.message || 'Checkout failed' });
    }
  });

  // ── STEP 2: Server proxy → calls PayGate initiate.trans ─────────────────
  // PayGate blocks browser→PayGate calls (CORS/WAF). We proxy it server-side.
  app.post('/api/paygate/initiate', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { params, reference } = req.body;
      if (!params || !reference) {
        return res.status(400).json({ success: false, message: 'Missing params or reference' });
      }

      const formData = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => formData.append(k, String(v)));

      const pgRes  = await fetch(payGate.INITIATE_URL, { method: 'POST', body: formData });
      const pgText = await pgRes.text();

      // Extract PAY_REQUEST_ID — try multiple formats PayGate may return
      let payRequestId: string | null = null;

      try {
        const parsed = new URLSearchParams(pgText);
        payRequestId = parsed.get('PAY_REQUEST_ID');
      } catch { /* try next */ }

      if (!payRequestId) {
        const match = pgText.match(/name=['"]PAY_REQUEST_ID['"][\s\S]*?value=['"]([^'"]+)['"]/i);
        if (match?.[1]) payRequestId = match[1];
      }

      if (!payRequestId) {
        try {
          const json = JSON.parse(pgText);
          payRequestId = json.PAY_REQUEST_ID;
        } catch { /* not JSON */ }
      }

      if (!payRequestId) {
        console.error('[PayGate initiate] Raw response:', pgText.substring(0, 500));
        return res.status(400).json({
          success: false,
          message: 'Failed to get PAY_REQUEST_ID from PayGate',
          debug: pgText.substring(0, 300),
        });
      }

      // Find payment by reference and save PAY_REQUEST_ID
      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      await storage.savePayRequestId(payment.invoiceId, payRequestId);

      return res.json({ success: true, payRequestId, reference });
    } catch (err: any) {
      console.error('[PayGate initiate]', err);
      return res.status(500).json({ success: false, message: err.message || 'Initiate failed' });
    }
  });

  // ── STEP 3: Calculate process.trans checksum for browser form POST ───────
  app.post('/api/paygate/process', authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
      const { payRequestId, reference } = _req.body;
      if (!payRequestId || !reference) {
        return res.status(400).json({ message: 'Missing payRequestId or reference' });
      }

      const checksum = payGate.buildProcessChecksum(payRequestId, reference);

      return res.json({
        success: true,
        processUrl: payGate.PROCESS_URL,
        params: { PAY_REQUEST_ID: payRequestId, CHECKSUM: checksum },
      });
    } catch (err: any) {
      return res.status(500).json({ message: 'Process step failed' });
    }
  });

  // ── STEP 4: RETURN_URL — browser redirect after PayGate hosted page ──────
  // PayGate POSTs to this URL; we update status (lenient) then redirect the
  // user's browser to a frontend result page.
  app.post('/api/paygate/return', async (req: Request, res: Response) => {
    const frontendBase =
      process.env.FRONTEND_URL ||
      process.env.SERVER_URL    ||
      'https://www.jobtradesasa.com';

    try {
      const data = req.body as Record<string, string>;
      const payRequestId    = data.PAY_REQUEST_ID || '';
      const transactionStatus = data.TRANSACTION_STATUS || '0';
      const checksum        = data.CHECKSUM || '';

      if (!payRequestId) {
        return res.redirect(303, `${frontendBase}/payment-result?status=failed&error=no_id`);
      }

      // Look up payment by PAY_REQUEST_ID
      let payment = await storage.getPaymentByPayRequestId(payRequestId);

      // Fallback: most recent pending payment (handles race with slow DB write)
      if (!payment) {
        payment = await storage.getMostRecentPendingPayment();
      }

      if (!payment) {
        return res.redirect(303, `${frontendBase}/payment-result?status=failed&error=not_found`);
      }

      const invoice = await storage.getInvoice(payment.invoiceId);
      if (!invoice) {
        return res.redirect(303, `${frontendBase}/payment-result?status=failed&error=no_invoice`);
      }

      const reference = payment.transactionId || '';
      const isSuccess = transactionStatus === '1';

      // Verify return checksum (lenient — authoritative check is in callback)
      if (reference) {
        const valid = payGate.verifyReturnChecksum(payRequestId, reference, checksum);
        if (!valid) console.warn('[PayGate return] Checksum mismatch — trusting callback');
      }

      if (isSuccess && payment.paymentStatus !== 'paid') {
        await storage.markPaymentAsPaid(payment.invoiceId, payRequestId);
      }

      const params = new URLSearchParams({
        status:    isSuccess ? 'success' : 'failed',
        reference: reference || payRequestId,
        jobId:     invoice.jobId,
      });

      return res.redirect(303, `${frontendBase}/payment-result?${params.toString()}`);
    } catch (err: any) {
      console.error('[PayGate return]', err);
      return res.redirect(303, `${frontendBase}/payment-result?status=failed&error=server`);
    }
  });

  // ── STEP 5: CALLBACK — authoritative server-to-server notification ────────
  // No auth middleware — PayGate calls this directly.
  // MUST return plain text "OK" — anything else causes PayGate to retry.
  app.post('/api/paygate/callback', async (req: Request, res: Response) => {
    try {
      // PayGate sends URL-encoded form data (not JSON)
      const data = req.body as Record<string, string>;

      // Verify checksum FIRST — preserve FormData insertion order (never sort)
      if (!payGate.verifyCallbackChecksum(data)) {
        console.error('[PayGate callback] Invalid checksum');
        return res.send('OK'); // still return OK to stop retries
      }

      const isSuccess        = data.TRANSACTION_STATUS === '1';
      const reference        = data.REFERENCE || '';
      const payGateTxId      = data.TRANSACTION_ID || data.PAY_REQUEST_ID || '';

      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        console.error('[PayGate callback] Payment not found for ref:', reference);
        return res.send('OK');
      }

      if (!isSuccess) {
        await storage.markPaymentFailed(payment.invoiceId, data.RESULT_DESC || 'Declined');
        return res.send('OK');
      }

      // Idempotency — skip if already marked paid
      if (payment.paymentStatus === 'paid') {
        return res.send('OK');
      }

      await storage.markPaymentAsPaid(payment.invoiceId, payGateTxId);

      // Notify the provider
      try {
        const invoice = await storage.getInvoice(payment.invoiceId);
        const job     = invoice ? await storage.getJob(invoice.jobId) : null;
        if (invoice && job) {
          await storage.createNotification({
            recipientId: invoice.providerId,
            jobId:       invoice.jobId,
            type:        'message_received',
            title:       'Payment Received!',
            message:     `Card payment of BWP ${invoice.amount} received for "${job.title}". You can now start the job.`,
          });
        }
      } catch (notifyErr) {
        console.error('[PayGate callback] Notification error:', notifyErr);
      }

      return res.send('OK');
    } catch (err: any) {
      console.error('[PayGate callback] Error:', err);
      return res.send('OK'); // always OK — never let errors cause PayGate retries
    }
  });
}
