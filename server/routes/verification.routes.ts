import type { Express } from "express"
import { ZodError } from "zod"
import { insertVerificationSubmissionSchema } from "@shared/schema"
import { storage } from "../storage"
import { notificationService } from '../services';
import { authMiddleware, generateToken, type AuthRequest } from "../middleware/auth"

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY verification-related routes (submit, status)
 */

export function registerVerificationRoutes(app: Express): void {
  /**
   * POST /api/verification/submit
   * Submit identity or document verification
   */
  app.post("/api/verification/submit", authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Note: No verifyAccess is needed here as this is the action to GET verified

      const validatedData = insertVerificationSubmissionSchema.parse(req.body)

      if (validatedData.type === "identity" && validatedData.documents.length < 2) {
        return res.status(400).json({ message: "Identity verification requires ID and Selfie photos." })
      }

      const submission = await storage.createVerificationSubmission({
        ...validatedData,
        userId: req.user!.id,
      })

      const updatedUser = await storage.getUser(req.user!.id)

      // AUTO-APPROVE IDENTITY FOR REQUESTERS:
      if (submission.type === "identity" && updatedUser!.role === "requester") {
        const approvedSubmission = await storage.updateVerificationSubmissionStatus(
          submission.id,
          "approved",
          "system", // System approval
        )

        const finalUser = await storage.getUser(req.user!.id) // Get user with final status
        const { passwordHash: _, ...userWithoutPassword } = finalUser!



      // Overwrite token data on the client immediately for seamless flow

        return res.status(200).json({

          message: "Identity Verified Automatically. Access Granted.",

          submission: approvedSubmission,

          user: userWithoutPassword,

          token: generateToken(userWithoutPassword), // Resend new token with updated status

        })

      }



      // For providers/suppliers, notify admin that a submission needs review

      if (updatedUser!.role === 'provider' || updatedUser!.role === 'supplier') {

        await notificationService.createAdminNotification({

          title: 'New Verification Submission',

          message: `A ${updatedUser!.role} has submitted documents for ${validatedData.type} verification.`,

          type: 'new_verification',

        });

      }



      res.status(201).json({

        message: `${validatedData.type} submission received. Status is pending.`,

        submission,

      })    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        })
      }
      console.error("Verification submission error:", error)
      res.status(500).json({ message: error.message || "Submission failed" })
    }
  })

  /**
   * GET /api/verification/status
   * Get current verification status
   */
  app.get("/api/verification/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const identity = await storage.getVerificationSubmission(req.user!.id, "identity")
      const document =
        req.user!.role === "provider" || req.user!.role === "supplier"
          ? await storage.getVerificationSubmission(req.user!.id, "document")
          : null

      // Return latest status from DB, but rely on token for protected access checks
      const userStatus = await storage.getUser(req.user!.id)

      res.json({
        isIdentityVerified: userStatus?.isIdentityVerified,
        isVerified: userStatus?.isVerified,
        identitySubmission: identity,
        documentSubmission: document,
        role: req.user!.role,
      })
    } catch (error: any) {
      console.error("Get verification status error:", error)
      res.status(500).json({ message: error.message || "Failed to get verification status" })
    }
  })
}
