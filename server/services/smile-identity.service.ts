/**
 * Smile Identity Service (Lambda v1)
 * Phase 1 Automated KYC – NO ADMIN APPROVAL
 */

import axios from "axios";
import crypto from "crypto";

const SMILE_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.smileidentity.com/v1"
    : "https://testapi.smileidentity.com/v1";

const SMILE_PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID!;
const SMILE_AUTH_TOKEN = process.env.SMILE_IDENTITY_API_KEY!; // auth_token

interface SmileIdentitySubmissionPayload {
  country: string;
  idType: string;
  selfieImage: string;
  idImage: string;
}

interface SmileIdentityResponse {
  job_id?: string;
  result?: {
    ResultCode: string;
    ResultText: string;
    ConfidenceValue?: number;
    ResultType?: "PASS" | "FAIL";
  };
}

/**
 * Generate Smile Identity Lambda signature
 */
function signPayload(payload: object) {
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json).toString("base64");

  const signature = crypto
    .createHmac("sha256", SMILE_AUTH_TOKEN)
    .update(base64Payload)
    .digest("base64");

  return { base64Payload, signature };
}

export class SmileIdentityService {
  /**
   * Submit Phase 1 KYC verification
   */
  async submitKYCVerification(payload: SmileIdentitySubmissionPayload) {
    try {
     const jobPayload = {
  job_type: 3, // SmartSelfie + ID
  job_id: `job_${Date.now()}`,
  user_id: `user_${Date.now()}`,

  id_info: {
    country: payload.country, // ✅ MUST be here (e.g. "BW")
    id_type: payload.idType,  // ✅ MUST be here
  },

  images: [
    {
      image_type_id: 1, // ID document
      image: payload.idImage.replace(/^data:image\/\w+;base64,/, ""),
    },
    {
      image_type_id: 2, // Selfie
      image: payload.selfieImage.replace(/^data:image\/\w+;base64,/, ""),
    },
  ],
};

      const { base64Payload, signature } = signPayload(jobPayload);

      const response = await axios.post(
        `${SMILE_BASE_URL}/verify`,
        {
          partner_id: SMILE_PARTNER_ID,
          timestamp: new Date().toISOString(),
          signature,
          payload: base64Payload,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      return response.data as SmileIdentityResponse;
    } catch (error: any) {
      console.error("❌ Smile Identity error:", error.response?.data || error.message);
      throw new Error("Smile Identity verification failed");
    }
  }

  /**
   * Parse Smile Identity result
   */
  parseVerificationResult(response: SmileIdentityResponse) {
    const passed = response?.result?.ResultType === "PASS";

    return {
      passed,
      jobId: response.job_id,
      confidenceScore: response.result?.ConfidenceValue || 0,
      failureReason: passed
        ? null
        : response.result?.ResultText || "Identity verification failed",
    };
  }
}

export const smileIdentityService = new SmileIdentityService();
