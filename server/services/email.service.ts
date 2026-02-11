import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = 'JobTradeSasa <onboarding@resend.dev>';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const emailService = {
  async sendVerificationEmail(to: string, name: string, verificationCode: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send verification email to:', to, 'Code:', verificationCode);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Verify Your Email - JobTradeSasa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #1a365d;">Hello ${name}!</h2>
              <p style="font-size: 16px; color: #333;">
                Thank you for signing up with JobTradeSasa. To complete your registration, 
                please verify your email address by entering the following code:
              </p>
              <div style="background-color: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${verificationCode}</span>
              </div>
              <p style="font-size: 14px; color: #666;">
                This code will expire in 15 minutes. If you didn't create an account with JobTradeSasa, 
                please ignore this email.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendPasswordResetEmail(to: string, name: string, resetCode: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send password reset email to:', to, 'Code:', resetCode);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Reset Your Password - JobTradeSasa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #1a365d;">Hello ${name}!</h2>
              <p style="font-size: 16px; color: #333;">
                We received a request to reset your password. Use the following code to reset it:
              </p>
              <div style="background-color: #fff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d;">${resetCode}</span>
              </div>
              <p style="font-size: 14px; color: #666;">
                This code will expire in 15 minutes. If you didn't request a password reset, 
                please ignore this email and your password will remain unchanged.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendDocumentApprovedEmail(to: string, name: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send document approved email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Documents Verified - JobTradeSasa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #1a365d;">Congratulations, ${name}!</h2>
              <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 48px;">&#10004;</span>
              </div>
              <p style="font-size: 16px; color: #333;">
                Great news! Your documents have been reviewed and <strong style="color: #22c55e;">approved</strong> by our admin team.
              </p>
              <p style="font-size: 16px; color: #333;">
                You now have full access to all features on JobTradeSasa. You can start:
              </p>
              <ul style="font-size: 14px; color: #333; line-height: 1.8;">
                <li>Browsing and applying for jobs in your area</li>
                <li>Receiving job notifications</li>
                <li>Building your profile and reputation</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://jobtradesasa.replit.app/jobs" style="background-color: #f59e0b; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Start Browsing Jobs
                </a>
              </div>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send document approved email:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendDocumentRejectedEmail(to: string, name: string, reason: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send document rejected email to:', to, 'Reason:', reason);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Document Verification Update - JobTradeSasa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #1a365d;">Hello ${name},</h2>
              <p style="font-size: 16px; color: #333;">
                We've reviewed your submitted documents, but unfortunately we were unable to approve them at this time.
              </p>
              <div style="background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
                <p style="font-size: 14px; color: #333; margin: 0;">
                  <strong>Reason:</strong><br/>
                  ${reason || 'Please ensure your documents are clear, valid, and match your profile information.'}
                </p>
              </div>
              <p style="font-size: 16px; color: #333;">
                Don't worry! You can resubmit your documents after addressing the issues mentioned above.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://jobtradesasa.replit.app/verification" style="background-color: #f59e0b; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Resubmit Documents
                </a>
              </div>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send document rejected email:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send welcome email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Welcome to JobTradeSasa!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #1a365d;">Welcome aboard, ${name}!</h2>
              <p style="font-size: 16px; color: #333;">
                Your email has been verified successfully. You're now part of the JobTradeSasa community!
              </p>
              <p style="font-size: 16px; color: #333;">
                To complete your account setup and start using all features, please:
              </p>
              <ol style="font-size: 14px; color: #333; line-height: 1.8;">
                <li>Complete your profile information</li>
                <li>Upload your verification documents</li>
                <li>Wait for admin approval (usually within 24 hours)</li>
              </ol>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://jobtradesasa.replit.app/profile" style="background-color: #f59e0b; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Complete Your Profile
                </a>
              </div>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  // 💰 Invoice Email Methods
  async sendInvoiceSentEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send invoice sent email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `New Invoice - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #1a365d;">New Invoice Received</h2>
              <p style="font-size: 16px; color: #333;">
                Hello ${name},
              </p>
              <p style="font-size: 16px; color: #333;">
                A new invoice has been sent for the job <strong>"${jobTitle}"</strong>.
              </p>
              <div style="background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #666;">Invoice Amount:</p>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #1a365d;">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size: 14px; color: #666;">
                Please review the invoice and approve or request changes in the JobTradeSasa platform.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });
      return !error;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendInvoiceApprovedEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send invoice approved email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Invoice Approved! - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #10b981;">✓ Invoice Approved!</h2>
              <p style="font-size: 16px; color: #333;">
                Hello ${name},
              </p>
              <p style="font-size: 16px; color: #333;">
                Your invoice for <strong>"${jobTitle}"</strong> has been approved!
              </p>
              <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; font-size: 14px; color: #666;">Invoice Amount:</p>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #10b981;">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size: 14px; color: #666;">
                Please proceed with the job. The requester is ready for you to start work.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });
      return !error;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendInvoiceDeclinedEmail(to: string, name: string, jobTitle: string, reason?: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send invoice declined email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Invoice Changes Requested - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #ef4444;">Invoice Changes Requested</h2>
              <p style="font-size: 16px; color: #333;">
                Hello ${name},
              </p>
              <p style="font-size: 16px; color: #333;">
                The requester has requested changes to your invoice for <strong>"${jobTitle}"</strong>.
              </p>
              ${reason ? `
              <div style="background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #333;">Reason:</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">${reason}</p>
              </div>
              ` : ''}
              <p style="font-size: 14px; color: #666;">
                Please review your invoice and make any necessary adjustments, then resubmit it for approval.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });
      return !error;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  // 💰 Payment Email Methods
  async sendPaymentReceivedEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send payment received email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Payment Received - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #10b981;">✓ Payment Received!</h2>
              <p style="font-size: 16px; color: #333;">
                Hello ${name},
              </p>
              <p style="font-size: 16px; color: #333;">
                Payment has been received for the job <strong>"${jobTitle}"</strong>.
              </p>
              <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; font-size: 14px; color: #666;">Amount Received:</p>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #10b981;">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size: 14px; color: #666;">
                Thank you for your work! You can now mark the job as complete once finished.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });
      return !error;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },

  async sendPaymentOverdueEmail(to: string, name: string, jobTitle: string, invoiceAmount: string): Promise<boolean> {
    try {
      if (!resend) {
        console.log('Email service not configured. Would send payment overdue email to:', to);
        return true;
      }
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Payment Reminder - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a365d; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">JobTradeSasa</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2 style="color: #f59e0b;">Payment Reminder</h2>
              <p style="font-size: 16px; color: #333;">
                Hello ${name},
              </p>
              <p style="font-size: 16px; color: #333;">
                This is a reminder that payment for the job <strong>"${jobTitle}"</strong> is pending.
              </p>
              <div style="background-color: #fffbeb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #666;">Outstanding Amount:</p>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #f59e0b;">BWP ${invoiceAmount}</p>
              </div>
              <p style="font-size: 14px; color: #666;">
                Please process the payment to complete the job and unlock the provider's ability to take on new projects.
              </p>
            </div>
            <div style="background-color: #1a365d; padding: 15px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Find. Connect. Hire. - JobTradeSasa
              </p>
            </div>
          </div>
        `,
      });
      return !error;
    } catch (err) {
      console.error('Email service error:', err);
      return false;
    }
  },
};

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
