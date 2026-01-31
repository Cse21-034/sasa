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

  // 🌍 Country code mapping (country name → ISO 2-letter code)
  const countryToISOCode: Record<string, string> = {
    "Botswana": "BW",
    "Nigeria": "NG",
    "Kenya": "KE",
    "South Africa": "ZA",
    "Ghana": "GH",
    "Uganda": "UG",
    "Tanzania": "TZ",
    "Rwanda": "RW",
    "Zambia": "ZM",
    "Zimbabwe": "ZW",
    "United States": "US",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Australia": "AU",
    "India": "IN",
    "Germany": "DE",
    "France": "FR",
    "Spain": "ES",
  }

  // 🔄 Map UI id types → Smile Identity enums
  const idTypeMap: Record<string, string> = {
    national_id: "NATIONAL_ID",
    passport: "PASSPORT",
    driver_licence: "DRIVER_LICENSE",
  }

  /**
   * POST /api/verification/submit
   * 🆕 Submit Phase 1 (Identity) or Phase 2 (Documents) verification
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

        if (!validatedData.idType || !idTypeMap[validatedData.idType]) {
          return res.status(400).json({
            message: "ID type (national_id, passport, driver_licence) is required and must be valid."
          })
        }

        // 🔗 Call Smile Identity API for verification
        const idDocument = validatedData.documents.find(d => d.name === validatedData.idType)
        const selfieDocument = validatedData.documents.find(d => d.name === "selfie_photo")

        if (!idDocument || !selfieDocument) {
          return res.status(400).json({
            message: "Both ID document and selfie photo are required."
          })
        }

        const smilePayload = {
          country: countryToISOCode[req.user!.phoneCountry || "Botswana"] || "BW",
          idType: idTypeMap[validatedData.idType],
          selfieImage: selfieDocument.url,
          idImage: idDocument.url,
        }

        console.log('🌍 User country info:', {
          phoneCountry: req.user!.phoneCountry,
          mappedCountryCode: smilePayload.country,
          idType: smilePayload.idType,
        })
        console.log('📤 Submitting to Smile Identity API...')
        const smileResponse = await smileIdentityService.submitKYCVerification(smilePayload)
        const parsedResult = smileIdentityService.parseVerificationResult(smileResponse)

        const submission = await storage.createVerificationSubmission({
          userId: req.user!.id,
          type: 'identity',
          documents: validatedData.documents,
          idType: validatedData.idType,
          verificationProvider: 'smile_identity',
        })

        let decidedSubmission = submission
        
        if (parsedResult.passed) {
          console.log('✅ Smile Identity PASSED - Auto-approving for all users')
          
          decidedSubmission = await verificationService.updateSmileIdentityResult(
            submission.id,
            'PASS',
            parsedResult.jobId || `smile_${Date.now()}`,
            parsedResult.confidenceScore,
            validatedData.idType
          ) || submission

          const user = await storage.getUser(req.user!.id)
          await storage.updateUser(req.user!.id, {
            isIdentityVerified: true,
            isVerified: user?.role === 'requester' ? true : false,
          })

          const finalUser = await storage.getUser(req.user!.id)
          const { passwordHash: _, ...userWithoutPassword } = finalUser!

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
        const phase1Status = await verificationService.getPhase1Status(req.user!.id)

        if (!phase1Status?.phase1Verified) {
          return res.status(400).json({
            message: "Please complete Phase 1 (Identity Verification) first."
          })
        }

        const submission = await storage.createVerificationSubmission({
          userId: req.user!.id,
          type: 'document',
          documents: validatedData.documents,
          verificationProvider: 'manual',
        })

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
   */
  app.get("/api/verification/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const phase1 = await storage.getVerificationSubmission(req.user!.id, "identity")
      const phase2 = (req.user!.role === "provider" || req.user!.role === "supplier")
        ? await storage.getVerificationSubmission(req.user!.id, "document")
        : null

      const user = await storage.getUser(req.user!.id)

      res.json({
        phase1: {
          status: phase1?.status || 'not_submitted',
          verified: phase1?.phase1Verified || false,
          verificationProvider: phase1?.verificationProvider || 'smile_identity',
          smileJobId: phase1?.smileJobId,
          smileResult: phase1?.smileResult,
          idType: phase1?.idType,
          confidenceScore: phase1?.confidenceScore,
          verifiedAt: phase1?.verifiedAt,
          rejectionReason: phase1?.rejectionReason,
        },
        phase2: phase2 ? {
          status: phase2.status,
          submittedAt: phase2.createdAt,
          rejectionReason: phase2.rejectionReason,
        } : null,
        isIdentityVerified: user?.isIdentityVerified || false,
        isVerified: user?.isVerified || false,
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
   */
  app.post("/api/verification/resubmit", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { documents, idType } = req.body

      if (!documents || documents.length < 2 || !idType || !idTypeMap[idType]) {
        return res.status(400).json({
          message: "ID type and both ID + selfie photos are required and must be valid."
        })
      }

      const previous = await verificationService.getPhase1Status(req.user!.id)
      if (!previous) {
        return res.status(400).json({
          message: "No previous submission found to resubmit."
        })
      }

      const idDocument = documents.find((d: any) => d.name === idType)
      const selfieDocument = documents.find((d: any) => d.name === "selfie_photo")

      if (!idDocument || !selfieDocument) {
        return res.status(400).json({
          message: "Both ID document and selfie photo are required."
        })
      }

      const smilePayload = {
        country: "BW",
        idType: idTypeMap[idType],
        selfieImage: selfieDocument.url,
        idImage: idDocument.url,
      }

      const smileResponse = await smileIdentityService.submitKYCVerification(smilePayload)
      const parsedResult = smileIdentityService.parseVerificationResult(smileResponse)

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
