import Queue from 'bull';
import { emailService } from './email.service';

// Define queue types
interface EmailPayload {
  type: 'verification' | 'welcome' | 'password_reset' | 'notification';
  email: string;
  name: string;
  code?: string;
  resetCode?: string;
}

// 🚀 Create email queue with Redis connection
// Using Upstash Redis in production, local Redis in development
let emailQueue: Queue.Queue<EmailPayload> | null = null;

try {
  // Production: Use Upstash REST API via custom adapter
  // Development: Use local Redis
  const isProduction = process.env.NODE_ENV === 'production';
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const queueConfig: any = isProduction && upstashUrl && upstashToken
    ? {
        // Upstash REST API endpoint with token auth
        host: upstashUrl.replace('https://', '').split('.')[0],
        port: 443,
        password: upstashToken,
        tls: true,
      }
    : {
        // Local Redis for development
        host: process.env.BULL_REDIS_HOST || 'localhost',
        port: parseInt(process.env.BULL_REDIS_PORT || '6379'),
        password: process.env.BULL_REDIS_PASSWORD,
      };

  emailQueue = new Queue<EmailPayload>('emails', queueConfig as any, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    },
  });

  // Process email queue
  emailQueue.process(async (job) => {
    const { type, email, name, code, resetCode } = job.data;

    try {
      switch (type) {
        case 'verification':
          if (!code) throw new Error('Verification code is required');
          await emailService.sendVerificationEmail(email, name, code);
          break;
        case 'welcome':
          await emailService.sendWelcomeEmail(email, name);
          break;
        case 'password_reset':
          if (!resetCode) throw new Error('Reset code is required');
          await emailService.sendPasswordResetEmail(email, name, resetCode);
          break;
        default:
          console.warn(`Unknown email type: ${type}`);
      }
      return { success: true, type, email };
    } catch (error) {
      console.error(`Failed to send ${type} email to ${email}:`, error);
      throw error;
    }
  });

  // Queue event handlers
  emailQueue.on('failed', (job, err) => {
    console.error(`Email job ${job.id} failed:`, err.message);
  });

  emailQueue.on('completed', (job) => {
    console.log(`Email job ${job.id} completed successfully`);
  });
} catch (error) {
  console.error('Failed to initialize email queue:', error);
  console.warn('Email sending will not be queued. Make sure Redis is configured.');
}

export class EmailQueueService {
  static async queueVerificationEmail(email: string, name: string, code: string) {
    if (!emailQueue) {
      console.warn('Email queue not initialized. Sending email synchronously.');
      return emailService.sendVerificationEmail(email, name, code);
    }
    return emailQueue.add(
      { type: 'verification', email, name, code },
      { priority: 10 } // High priority
    );
  }

  static async queueWelcomeEmail(email: string, name: string) {
    if (!emailQueue) {
      console.warn('Email queue not initialized. Sending email synchronously.');
      return emailService.sendWelcomeEmail(email, name);
    }
    return emailQueue.add(
      { type: 'welcome', email, name },
      { priority: 5 }
    );
  }

  static async queuePasswordResetEmail(email: string, name: string, resetCode: string) {
    if (!emailQueue) {
      console.warn('Email queue not initialized. Sending email synchronously.');
      return emailService.sendPasswordResetEmail(email, name, resetCode);
    }
    return emailQueue.add(
      { type: 'password_reset', email, name, resetCode },
      { priority: 10 }
    );
  }

  static async getQueueStats() {
    if (!emailQueue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
    
    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  static async closeQueue() {
    if (emailQueue) {
      await emailQueue.close();
    }
  }
}

export default emailQueue;
