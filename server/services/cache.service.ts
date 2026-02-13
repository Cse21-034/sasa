import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client with fallback to local if no credentials
let redis: Redis | null = null;
let redisAvailable = false;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisAvailable = true;
    console.log('✅ Redis cache initialized successfully');
  } else {
    console.warn('⚠️  Upstash Redis credentials not configured. Cache will be disabled.');
    console.warn('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env to enable caching');
    redisAvailable = false;
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis:', error);
  console.warn('⚠️  Continuing without cache. App will work normally but slower.');
  redisAvailable = false;
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
};

class CacheService {
  // User Profile Cache
  async getUserProfile(userId: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`user:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setUserProfile(userId: string, data: any) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        `user:${userId}`,
        CACHE_DURATIONS.USER_PROFILE,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateUserProfile(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del(`user:${userId}`);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Provider Profile Cache
  async getProviderProfile(userId: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`provider:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setProviderProfile(userId: string, data: any) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        `provider:${userId}`,
        CACHE_DURATIONS.PROVIDER_PROFILE,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateProviderProfile(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del(`provider:${userId}`);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Supplier Profile Cache
  async getSupplierProfile(userId: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`supplier:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setSupplierProfile(userId: string, data: any) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        `supplier:${userId}`,
        CACHE_DURATIONS.SUPPLIER_PROFILE,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateSupplierProfile(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del(`supplier:${userId}`);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Company Profile Cache
  async getCompanyProfile(userId: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`company:${userId}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setCompanyProfile(userId: string, data: any) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        `company:${userId}`,
        CACHE_DURATIONS.COMPANY_PROFILE,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateCompanyProfile(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del(`company:${userId}`);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Categories Cache
  async getCategories() {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get('categories:all');
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setCategories(data: any) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        'categories:all',
        CACHE_DURATIONS.CATEGORY_LIST,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateCategories() {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del('categories:all');
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Unread Message Count Cache
  async getUnreadCount(userId: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`unread_messages:${userId}`);
      return cached ? parseInt(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setUnreadCount(userId: string, count: number) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        `unread_messages:${userId}`,
        CACHE_DURATIONS.UNREAD_COUNT,
        count.toString()
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async incrementUnreadCount(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      const current = await redis.get(`unread_messages:${userId}`);
      const count = current ? parseInt(current as string) : 0;
      await this.setUnreadCount(userId, count + 1);
    } catch (error) {
      console.warn('Cache increment error:', error);
    }
  }

  async decrementUnreadCount(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      const current = await redis.get(`unread_messages:${userId}`);
      const count = current ? parseInt(current as string) : 0;
      if (count > 0) {
        await this.setUnreadCount(userId, count - 1);
      }
    } catch (error) {
      console.warn('Cache decrement error:', error);
    }
  }

  async invalidateUnreadCount(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del(`unread_messages:${userId}`);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Provider Search Cache
  async getProviderSearchResults(key: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`providers:search:${key}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setProviderSearchResults(key: string, data: any) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(
        `providers:search:${key}`,
        CACHE_DURATIONS.PROVIDER_SEARCH,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateProviderSearch(pattern: string = '*') {
    if (!redisAvailable || !redis) return;
    try {
      const keys = await redis.keys(`providers:search:${pattern}`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.warn('Error invalidating provider search cache:', error);
    }
  }

  // Email Verification Token Cache
  async getEmailToken(userId: string, code: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`email_token:${userId}:${code}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setEmailToken(userId: string, code: string, expiresAt: Date) {
    if (!redisAvailable || !redis) return;
    try {
      const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      await redis.setex(
        `email_token:${userId}:${code}`,
        Math.max(ttl, 60),
        JSON.stringify({ userId, code, expiresAt })
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidateEmailTokens(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      const keys = await redis.keys(`email_token:${userId}:*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.warn('Error invalidating email tokens:', error);
    }
  }

  // Password Reset Token Cache
  async getPasswordResetToken(userId: string, code: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(`password_reset:${userId}:${code}`);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async setPasswordResetToken(userId: string, code: string, expiresAt: Date) {
    if (!redisAvailable || !redis) return;
    try {
      const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
      await redis.setex(
        `password_reset:${userId}:${code}`,
        Math.max(ttl, 60),
        JSON.stringify({ userId, code, expiresAt })
      );
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async invalidatePasswordResetTokens(userId: string) {
    if (!redisAvailable || !redis) return;
    try {
      const keys = await redis.keys(`password_reset:${userId}:*`);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.warn('Error invalidating password reset tokens:', error);
    }
  }

  // Generic Cache Methods
  async get(key: string) {
    if (!redisAvailable || !redis) return null;
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttl: number = 300) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async del(key: string) {
    if (!redisAvailable || !redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  // Batch invalidate by pattern
  async invalidateByPattern(pattern: string) {
    if (!redisAvailable || !redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.del(key)));
      }
    } catch (error) {
      console.warn(`Error invalidating cache pattern ${pattern}:`, error);
    }
  }
}

export const cacheService = new CacheService();
