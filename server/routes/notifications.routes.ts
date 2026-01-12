import type { Express, Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { storage } from '../storage';

export function registerNotificationRoutes(app: Express, verifyAccess: any): void {
  /**
   * GET /api/notifications
   * Get all notifications for the current user
   */
  app.get('/api/notifications', authMiddleware, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error: any) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/notifications/unread
   * Get unread notifications for the current user
   */
  app.get('/api/notifications/unread', authMiddleware, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
      const unreadNotifications = await storage.getUnreadNotifications(req.user!.id);
      res.json(unreadNotifications);
    } catch (error: any) {
      console.error('Get unread notifications error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/notifications/unread/count
   * Get count of unread notifications for the current user
   */
  app.get('/api/notifications/unread/count', authMiddleware, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ unreadCount: count });
    } catch (error: any) {
      console.error('Get unread notification count error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * PATCH /api/notifications/:id/read
   * Mark a specific notification as read
   */
  app.patch('/api/notifications/:id/read', authMiddleware, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
      const notification = await storage.markNotificationAsRead((req as any).params.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json(notification);
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for the current user
   */
  app.patch('/api/notifications/read-all', authMiddleware, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * DELETE /api/notifications/:id
   * Delete a specific notification
   */
  app.delete('/api/notifications/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res: Response) => {
    try {
      await storage.deleteNotification((req as any).params.id);
      res.json({ message: 'Notification deleted successfully' });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      res.status(500).json({ message: error.message });
    }
  });
}
