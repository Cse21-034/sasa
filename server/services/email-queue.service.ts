import { emailService } from './email.service';

// Direct async email sender — no Bull/Redis required (works on Vercel serverless)
export class EmailQueueService {
  static queueVerificationEmail(email: string, name: string, code: string): Promise<void> {
    return emailService.sendVerificationEmail(email, name, code)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send verification email:', err));
  }

  static queueWelcomeEmail(email: string, name: string): Promise<void> {
    return emailService.sendWelcomeEmail(email, name)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send welcome email:', err));
  }

  static queuePasswordResetEmail(email: string, name: string, resetCode: string): Promise<void> {
    return emailService.sendPasswordResetEmail(email, name, resetCode)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send password reset email:', err));
  }

  static queueInvoiceSentEmail(email: string, name: string, jobTitle: string, invoiceAmount: string): Promise<void> {
    return emailService.sendInvoiceSentEmail(email, name, jobTitle, invoiceAmount)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send invoice sent email:', err));
  }

  static queueInvoiceApprovedEmail(email: string, name: string, jobTitle: string, invoiceAmount: string): Promise<void> {
    return emailService.sendInvoiceApprovedEmail(email, name, jobTitle, invoiceAmount)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send invoice approved email:', err));
  }

  static queueInvoiceDeclinedEmail(email: string, name: string, jobTitle: string, reason?: string): Promise<void> {
    return emailService.sendInvoiceDeclinedEmail(email, name, jobTitle, reason)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send invoice declined email:', err));
  }

  static queuePaymentReceivedEmail(email: string, name: string, jobTitle: string, invoiceAmount: string): Promise<void> {
    return emailService.sendPaymentReceivedEmail(email, name, jobTitle, invoiceAmount)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send payment received email:', err));
  }

  static queuePaymentOverdueEmail(email: string, name: string, jobTitle: string, invoiceAmount: string): Promise<void> {
    return emailService.sendPaymentOverdueEmail(email, name, jobTitle, invoiceAmount)
      .then(() => {})
      .catch(err => console.error('❌ [Email Queue] Failed to send payment overdue email:', err));
  }
}

export default EmailQueueService;
