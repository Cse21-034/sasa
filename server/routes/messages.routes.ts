import type { Express } from "express"
import { ZodError } from "zod"
import { insertMessageSchema } from "@shared/schema"
import { storage } from "../storage"
import { authMiddleware, type AuthRequest } from "../middleware/auth"
import { notificationService } from "../services/notification.service"
import { WebSocket } from "ws"

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY message-related routes (conversations, job chat, admin chat)
 */

let verifyAccess: any
let clients: Map<string, WebSocket>

export function registerMessagingRoutes(
  app: Express,
  injectedVerifyAccess: any,
  injectedClients: Map<string, WebSocket>,
): void {
  verifyAccess = injectedVerifyAccess
  clients = injectedClients

  // ==================== CONVERSATION ROUTES ====================

  /**
   * GET /api/messages/conversations
   * Get all conversations for current user
   */
  app.get("/api/messages/conversations", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id)
      res.json(conversations)
    } catch (error: any) {
      console.error("Get conversations error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/messages/admin-chat
   * Reporter: Get messages with admin (static GET route)
   */
  app.get("/api/messages/admin-chat", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const adminUser = await storage.getAdminUser()

      if (!adminUser) {
        return res.status(500).json({ message: "System Admin account required to fetch chat." })
      }

      const messages = await storage.getAdminChatMessages(adminUser.id, req.user!.id)
      res.json(messages)
    } catch (error: any) {
      console.error("Get reporter admin chat messages error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * POST /api/messages/admin-chat
   * Reporter: Send a private message to Admin
   */
  app.post("/api/messages/admin-chat", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const { messageText } = insertMessageSchema.partial().parse(req.body)

      const adminUser = await storage.getAdminUser()

      if (!adminUser) {
        return res.status(500).json({ message: "System Admin not found." })
      }

      const message = await storage.createMessage({
        messageText,
        senderId: req.user!.id,
        receiverId: adminUser.id, // Explicitly target the Admin
        messageType: "admin_message",
      })

      console.log(`💬 Admin message created from ${req.user!.id}, sending notification to admin ${adminUser.id}`)

      // Send notification to admin
      const senderUser = await storage.getUser(req.user!.id)
      if (senderUser) {
        console.log(`📧 Creating notification for admin: "New message from ${senderUser.name}"`)
        await notificationService.notifyRecipientOfMessage(
          adminUser.id,
          senderUser.name,
          messageText,
        )
        console.log(`✅ Notification sent to admin ${adminUser.id}`)
      } else {
        console.warn(`⚠️ Sender user not found: ${req.user!.id}`)
      }

      // Notify Admin via WebSocket (if client is open)
      if (clients.has(adminUser.id)) {
        const adminWs = clients.get(adminUser.id)
        if (adminWs && adminWs.readyState === WebSocket.OPEN) {
          adminWs.send(
            JSON.stringify({
              type: "message",
              payload: message,
            }),
          )
          const unreadCount = await storage.getUnreadMessageCount(adminUser.id)
          adminWs.send(
            JSON.stringify({
              type: "unread_count",
              payload: { count: unreadCount },
            }),
          )
        }
      }

      res.status(201).json(message)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Reporter send admin message error:", error)
      res.status(400).json({ message: error.message })
    }
  })

  /**
   * POST /api/messages/admin-chat/read-all
   * Reporter: Mark all Admin messages as read
   */
  app.post("/api/messages/admin-chat/read-all", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      await storage.markAllAdminMessagesRead(req.user!.id)

      const unreadCount = await storage.getUnreadMessageCount(req.user!.id)
      res.json({ success: true, unreadCount })
    } catch (error: any) {
      console.error("Mark all admin messages read error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/messages/:jobId
   * Get messages for a specific job
   */
  app.get("/api/messages/:jobId", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // NOTE: This endpoint handles job chat and expects a UUID.
      const messages = await storage.getMessages(req.params.jobId)
      res.json(messages)
    } catch (error: any) {
      console.error("Get messages error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * POST /api/messages
   * Create a new message
   */
  app.post("/api/messages", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      console.log(`📬 POST /api/messages called - Body:`, JSON.stringify(req.body))
      const validatedData = insertMessageSchema.parse(req.body)
      console.log(`✓ Message validation passed - receiverId: ${validatedData.receiverId}`)
      
      const message = await storage.createMessage({
        ...validatedData,
        senderId: req.user!.id,
      })
      console.log(`✓ Message created with id: ${message.id} - receiver: ${message.receiverId}`)

      // Send notification to receiver
      // Note: receiverId might be determined by storage.createMessage from jobId
      if (message.receiverId) {
        console.log(`🔔 Attempting to send notification to receiver: ${message.receiverId}`)
        const senderUser = await storage.getUser(req.user!.id)
        if (senderUser) {
          console.log(`📧 Creating notification: "${validatedData.messageText}" from ${senderUser.name}`)
          await notificationService.notifyRecipientOfMessage(
            message.receiverId,
            senderUser.name,
            validatedData.messageText || 'Sent a message',
          )
          console.log(`✅ Notification sent successfully to ${message.receiverId}`)
        } else {
          console.warn(`⚠️ Sender user not found: ${req.user!.id}`)
        }
      } else {
        console.warn(`⚠️ No receiverId determined for message`)
      }

      res.status(201).json(message)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Create message error:", error)
      res.status(400).json({ message: error.message })
    }
  })
}
