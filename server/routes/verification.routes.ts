import type { Express } from "express"
import { ZodError } from "zod"
import { insertVerificationSubmissionSchema } from "@shared/schema"
import { storage } from "../storage"
import { notificationService, smileIdentityService, verificationService } from '../services';
import { authMiddleware, generateToken, type AuthRequest } from "../middleware/auth"

/**
 * SOLID Principle: Single Responsibility
 * This module handles verification-related routes with Smile Identity KYC for Phase 1
 * 
 * ARCHITECTURE:
 * - Phase 1 (Identity): Fully automated via Smile Identity - NO admin approval
 * - Phase 2 (Documents): Admin approval required for category/qualification verification
 */

export function registerVerificationRoutes(app: Express): void {
  /**
   * POST /api/verification/submit
   * 🆕 Submit Phase 1 (Identity) or Phase 2 (Documents) verification
   * 
   * For Phase 1 (Identity):
   *   - Sends images to Smile Identity API
   *   - Automatically approves/rejects based on Smile result
   *   - NO admin involvement
   * 
   * For Phase 2 (Documents):
   *   - Stores documents for admin review
   *   - Requires admin approval (providers/suppliers only)
   */
  app.post("/api/verification/submit", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertVerificationSubmissionSchema.parse(req.body)

      // 🔐 PHASE 1: IDENTITY VERIFICATION (Automated with Smile Identity)
      if (validatedData.type === "identity") {
        if (validatedData.documents.length < 2) {
          return res.status(400).json({ 
            message: "Identity verification requires ID document and Selfie photo." 
          })
        }

        // 📋 Validate ID type is provided for Phase 1
        if (!validatedData.idType) {
          return res.status(400).json({
            message: "ID type (national_id, passport, driver_licence) is required for identity verification."
          })
        }

        // 🔗 Call Smile Identity API for verification
        const smilePayload = {
          country: 'BW', // Botswana
          idType: validatedData.idType,
          selfieImage: validatedData.documents.find(d => d.name === 'selfie_photo')?.url || '',
          idImage: validatedData.documents.find(d => d.name === 'national_id')?.url || '',
        }

        console.log('📤 Submitting to Smile Identity API...')
        const smileResponse = await smileIdentityService.submitKYCVerification(smilePayload)
        const parsedResult = smileIdentityService.parseVerificationResult(smileResponse)

        // 💾 Create submission record with Smile result
        const submission = await storage.createVerificationSubmission({
          userId: req.user!.id,
          type: 'identity',
          documents: validatedData.documents,
          idType: validatedData.idType,
          verificationProvider: 'smile_identity',
        })

        // ✅ AUTOMATED DECISION - NO ADMIN APPROVAL NEEDED
        let decidedSubmission = submission
        
        if (parsedResult.passed) {
          // 🟢 SMILE PASSED: Auto-approve for ALL user types
          console.log('✅ Smile Identity PASSED - Auto-approving for all users')
          
          decidedSubmission = await verificationService.updateSmileIdentityResult(
            submission.id,
            'PASS',
            parsedResult.jobId || `smile_${Date.now()}`,
            parsedResult.confidenceScore,
            validatedData.idType
          ) || submission

          // 🔓 Update user's identity verification flag
          const user = await storage.getUser(req.user!.id)
          await storage.updateUser(req.user!.id, {
            isIdentityVerified: true,
            isVerified: user?.role === 'requester' ? true : false, // Requesters are fully verified
          })

          const finalUser = await storage.getUser(req.user!.id)
          const { passwordHash: _, ...userWithoutPassword } = finalUser!

          // 📧 Notify providers/suppliers they can proceed to Phase 2
          if (user?.role === 'provider' || user?.role === 'supplier') {
            await notificationService.createAdminNotification({
              title: 'Phase 1 Identity Verified',
              message: `A ${user?.role} has passed Phase 1 identity verification. They can now proceed to Phase 2 (category/qualification verification).`,
              type: 'new_verification',
            })
          }

          return res.status(200).json({
            message: user?.role === 'requester' 
              ? "Identity Verified! You are fully verified and can post jobs." 
              : "Phase 1 Complete! You can now upload category documents for Phase 2.",
            submission: decidedSubmission,
            user: userWithoutPassword,
            token: generateToken(userWithoutPassword),
            phase1Verified: true,
          })
        } else {
          // 🔴 SMILE FAILED: Auto-reject with Smile reason
          console.log('❌ Smile Identity FAILED - Auto-rejecting')
          
          decidedSubmission = await verificationService.updateSmileIdentityResult(
            submission.id,
            'FAIL',
            parsedResult.jobId || `smile_${Date.now()}`,
            parsedResult.confidenceScore,
            validatedData.idType,
            parsedResult.failureReason
          ) || submission

          return res.status(400).json({
            message: "Identity verification failed. Please resubmit.",
            submission: decidedSubmission,
            rejectionReason: parsedResult.failureReason,
            phase1Verified: false,
          })
        }
      }

      // 📋 PHASE 2: DOCUMENT VERIFICATION (Manual - Admin Approval)
      if (validatedData.type === "document") {
        if (validatedData.documents.length < 1) {
          return res.status(400).json({ 
            message: "At least one document is required." 
          })
        }

        const user = await storage.getUser(req.user!.id)

        // ✅ Phase 2 requires Phase 1 to be complete
        const phase1Status = await verificationService.getPhase1Status(req.user!.id)
        if (!phase1Status?.phase1Verified) {
          return res.status(400).json({
            message: "Please complete Phase 1 (Identity Verification) first."
          })
        }

        // 💾 Create Phase 2 submission (pending admin review)
        const submission = await storage.createVerificationSubmission({
          userId: req.user!.id,
          type: 'document',
          documents: validatedData.documents,
          verificationProvider: 'manual', // Phase 2 is always manual
        })

        // 🔔 Notify admin of pending review (only for Phase 2)
        await notificationService.createAdminNotification({
          title: 'Phase 2: Category Verification Pending',
          message: `A ${user?.role} has submitted documents for Phase 2 category/qualification verification.`,
          type: 'new_verification',
        })

        return res.status(201).json({
          message: "Phase 2 submission received. Admin will review and approve within 24-48 hours.",
          submission,
        })
      }

    } catch (error: any) {
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
   * Get current verification status for all phases
   * 
   * Returns:
   * - Phase 1 status (Smile Identity result)
   * - Phase 2 status (if applicable)
   * - User verification flags
   * - Smile confidence score and failure reasons
   */
  app.get("/api/verification/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      // 📊 Get Phase 1 (Identity) status
      const phase1 = await storage.getVerificationSubmission(req.user!.id, "identity")
      
      // 📊 Get Phase 2 (Document) status if applicable
      const phase2 = (req.user!.role === "provider" || req.user!.role === "supplier")
        ? await storage.getVerificationSubmission(req.user!.id, "document")
        : null

      // 👤 Get user current status
      const user = await storage.getUser(req.user!.id)

      res.json({
        // 🔐 Phase 1 (Identity)
        phase1: {
          status: phase1?.status || 'not_submitted', // pending, approved, rejected, not_submitted
          verified: phase1?.phase1Verified || false,
          verificationProvider: phase1?.verificationProvider || 'smile_identity',
          smileJobId: phase1?.smileJobId,
          smileResult: phase1?.smileResult, // PASS or FAIL
          idType: phase1?.idType,
          confidenceScore: phase1?.confidenceScore,
          verifiedAt: phase1?.verifiedAt,
          rejectionReason: phase1?.rejectionReason,
        },
        
        // 📋 Phase 2 (Documents/Category Verification)
        phase2: phase2 ? {
          status: phase2.status, // pending, approved, rejected
          submittedAt: phase2.createdAt,
          rejectionReason: phase2.rejectionReason,
        } : null,

        // 👤 User Verification Flags
        isIdentityVerified: user?.isIdentityVerified || false,
        isVerified: user?.isVerified || false,
        
        // 🔄 Workflow Status
        canProceedToPhase2: phase1?.phase1Verified && phase1?.status === 'approved',
        canAcceptJobs: user?.role === 'requester' ? user?.isVerified : (phase1?.phase1Verified && phase2?.status === 'approved'),
        role: req.user!.role,
      })
    } catch (error: any) {
      console.error("Get verification status error:", error)
      res.status(500).json({ message: error.message || "Failed to get verification status" })
    }
  })

  /**
   * POST /api/verification/resubmit
   * 🆕 Resubmit Phase 1 verification after rejection
   * Uses same Smile Identity flow as initial submission
   */
  app.post("/api/verification/resubmit", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { documents, idType } = req.body

      if (!documents || documents.length < 2 || !idType) {
        return res.status(400).json({
          message: "ID type and both ID + selfie photos are required."
        })
      }

      // 📊 Get previous Phase 1 submission
      const previous = await verificationService.getPhase1Status(req.user!.id)
      if (!previous) {
        return res.status(400).json({
          message: "No previous submission found to resubmit."
        })
      }

      // 🔄 Resubmit to Smile Identity
      const smilePayload = {
        country: 'BW',
        idType,
        selfieImage: documents.find((d: any) => d.name === 'selfie_photo')?.url || '',
        idImage: documents.find((d: any) => d.name === 'national_id')?.url || '',
      }

      const smileResponse = await smileIdentityService.submitKYCVerification(smilePayload)
      const parsedResult = smileIdentityService.parseVerificationResult(smileResponse)

      // 💾 Update with new result
      let updatedSubmission: any

      if (parsedResult.passed) {
        updatedSubmission = await verificationService.updateSmileIdentityResult(
          previous.id,
          'PASS',
          parsedResult.jobId || `smile_${Date.now()}`,
          parsedResult.confidenceScore,
          idType
        )

        const user = await storage.getUser(req.user!.id)
        await storage.updateUser(req.user!.id, {
          isIdentityVerified: true,
          isVerified: user?.role === 'requester' ? true : false,
        })

        const finalUser = await storage.getUser(req.user!.id)
        const { passwordHash: _, ...userWithoutPassword } = finalUser!

        return res.status(200).json({
          message: "Identity Verified! Resubmission successful.",
          submission: updatedSubmission,
          user: userWithoutPassword,
          token: generateToken(userWithoutPassword),
        })
      } else {
        updatedSubmission = await verificationService.updateSmileIdentityResult(
          previous.id,
          'FAIL',
          parsedResult.jobId || `smile_${Date.now()}`,
          parsedResult.confidenceScore,
          idType,
          parsedResult.failureReason
        )

        return res.status(400).json({
          message: "Verification failed again. Please review the requirements and try once more.",
          submission: updatedSubmission,
          rejectionReason: parsedResult.failureReason,
        })
      }
    } catch (error: any) {
      console.error("Resubmission error:", error)
      res.status(500).json({ message: error.message || "Resubmission failed" })
    }
  })
}
