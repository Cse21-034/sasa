import type { Express } from "express"
import { cloudinaryService } from "../services"
import { authMiddleware, type AuthRequest } from "../middleware/auth"

/**
 * SOLID Principle: Single Responsibility
 * This module handles Cloudinary image management routes (deletion, metadata)
 */

export function registerCloudinaryRoutes(app: Express): void {
  /**
   * DELETE /api/cloudinary/delete
   * Delete an image from Cloudinary by public ID
   * Requires: publicId in request body
   */
  app.delete("/api/cloudinary/delete", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { publicId } = req.body

      if (!publicId) {
        return res.status(400).json({ message: "publicId is required" })
      }

      // Validate publicId format (prevent injection attacks)
      if (typeof publicId !== "string" || publicId.length === 0 || publicId.length > 500) {
        return res.status(400).json({ message: "Invalid publicId format" })
      }

      // Delete the image from Cloudinary
      await cloudinaryService.deleteImage(publicId)

      res.json({ message: "Image deleted successfully", publicId })
    } catch (error: any) {
      console.error("Cloudinary delete error:", error)
      res.status(500).json({ message: error.message || "Failed to delete image" })
    }
  })

  /**
   * DELETE /api/cloudinary/delete-multiple
   * Delete multiple images from Cloudinary
   * Requires: publicIds array in request body
   */
  app.delete("/api/cloudinary/delete-multiple", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { publicIds } = req.body

      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({ message: "publicIds array is required and must not be empty" })
      }

      // Validate all publicIds
      if (!publicIds.every((id: any) => typeof id === "string" && id.length > 0 && id.length <= 500)) {
        return res.status(400).json({ message: "Invalid publicId format in array" })
      }

      // Delete all images from Cloudinary
      await cloudinaryService.deleteImages(publicIds)

      res.json({
        message: "Images deleted successfully",
        deleted: publicIds.length,
        publicIds: publicIds,
      })
    } catch (error: any) {
      console.error("Cloudinary bulk delete error:", error)
      res.status(500).json({ message: error.message || "Failed to delete images" })
    }
  })

  /**
   * GET /api/cloudinary/metadata/:publicId
   * Get metadata for an image from Cloudinary
   */
  app.get("/api/cloudinary/metadata/:publicId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { publicId } = req.params

      if (!publicId) {
        return res.status(400).json({ message: "publicId is required" })
      }

      const metadata = await cloudinaryService.getImageMetadata(publicId)

      if (!metadata) {
        return res.status(404).json({ message: "Image metadata not found" })
      }

      res.json(metadata)
    } catch (error: any) {
      console.error("Cloudinary metadata error:", error)
      res.status(500).json({ message: error.message || "Failed to retrieve metadata" })
    }
  })

  /**
   * POST /api/cloudinary/tag
   * Add tags to Cloudinary resources for organization
   */
  app.post("/api/cloudinary/tag", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { publicIds, tags } = req.body

      if (!Array.isArray(publicIds) || !Array.isArray(tags)) {
        return res.status(400).json({ message: "publicIds and tags arrays are required" })
      }

      if (publicIds.length === 0 || tags.length === 0) {
        return res.status(400).json({ message: "publicIds and tags must not be empty" })
      }

      await cloudinaryService.tagResources(publicIds, tags)

      res.json({ message: "Tags added successfully", tagged: publicIds.length })
    } catch (error: any) {
      console.error("Cloudinary tagging error:", error)
      res.status(500).json({ message: error.message || "Failed to add tags" })
    }
  })
}
