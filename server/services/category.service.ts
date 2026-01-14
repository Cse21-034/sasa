/**
 * Category Service
 * Handles all category management operations including category addition requests
 */

import { storage } from "../storage";
import type { CategoryAdditionRequest, InsertCategoryAdditionRequest } from "@shared/schema";

export class CategoryService {
  /**
   * Create a category addition request
   * @param request - Category addition request data
   * @returns Created request
   */
  async createCategoryAdditionRequest(request: InsertCategoryAdditionRequest): Promise<CategoryAdditionRequest> {
    return await storage.createCategoryAdditionRequest(request);
  }

  /**
   * Get a specific category addition request
   * @param id - Request ID
   * @returns Request or undefined
   */
  async getCategoryAdditionRequest(id: string): Promise<CategoryAdditionRequest | undefined> {
    return await storage.getCategoryAdditionRequest(id);
  }

  /**
   * Get all pending category addition requests (for admin)
   * @returns Array of pending requests
   */
  async getPendingCategoryAdditionRequests(): Promise<CategoryAdditionRequest[]> {
    return await storage.getPendingCategoryAdditionRequests();
  }

  /**
   * Get pending category addition requests for a specific provider
   * @param providerId - Provider user ID
   * @returns Array of pending requests for that provider
   */
  async getPendingCategoryAdditionRequestsForProvider(providerId: string): Promise<CategoryAdditionRequest[]> {
    return await storage.getPendingCategoryAdditionRequestsForProvider(providerId);
  }

  /**
   * Approve a category addition request
   * @param requestId - Request ID
   * @param adminId - Admin user ID
   * @returns Updated request
   */
  async approveCategoryAdditionRequest(requestId: string, adminId: string): Promise<CategoryAdditionRequest | undefined> {
    const request = await storage.getCategoryAdditionRequest(requestId);
    if (!request) return undefined;

    const updated = await storage.updateCategoryAdditionRequestStatus(
      requestId,
      'approved',
      adminId
    );

    if (updated) {
      // Notify the provider that their category request was approved
      const category = await storage.getCategory(request.categoryId);
      await storage.createNotification({
        recipientId: request.providerId,
        type: 'category_request_approved',
        title: 'Category Request Approved',
        message: `Your request to add "${category?.name || 'the requested'}" category has been approved! You can now receive jobs in this category.`,
      });
    }

    return updated;
  }

  /**
   * Reject a category addition request
   * @param requestId - Request ID
   * @param adminId - Admin user ID
   * @param rejectionReason - Reason for rejection
   * @returns Updated request
   */
  async rejectCategoryAdditionRequest(requestId: string, adminId: string, rejectionReason: string): Promise<CategoryAdditionRequest | undefined> {
    const request = await storage.getCategoryAdditionRequest(requestId);
    if (!request) return undefined;

    const updated = await storage.updateCategoryAdditionRequestStatus(
      requestId,
      'rejected',
      adminId,
      rejectionReason
    );

    if (updated) {
      // Notify the provider that their category request was rejected
      const category = await storage.getCategory(request.categoryId);
      await storage.createNotification({
        recipientId: request.providerId,
        type: 'category_request_rejected',
        title: 'Category Request Rejected',
        message: `Your request to add "${category?.name || 'the requested'}" category was rejected. Reason: ${rejectionReason}`,
      });
    }

    return updated;
  }
}

export const categoryService = new CategoryService();
