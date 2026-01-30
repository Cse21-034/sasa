/**
 * Smile Identity Service - VERSION A
 * Standard REST API with Simple API Key Authentication
 * 
 * Use this version if:
 * - Your Partner ID is a short number (e.g., "0001")
 * - Your API Key is a regular alphanumeric string (not AWS format)
 * - You're using https://api.smileidentity.com or https://testapi.smileidentity.com
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// 🔐 Smile Identity API Configuration
const SMILE_IDENTITY_API_BASE = process.env.SMILE_IDENTITY_API_URL || 'https://testapi.smileidentity.com/v1';
const SMILE_IDENTITY_API_KEY = process.env.SMILE_IDENTITY_API_KEY;
const SMILE_IDENTITY_PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID;

interface SmileIdentitySubmissionPayload {
  country: string;
  idType: string;
  idNumber?: string;
  firstName?: string;
  lastName?: string;
  selfieImage: string; // Base64
  idImage: string; // Base64
  livenessImages?: string[];
}

interface SmileIdentityResponse {
  success: boolean;
  smile_job_id?: string;
  result?: {
    ConfidenceScore: number;
    ResultCode: string;
    ResultStatus: string;
    Actions?: {
      Liveness: string;
      FaceMatch: string;
      DocumentAuthenticity: string;
    };
  };
  signature?: string;
  timestamp?: string;
}

export class SmileIdentityService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: SMILE_IDENTITY_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // 🔐 Add Smile Identity signature authentication
    this.apiClient.interceptors.request.use((config) => {
      if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
        console.warn('⚠️ Smile Identity credentials not configured');
        return config;
      }

      try {
        // Generate timestamp
        const timestamp = new Date().toISOString();
        
        // Create signature (Smile Identity specific)
        // Signature = HMAC-SHA256(partner_id + timestamp, api_key)
        const signatureString = SMILE_IDENTITY_PARTNER_ID + timestamp;
        const signature = crypto
          .createHmac('sha256', SMILE_IDENTITY_API_KEY)
          .update(signatureString)
          .digest('hex');

        // Add Smile Identity authentication headers
        config.headers['partner_id'] = SMILE_IDENTITY_PARTNER_ID;
        config.headers['timestamp'] = timestamp;
        config.headers['signature'] = signature;

        console.log('✅ Smile Identity signature created:', {
          partner_id: SMILE_IDENTITY_PARTNER_ID,
          timestamp,
          signature: signature.substring(0, 10) + '...',
        });
      } catch (error) {
        console.error('❌ Error creating signature:', error);
      }

      return config;
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('Smile Identity API Error:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        }
        throw error;
      }
    );
  }

  /**
   * Submit KYC verification to Smile Identity
   */
  async submitKYCVerification(
    payload: SmileIdentitySubmissionPayload
  ): Promise<SmileIdentityResponse> {
    try {
      if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
        console.error('🚨 CRITICAL: Smile Identity credentials NOT configured!');
        return {
          success: false,
          result: {
            ConfidenceScore: 0,
            ResultCode: 'CREDENTIALS_MISSING',
            ResultStatus: 'FAIL',
          },
        };
      }

      console.log('📤 Submitting to Smile Identity:', {
        country: payload.country,
        idType: payload.idType,
        endpoint: SMILE_IDENTITY_API_BASE,
      });

      // Prepare the request body according to Smile Identity API spec
      const requestBody = {
        partner_params: {
          job_id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: `user_${Date.now()}`,
          job_type: 5, // Enhanced KYC with Biometric
        },
        images: [
          {
            image_type_id: 1, // ID Card
            image: payload.idImage.replace(/^data:image\/[a-z]+;base64,/, ''),
          },
          {
            image_type_id: 2, // Selfie
            image: payload.selfieImage.replace(/^data:image\/[a-z]+;base64,/, ''),
          },
        ],
        id_info: {
          country: payload.country,
          id_type: this.mapIdType(payload.idType),
          id_number: payload.idNumber || '',
          first_name: payload.firstName || '',
          last_name: payload.lastName || '',
        },
      };

      const response = await this.apiClient.post('/submit', requestBody);

      console.log('✅ Smile Identity submission successful:', {
        status: response.status,
        data: response.data,
      });

      // Parse response
      const result = response.data;
      
      return {
        success: true,
        smile_job_id: result.job_id || result.smile_job_id,
        result: {
          ConfidenceScore: result.confidence_score || result.ConfidenceScore || 0,
          ResultCode: result.result_code || result.ResultCode || 'UNKNOWN',
          ResultStatus: result.result_status || result.ResultStatus || 'PENDING',
          Actions: result.Actions,
        },
      };
    } catch (error: any) {
      console.error('❌ Smile Identity API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return {
        success: false,
        result: {
          ResultStatus: 'FAIL',
          ResultCode: 'API_ERROR',
          ConfidenceScore: 0,
        },
      };
    }
  }

  /**
   * Get verification result
   */
  async getVerificationResult(jobId: string): Promise<SmileIdentityResponse> {
    try {
      if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
        return {
          success: false,
          result: {
            ResultStatus: 'FAIL',
            ResultCode: 'CREDENTIALS_MISSING',
            ConfidenceScore: 0,
          },
        };
      }

      const response = await this.apiClient.get(`/job_status`, {
        params: { job_id: jobId },
      });

      return {
        success: true,
        smile_job_id: jobId,
        result: {
          ConfidenceScore: response.data.confidence_score || 0,
          ResultCode: response.data.result_code || 'UNKNOWN',
          ResultStatus: response.data.result_status || 'PENDING',
        },
      };
    } catch (error: any) {
      console.error('❌ Error retrieving result:', error);
      return {
        success: false,
        result: {
          ResultStatus: 'FAIL',
          ResultCode: 'RESULT_NOT_FOUND',
          ConfidenceScore: 0,
        },
      };
    }
  }

  /**
   * Map ID types to Smile Identity format
   */
  private mapIdType(idType: string): string {
    const mapping: Record<string, string> = {
      'national_id': 'NATIONAL_ID',
      'passport': 'PASSPORT',
      'driver_licence': 'DRIVERS_LICENSE',
    };
    return mapping[idType] || 'NATIONAL_ID';
  }

  /**
   * Parse verification result
   */
  parseVerificationResult(response: SmileIdentityResponse) {
    const isPassed = response.result?.ResultStatus === 'PASS';
    const confidenceScore = response.result?.ConfidenceScore || 0;
    const failureReason = this.getFailureReason(response);

    return {
      passed: isPassed,
      jobId: response.smile_job_id,
      resultStatus: response.result?.ResultStatus,
      confidenceScore,
      failureReason,
      actions: response.result?.Actions,
    };
  }

  /**
   * Get failure reason
   */
  private getFailureReason(response: SmileIdentityResponse): string {
    if (response.result?.ResultStatus === 'PASS') {
      return '';
    }

    const resultCode = response.result?.ResultCode;

    const failureReasons: Record<string, string> = {
      'CREDENTIALS_MISSING': 'System configuration error. Please contact support.',
      'API_ERROR': 'Verification service temporarily unavailable. Please try again later.',
      'DOCUMENT_FAILED_VERIFICATION': 'Document could not be verified. Please upload a clear, readable ID.',
      'FACE_MISMATCH': 'Face does not match the ID document. Please ensure both photos are clear.',
      'LIVENESS_FAILED': 'Liveness check failed. Please submit a fresh selfie.',
      'DUPLICATE_PERSON': 'This identity has already been verified.',
      'UNDERAGE_PERSON': 'Must be 18 years or older.',
      'POOR_IMAGE_QUALITY': 'Image quality too poor. Please ensure good lighting and clarity.',
      'MULTIPLE_FACES': 'Multiple faces detected in selfie. Please upload a photo with only your face.',
      'NO_FACE_DETECTED': 'No face detected in photo. Please upload a clear selfie.',
      'MISSING_DOCUMENT': 'No valid ID document found.',
      'EXPIRED_DOCUMENT': 'Document has expired. Please use a valid ID.',
    };

    return failureReasons[resultCode as string] || 
      `Verification failed. Please try again or contact support. (Code: ${resultCode})`;
  }
}

export const smileIdentityService = new SmileIdentityService();