/**
 * Supplier Service
 * Handles supplier profile and promotion management
 * Follows Single Responsibility Principle by focusing on supplier operations
 */

import { db } from "../db";
import { suppliers, users, supplierPromotions } from "@shared/schema";
import type { Supplier, InsertSupplier, SupplierPromotion, InsertSupplierPromotion } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

type SupplierWithUser = Supplier & {
  user: any;
};

export class SupplierService {
  /**
   * Get supplier profile with user data and active promotions
   * @param userId - User ID
   * @returns Supplier with user and promotions or undefined
   */
  async getSupplier(userId: string): Promise<any | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.userId, userId));

    if (!supplier) return undefined;

    // Get associated user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Get active promotions for this supplier
    const promotions = await db.select().from(supplierPromotions)
      .where(eq(supplierPromotions.supplierId, userId))
      .orderBy(desc(supplierPromotions.createdAt));

    // Update isActive status based on current time
    const now = new Date();
    for (const promo of promotions) {
      const isActive = promo.validUntil.getTime() > now.getTime();
      if (promo.isActive !== isActive) {
        await db.update(supplierPromotions)
          .set({ isActive, updatedAt: now })
          .where(eq(supplierPromotions.id, promo.id));
        promo.isActive = isActive;
      }
    }

    return {
      ...supplier,
      user,
      promotions,
    };
  }

  /**
   * Create a new supplier profile
   * @param supplier - Supplier data to insert
   * @returns Created supplier
   */
  async createSupplier(supplier: InsertSupplier & { userId: string }): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  /**
   * Update supplier profile information
   * @param userId - User ID
   * @param data - Partial supplier data to update
   * @returns Updated supplier or undefined
   */
  async updateSupplier(userId: string, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const [updated] = await db
      .update(suppliers)
      .set(data)
      .where(eq(suppliers.userId, userId))
      .returning();
    return updated || undefined;
  }

  /**
   * Get all suppliers with user information
   * @returns Array of suppliers with associated user data
   */
  async getSuppliers(): Promise<SupplierWithUser[]> {
    const results = await db
      .select({
        supplier: suppliers,
        user: users,
      })
      .from(suppliers)
      .leftJoin(users, eq(suppliers.userId, users.id));

    return results.map((r) => ({
      ...r.supplier,
      user: r.user,
    })) as SupplierWithUser[];
  }

  /**
   * Get all promotions for a supplier
   * @param supplierId - Supplier user ID
   * @returns Array of supplier promotions
   */
  async getSupplierPromotions(supplierId: string): Promise<SupplierPromotion[]> {
    return await db.select().from(supplierPromotions)
      .where(eq(supplierPromotions.supplierId, supplierId))
      .orderBy(desc(supplierPromotions.createdAt));
  }

  /**
   * Create a new promotion for a supplier
   * @param promotion - Promotion data to insert
   * @returns Created promotion
   */
  async createSupplierPromotion(promotion: InsertSupplierPromotion & { supplierId: string }): Promise<SupplierPromotion> {
    const [created] = await db.insert(supplierPromotions).values(promotion).returning();
    return created;
  }

  /**
   * Update promotion information
   * @param id - Promotion ID
   * @param data - Partial promotion data to update
   * @returns Updated promotion or undefined
   */
  async updateSupplierPromotion(id: string, data: Partial<InsertSupplierPromotion>): Promise<SupplierPromotion | undefined> {
    const [updated] = await db
      .update(supplierPromotions)
      .set(data)
      .where(eq(supplierPromotions.id, id))
      .returning();
    return updated || undefined;
  }

  /**
   * Delete a promotion
   * @param id - Promotion ID
   */
  async deleteSupplierPromotion(id: string): Promise<void> {
    await db.delete(supplierPromotions).where(eq(supplierPromotions.id, id));
  }
}

// Export singleton instance
export const supplierService = new SupplierService();
