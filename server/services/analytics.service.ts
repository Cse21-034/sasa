/**
 * Analytics Service
 * Handles analytics and reporting including user stats, provider stats, and admin reports
 * Follows Single Responsibility Principle by focusing on analytics operations
 */

import { db } from "../db";
import { jobs, ratings, jobReports, users } from "@shared/schema";
import type { JobReport } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface JobReportWithRelations extends JobReport {
  reporter: any;
  jobTitle: string;
  jobStatus: string;
}

export class AnalyticsService {
  /**
   * Get requester statistics
   * @param requesterId - Requester user ID
   * @returns Statistics including job counts, spending, and completion rate
   */
  async getRequesterStats(requesterId: string): Promise<any> {
    const userJobs = await db.select().from(jobs).where(eq(jobs.requesterId, requesterId));

    const totalJobs = userJobs.length;
    const completedJobs = userJobs.filter(j => j.status === 'completed').length;
    const totalSpent = userJobs
      .filter(j => j.amountPaid)
      .reduce((sum, j) => sum + parseFloat(j.amountPaid || '0'), 0);

    const jobsByCategory = userJobs.reduce((acc, job) => {
      const catId = job.categoryId.toString();
      acc[catId] = (acc[catId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalJobs,
      completedJobs,
      totalSpent,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      jobsByCategory,
      recentJobs: userJobs.slice(0, 10),
    };
  }

  /**
   * Get provider statistics
   * @param providerId - Provider user ID
   * @returns Statistics including earnings, completed jobs, and ratings
   */
  async getProviderStats(providerId: string): Promise<any> {
    const providerJobs = await db.select().from(jobs).where(eq(jobs.providerId, providerId));

    const totalJobs = providerJobs.length;
    const completedJobs = providerJobs.filter(j => j.status === 'completed').length;
    // 🔥 FIXED: Use amountPaid (what requester actually paid) instead of providerCharge (what provider quoted)
    const totalEarnings = providerJobs
      .filter(j => j.amountPaid)
      .reduce((sum, j) => sum + parseFloat(j.amountPaid || '0'), 0);

    const providerRatings = await db.select().from(ratings).where(eq(ratings.toUserId, providerId));

    const avgRating =
      providerRatings.length > 0
        ? providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length
        : 0;

    return {
      totalEarnings,
      completedJobs,
      averageRating: avgRating.toFixed(1),
      avgResponseTime: 12,
    };
  }

  /**
   * Get admin job analytics
   * Platform-wide job statistics for dashboard
   * @returns Analytics including total jobs, completion rates, and trends
   */
  async getAdminJobAnalytics(): Promise<any> {
    const allJobs = await db.select().from(jobs);
    
    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter(j => j.status === 'completed').length;
    const activeJobs = allJobs.filter(j => j.status === 'accepted' || j.status === 'enroute' || j.status === 'onsite').length;
    
    const totalRevenueData = allJobs
      .filter(j => j.amountPaid)
      .reduce((sum, j) => sum + parseFloat(j.amountPaid || '0'), 0);

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      totalRevenue: totalRevenueData,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
    };
  }

  /**
   * Get all job reports with filters
   * Admin function to view reported jobs
   * @param params - Filter parameters (status)
   * @returns Array of job reports with related data
   */
  async getJobReports(params: { status?: 'resolved' | 'unresolved' }): Promise<JobReportWithRelations[]> {
    const conditions = [];
    if (params.status) {
      conditions.push(eq(jobReports.status, params.status));
    }

    const results = await db
      .select({
        report: jobReports,
        reporter: users,
        job: jobs,
      })
      .from(jobReports)
      .leftJoin(users, eq(jobReports.reporterId, users.id))
      .leftJoin(jobs, eq(jobReports.jobId, jobs.id))
      .where(conditions.length ? conditions[0] : undefined);

    return results.map((r) => ({
      ...r.report,
      reporter: r.reporter,
      jobTitle: r.job?.title || 'Unknown',
      jobStatus: r.job?.status || 'unknown',
    }));
  }

  /**
   * Resolve a job report
   * @param reportId - Report ID
   * @returns Updated report or undefined
   */
  async resolveJobReport(reportId: string): Promise<JobReport | undefined> {
    const [updated] = await db
      .update(jobReports)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(eq(jobReports.id, reportId))
      .returning();

    return updated || undefined;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
