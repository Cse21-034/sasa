/**
 * Company Service
 * Handles all company profile operations for company requesters and service providers
 * Follows Single Responsibility Principle by focusing on company-related operations
 */

import { db } from "../db";
import { companies, users } from "@shared/schema";
import type { InsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";

type Company = typeof companies.$inferSelect;
type InsertCompany = typeof companies.$inferInsert;

export class CompanyService {
  /**
   * Get company profile by user ID
   * @param userId - User ID
   * @returns Company profile or undefined
   */
  async getCompany(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company || undefined;
  }

  /**
   * Create a new company profile
   * @param company - Company data to insert
   * @returns Created company
   */
  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  /**
   * Update company profile information
   * @param userId - User ID
   * @param data - Partial company data to update
   * @returns Updated company or undefined
   */
  async updateCompany(userId: string, data: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.userId, userId))
      .returning();
    return updated || undefined;
  }

  /**
   * Get company by registration number
   * Verify company existence during registration
   * @param registrationNumber - Company registration number
   * @returns Company or undefined
   */
  async getCompanyByRegistration(registrationNumber: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.registrationNumber, registrationNumber));
    return company || undefined;
  }

  /**
   * Verify company documents (for verification workflow)
   * @param userId - User ID
   * @param isVerified - Verification status
   * @returns Updated company or undefined
   */
  async setCompanyVerification(userId: string, isVerified: boolean): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(companies.userId, userId))
      .returning();
    return updated || undefined;
  }

  /**
   * Update company rating and job count
   * Used after job completion
   * @param userId - User ID
   * @param rating - New average rating
   * @param jobsCompleted - Number of completed jobs
   * @returns Updated company or undefined
   */
  async updateCompanyStats(userId: string, rating: number, jobsCompleted: number): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({
        ratingAverage: rating.toString(),
        completedJobsCount: jobsCompleted,
        updatedAt: new Date(),
      })
      .where(eq(companies.userId, userId))
      .returning();
    return updated || undefined;
  }

  /**
   * Get all verified companies
   * For company service provider search
   * @returns Array of verified companies
   */
  async getVerifiedCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isVerified, true));
  }

  /**
   * Delete company profile (cascade handled by database)
   * @param userId - User ID
   */
  async deleteCompany(userId: string): Promise<void> {
    await db.delete(companies).where(eq(companies.userId, userId));
  }
}

// Export singleton instance
export const companyService = new CompanyService();
