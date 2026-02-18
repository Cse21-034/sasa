/**
 * Cloudinary Upload Service
 * Handles all image and document uploads to Cloudinary CDN
 * Replaces Base64 uploads with direct cloud storage
 */

// Types
export interface CloudinaryUploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  detection?: string; // 'ocr_text', 'face', 'object'
  maxResults?: number;
  transformation?: any[];
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
  secureUrl?: string;
}

export interface CloudinaryUrlParams {
  publicId: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string;
  format?: string;
  dpr?: string;
}

// Environment variables
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn('⚠️  Cloudinary credentials not configured. Image uploads will not work.');
  console.warn('Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env');
}

/**
 * Determine if a file is a document (not an image)
 */
function isDocumentFile(file: File): boolean {
  const documentTypes = ['application/pdf'];
  return documentTypes.includes(file.type);
}

/**
 * Upload a single file to Cloudinary
 * Dynamically selects the appropriate endpoint based on file type:
 * - PDFs and documents use /raw/upload (for non-image files)
 * - Images use /image/upload
 */
export async function uploadToCloudinary(
  file: File,
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  // Validate file before upload
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET || '');
  
  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  try {
    // 💰 CRITICAL FIX: Determine the correct upload endpoint based on file type
    const isDocument = isDocumentFile(file);
    const uploadEndpoint = isDocument ? 'raw/upload' : 'image/upload';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${uploadEndpoint}`;

    console.log(`📤 Uploading file: ${file.name} (type: ${file.type}) to /${uploadEndpoint}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();

    console.log(`✅ File uploaded successfully: ${file.name}`);

    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      width: data.width || 0,
      height: data.height || 0,
      format: data.format,
      size: data.bytes,
      secureUrl: data.secure_url,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Upload multiple files to Cloudinary (batch upload)
 */
export async function uploadMultipleFiles(
  files: File[],
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map((file) => uploadToCloudinary(file, options));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error: any) {
    console.error('Batch upload error:', error);
    throw new Error(`Batch upload failed: ${error.message}`);
  }
}

/**
 * Generate optimized Cloudinary URL with transformations
 * Supports both image and raw (PDF/document) files
 */
export function generateCloudinaryUrl(params: CloudinaryUrlParams): string {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const transformations: string[] = [];

  if (params.width || params.height) {
    const cropParam = params.crop || 'fill';
    const gravity = params.gravity ? `,g_${params.gravity}` : '';
    transformations.push(`w_${params.width || 'auto'},h_${params.height || 'auto'},c_${cropParam}${gravity}`);
  }

  if (params.quality) {
    transformations.push(`q_${params.quality}`);
  }

  if (params.dpr) {
    transformations.push(`dpr_${params.dpr}`);
  }

  if (params.format) {
    transformations.push(`f_${params.format}`);
  }

  const transformationPath = transformations.length > 0 ? `${transformations.join('/')}/` : '';
  
  // ✅ NEW: Use raw/upload for PDFs (public_ids ending in .pdf), image/upload for images
  const uploadType = params.publicId.toLowerCase().endsWith('.pdf') ? 'raw/upload' : 'image/upload';
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/${uploadType}/${transformationPath}${params.publicId}`;
}

/**
 * Delete an image from Cloudinary (requires authenticated request to backend)
 */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Delete failed');
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // File size validation
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // File type validation
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: JPG, PNG, GIF, WebP, BMP, PDF. Got: ${file.type}`,
    };
  }

  return { valid: true };
}

/**
 * Convert file to Base64 (fallback, for backward compatibility)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if URL is from Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/');
}

/**
 * Extract public ID from Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) {
    return null;
  }

  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Get everything after 'upload/' and remove extension
    const remainder = parts.slice(uploadIndex + 1).join('/');
    const withoutExtension = remainder.replace(/\.[^/.]+$/, '');
    return withoutExtension;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

/**
 * Generate thumbnail URL from Cloudinary image
 */
export function generateThumbnailUrl(publicId: string, width = 200, height = 200): string {
  return generateCloudinaryUrl({
    publicId,
    width,
    height,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
  });
}

/**
 * Generate responsive image URL with automatic DPR
 */
export function generateResponsiveUrl(publicId: string, width: number): string {
  return generateCloudinaryUrl({
    publicId,
    width,
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  });
}

export default {
  uploadToCloudinary,
  uploadMultipleFiles,
  generateCloudinaryUrl,
  deleteCloudinaryImage,
  validateImageFile,
  fileToBase64,
  isCloudinaryUrl,
  getPublicIdFromUrl,
  generateThumbnailUrl,
  generateResponsiveUrl,
};
