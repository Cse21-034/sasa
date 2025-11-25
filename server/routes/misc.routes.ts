import type { Express } from "express"
import { ZodError } from "zod"
import {
  updateProfileSchema,
  insertRatingSchema,
  insertJobFeedbackSchema,
  insertJobReportSchema,
  setProviderChargeSchema,
  confirmPaymentSchema,
} from "@shared/schema"
import { storage } from "../storage"
import { authMiddleware, generateToken, type AuthRequest } from "../middleware/auth"

/**
 * SOLID Principle: Single Responsibility
 * This module handles miscellaneous routes (profile, categories, ratings, feedback, reports, payments)
 */

let verifyAccess: any

export function registerMiscRoutes(app: Express, injectedVerifyAccess: any): void {
  verifyAccess = injectedVerifyAccess

  // ==================== PROFILE ROUTES ====================

  /**
   * PATCH /api/profile
   * Update user profile
   */
  app.patch("/api/profile", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body)

      // Log what we're trying to update (for debugging)
      console.log("Updating profile for user:", req.user!.id)
      console.log("Update data keys:", Object.keys(validatedData))
      console.log("Has profilePhotoUrl:", !!validatedData.profilePhotoUrl)

      const updated = await storage.updateUser(req.user!.id, validatedData)

      if (!updated) {
        return res.status(404).json({ message: "User not found" })
      }

      const { passwordHash: _, ...userWithoutPassword } = updated

      // Return the updated user (must send a new token to keep status fresh)
      res.json({
        ...userWithoutPassword,
        token: generateToken(userWithoutPassword),
      })
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Update profile error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== CATEGORY ROUTES ====================

  /**
   * GET /api/categories
   * Get all categories (public)
   */
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories()
      res.json(categories)
    } catch (error: any) {
      console.error("Get categories error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== RATING ROUTES ====================

  /**
   * POST /api/ratings
   * Create a new rating
   */
  app.post("/api/ratings", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body)
      const rating = await storage.createRating({
        ...validatedData,
        fromUserId: req.user!.id,
      })

      res.json(rating)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Create rating error:", error)
      res.status(400).json({ message: error.message })
    }
  })

  /**
   * GET /api/ratings/:providerId
   * Get ratings for a provider
   */
  app.get("/api/ratings/:providerId", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const ratings = await storage.getProviderRatings(req.params.providerId)
      res.json(ratings)
    } catch (error: any) {
      console.error("Get ratings error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== PAYMENT ROUTES ====================

  /**
   * POST /api/jobs/:id/set-charge
   * Provider sets job charge
   */
  app.post("/api/jobs/:id/set-charge", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can set charges" })
      }

      const { providerCharge } = setProviderChargeSchema.parse(req.body)
      const job = await storage.setProviderCharge(req.params.id, providerCharge)

      if (!job) {
        return res.status(404).json({ message: "Job not found" })
      }

      res.json(job)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Set charge error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * POST /api/jobs/:id/confirm-payment
   * Requester confirms payment
   */
  app.post("/api/jobs/:id/confirm-payment", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "requester" && req.user!.role !== "company") {
        return res.status(403).json({ message: "Only requesters can confirm payment" })
      }

      const { amountPaid } = confirmPaymentSchema.parse(req.body)
      const job = await storage.confirmPayment(req.params.id, amountPaid)

      if (!job) {
        return res.status(404).json({ message: "Job not found" })
      }

      res.json(job)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Confirm payment error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== JOB FEEDBACK ROUTES ====================

  /**
   * POST /api/jobs/:id/feedback
   * Provider submits job feedback
   */
  app.post("/api/jobs/:id/feedback", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can submit feedback" })
      }

      const validatedData = insertJobFeedbackSchema.parse(req.body)
      const feedback = await storage.createJobFeedback({
        ...validatedData,
        providerId: req.user!.id,
      })

      res.json(feedback)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Submit feedback error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/jobs/:id/feedback
   * Get feedback for a job
   */
  app.get("/api/jobs/:id/feedback", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const feedback = await storage.getJobFeedback(req.params.id)
      res.json(feedback)
    } catch (error: any) {
      console.error("Get feedback error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== JOB REPORT ROUTES ====================

  /**
   * POST /api/jobs/:id/report
   * Submit a job report
   */
  app.post("/api/jobs/:id/report", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertJobReportSchema.parse(req.body)
      const report = await storage.createJobReport({
        ...validatedData,
        reporterId: req.user!.id,
      })

      res.json(report)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Submit report error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== ANALYTICS/STATS ROUTES ====================

  /**
   * GET /api/reports/requester
   * Get requester statistics
   */
  app.get("/api/reports/requester", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "requester" && req.user!.role !== "company") {
        return res.status(403).json({ message: "Only requesters can access this" })
      }

      const stats = await storage.getRequesterStats(req.user!.id)
      res.json(stats)
    } catch (error: any) {
      console.error("Get requester stats error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/reports/provider
   * Get provider statistics
   */
  app.get("/api/reports/provider", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can access this" })
      }

      const stats = await storage.getProviderStats(req.user!.id)
      res.json(stats)
    } catch (error: any) {
      console.error("Get provider stats error:", error)
      res.status(500).json({ message: error.message })
    }
  })
}
