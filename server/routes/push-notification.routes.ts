import type { Express } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { pushNotificationService } from "../services/push-notification.service";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerPushNotificationRoutes(
  app: Express,
  injectedVerifyAccess: any
): void {
  const verifyAccess = injectedVerifyAccess;

  /**
   * GET /api/push/vapid-public-key
   * Get VAPID public key for client-side subscription
   */
  app.get("/api/push/vapid-public-key", (req, res) => {
    try {
      const key = pushNotificationService.getVapidPublicKey();
      res.json({ key });
    } catch (error: any) {
      console.error("Error getting VAPID public key:", error);
      res.status(500).json({ message: "Failed to get VAPID key" });
    }
  });

  /**
   * POST /api/push/subscribe
   * Save push subscription for authenticated user
   */
  app.post("/api/push/subscribe", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const { subscription, enableNotifications } = req.body;

      if (!subscription) {
        return res.status(400).json({ message: "Subscription object is required" });
      }

      await pushNotificationService.savePushSubscription(
        req.user!.id,
        subscription,
        enableNotifications !== false
      );

      res.json({ success: true, message: "Push subscription saved" });
    } catch (error: any) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * PUT /api/push/preferences
   * Update push notification preferences for user
   */
  app.put("/api/push/preferences", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const { enableWebPushNotifications } = req.body;

      if (typeof enableWebPushNotifications !== "boolean") {
        return res.status(400).json({ message: "enableWebPushNotifications must be a boolean" });
      }

      // Update user preferences
      await db
        .update(users)
        .set({ enableWebPushNotifications })
        .where(eq(users.id, req.user!.id));

      // Also update the subscription status
      await pushNotificationService.updateNotificationPreference(
        req.user!.id,
        enableWebPushNotifications
      );

      console.log(`✅ Push notification preferences updated for user ${req.user!.id}`);

      res.json({
        success: true,
        message: "Preferences updated",
        enableWebPushNotifications,
      });
    } catch (error: any) {
      console.error("Error updating push preferences:", error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/push/preferences
   * Get push notification preferences for user
   */
  app.get("/api/push/preferences", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const [user] = await db
        .select({ enableWebPushNotifications: users.enableWebPushNotifications })
        .from(users)
        .where(eq(users.id, req.user!.id));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        enableWebPushNotifications: user.enableWebPushNotifications,
      });
    } catch (error: any) {
      console.error("Error fetching push preferences:", error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * DELETE /api/push/unsubscribe
   * Unsubscribe from push notifications
   */
  app.delete("/api/push/unsubscribe", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      await pushNotificationService.updateNotificationPreference(req.user!.id, false);

      res.json({
        success: true,
        message: "Unsubscribed from push notifications",
      });
    } catch (error: any) {
      console.error("Error unsubscribing from push notifications:", error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/push/test
   * Send a test push notification (for testing only)
   */
  app.post("/api/push/test", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      console.log(`📬 Sending test notification to user ${req.user!.id}`);

      await pushNotificationService.sendPushNotification(
        req.user!.id,
        "🎉 Test Notification",
        {
          body: "This is a test push notification from JobTradeSasa",
          tag: "test_notification",
          url: "/",
        }
      );

      res.json({
        success: true,
        message: "Test notification sent! Check your browser in a few seconds.",
        notification: {
          title: "🎉 Test Notification",
          body: "This is a test push notification from JobTradeSasa",
          tag: "test_notification",
        },
      });
    } catch (error: any) {
      console.error("Error sending test push notification:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send test notification",
        hint: "Make sure you have push notifications enabled in your profile and granted browser permissions.",
      });
    }
  });
}
