import { Resend } from 'resend';

interface IEmailService {
  sendVerificationEmail(to: string, name: string, code: string): Promise<boolean>;
  sendWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, name: string, resetCode: string): Promise<boolean>;
  sendDocumentApprovedEmail(to: string, name: string): Promise<boolean>;
  sendDocumentRejectedEmail(to: string, name: string, reason: string): Promise<boolean>;
  sendInvoiceSentEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean>;
  sendInvoiceApprovedEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean>;
  sendInvoiceDeclinedEmail(to: string, name: string, jobTitle: string, reason?: string): Promise<boolean>;
  sendPaymentReceivedEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean>;
  sendPaymentOverdueEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean>;
  testConnection(): Promise<boolean>;
}

class ResendEmailService implements IEmailService {
  private resend: Resend | null = null;
  private baseUrl: string;

  // Different sender addresses for different email categories
  private readonly addresses = {
    registration: 'JobTradeSasa Registration <registration@jobtradesasa.com>',
    support:      'JobTradeSasa Support <support@jobtradesasa.com>',
    billing:      'JobTradeSasa Billing <billing@jobtradesasa.com>',
    info:         'JobTradeSasa <info@jobtradesasa.com>',
  };

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.baseUrl = process.env.FRONTEND_URL || 'https://jobtradesasa.com';

      console.log('✅ [Email Service] Resend email service initialized');
      console.log(`📧 [Email Service] Senders: registration, support, billing, info @jobtradesasa.com`);
      console.log(`🌐 [Email Service] Base URL: ${this.baseUrl}`);
    } else {
      this.baseUrl = 'https://jobtradesasa.com';
      console.warn('⚠️ [Email Service] RESEND_API_KEY not configured. Email functionality disabled.');
    }
  }

  private async sendEmail(to: string, subject: string, html: string, text: string, from?: string): Promise<boolean> {
    if (!this.resend) {
      console.warn(`⚠️ [Email Service] Email service not configured. Skipping email to: ${to}`);
      return false;
    }

    const sender = from || this.addresses.info;

    try {
      console.log(`[Email Service] Sending "${subject}" to: ${to} from: ${sender}`);

      const { data, error } = await this.resend.emails.send({
        from: sender,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error('❌ [Email Service] Resend API error:', error);
        return false;
      }

      if (data?.id) {
        console.log(`✅ [Email Service] Email sent successfully. Resend ID: ${data.id}`);
        return true;
      }

      console.warn('⚠️ [Email Service] No data returned and no error received');
      return false;
    } catch (err: any) {
      console.error('❌ [Email Service] Exception while sending email:', err.message || err);
      return false;
    }
  }

  async sendVerificationEmail(to: string, name: string, code: string): Promise<boolean> {
    const subject = 'Verify Your Email - JobTradeSasa';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .code-box { background: white; border: 2px solid #1a365d; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
            .code { font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1a365d; font-family: monospace; }
            .timer { color: #f59e0b; font-weight: bold; margin-top: 8px; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#1a365d">Hello ${name}!</h2>
              <p>Thank you for signing up. Enter the code below to verify your email address:</p>
              <div class="code-box">
                <div class="code">${code}</div>
                <div class="timer">Expires in 15 minutes</div>
              </div>
              <p style="font-size:14px;color:#666">If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nYour JobTradeSasa verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, please ignore this email.\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.registration);
    if (sent) console.log(`✅ [Email Service] Verification email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send verification email to: ${to}`);
    return sent;
  }

  async sendPasswordResetEmail(to: string, name: string, resetCode: string): Promise<boolean> {
    const subject = 'Reset Your Password - JobTradeSasa';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .code-box { background: white; border: 2px solid #1a365d; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
            .code { font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1a365d; font-family: monospace; }
            .timer { color: #f59e0b; font-weight: bold; margin-top: 8px; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#1a365d">Hello ${name}!</h2>
              <p>We received a request to reset your password. Use the code below:</p>
              <div class="code-box">
                <div class="code">${resetCode}</div>
                <div class="timer">Expires in 15 minutes</div>
              </div>
              <p style="font-size:14px;color:#666">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nYour JobTradeSasa password reset code is: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.support);
    if (sent) console.log(`✅ [Email Service] Password reset email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send password reset email to: ${to}`);
    return sent;
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to JobTradeSasa!';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .step { padding: 12px; background: white; margin: 10px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:28px">Welcome aboard, ${name}!</h1>
              <p style="margin:8px 0 0 0;opacity:0.9">Your email has been verified</p>
            </div>
            <div class="content">
              <p>You're now part of the JobTradeSasa community! To complete your account setup:</p>
              <div class="step"><strong>1.</strong> Complete your profile information</div>
              <div class="step"><strong>2.</strong> Upload your verification documents</div>
              <div class="step"><strong>3.</strong> Wait for admin approval (usually within 24 hours)</div>
              <div style="text-align:center">
                <a href="${this.baseUrl}/profile" class="button">Complete Your Profile</a>
              </div>
              <p style="font-size:14px;color:#666">Need help? Contact us anytime — we're here for you.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Welcome aboard, ${name}!\n\nYour email has been verified. To complete your account setup:\n\n1. Complete your profile information\n2. Upload your verification documents\n3. Wait for admin approval (usually within 24 hours)\n\nGet started at: ${this.baseUrl}/profile\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.registration);
    if (sent) console.log(`✅ [Email Service] Welcome email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send welcome email to: ${to}`);
    return sent;
  }

  async sendDocumentApprovedEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Documents Verified - JobTradeSasa';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .badge { text-align: center; margin: 20px 0; }
            .feature { padding: 10px; background: white; margin: 8px 0; border-left: 4px solid #22c55e; border-radius: 4px; font-size: 14px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#22c55e;text-align:center">Congratulations, ${name}! ✓</h2>
              <p>Great news! Your documents have been reviewed and <strong style="color:#22c55e">approved</strong> by our admin team.</p>
              <p>You now have full access to all features:</p>
              <div class="feature">Browse and apply for jobs in your area</div>
              <div class="feature">Receive job notifications</div>
              <div class="feature">Build your profile and reputation</div>
              <div style="text-align:center">
                <a href="${this.baseUrl}/jobs" class="button">Start Browsing Jobs</a>
              </div>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Congratulations, ${name}!\n\nYour documents have been reviewed and approved. You now have full access to all features on JobTradeSasa.\n\nStart browsing jobs at: ${this.baseUrl}/jobs\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.support);
    if (sent) console.log(`✅ [Email Service] Document approved email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send document approved email to: ${to}`);
    return sent;
  }

  async sendDocumentRejectedEmail(to: string, name: string, reason: string): Promise<boolean> {
    const subject = 'Document Verification Update - JobTradeSasa';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .reason-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#1a365d">Hello ${name},</h2>
              <p>We've reviewed your submitted documents, but unfortunately we were unable to approve them at this time.</p>
              <div class="reason-box">
                <strong>Reason:</strong><br>
                ${reason || 'Please ensure your documents are clear, valid, and match your profile information.'}
              </div>
              <p>Don't worry! You can resubmit your documents after addressing the issues above.</p>
              <div style="text-align:center">
                <a href="${this.baseUrl}/verification" class="button">Resubmit Documents</a>
              </div>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nWe've reviewed your submitted documents but were unable to approve them at this time.\n\nReason: ${reason || 'Please ensure your documents are clear, valid, and match your profile information.'}\n\nYou can resubmit at: ${this.baseUrl}/verification\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.support);
    if (sent) console.log(`✅ [Email Service] Document rejected email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send document rejected email to: ${to}`);
    return sent;
  }

  async sendInvoiceSentEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    const subject = `New Invoice - ${jobTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .amount-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#1a365d">New Invoice Received</h2>
              <p>Hello ${name},</p>
              <p>A new invoice has been sent for the job <strong>"${jobTitle}"</strong>.</p>
              <div class="amount-box">
                <p style="margin:0;font-size:14px;color:#666">Invoice Amount:</p>
                <p style="margin:8px 0 0 0;font-size:28px;font-weight:bold;color:#1a365d">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size:14px;color:#666">Please review the invoice and approve or request changes in the platform.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nA new invoice has been sent for the job "${jobTitle}".\n\nAmount: BWP ${invoiceAmount}\n\nPlease log in to review and approve.\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.billing);
    if (sent) console.log(`✅ [Email Service] Invoice sent email delivered to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send invoice email to: ${to}`);
    return sent;
  }

  async sendInvoiceApprovedEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    const subject = `Invoice Approved! - ${jobTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .amount-box { background: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#10b981">✓ Invoice Approved!</h2>
              <p>Hello ${name},</p>
              <p>Your invoice for <strong>"${jobTitle}"</strong> has been approved!</p>
              <div class="amount-box">
                <p style="margin:0;font-size:14px;color:#666">Invoice Amount:</p>
                <p style="margin:8px 0 0 0;font-size:28px;font-weight:bold;color:#10b981">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size:14px;color:#666">Please proceed with the job. The requester is ready for you to start work.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nYour invoice for "${jobTitle}" has been approved!\n\nAmount: BWP ${invoiceAmount}\n\nPlease proceed with the job.\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.billing);
    if (sent) console.log(`✅ [Email Service] Invoice approved email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send invoice approved email to: ${to}`);
    return sent;
  }

  async sendInvoiceDeclinedEmail(to: string, name: string, jobTitle: string, reason?: string): Promise<boolean> {
    const subject = `Invoice Changes Requested - ${jobTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .reason-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#ef4444">Invoice Changes Requested</h2>
              <p>Hello ${name},</p>
              <p>The requester has requested changes to your invoice for <strong>"${jobTitle}"</strong>.</p>
              ${reason ? `
              <div class="reason-box">
                <strong>Reason:</strong><br>${reason}
              </div>` : ''}
              <p style="font-size:14px;color:#666">Please review and resubmit your invoice for approval.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nChanges have been requested for your invoice for "${jobTitle}".\n\n${reason ? `Reason: ${reason}\n\n` : ''}Please review and resubmit your invoice.\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.billing);
    if (sent) console.log(`✅ [Email Service] Invoice declined email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send invoice declined email to: ${to}`);
    return sent;
  }

  async sendPaymentReceivedEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    const subject = `Payment Received - ${jobTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .amount-box { background: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#10b981">✓ Payment Received!</h2>
              <p>Hello ${name},</p>
              <p>Payment has been received for the job <strong>"${jobTitle}"</strong>.</p>
              <div class="amount-box">
                <p style="margin:0;font-size:14px;color:#666">Amount Received:</p>
                <p style="margin:8px 0 0 0;font-size:28px;font-weight:bold;color:#10b981">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size:14px;color:#666">Thank you for your work! You can now mark the job as complete once finished.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nPayment has been received for the job "${jobTitle}".\n\nAmount: BWP ${invoiceAmount}\n\nThank you for your work!\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.billing);
    if (sent) console.log(`✅ [Email Service] Payment received email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send payment received email to: ${to}`);
    return sent;
  }

  async sendPaymentOverdueEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    const subject = `Payment Reminder - ${jobTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a365d; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; background: #f8f9fa; }
            .amount-box { background: #fffbeb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .footer { background: #1a365d; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .footer p { color: white; margin: 0; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1 style="margin:0">JobTradeSasa</h1></div>
            <div class="content">
              <h2 style="color:#f59e0b">Payment Reminder</h2>
              <p>Hello ${name},</p>
              <p>This is a reminder that payment for the job <strong>"${jobTitle}"</strong> is pending.</p>
              <div class="amount-box">
                <p style="margin:0;font-size:14px;color:#666">Outstanding Amount:</p>
                <p style="margin:8px 0 0 0;font-size:28px;font-weight:bold;color:#f59e0b">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size:14px;color:#666">Please process the payment to complete the job and unlock the provider's ability to take on new projects.</p>
            </div>
            <div class="footer"><p>Find. Connect. Hire. - JobTradeSasa</p></div>
          </div>
        </body>
      </html>`;

    const text = `Hello ${name},\n\nThis is a reminder that payment for the job "${jobTitle}" is pending.\n\nOutstanding Amount: BWP ${invoiceAmount}\n\nPlease process payment at your earliest convenience.\n\nFind. Connect. Hire. - JobTradeSasa`;

    const sent = await this.sendEmail(to, subject, html, text, this.addresses.billing);
    if (sent) console.log(`✅ [Email Service] Payment overdue email sent to: ${to}`);
    else console.error(`❌ [Email Service] Failed to send payment overdue email to: ${to}`);
    return sent;
  }

  async testConnection(): Promise<boolean> {
    if (!this.resend) {
      console.error('❌ [Email Service] Resend not initialized — check RESEND_API_KEY');
      return false;
    }

    try {
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      console.log(`[Email Service] Testing connection with email: ${testEmail}`);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: testEmail,
        subject: 'Test Email - JobTradeSasa',
        html: '<p>This is a test email to verify the Resend integration with JobTradeSasa.</p>',
        text: 'This is a test email to verify the Resend integration with JobTradeSasa.',
      });

      if (error) {
        console.error('❌ [Email Service] Connection test failed:', error);
        return false;
      }

      console.log(`✅ [Email Service] Connection test successful. Resend ID: ${data?.id}`);
      return true;
    } catch (err: any) {
      console.error('❌ [Email Service] Connection test exception:', err.message || err);
      return false;
    }
  }
}

export const emailService = new ResendEmailService();

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
