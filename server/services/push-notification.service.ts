import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn('⚠️ VAPID keys not configured. Web push notifications will not work.');
} else {
  webpush.setVapidDetails(
    'mailto:support@jobtradesasa.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ Web Push configured successfully');
}

export class PushNotificationService {
  /**
   * Save or update a user's push subscription
   */
  async savePushSubscription(
    userId: string,
    subscription: PushSubscriptionJSON,
    enableNotifications: boolean = true
  ): Promise<void> {
    try {
      // Check if subscription already exists
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      if (existing.length > 0) {
        // Update existing subscription
        await db
          .update(pushSubscriptions)
          .set({
            subscription: JSON.stringify(subscription),
            isEnabled: enableNotifications,
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.userId, userId));
      } else {
        // Insert new subscription
        await db.insert(pushSubscriptions).values({
          userId,
          subscription: JSON.stringify(subscription),
          isEnabled: enableNotifications,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      console.log(`✅ Push subscription saved for user ${userId}`);
    } catch (error) {
      console.error('❌ Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Update notification preference for a user
   */
  async updateNotificationPreference(userId: string, isEnabled: boolean): Promise<void> {
    try {
      await db
        .update(pushSubscriptions)
        .set({
          isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.userId, userId));
      
      console.log(`✅ Notification preference updated for user ${userId}: ${isEnabled}`);
    } catch (error) {
      console.error('❌ Error updating notification preference:', error);
      throw error;
    }
  }

  /**
   * Send a push notification to a specific user
   */
  async sendPushNotification(
    userId: string,
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      url?: string;
    }
  ): Promise<void> {
    try {
      // Get user's push subscription
      const [subscription] = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      if (!subscription || !subscription.isEnabled) {
        console.log(`⏭️  Push notifications disabled for user ${userId} or no subscription found`);
        return;
      }

      const subscriptionObject = JSON.parse(subscription.subscription);
      
      const payload = JSON.stringify({
        title,
        body: options?.body || '',
        icon: options?.icon || '/icon-192.png',
        badge: options?.badge || '/icon-192.png',
        tag: options?.tag || 'notification',
        url: options?.url || '/',
      });

      await webpush.sendNotification(subscriptionObject, payload);
      console.log(`✅ Push notification sent to user ${userId}`);
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Subscription no longer valid, remove it
        console.log(`🗑️  Removing invalid subscription for user ${userId}`);
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      } else {
        console.error(`❌ Error sending push notification to user ${userId}:`, error.message);
      }
    }
  }

  /**
   * Send push notifications to multiple users
   */
  async sendBulkPushNotifications(
    userIds: string[],
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      url?: string;
    }
  ): Promise<void> {
    try {
      console.log(`📢 Sending push notification to ${userIds.length} users`);
      
      for (const userId of userIds) {
        await this.sendPushNotification(userId, title, options);
      }
    } catch (error) {
      console.error('❌ Error sending bulk push notifications:', error);
    }
  }

  /**
   * Send push notification when a message is received
   */
  async notifyMessageReceived(
    recipientId: string,
    senderName: string,
    messagePreview: string
  ): Promise<void> {
    try {
      await this.sendPushNotification(recipientId, `New message from ${senderName}`, {
        body: messagePreview,
        tag: 'message',
        url: '/messages',
      });
    } catch (error) {
      console.error('❌ Error notifying message received:', error);
    }
  }

  /**
   * Send push notification when a new job is posted
   */
  async notifyJobPosted(
    providerId: string,
    jobTitle: string,
    jobCity: string
  ): Promise<void> {
    try {
      await this.sendPushNotification(providerId, `New job in ${jobCity}`, {
        body: `${jobTitle}`,
        tag: 'job',
        url: '/jobs',
      });
    } catch (error) {
      console.error('❌ Error notifying job posted:', error);
    }
  }

  /**
   * Send push notification for application received
   */
  async notifyApplicationReceived(
    requesterId: string,
    providerName: string,
    jobTitle: string
  ): Promise<void> {
    try {
      await this.sendPushNotification(requesterId, `New application from ${providerName}`, {
        body: `Applied to: ${jobTitle}`,
        tag: 'application',
        url: '/jobs',
      });
    } catch (error) {
      console.error('❌ Error notifying application received:', error);
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey(): string {
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }
    return vapidPublicKey;
  }
}

export const pushNotificationService = new PushNotificationService();
