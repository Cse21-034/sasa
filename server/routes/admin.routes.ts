import type { Express } from "express"
import { ZodError } from "zod"
import { updateUserStatusSchema, updateVerificationStatusSchema, insertMessageSchema } from "@shared/schema"
import { storage } from "../storage"
import { authMiddleware, generateToken, type AuthRequest } from "../middleware/auth"
import { WebSocket } from "ws"

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY admin-related routes (users, reports, analytics, verification, migrations, messages)
 */

// WebSocket clients map (injected from main routes)
let clients: Map<string, WebSocket>

export function registerAdminRoutes(app: Express, injectedClients: Map<string, WebSocket>): void {
  clients = injectedClients

  // ==================== ADMIN USER MANAGEMENT ====================

  /**
   * GET /api/admin/users
   * List all users with filters
   */
  app.get("/api/admin/users", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const { role, status, search } = req.query
      const usersList = await storage.getUsers({
        role: role as string,
        status: status as string,
        search: search as string,
      })
      res.json(usersList)
    } catch (error: any) {
      console.error("Get users error:", error)
      res.status(500).json({ message: error.message || "Failed to list users" })
    }
  })

  /**
   * PATCH /api/admin/users/:id/update-status
   * Block/Deactivate/Activate user
   */
  app.patch("/api/admin/users/:id/update-status", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const validatedData = updateUserStatusSchema.parse(req.body)
      const updatedUser = await storage.updateUserStatus(req.params.id, validatedData.status)

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." })
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser

      res.json(userWithoutPassword)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Update user status error:", error)
      res.status(500).json({ message: error.message || "Failed to update user status" })
    }
  })

  // ==================== ADMIN REPORTS MANAGEMENT ====================

  /**
   * GET /api/admin/reports
   * List all job reports
   */
  app.get("/api/admin/reports", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const statusParam = req.query.status as string | undefined
      let filterStatus: "resolved" | "unresolved" | undefined

      if (statusParam === "resolved") {
        filterStatus = "resolved"
      } else if (statusParam === "unresolved") {
        filterStatus = "unresolved"
      }

      const reports = await storage.getJobReports({ status: filterStatus })

      console.log(`Admin fetching reports with status: ${filterStatus || "all"}, found: ${reports.length}`)

      res.json(reports)
    } catch (error: any) {
      console.error("Get admin reports error:", error)
      res.status(500).json({ message: error.message || "Failed to list reports" })
    }
  })

  /**
   * PATCH /api/admin/reports/:id/resolve
   * Resolve a report
   */
  app.patch("/api/admin/reports/:id/resolve", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const updated = await storage.resolveJobReport(req.params.id)

      if (!updated) {
        return res.status(404).json({ message: "Report not found." })
      }

      res.json(updated)
    } catch (error: any) {
      console.error("Resolve report error:", error)
      res.status(500).json({ message: error.message || "Failed to resolve report" })
    }
  })

  // ==================== ADMIN ANALYTICS ====================

  /**
   * GET /api/admin/analytics
   * Get platform-wide analytics
   */
  app.get("/api/admin/analytics", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const analytics = await storage.getAdminJobAnalytics()
      res.json(analytics)
    } catch (error: any) {
      console.error("Get analytics error:", error)
      res.status(500).json({ message: error.message || "Failed to get analytics" })
    }
  })

  // ==================== ADMIN VERIFICATION MANAGEMENT ====================

  /**
   * GET /api/admin/verification/pending
   * List pending verification submissions
   */
  app.get("/api/admin/verification/pending", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const pending = await storage.getPendingVerificationSubmissions()
      res.json(pending)
    } catch (error: any) {
      console.error("Get pending verification error:", error)
      res.status(500).json({ message: error.message || "Failed to list pending verifications" })
    }
  })

  /**
   * PATCH /api/admin/verification/:id/update-status
   * Approve/Reject verification submission
   */
  app.patch("/api/admin/verification/:id/update-status", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const validatedData = updateVerificationStatusSchema.parse(req.body)

      const updatedSubmission = await storage.updateVerificationSubmissionStatus(
        req.params.id,
        validatedData.status,
        req.user!.id,
        validatedData.rejectionReason,
      )

      if (!updatedSubmission) {
        return res.status(404).json({ message: "Submission not found." })
      }

      // Return the new full user object and token if approved/rejected
      const finalUser = await storage.getUser(updatedSubmission.userId)
      const { passwordHash: _, ...userWithoutPassword } = finalUser!

      res.json({
        message: `Submission ${updatedSubmission.status}`,
        submission: updatedSubmission,
        user: userWithoutPassword,
        token: generateToken(userWithoutPassword),
      })
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Update verification status error:", error)
      res.status(500).json({ message: error.message || "Failed to update verification status" })
    }
  })

  // ==================== ADMIN MIGRATION MANAGEMENT ====================

  /**
   * GET /api/admin/migrations/pending
   * Get pending migration requests
   */
  app.get("/api/admin/migrations/pending", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const migrations = await storage.getPendingMigrations()
      res.json(migrations)
    } catch (error: any) {
      console.error("Get pending migrations error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * POST /api/admin/migrations/:id/approve
   * Approve a migration request
   */
  app.post("/api/admin/migrations/:id/approve", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const { notes } = req.body
      const migration = await storage.approveMigration(req.params.id, req.user!.id, notes)

      if (!migration) {
        return res.status(404).json({ message: "Migration request not found" })
      }

      res.json(migration)
    } catch (error: any) {
      console.error("Approve migration error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * POST /api/admin/migrations/:id/reject
   * Reject a migration request
   */
  app.post("/api/admin/migrations/:id/reject", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const { notes } = req.body
      const migration = await storage.rejectMigration(req.params.id, req.user!.id, notes)

      if (!migration) {
        return res.status(404).json({ message: "Migration request not found" })
      }

      res.json(migration)
    } catch (error: any) {
      console.error("Reject migration error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== ADMIN MESSAGING ====================

  /**
   * GET /api/admin/conversations
   * Get list of users admin has conversations with
   */
  app.get("/api/admin/conversations", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const conversations = await storage.getAdminConversations()
      res.json(conversations)
    } catch (error: any) {
      console.error("Get admin conversations error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/admin/messages/:userId
   * Get all messages between Admin and target User
   */
  app.get("/api/admin/messages/:userId", authMiddleware, async (req: AuthRequest, res) => {
    // Authorization: User must be Admin OR the ID requested must be their own ID.
    if (req.user!.role !== "admin" && req.user!.id !== req.params.userId) {
      return res.status(403).json({ message: "Access denied: Cannot view other users' admin chats." })
    }

    try {
      const targetUserId = req.user!.role === "admin" ? req.params.userId : req.user!.id
      const adminUser = await storage.getAdminUser()

      if (!adminUser) {
        return res.status(500).json({ message: "System Admin account required to fetch chat." })
      }

      const messages = await storage.getAdminChatMessages(adminUser.id, targetUserId)
      res.json(messages)
    } catch (error: any) {
      console.error("Get admin messages error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * POST /api/admin/messages
   * Send a message from Admin to a target user
   */
  app.post("/api/admin/messages", authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
    }

    try {
      const validatedData = insertMessageSchema.partial().parse(req.body)

      if (!validatedData.receiverId) {
        return res.status(400).json({ message: "Receiver ID is required for admin messages" })
      }

      const message = await storage.createMessage({
        ...(validatedData as any),
        senderId: req.user!.id,
        messageType: "admin_message",
      })

      if (clients.has(validatedData.receiverId)) {
        const receiverWs = clients.get(validatedData.receiverId)
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(
            JSON.stringify({
              type: "message",
              payload: message,
            }),
          )

          const unreadCount = await storage.getUnreadMessageCount(validatedData.receiverId)
          receiverWs.send(
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
      console.error("Admin send message error:", error)
      res.status(400).json({ message: error.message })
    }
  })
}
