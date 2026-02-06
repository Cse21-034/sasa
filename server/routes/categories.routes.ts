/**
 * Category Routes
 * Handles category addition requests and category management
 */

import type { Express } from "express";
import { ZodError } from "zod";
import { insertCategoryAdditionRequestSchema } from "@shared/schema";
import { storage } from "../storage";
import { categoryService } from "../services";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { cacheService } from "../services/cache.service";

export function registerCategoryRoutes(app: Express): void {
  /**
   * POST /api/categories/request-addition
   * Create a new category addition request
   * Only for providers
   */
  app.post("/api/categories/request-addition", authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Check if user is a provider
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only service providers can request category additions" });
      }

      const validatedData = insertCategoryAdditionRequestSchema.parse({
        ...req.body,
        providerId: req.user!.id,
      });

      // Check if provider already has this category
      const provider = await storage.getProvider(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }

      const allCategories = [...(provider.registeredCategories || []), ...(provider.additionalCategories || [])];
      if (allCategories.includes(validatedData.categoryId)) {
        return res.status(400).json({ message: "You already have this category or have a pending request for it" });
      }

      // Check if there's already a pending request for this category
      const existingRequests = await categoryService.getPendingCategoryAdditionRequestsForProvider(req.user!.id);
      if (existingRequests.some(r => r.categoryId === validatedData.categoryId)) {
        return res.status(400).json({ message: "You already have a pending request for this category" });
      }

      const request = await categoryService.createCategoryAdditionRequest(validatedData);

      // Notify admin about new category request
      const category = await storage.getCategory(validatedData.categoryId);
      await storage.createNotification({
        recipientId: "", // This will be handled by admin notification system
        type: 'category_request_received',
        title: 'New Category Addition Request',
        message: `A service provider has requested to add the "${category?.name || 'unknown'}" category.`,
      });

      res.status(201).json({
        message: "Category addition request created successfully. Please wait for admin review.",
        request,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        });
      }
      console.error("Category request error:", error);
      res.status(500).json({ message: error.message || "Failed to create category request" });
    }
  });

  /**
   * GET /api/categories/requests/pending
   * Get all pending category addition requests for the current provider
   */
  app.get("/api/categories/requests/pending", authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== "provider") {
        return res.status(403).json({ message: "Only service providers can view their requests" });
      }

      const requests = await categoryService.getPendingCategoryAdditionRequestsForProvider(req.user!.id);
      res.json(requests);
    } catch (error: any) {
      console.error("Get pending requests error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch requests" });
    }
  });

  /**
   * GET /api/categories
   * Get all available categories
   * 🚀 Now cached for performance
   */
  app.get("/api/categories", async (req, res) => {
    try {
      // 🚀 Check cache first (1 hour TTL)
      let categories = await cacheService.getCategories();
      if (!categories) {
        // Fetch from database if not in cache
        categories = await storage.getCategories();
        // Cache the result
        if (categories && categories.length > 0) {
          await cacheService.setCategories(categories);
        }
      }
      res.json(categories || []);
    } catch (error: any) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch categories" });
    }
  });
}
