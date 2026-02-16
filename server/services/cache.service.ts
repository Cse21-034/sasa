import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client with fallback to local if no credentials
let redis: Redis;

try {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️  Upstash Redis credentials not configured. Cache will be disabled.');
    console.warn('   To enable caching, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');
  }
  
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  redis = new Redis({
    url: '',
    token: '',
  });
}

// Cache TTL constants (in seconds)
const CACHE_DURATIONS = {
  USER_PROFILE: 1800, // 30 minutes
  CATEGORY_LIST: 3600, // 1 hour
  PROVIDER_SEARCH: 300, // 5 minutes
  UNREAD_COUNT: 300, // 5 minutes
  EMAIL_TOKEN: 900, // 15 minutes
  PROVIDER_PROFILE: 1800, // 30 minutes
  SUPPLIER_PROFILE: 1800, // 30 minutes
  COMPANY_PROFILE: 3600, // 1 hour
  INVOICE: 1800, // 30 minutes - invoices don't change often
  PAYMENT: 300, // 5 minutes - payments are time-sensitive
};

class CacheService {
  // User Profile Cache
  async getUserProfile(userId: string) {
    try {
      const cached = await redis.get(`user:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for user profile ${userId}:`, error.message);
      await redis.del(`user:${userId}`).catch(() => {});
      return null;
    }
  }

  async setUserProfile(userId: string, data: any) {
    await redis.setex(
      `user:${userId}`,
      CACHE_DURATIONS.USER_PROFILE,
      JSON.stringify(data)
    );
  }

  async invalidateUserProfile(userId: string) {
    await redis.del(`user:${userId}`);
  }

  // Provider Profile Cache
  async getProviderProfile(userId: string) {
    try {
      const cached = await redis.get(`provider:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for provider profile ${userId}:`, error.message);
      await redis.del(`provider:${userId}`).catch(() => {});
      return null;
    }
  }

  async setProviderProfile(userId: string, data: any) {
    await redis.setex(
      `provider:${userId}`,
      CACHE_DURATIONS.PROVIDER_PROFILE,
      JSON.stringify(data)
    );
  }

  async invalidateProviderProfile(userId: string) {
    await redis.del(`provider:${userId}`);
  }

  // Supplier Profile Cache
  async getSupplierProfile(userId: string) {
    try {
      const cached = await redis.get(`supplier:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for supplier profile ${userId}:`, error.message);
      await redis.del(`supplier:${userId}`).catch(() => {});
      return null;
    }
  }

  async setSupplierProfile(userId: string, data: any) {
    try {
      const serialized = JSON.stringify(data);
      if (!serialized || serialized === 'undefined') {
        console.warn(`Skipping cache for supplier:${userId}: data not serializable`);
        return;
      }
      await redis.setex(
        `supplier:${userId}`,
        CACHE_DURATIONS.SUPPLIER_PROFILE,
        serialized
      );
    } catch (error: any) {
      console.error(`Cache storage error for supplier:${userId}:`, error.message);
    }
  }

  async invalidateSupplierProfile(userId: string) {
    await redis.del(`supplier:${userId}`);
  }

  // Company Profile Cache
  async getCompanyProfile(userId: string) {
    try {
      const cached = await redis.get(`company:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for company profile ${userId}:`, error.message);
      await redis.del(`company:${userId}`).catch(() => {});
      return null;
    }
  }

  async setCompanyProfile(userId: string, data: any) {
    await redis.setex(
      `company:${userId}`,
      CACHE_DURATIONS.COMPANY_PROFILE,
      JSON.stringify(data)
    );
  }

  async invalidateCompanyProfile(userId: string) {
    await redis.del(`company:${userId}`);
  }

  // Suppliers Cache
  async getSuppliers() {
    try {
      const cached = await redis.get('suppliers:all');
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error('Cache error for suppliers list:', error.message);
      await redis.del('suppliers:all').catch(() => {});
      return null;
    }
  }

  async setSuppliers(data: any) {
    try {
      const serialized = JSON.stringify(data);
      if (!serialized || serialized === 'undefined') {
        console.warn('Skipping cache for suppliers:all: data not serializable');
        return;
      }
      await redis.setex('suppliers:all', CACHE_DURATIONS.CATEGORY_LIST, serialized);
    } catch (error: any) {
      console.error('Cache storage error for suppliers:all:', error.message);
    }
  }

  async invalidateSuppliers() {
    await redis.del('suppliers:all');
  }

  // Supplier Details Cache
  async getSupplierDetails(supplierId: string) {
    try {
      const cached = await redis.get(`supplier:details:${supplierId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for supplier details ${supplierId}:`, error.message);
      await redis.del(`supplier:details:${supplierId}`).catch(() => {});
      return null;
    }
  }

  async setSupplierDetails(supplierId: string, data: any) {
    try {
      const serialized = JSON.stringify(data);
      if (!serialized || serialized === 'undefined') {
        console.warn(`Skipping cache for supplier:details:${supplierId}: data not serializable`);
        return;
      }
      await redis.setex(`supplier:details:${supplierId}`, CACHE_DURATIONS.SUPPLIER_PROFILE, serialized);
    } catch (error: any) {
      console.error(`Cache storage error for supplier:details:${supplierId}:`, error.message);
    }
  }

  async invalidateSupplierDetails(supplierId: string) {
    await redis.del(`supplier:details:${supplierId}`);
  }

  // Categories Cache
  async getCategories() {
    try {
      const cached = await redis.get('categories:all');
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error('Cache error for categories:', error.message);
      await redis.del('categories:all').catch(() => {});
      return null;
    }
  }

  async setCategories(data: any) {
    await redis.setex(
      'categories:all',
      CACHE_DURATIONS.CATEGORY_LIST,
      JSON.stringify(data)
    );
  }

  async invalidateCategories() {
    await redis.del('categories:all');
  }

  // Unread Message Count Cache
  async getUnreadCount(userId: string) {
    const cached = await redis.get(`unread_messages:${userId}`);
    return cached ? parseInt(cached as string) : null;
  }

  async setUnreadCount(userId: string, count: number) {
    await redis.setex(
      `unread_messages:${userId}`,
      CACHE_DURATIONS.UNREAD_COUNT,
      count.toString()
    );
  }

  async incrementUnreadCount(userId: string) {
    const current = await redis.get(`unread_messages:${userId}`);
    const count = current ? parseInt(current as string) : 0;
    await this.setUnreadCount(userId, count + 1);
  }

  async decrementUnreadCount(userId: string) {
    const current = await redis.get(`unread_messages:${userId}`);
    const count = current ? parseInt(current as string) : 0;
    if (count > 0) {
      await this.setUnreadCount(userId, count - 1);
    }
  }

  async invalidateUnreadCount(userId: string) {
    await redis.del(`unread_messages:${userId}`);
  }

  // Provider Search Cache
  async getProviderSearchResults(key: string) {
    try {
      const cached = await redis.get(`providers:search:${key}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for provider search ${key}:`, error.message);
      await redis.del(`providers:search:${key}`).catch(() => {});
      return null;
    }
  }

  async setProviderSearchResults(key: string, data: any) {
    await redis.setex(
      `providers:search:${key}`,
      CACHE_DURATIONS.PROVIDER_SEARCH,
      JSON.stringify(data)
    );
  }

  async invalidateProviderSearch(pattern: string = '*') {
    // Get all provider search keys and delete them
    try {
      const keys = await redis.keys(`providers:search:${pattern}`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.error('Error invalidating provider search cache:', error);
    }
  }

  // Email Verification Token Cache
  async getEmailToken(userId: string, code: string) {
    try {
      const cached = await redis.get(`email_token:${userId}:${code}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for email token ${userId}:${code}:`, error.message);
      await redis.del(`email_token:${userId}:${code}`).catch(() => {});
      return null;
    }
  }

  async setEmailToken(userId: string, code: string, expiresAt: Date) {
    const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
    await redis.setex(
      `email_token:${userId}:${code}`,
      Math.max(ttl, 60), // Minimum 60 seconds
      JSON.stringify({ userId, code, expiresAt })
    );
  }

  async invalidateEmailTokens(userId: string) {
    try {
      const keys = await redis.keys(`email_token:${userId}:*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.error('Error invalidating email tokens:', error);
    }
  }

  // Password Reset Token Cache
  async getPasswordResetToken(userId: string, code: string) {
    try {
      const cached = await redis.get(`password_reset:${userId}:${code}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for password reset token ${userId}:${code}:`, error.message);
      await redis.del(`password_reset:${userId}:${code}`).catch(() => {});
      return null;
    }
  }

  async setPasswordResetToken(userId: string, code: string, expiresAt: Date) {
    const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
    await redis.setex(
      `password_reset:${userId}:${code}`,
      Math.max(ttl, 60),
      JSON.stringify({ userId, code, expiresAt })
    );
  }

  async invalidatePasswordResetTokens(userId: string) {
    try {
      const keys = await redis.keys(`password_reset:${userId}:*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.error('Error invalidating password reset tokens:', error);
    }
  }

  // Generic Cache Methods
  async get(key: string) {
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      
      // Ensure we have a string before parsing
      const cachedStr = typeof cached === 'string' ? cached : String(cached);
      return JSON.parse(cachedStr);
    } catch (error: any) {
      console.error(`Cache retrieval error for key ${key}:`, error.message);
      // Clear corrupted cache entry
      try {
        await redis.del(key);
      } catch (delError) {
        console.error(`Failed to delete corrupted cache key ${key}:`, delError);
      }
      return null;
    }
  }

  async set(key: string, data: any, ttl: number = 300) {
    try {
      // Ensure data is serializable (strip ORM metadata if needed)
      const serialized = JSON.stringify(data);
      if (!serialized || serialized === 'undefined') {
        console.warn(`Skipping cache for ${key}: data not serializable`);
        return;
      }
      await redis.setex(key, ttl, serialized);
    } catch (error: any) {
      console.error(`Cache storage error for key ${key}:`, error.message);
      // Don't throw - let the app continue without caching
    }
  }

  async del(key: string) {
    await redis.del(key);
  }

  // Batch invalidate by pattern
  async invalidateByPattern(pattern: string) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.error(`Error invalidating cache pattern ${pattern}:`, error);
    }
  }

  // 💰 Invoice Cache
  async getInvoice(invoiceId: string) {
    try {
      const cached = await redis.get(`invoice:${invoiceId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for invoice ${invoiceId}:`, error.message);
      await redis.del(`invoice:${invoiceId}`).catch(() => {});
      return null;
    }
  }

  async setInvoice(invoiceId: string, data: any) {
    await redis.setex(
      `invoice:${invoiceId}`,
      CACHE_DURATIONS.INVOICE,
      JSON.stringify(data)
    );
  }

  async invalidateInvoice(invoiceId: string) {
    await redis.del(`invoice:${invoiceId}`);
  }

  // 💰 Invoice by Job ID Cache
  async getInvoiceByJobId(jobId: string) {
    try {
      const cached = await redis.get(`invoice:job:${jobId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for invoice by job ${jobId}:`, error.message);
      await redis.del(`invoice:job:${jobId}`).catch(() => {});
      return null;
    }
  }

  async setInvoiceByJobId(jobId: string, data: any) {
    await redis.setex(
      `invoice:job:${jobId}`,
      CACHE_DURATIONS.INVOICE,
      JSON.stringify(data)
    );
  }

  async invalidateInvoiceByJobId(jobId: string) {
    await redis.del(`invoice:job:${jobId}`);
  }

  // 💰 Payment Cache
  async getPayment(paymentId: string) {
    try {
      const cached = await redis.get(`payment:${paymentId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for payment ${paymentId}:`, error.message);
      await redis.del(`payment:${paymentId}`).catch(() => {});
      return null;
    }
  }

  async setPayment(paymentId: string, data: any) {
    await redis.setex(
      `payment:${paymentId}`,
      CACHE_DURATIONS.PAYMENT,
      JSON.stringify(data)
    );
  }

  async invalidatePayment(paymentId: string) {
    await redis.del(`payment:${paymentId}`);
  }

  // 💰 Payment by Invoice ID Cache
  async getPaymentByInvoiceId(invoiceId: string) {
    try {
      const cached = await redis.get(`payment:invoice:${invoiceId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error: any) {
      console.error(`Cache error for payment by invoice ${invoiceId}:`, error.message);
      await redis.del(`payment:invoice:${invoiceId}`).catch(() => {});
      return null;
    }
  }

  async setPaymentByInvoiceId(invoiceId: string, data: any) {
    await redis.setex(
      `payment:invoice:${invoiceId}`,
      CACHE_DURATIONS.PAYMENT,
      JSON.stringify(data)
    );
  }

  async invalidatePaymentByInvoiceId(invoiceId: string) {
    await redis.del(`payment:invoice:${invoiceId}`);
  }

  // 💰 Invalidate all invoice/payment caches for a job
  async invalidateJobInvoicesAndPayments(jobId: string) {
    try {
      await Promise.all([
        this.invalidateInvoiceByJobId(jobId),
        redis.del(`invoice:job:${jobId}`),
        redis.del(`payment:job:${jobId}`),
      ]);
    } catch (error) {
      console.error(`Error invalidating invoice/payment cache for job ${jobId}:`, error);
    }
  }
}

export const cacheService = new CacheService();
