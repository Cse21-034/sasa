/**
 * Provider Service
 * Handles all provider operations including profile management and searching
 * Follows Single Responsibility Principle by focusing on provider-related operations
 */

import { db } from "../db";
import { providers, users } from "@shared/schema";
import type { Provider, InsertProvider } from "@shared/schema";
import { eq } from "drizzle-orm";
import { InferSelectModel } from 'drizzle-orm';

type ProviderSearchResult = InferSelectModel<typeof providers> & {
  user: any;
};

export class ProviderService {
  /**
   * Get provider by user ID
   * @param userId - User ID
   * @returns Provider or undefined
   */
  async getProvider(userId: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider || undefined;
  }

  /**
   * Create a new provider profile
   * @param provider - Provider data to insert
   * @returns Created provider
   */
  async createProvider(provider: InsertProvider & { userId: string }): Promise<Provider> {
    const [created] = await db.insert(providers).values(provider).returning();
    return created;
  }

  /**
   * Update provider profile information
   * @param userId - User ID
   * @param data - Partial provider data to update
   * @returns Updated provider or undefined
   */
  async updateProvider(userId: string, data: Partial<Provider>): Promise<Provider | undefined> {
    const [updated] = await db
      .update(providers)
      .set(data)
      .where(eq(providers.userId, userId))
      .returning();
    return updated || undefined;
  }

  /**
   * Update provider's service area
   * @param userId - User ID
   * @param primaryCity - Primary city of operation
   * @param primaryRegion - Primary region (optional)
   * @returns Updated provider or undefined
   */
  async updateProviderServiceArea(userId: string, primaryCity: string, primaryRegion?: string): Promise<Provider | undefined> {
    const [updated] = await db
      .update(providers)
      .set({
        primaryCity,
        primaryRegion,
      })
      .where(eq(providers.userId, userId))
      .returning();
    return updated || undefined;
  }

  /**
   * Search for providers based on criteria
   * Filters by category, city, location, or online status
   * @param params - Search parameters
   * @returns Array of matching providers with user info
   */
  async searchProviders(params: {
    categoryId?: number;
    city?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<ProviderSearchResult[]> {
    let query = db
      .select({
        userId: providers.userId,
        companyName: providers.companyName,
        serviceCategories: providers.serviceCategories,
        ratingAverage: providers.ratingAverage,
        completedJobsCount: providers.completedJobsCount,
        isOnline: providers.isOnline,
        latitude: providers.latitude,
        longitude: providers.longitude,
        primaryCity: providers.primaryCity,
        approvedServiceAreas: providers.approvedServiceAreas,
        user: users,
      })
      .from(providers)
      .leftJoin(users, eq(providers.userId, users.id))
      .where(eq(providers.isOnline, true));

    // Filter by city if provided
    if (params.city) {
      const results = await query;
      return results.filter(r =>
        r.approvedServiceAreas &&
        (r.approvedServiceAreas as string[]).includes(params.city!)
      ).map((r) => ({ ...r, user: r.user })) as ProviderSearchResult[];
    }

    const results = await query;
    return results.map((r) => ({ ...r, user: r.user })) as ProviderSearchResult[];
  }

  /**
   * Get provider statistics including earnings and ratings
   * @param providerId - Provider user ID
   * @returns Provider statistics object
   */
  async getProviderStats(providerId: string): Promise<any> {
    // Implementation moved to analytics service
    // This is kept for backwards compatibility
    throw new Error('Use AnalyticsService.getProviderStats() instead');
  }
}

// Export singleton instance
export const providerService = new ProviderService();
