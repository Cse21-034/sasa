import type { Express } from "express"
import { ZodError } from "zod"
import { insertServiceAreaMigrationSchema, updateProviderServiceAreaSchema } from "@shared/schema"
import { storage } from "../storage"
import { notificationService } from '../services';
import { authMiddleware, type AuthRequest } from "../middleware/auth"

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY provider-related routes (profile, stats, migrations, categories)
 */

let verifyAccess: any

export function registerProviderRoutes(app: Express, injectedVerifyAccess: any): void {
  verifyAccess = injectedVerifyAccess

  // ==================== PROVIDER PROFILE ROUTES ====================

  /**
   * GET /api/providers
   * Search for providers based on criteria
   */
  app.get("/api/providers", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const { categoryId, city, latitude, longitude, radius } = req.query
      const params: any = {}
      if (categoryId) params.categoryId = Number.parseInt(categoryId as string)
      if (city) params.city = city as string
      if (latitude) params.latitude = Number.parseFloat(latitude as string)
      if (longitude) params.longitude = Number.parseFloat(longitude as string)
      if (radius) params.radius = Number.parseInt(radius as string)

      const providers = await storage.searchProviders(params)
      res.json(providers)
    } catch (error: any) {
      console.error("Get providers error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/provider/profile
   * Get current provider's profile
   */
  app.get("/api/provider/profile", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can access this" })
      }

      const provider = await storage.getProvider(req.user!.id)

      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" })
      }

      res.json(provider)
    } catch (error: any) {
      console.error("Get provider profile error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/provider/stats
   * Get provider statistics
   */
  app.get("/api/provider/stats", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can access stats" })
      }

      const stats = await storage.getProviderStats(req.user!.id)
      res.json(stats)
    } catch (error: any) {
      console.error("Get provider stats error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/provider/recent-jobs
   * Get provider's recent jobs
   */
  app.get("/api/provider/recent-jobs", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can access this" })
      }

      const jobs = await storage.getJobs({ providerId: req.user!.id })
      const recentJobs = jobs.slice(0, 10)
      res.json(recentJobs)
    } catch (error: any) {
      console.error("Get recent jobs error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * PATCH /api/provider/categories
   * Update provider's service categories
   */
  app.patch("/api/provider/categories", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can update categories" })
      }

      const { serviceCategories } = req.body

      if (!Array.isArray(serviceCategories)) {
        return res.status(400).json({ message: "Service categories must be an array" })
      }

      const updated = await storage.updateProvider(req.user!.id, {
        serviceCategories,
      })

      if (!updated) {
        return res.status(404).json({ message: "Provider not found" })
      }

      res.json(updated)
    } catch (error: any) {
      console.error("Update categories error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  // ==================== SERVICE AREA MIGRATION ROUTES ====================

  /**
   * POST /api/provider/migration-request
   * Request migration to a new service area
   */
  app.post("/api/provider/migration-request", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can request migrations" })
      }

      const validatedData = insertServiceAreaMigrationSchema.parse(req.body)

      // Check if already approved for this city
      const provider = await storage.getProvider(req.user!.id)
      const approvedCities = (provider?.approvedServiceAreas as string[]) || []

      if (approvedCities.includes(validatedData.requestedCity)) {
        return res.status(400).json({ message: "You are already approved to work in this city" })
      }

      const migration = await storage.createServiceAreaMigration({
        ...validatedData,
        providerId: req.user!.id,
      })
      
      // Notify admin
      await notificationService.createAdminNotification({
        title: "New Migration Request",
        message: `${req.user!.name} requested migration to ${validatedData.requestedCity}.`,
        type: 'new_migration'
      });

      res.status(201).json(migration)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Migration request error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * GET /api/provider/migrations
   * Get provider's migration requests
   */
  app.get("/api/provider/migrations", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can view migrations" })
      }

      const migrations = await storage.getProviderMigrations(req.user!.id)
      res.json(migrations)
    } catch (error: any) {
      console.error("Get migrations error:", error)
      res.status(500).json({ message: error.message })
    }
  })

  /**
   * PATCH /api/provider/service-area
   * Update provider's primary service area
   */
  app.patch("/api/provider/service-area", authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only providers can update service area" })
      }

      const validatedData = updateProviderServiceAreaSchema.parse(req.body)
      const updated = await storage.updateProviderServiceArea(
        req.user!.id,
        validatedData.primaryCity,
        validatedData.primaryRegion,
      )

      if (!updated) {
        return res.status(404).json({ message: "Provider not found" })
      }

      res.json(updated)
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Update service area error:", error)
      res.status(500).json({ message: error.message })
    }
  })
}
