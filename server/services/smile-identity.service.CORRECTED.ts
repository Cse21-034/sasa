/**
 * Smile Identity Service - Lambda v1 API (CORRECTED)
 * Phase 1 Automated KYC with proper payload structure
 */

import axios from "axios";
import crypto from "crypto";

const SMILE_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.smileidentity.com/v1"
    : "https://testapi.smileidentity.com/v1";

const SMILE_PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID!;
const SMILE_AUTH_TOKEN = process.env.SMILE_IDENTITY_API_KEY!;

interface SmileIdentitySubmissionPayload {
  country: string;
  idType: string;
  selfieImage: string;
  idImage: string;
}

interface SmileIdentityResponse {
  success?: boolean;
  smile_job_id?: string;
  job_complete?: boolean;
  result?: {
    ResultCode?: string;
    ResultText?: string;
    ConfidenceValue?: string;
    ResultType?: string;
  };
  Actions?: {
    Liveness_Check?: string;
    Selfie_To_ID_Authority_Compare?: string;
    Selfie_To_ID_Card_Compare?: string;
  };
}

/**
 * Generate Smile Identity signature
 * Signature = HMAC-SHA256(timestamp + partner_id + "sid_request" + api_version, api_key)
 */
function generateSignature(timestamp: string): string {
  const dataToSign = `${timestamp}${SMILE_PARTNER_ID}sid_request1`;
  
  return crypto
    .createHmac("sha256", SMILE_AUTH_TOKEN)
    .update(dataToSign)
    .digest("base64");
}

export class SmileIdentityService {
  /**
   * Submit Phase 1 KYC verification to Smile Identity Lambda API
   */
  async submitKYCVerification(payload: SmileIdentitySubmissionPayload) {
    try {
      console.log('📋 Smile Identity Payload received:', {
        country: payload.country,
        idType: payload.idType,
        hasIdImage: !!payload.idImage,
        hasSelfieImage: !!payload.selfieImage,
      });

      const timestamp = new Date().toISOString();
      const signature = generateSignature(timestamp);

      // ✅ CRITICAL: Smile Identity expects images array WITHOUT base64Payload wrapper
      const requestBody = {
        source_sdk: "rest_api",
        source_sdk_version: "1.0.0",
        sec_key: timestamp,
        timestamp,
        
        partner_params: {
          job_id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: `user_${Date.now()}`,
          job_type: 5, // ✅ Enhanced KYC (job_type 5 for SmartSelfie + ID)
        },
        
        // ✅ Images array (no base64Payload wrapper)
        images: [
          {
            image_type_id: 1, // ID document
            image: payload.idImage.replace(/^data:image\/\w+;base64,/, ""),
          },
          {
            image_type_id: 2, // Selfie with ID
            image: payload.selfieImage.replace(/^data:image\/\w+;base64,/, ""),
          },
        ],
        
        // ✅ ID Information (top-level, not in partner_params)
        id_info: {
          country: payload.country,
          id_type: payload.idType,
          // Optional: id_number, first_name, last_name if you have them
        },
        
        // ✅ Partner credentials
        partner_id: SMILE_PARTNER_ID,
        signature,
      };

      console.log('📤 Sending to Smile Identity:', {
        endpoint: `${SMILE_BASE_URL}/async_id_verification`,
        partner_id: SMILE_PARTNER_ID,
        job_type: requestBody.partner_params.job_type,
        country: requestBody.id_info.country,
        id_type: requestBody.id_info.id_type,
        timestamp,
      });

      // ✅ Use async_id_verification endpoint for job_type 5
      const response = await axios.post(
        `${SMILE_BASE_URL}/async_id_verification`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      console.log('✅ Smile Identity response:', {
        status: response.status,
        job_complete: response.data.job_complete,
        smile_job_id: response.data.smile_job_id,
        result_code: response.data.result?.ResultCode,
      });

      return response.data as SmileIdentityResponse;
    } catch (error: any) {
      console.error("❌ Smile Identity error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      // Return a failure response instead of throwing
      return {
        success: false,
        result: {
          ResultCode: "2500",
          ResultText: error.response?.data?.error || "Verification service error",
          ResultType: "FAIL",
        },
      } as SmileIdentityResponse;
    }
  }

  /**
   * Parse Smile Identity result
   */
  parseVerificationResult(response: SmileIdentityResponse) {
    // Check for explicit success indicators
    const passed = 
      response.result?.ResultType === "PASS" ||
      response.result?.ResultCode === "1012" || // ID Verified
      response.Actions?.Selfie_To_ID_Card_Compare === "Passed";

    const confidenceValue = response.result?.ConfidenceValue;
    const confidenceScore = confidenceValue 
      ? parseFloat(confidenceValue) 
      : 0;

    return {
      passed,
      jobId: response.smile_job_id,
      confidenceScore,
      failureReason: passed
        ? null
        : this.getFailureReason(response),
    };
  }

  /**
   * Get human-readable failure reason
   */
  private getFailureReason(response: SmileIdentityResponse): string {
    const resultText = response.result?.ResultText;
    const resultCode = response.result?.ResultCode;

    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      "2413": "Invalid country code. Please ensure your country is supported.",
      "2414": "Invalid ID type. Please use a supported ID document.",
      "2415": "Poor image quality. Please ensure your photos are clear and well-lit.",
      "2416": "Face not detected in selfie. Please ensure your face is clearly visible.",
      "2417": "Multiple faces detected. Please ensure only one face is in the selfie.",
      "2418": "ID document not readable. Please upload a clearer photo of your ID.",
      "2419": "Liveness check failed. Please submit a fresh, live selfie.",
      "2420": "Face mismatch. The face in the selfie doesn't match the ID document.",
      "2500": "Verification service temporarily unavailable. Please try again later.",
    };

    if (resultCode && errorMessages[resultCode]) {
      return errorMessages[resultCode];
    }

    if (resultText) {
      return resultText;
    }

    return "Identity verification failed. Please ensure your photos are clear and try again.";
  }
}

export const smileIdentityService = new SmileIdentityService();
