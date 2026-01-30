/**
 * Smile Identity Service
 * Handles KYC (Know Your Customer) verification using Smile Identity API
 * For Phase 1: Automated identity verification with liveness detection and face matching
 */

import axios, { AxiosInstance } from 'axios';
import aws4 from 'aws4';

// 🔐 Smile Identity API Configuration
const SMILE_IDENTITY_API_BASE = process.env.SMILE_IDENTITY_API_URL || 'https://3eydmgh10d.execute-api.us-west-2.amazonaws.com';
const SMILE_IDENTITY_API_KEY = process.env.SMILE_IDENTITY_API_KEY; // AWS Secret Access Key
const SMILE_IDENTITY_PARTNER_ID = process.env.SMILE_IDENTITY_PARTNER_ID; // AWS Access Key ID
const AWS_REGION = 'us-west-2';
const AWS_SERVICE = 'execute-api';

interface SmileIdentitySubmissionPayload {
  country: string;
  idType: string;
  idNumber?: string; // Optional - may not be available from image
  firstName?: string;
  lastName?: string;
  selfieImage: string; // Base64
  idImage: string; // Base64
  livenessImages?: string[]; // Base64 images
}

interface SmileIdentityResponse {
  success: boolean;
  smile_job_id?: string;
  result?: {
    ConfidenceScore: number;
    ResultCode: string;
    ResultStatus: string; // PASS or FAIL
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

    // 🔐 Add AWS SigV4 signing interceptor
    this.apiClient.interceptors.request.use((config) => {
      if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
        console.warn('⚠️ Smile Identity credentials not configured');
        return config;
      }

      try {
        // Parse the URL to get host and path
        const url = new URL(config.url || '', config.baseURL);
        
        // Prepare request for signing with correct AWS configuration
        const request: any = {
          host: url.hostname,
          path: url.pathname + url.search,
          method: config.method?.toUpperCase() || 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: config.data ? JSON.stringify(config.data) : undefined,
          service: AWS_SERVICE, // 'execute-api'
          region: AWS_REGION,   // 'us-west-2'
        };

        // 🔐 Sign the request with AWS SigV4
        // Using Partner ID as access key and API key as secret key
        aws4.sign(request, {
          accessKeyId: SMILE_IDENTITY_PARTNER_ID,
          secretAccessKey: SMILE_IDENTITY_API_KEY,
          region: AWS_REGION,
          service: AWS_SERVICE,
        });

        // Update config with signed headers (excluding host which axios handles)
        const { host, ...signedHeaders } = request.headers;
        config.headers = signedHeaders as any;

        console.log('✅ Request signed successfully for:', url.pathname);
      } catch (error) {
        console.error('❌ Error signing request:', error);
      }

      return config;
    });

    // Add response interceptor for better error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('Smile Identity API Error Response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else if (error.request) {
          console.error('Smile Identity API No Response:', error.request);
        } else {
          console.error('Smile Identity API Request Error:', error.message);
        }
        throw error;
      }
    );
  }

  /**
   * Submit KYC verification to Smile Identity
   * Includes: Face match, Liveness detection, ID authenticity verification
   * @param payload - User verification data
   * @returns Smile Identity response with verification result
   */
  async submitKYCVerification(
    payload: SmileIdentitySubmissionPayload
  ): Promise<SmileIdentityResponse> {
    try {
      if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
        console.error('🚨 CRITICAL: Smile Identity credentials NOT configured!');
        console.error('   SMILE_IDENTITY_API_KEY:', SMILE_IDENTITY_API_KEY ? '✓ Set' : '✗ Missing');
        console.error('   SMILE_IDENTITY_PARTNER_ID:', SMILE_IDENTITY_PARTNER_ID ? '✓ Set' : '✗ Missing');
        
        // ⚠️ DO NOT AUTO-PASS - return FAIL to force configuration
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
        hasIdImage: !!payload.idImage,
        hasSelfieImage: !!payload.selfieImage,
      });

      // 🔗 POST to Smile Identity Smart Selfie Compare endpoint
      const response = await this.apiClient.post('/v2/smart-selfie-compare', {
        partner_params: {
          job_type: 3, // KYC job type
          user_id: `user_${Date.now()}`, // Unique user identifier
          job_id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        source_sdk: 'backend_nodejs',
        source_sdk_version: '1.0.0',
        timestamp: new Date().toISOString(),
        // 🖼️ Image data
        selfie_image: payload.selfieImage,
        id_image: payload.idImage,
        liveness_images: payload.livenessImages || [],
        // 📋 ID Information
        country: payload.country,
        id_type: payload.idType,
        id_number: payload.idNumber,
        first_name: payload.firstName,
        last_name: payload.lastName,
      });

      // ✅ Extract verification result
      const verificationResult = response.data as SmileIdentityResponse;

      // 📊 Log submission for audit
      console.log('✅ Smile Identity submission successful', {
        jobId: verificationResult.smile_job_id,
        resultStatus: verificationResult.result?.ResultStatus,
        confidenceScore: verificationResult.result?.ConfidenceScore,
      });

      return verificationResult;
    } catch (error: any) {
      console.error('❌ Smile Identity API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // 🚨 Return failure response
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
   * Get verification result from Smile Identity (for polling/webhook follow-up)
   * @param jobId - Smile Identity job ID from previous submission
   * @returns Verification status and result
   */
  async getVerificationResult(jobId: string): Promise<SmileIdentityResponse> {
    try {
      if (!SMILE_IDENTITY_API_KEY || !SMILE_IDENTITY_PARTNER_ID) {
        console.error('🚨 CRITICAL: Smile Identity credentials NOT configured!');
        return {
          success: false,
          result: {
            ResultStatus: 'FAIL',
            ResultCode: 'CREDENTIALS_MISSING',
            ConfidenceScore: 0,
          },
        };
      }

      // 🔗 GET result from Smile Identity
      const response = await this.apiClient.get(`/v2/smart-selfie-compare/${jobId}`);

      return response.data as SmileIdentityResponse;
    } catch (error: any) {
      console.error('❌ Smile Identity result retrieval error:', error.response?.data || error.message);
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
   * Parse Smile Identity response and determine if verification passed
   * @param response - Smile Identity API response
   * @returns Parsed verification decision
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
   * Extract human-readable failure reason from Smile Identity response
   * @param response - Smile Identity API response
   * @returns Failure reason text
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