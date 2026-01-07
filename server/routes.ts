import type { Express } from "express"
import { createServer, type Server } from "http"
import { WebSocketServer, WebSocket } from "ws"
import { storage } from "./storage"
import { authMiddleware, type AuthRequest } from "./middleware/auth"
import type { NextFunction, Response } from "express"
import {
  registerAuthRoutes,
  registerJobRoutes,
  registerCompanyRoutes,
  registerSupplierRoutes,
  registerProviderRoutes,
  registerVerificationRoutes,
  registerAdminRoutes,
  registerMessagingRoutes,
  registerMiscRoutes,
} from "./routes/index"

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app)

  // ==================== VERIFICATION MIDDLEWARE ====================
  const verifyAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user!.role === "admin") {
      return next()
    }
    if (req.user!.status !== "active") {
      return res.status(403).json({
        message: "Access denied. Your account is currently blocked or deactivated.",
        code: "ACCOUNT_BLOCKED",
      })
    }
    if (!req.user!.isVerified) {
      return res.status(403).json({
        message: "Access denied. Account is not fully verified. Please complete verification steps.",
        code: "NOT_VERIFIED",
      })
    }
    next()
  }

  // ==================== WEBSOCKET SETUP ====================
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" })
  const clients = new Map<string, WebSocket>()

  wss.on("connection", (ws: WebSocket, req) => {
    let userId: string | null = null

    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message.toString())

        if (data.type === "auth") {
          userId = data.userId
          if (userId) {
            clients.set(userId, ws)
            const unreadCount = await storage.getUnreadMessageCount(userId)
            ws.send(
              JSON.stringify({
                type: "unread_count",
                payload: { count: unreadCount },
              }),
            )
          }
        } else if (data.type === "message" && userId) {
          const msg = await storage.createMessage({
            ...data.payload,
            senderId: userId,
          })

          let receiverIds: string[] = []
          if (data.payload.messageType === "admin_message") {
            if (data.payload.receiverId) {
              receiverIds = [data.payload.receiverId]
            }
          } else if (data.payload.jobId) {
            const job = await storage.getJob(data.payload.jobId)
            if (job) {
              const otherUserId = job.requesterId === userId ? job.providerId : job.requesterId
              if (otherUserId) receiverIds = [otherUserId]
            }
          }

          for (const receiverId of receiverIds) {
            if (clients.has(receiverId)) {
              const receiverWs = clients.get(receiverId)
              if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                receiverWs.send(
                  JSON.stringify({
                    type: "message",
                    payload: msg,
                  }),
                )
                const unreadCount = await storage.getUnreadMessageCount(receiverId)
                receiverWs.send(
                  JSON.stringify({
                    type: "unread_count",
                    payload: { count: unreadCount },
                  }),
                )
              }
            }
          }

          ws.send(
            JSON.stringify({
              type: "message_sent",
              payload: msg,
            }),
          )
        } else if (data.type === "mark_read" && userId) {
          await storage.markMessageAsRead(data.payload.messageId, userId)
          const unreadCount = await storage.getUnreadMessageCount(userId)
          ws.send(
            JSON.stringify({
              type: "unread_count",
              payload: { count: unreadCount },
            }),
          )
        }
      } catch (error) {
        console.error("WebSocket error:", error)
      }
    })

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId)
      }
    })
  })

  // ==================== CORE MESSAGE ROUTES (kept here for WebSocket access) ====================
  app.get("/api/messages/unread-count", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id)
      res.json({ count })
    } catch (error: any) {
      console.error("Get unread count error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  app.post("/api/messages/:messageId/read", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.messageId, req.user!.id)
      if (!message) {
        return res.status(404).json({ message: "Message not found or not authorized" })
      }
      res.json(message)
    } catch (error: any) {
      console.error("Mark message read error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  app.post("/api/messages/job/:jobId/read-all", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      await storage.markAllMessagesRead(req.params.jobId, req.user!.id)
      const unreadCount = await storage.getUnreadMessageCount(req.user!.id)
      res.json({ success: true, unreadCount })
    } catch (error: any) {
      console.error("Mark all messages read error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== REGISTER ALL ROUTE MODULES ====================

  // Auth routes (no verifyAccess needed - public)
  registerAuthRoutes(app)

  // Verification routes (no verifyAccess - this is how users get verified)
  registerVerificationRoutes(app)

  // Protected routes with verifyAccess
  registerJobRoutes(app, verifyAccess)
  registerCompanyRoutes(app, verifyAccess)
  registerSupplierRoutes(app, verifyAccess)
  registerProviderRoutes(app, verifyAccess)

  // Misc routes (profile, categories, ratings, payments, feedback, reports)
  registerMiscRoutes(app, verifyAccess)

  // Messaging routes (needs both verifyAccess and clients for WebSocket)
  registerMessagingRoutes(app, verifyAccess, clients)

  // Admin routes (needs clients for WebSocket messaging)
  registerAdminRoutes(app, clients)

  // Promotions Routes
  app.get("/api/promotions/active", async (req, res) => {
    try {
      const activePromotions = await storage.getActivePromotions();
      res.json(activePromotions);
    } catch (error: any) {
      console.error("Get active promotions error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch promotions" });
    }
  });

  return httpServer
}
