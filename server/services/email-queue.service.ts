import { emailService } from './email.service';

// Direct async email sender — no Bull/Redis required (works on Vercel serverless)
export class EmailQueueService {
  static queueVerificationEmail(email: string, name: string, code: string) {
    emailService.sendVerificationEmail(email, name, code)
      .catch(err => console.error('❌ [Email Queue] Failed to send verification email:', err));
  }

  static queueWelcomeEmail(email: string, name: string) {
    emailService.sendWelcomeEmail(email, name)
      .catch(err => console.error('❌ [Email Queue] Failed to send welcome email:', err));
  }

  static queuePasswordResetEmail(email: string, name: string, resetCode: string) {
    emailService.sendPasswordResetEmail(email, name, resetCode)
      .catch(err => console.error('❌ [Email Queue] Failed to send password reset email:', err));
  }

  static queueInvoiceSentEmail(email: string, name: string, jobTitle: string, invoiceAmount: string) {
    emailService.sendInvoiceSentEmail(email, name, jobTitle, invoiceAmount)
      .catch(err => console.error('❌ [Email Queue] Failed to send invoice sent email:', err));
  }

  static queueInvoiceApprovedEmail(email: string, name: string, jobTitle: string, invoiceAmount: string) {
    emailService.sendInvoiceApprovedEmail(email, name, jobTitle, invoiceAmount)
      .catch(err => console.error('❌ [Email Queue] Failed to send invoice approved email:', err));
  }

  static queueInvoiceDeclinedEmail(email: string, name: string, jobTitle: string, reason?: string) {
    emailService.sendInvoiceDeclinedEmail(email, name, jobTitle, reason)
      .catch(err => console.error('❌ [Email Queue] Failed to send invoice declined email:', err));
  }

  static queuePaymentReceivedEmail(email: string, name: string, jobTitle: string, invoiceAmount: string) {
    emailService.sendPaymentReceivedEmail(email, name, jobTitle, invoiceAmount)
      .catch(err => console.error('❌ [Email Queue] Failed to send payment received email:', err));
  }

  static queuePaymentOverdueEmail(email: string, name: string, jobTitle: string, invoiceAmount: string) {
    emailService.sendPaymentOverdueEmail(email, name, jobTitle, invoiceAmount)
      .catch(err => console.error('❌ [Email Queue] Failed to send payment overdue email:', err));
  }
}

export default EmailQueueService;
