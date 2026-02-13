/**
 * Cloudinary Service
 * Backend service for Cloudinary operations (delete, metadata, etc.)
 * Requires authentication for security
 */

import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

// Initialize Cloudinary
const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary API credentials not configured');
  console.warn('Set CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
} else {
  cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export class CloudinaryService {
  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok') {
        throw new Error(`Failed to delete image: ${result.result}`);
      }
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   */
  async deleteImages(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map((id) => this.deleteImage(id));
      await Promise.all(deletePromises);
    } catch (error: any) {
      console.error('Batch delete error:', error);
      throw new Error(`Batch delete failed: ${error.message}`);
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(publicId: string): Promise<any> {
    try {
      const resource = await cloudinary.api.resource(publicId);
      return {
        publicId: resource.public_id,
        url: resource.secure_url,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        sizeBytes: resource.bytes,
        createdAt: resource.created_at,
      };
    } catch (error: any) {
      console.error('Metadata fetch error:', error);
      throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
  }

  /**
   * Rename/move a resource
   */
  async renameResource(publicId: string, newPublicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.rename(publicId, newPublicId);
      return result;
    } catch (error: any) {
      console.error('Rename error:', error);
      throw new Error(`Rename failed: ${error.message}`);
    }
  }

  /**
   * Tag resources for better organization
   */
  async tagResources(publicIds: string[], tags: string[]): Promise<void> {
    try {
      await cloudinary.api.add_tag(tags, { resource_ids: publicIds });
    } catch (error: any) {
      console.error('Tag error:', error);
      throw new Error(`Tagging failed: ${error.message}`);
    }
  }

  /**
   * Validate if URL is from Cloudinary
   */
  isCloudinaryUrl(url: string): boolean {
    return url.startsWith('https://res.cloudinary.com/') || url.startsWith('http://res.cloudinary.com/');
  }

  /**
   * Extract public ID from URL
   */
  extractPublicId(url: string): string | null {
    if (!this.isCloudinaryUrl(url)) {
      return null;
    }

    try {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;

      const remainder = parts.slice(uploadIndex + 1).join('/');
      const withoutExtension = remainder.replace(/\.[^/.]+$/, '');
      return withoutExtension;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }
}

export const cloudinaryService = new CloudinaryService();

export default cloudinaryService;
