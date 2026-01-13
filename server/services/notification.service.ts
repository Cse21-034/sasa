/**
 * Notification Service
 * Handles sending notifications to providers when jobs are posted
 * Filters notifications based on:
 * - Category (provider must serve this category)
 * - Location (provider must serve this city)
 * - Provider Type (respects allowedProviderType: individual, company, or both)
 */

import { db } from "../db";
import { providers, users, notifications, companies } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

type JobNotificationPayload = {
  jobId: string;
  jobTitle: string;
  jobCity: string;
  categoryId: number;
  allowedProviderType: 'individual' | 'company' | 'both';
  jobDescription: string;
  urgency: string;
};

export class NotificationService {
  /**
   * Send job posted notifications to relevant providers
   * Filters by:
   * - Service category
   * - Service location/city
   * - Provider type (individual, company, or both)
   */
  async notifyProvidersOfNewJob(jobPayload: JobNotificationPayload): Promise<string[]> {
    try {
      const notifiedProviderIds: string[] = [];

      // Get all active providers with this service category
      // Use SQL for JSONB contains check - the @> operator checks if array contains value
      const categoryArray = JSON.stringify([jobPayload.categoryId]);
      const relevantProviders = await db
        .select({
          userId: providers.userId,
          approvedServiceAreas: providers.approvedServiceAreas,
          primaryCity: providers.primaryCity,
        })
        .from(providers)
        .where(
          sql`(${providers.serviceCategories}::jsonb) @> (${categoryArray}::jsonb)`
        );

      if (relevantProviders.length === 0) {
        return [];
      }

      // Filter providers by location and provider type
      for (const provider of relevantProviders) {
        const approvedCities = (provider.approvedServiceAreas as string[]) || [provider.primaryCity];

        // Check if provider serves this city
        if (!approvedCities.includes(jobPayload.jobCity)) {
          continue;
        }

        // Determine if this is a company provider
        const isCompanyProvider = await this.isCompanyProvider(provider.userId);

        // Check if provider type matches the job's allowedProviderType
        if (!this.matchesProviderType(isCompanyProvider, jobPayload.allowedProviderType)) {
          continue;
        }

        // Create notification for this provider
        const notificationTitle = `New ${jobPayload.urgency === 'emergency' ? '🚨 URGENT ' : ''}Job in ${jobPayload.jobCity}`;
        const notificationMessage = `A new job has been posted: "${jobPayload.jobTitle}". Tap to view details and apply.`;

        await db.insert(notifications).values({
          recipientId: provider.userId,
          jobId: jobPayload.jobId,
          type: 'job_posted',
          title: notificationTitle,
          message: notificationMessage,
        });

        notifiedProviderIds.push(provider.userId);
      }

      return notifiedProviderIds;
    } catch (error) {
      console.error('Error notifying providers of new job:', error);
      return [];
    }
  }

  /**
   * Check if a provider is a company provider
   * (has both a provider profile and a company profile)
   */
  private async isCompanyProvider(userId: string): Promise<boolean> {
    const [companyProfile] = await db
      .select({ id: companies.userId })
      .from(companies)
      .where(eq(companies.userId, userId));

    return !!companyProfile;
  }

  /**
   * Check if provider type matches job requirements
   * Returns true if the provider type matches what the job allows
   */
  private matchesProviderType(
    isCompanyProvider: boolean,
    allowedProviderType: 'individual' | 'company' | 'both'
  ): boolean {
    if (allowedProviderType === 'both') {
      return true; // Both individual and company can apply
    }

    if (allowedProviderType === 'individual') {
      return !isCompanyProvider; // Only individuals can apply
    }

    if (allowedProviderType === 'company') {
      return isCompanyProvider; // Only companies can apply
    }

    return false;
  }

  /**
   * Notify requester when a provider applies to their job
   */
  async notifyRequesterOfApplication(
    requesterId: string,
    providerId: string,
    jobId: string,
    jobTitle: string,
    providerName: string
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        recipientId: requesterId,
        jobId: jobId,
        type: 'application_received',
        title: 'New Application',
        message: `${providerName} has applied to your job "${jobTitle}". Tap to view their profile and message.`,
      });
    } catch (error) {
      console.error('Error notifying requester of application:', error);
    }
  }

  /**
   * Notify provider when their application is accepted
   */
  async notifyProviderApplicationAccepted(
    providerId: string,
    jobId: string,
    jobTitle: string
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        recipientId: providerId,
        jobId: jobId,
        type: 'application_accepted',
        title: 'Application Accepted! 🎉',
        message: `Your application for "${jobTitle}" has been accepted. The requester will contact you soon.`,
      });
    } catch (error) {
      console.error('Error notifying provider of acceptance:', error);
    }
  }

  /**
   * Notify provider when their application is rejected
   */
  async notifyProviderApplicationRejected(
    providerId: string,
    jobId: string,
    jobTitle: string
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        recipientId: providerId,
        jobId: jobId,
        type: 'application_rejected',
        title: 'Application Update',
        message: `Unfortunately, you were not selected for "${jobTitle}". Keep applying to other opportunities!`,
      });
    } catch (error) {
      console.error('Error notifying provider of rejection:', error);
    }
  }

  /**
   * Notify recipient when a new message is received
   */
  async notifyRecipientOfMessage(
    recipientId: string,
    senderName: string,
    messagePreview: string
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        recipientId: recipientId,
        type: 'message_received',
        title: `New message from ${senderName}`,
        message: messagePreview,
      });
    } catch (error) {
      console.error('Error notifying recipient of message:', error);
    }
  }
}

export const notificationService = new NotificationService();