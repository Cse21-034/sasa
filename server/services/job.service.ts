/**
 * Job Service
 * Handles all job operations including creation, updates, acceptance, and payments
 * Follows Single Responsibility Principle by focusing on job-related operations
 */

import { db } from "../db";
import { jobs, users, categories, providers as providersTable } from "@shared/schema";
import type { Job, InsertJob } from "@shared/schema";
import { eq, and, or, desc, inArray } from "drizzle-orm";

type JobWithRelations = Job & {
  requester: any;
  provider?: any;
  category: any;
};

export class JobService {
  /**
   * Get a specific job with all relations (requester, provider, category)
   * @param id - Job ID
   * @returns Job with relations or undefined
   */
  async getJob(id: string): Promise<JobWithRelations | undefined> {
    const [jobSelect] = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(eq(jobs.id, id));

    if (!jobSelect) return undefined;

    let provider = null;
    if (jobSelect.job.providerId) {
      const [providerData] = await db
        .select()
        .from(users)
        .where(eq(users.id, jobSelect.job.providerId));
      
      const [providerProfile] = await db
        .select()
        .from(providersTable)
        .where(eq(providersTable.userId, jobSelect.job.providerId));
      
      if (providerData) {
        provider = {
          ...providerData,
          ratingAverage: providerProfile?.ratingAverage || '0',
          completedJobsCount: providerProfile?.completedJobsCount || 0,
          isVerified: providerProfile?.isVerified || false,
        };
      }
    }

    return {
      ...jobSelect.job,
      requester: jobSelect.requester,
      provider,
      category: jobSelect.category,
    };
  }

  /**
   * Get jobs filtered by category, status, requester, provider, or city
   * @param params - Filter parameters
   * @returns Array of jobs matching criteria
   */
  async getJobs(params: {
    categoryId?: string;
    status?: string;
    requesterId?: string;
    providerId?: string;
    city?: string;
  }): Promise<JobWithRelations[]> {
    const conditions = [];

    if (params.categoryId) conditions.push(eq(jobs.categoryId, parseInt(params.categoryId)));
    if (params.status) conditions.push(eq(jobs.status, params.status as Job['status']));
    if (params.requesterId) conditions.push(eq(jobs.requesterId, params.requesterId));
    if (params.providerId) conditions.push(eq(jobs.providerId, params.providerId));
    if (params.city) conditions.push(eq(jobs.city, params.city));

    const results = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt));

    return results.map((r) => ({
      ...r.job,
      requester: r.requester,
      category: r.category,
    })) as JobWithRelations[];
  }

  /**
   * Get jobs by multiple cities
   * @param cities - Array of city names
   * @returns Array of jobs in specified cities
   */
  async getJobsByCity(cities: string[]): Promise<JobWithRelations[]> {
    if (!cities || cities.length === 0) return [];

    const results = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(inArray(jobs.city, cities))
      .orderBy(desc(jobs.createdAt));

    return results.map((r) => ({
      ...r.job,
      requester: r.requester,
      category: r.category,
    })) as JobWithRelations[];
  }

  /**
   * Get jobs by provider type (individual, company, or both)
   * Filters jobs by their allowed provider type
   * @param providerType - Provider type filter (individual, company, or both)
   * @param cities - Optional array of cities to filter by
   * @returns Array of jobs matching the provider type
   */
  async getJobsByProviderType(providerType: string, cities?: string[]): Promise<JobWithRelations[]> {
    const conditions: any[] = [];

    // Filter by provider type - show jobs that either allow this type or allow both
    if (providerType === 'individual') {
      // Individual providers can see jobs for 'individual' or 'both'
      conditions.push(
        or(
          eq(jobs.allowedProviderType, 'individual' as any),
          eq(jobs.allowedProviderType, 'both' as any)
        )
      );
    } else if (providerType === 'company') {
      // Company providers can see jobs for 'company' or 'both'
      conditions.push(
        or(
          eq(jobs.allowedProviderType, 'company' as any),
          eq(jobs.allowedProviderType, 'both' as any)
        )
      );
    }
    // If 'both', show all jobs

    // Also filter by cities if provided
    if (cities && cities.length > 0) {
      conditions.push(inArray(jobs.city, cities));
    }

    const results = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions.length === 1 ? conditions[0] : undefined)
      .orderBy(desc(jobs.createdAt));

    return results.map((r) => ({
      ...r.job,
      requester: r.requester,
      category: r.category,
    })) as JobWithRelations[];
  }

  /**
   * Create a new job
   * @param insertJob - Job data to insert
   * @returns Created job
   */
  async createJob(insertJob: InsertJob & { requesterId: string }): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  /**
   * Update job information
   * @param id - Job ID
   * @param data - Partial job data to update
   * @returns Updated job or undefined
   */
  async updateJob(id: string, data: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updated || undefined;
  }

  /**
   * Accept a job for a provider
   * Sets provider ID and status to 'accepted'
   * @param jobId - Job ID
   * @param providerId - Provider user ID
   * @returns Updated job or undefined
   */
  async acceptJob(jobId: string, providerId: string): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ providerId, status: 'accepted', updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    return updated || undefined;
  }

  /**
   * Set provider's charge for completed work
   * @param jobId - Job ID
   * @param charge - Charge amount as string
   * @returns Updated job or undefined
   */
  async setProviderCharge(jobId: string, charge: string): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ providerCharge: charge, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    return updated || undefined;
  }

  /**
   * Confirm payment for a job
   * @param jobId - Job ID
   * @param amount - Amount paid as string
   * @returns Updated job or undefined
   */
  async confirmPayment(jobId: string, amount: string): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ amountPaid: amount, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    return updated || undefined;
  }
}

// Export singleton instance
export const jobService = new JobService();
