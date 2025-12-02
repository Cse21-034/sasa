/**
 * Verification Service
 * Handles user verification submissions and status management
 * Follows Single Responsibility Principle by focusing on verification operations
 */

import { db } from "../db";
import { verificationSubmissions, users } from "@shared/schema";
import type { VerificationSubmission, InsertVerificationSubmission } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

interface SubmissionWithUser extends VerificationSubmission {
  user: any;
}

export class VerificationService {
  /**
   * Create or update a verification submission
   * Overwrites existing pending/rejected submissions of the same type
   * @param submission - Verification submission data
   * @returns Created submission
   */
  async createVerificationSubmission(submission: InsertVerificationSubmission & { userId: string }): Promise<VerificationSubmission> {
    // Overwrite existing pending/rejected submission of the same type for simplicity
    await db.delete(verificationSubmissions)
      .where(and(eq(verificationSubmissions.userId, submission.userId), eq(verificationSubmissions.type, submission.type)));

    const [created] = await db.insert(verificationSubmissions).values(submission).returning();
    return created;
  }

  /**
   * Get verification submission for a user
   * @param userId - User ID
   * @param type - Submission type (identity or document)
   * @returns Verification submission or undefined
   */
  async getVerificationSubmission(userId: string, type: 'identity' | 'document'): Promise<VerificationSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(verificationSubmissions)
      .where(and(eq(verificationSubmissions.userId, userId), eq(verificationSubmissions.type, type)));
    return submission || undefined;
  }

  /**
   * Get all pending verification submissions
   * Admin function to review verification requests
   * @returns Array of pending submissions with user information
   */
  async getPendingVerificationSubmissions(): Promise<SubmissionWithUser[]> {
    const results = await db
      .select({
        submission: verificationSubmissions,
        user: users,
      })
      .from(verificationSubmissions)
      .leftJoin(users, eq(verificationSubmissions.userId, users.id))
      .where(eq(verificationSubmissions.status, 'pending'))
      .orderBy(desc(verificationSubmissions.createdAt));

    // Map the combined result into the desired structure
    return results.map(r => ({
      ...r.submission,
      user: r.user!,
    }));
  }

  /**
   * Update verification submission status
   * Admin function to approve or reject verification
   * @param id - Submission ID
   * @param status - New status (approved or rejected)
   * @param reviewerId - ID of the reviewer (admin)
   * @param rejectionReason - Reason for rejection (if applicable)
   * @returns Updated submission or undefined
   */
  async updateVerificationSubmissionStatus(
    id: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    rejectionReason?: string
  ): Promise<VerificationSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.id, id));

    if (!submission) return undefined;

    // Update user's verification status if this is an identity verification
    if (status === 'approved' && submission.type === 'identity') {
      await db
        .update(users)
        .set({ isVerified: true, updatedAt: new Date() })
        .where(eq(users.id, submission.userId));
    }

    // Update submission status
    const [updated] = await db
      .update(verificationSubmissions)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason,
      })
      .where(eq(verificationSubmissions.id, id))
      .returning();

    return updated || undefined;
  }
}

// Export singleton instance
export const verificationService = new VerificationService();
