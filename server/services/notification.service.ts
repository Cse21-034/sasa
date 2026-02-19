/**
 * Notification Service
 * Handles sending notifications to providers when jobs are posted
 * Filters notifications based on:
 * - Category (provider must serve this category)
 * - Location (provider must serve this city)
 * - Provider Type (respects allowedProviderType: individual, company, or both)
 */

import { db } from "../db";
import { providers, users, notifications, companies, providerCategoryVerifications } from "@shared/schema";
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

      // Get all providers with APPROVED verification for this service category
      // This ensures only verified providers receive job notifications
      const relevantProviders = await db
        .selectDistinct({
          userId: providers.userId,
          approvedServiceAreas: providers.approvedServiceAreas,
          primaryCity: providers.primaryCity,
        })
        .from(providerCategoryVerifications)
        .innerJoin(providers, eq(providerCategoryVerifications.providerId, providers.userId))
        .where(
          and(
            eq(providerCategoryVerifications.categoryId, jobPayload.categoryId),
            eq(providerCategoryVerifications.status, 'approved')
          )
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
      console.log(`🔔 [NotificationService] Creating message notification for ${recipientId} from ${senderName}`)
      await db.insert(notifications).values({
        recipientId: recipientId,
        type: 'message_received',
        title: `New message from ${senderName}`,
        message: messagePreview,
      })
            console.log(`✅ [NotificationService] Message notification created successfully`)
          } catch (error) {
            console.error('❌ [NotificationService] Error notifying recipient of message:', error);
          }
        }

  /**
   * Generic notification method for recipients
   */
  async notifyRecipient(
    recipientId: string,
    type: 'category_request_approved' | 'category_request_rejected' | 'job_posted' | 'job_cancelled' | 'message_received' | 'application_accepted' | 'application_rejected',
    title: string,
    message: string,
    jobId?: string
  ): Promise<void> {
    try {
      await db.insert(notifications).values({
        recipientId,
        jobId,
        type,
        title,
        message,
      })
    } catch (error) {
      console.error('Error notifying recipient:', error)
    }
  }
      
        async createAdminNotification(payload: {
          title: string;
          message: string;
          type: 'new_report' | 'new_verification' | 'new_migration';
        }): Promise<void> {
          try {
            const adminUsers = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.role, 'admin'));
      
            if (adminUsers.length === 0) {
              console.warn('No admin users found to send a notification to.');
              return;
            }
      
            const notificationInserts = adminUsers.map((admin) => ({
              recipientId: admin.id,
              type: payload.type,
              title: payload.title,
              message: payload.message,
            }));
      
            await db.insert(notifications).values(notificationInserts);
          } catch (error) {
            console.error('Error creating admin notification:', error);
          }
        }
      }
      
      export const notificationService = new NotificationService();
      