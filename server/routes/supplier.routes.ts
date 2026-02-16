import type { Express } from 'express';
import { ZodError } from 'zod';
import { updateSupplierProfileSchema, insertSupplierPromotionSchema } from '@shared/schema';
import { storage } from '../storage';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { cacheService } from '../services/cache.service';

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY supplier-related routes (profile, promotions)
 */

let verifyAccess: any;

export function registerSupplierRoutes(app: Express, injectedVerifyAccess: any): void {
  verifyAccess = injectedVerifyAccess;

  /**
   * GET /api/suppliers
   * Get list of all suppliers (for requesters to browse)
   */
  app.get('/api/suppliers', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // 🔥 TIER 5: Cache all suppliers list
      const cacheKey = 'suppliers:all';
      let suppliers = await cacheService.get(cacheKey);
      
      if (!suppliers) {
        suppliers = await storage.getSuppliers();
        // Cache suppliers list for 15 minutes (900s)
        await cacheService.set(cacheKey, suppliers, 900);
      }
      
      res.json(suppliers);
    } catch (error: any) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/suppliers/:id/details
   * Get a single supplier's profile with promotions
   */
  app.get('/api/suppliers/:id/details', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // 🔥 TIER 5: Cache individual supplier details
      const cacheKey = `supplier:details:${req.params.id}`;
      let supplierData = await cacheService.get(cacheKey);
      
      if (!supplierData) {
        const supplier = await storage.getSupplier(req.params.id);
        if (!supplier) {
          return res.status(404).json({ message: 'Supplier not found' });
        }

        // Get supplier promotions (only active ones)
        const promotions = await storage.getSupplierPromotions(req.params.id);
        
        supplierData = {
          ...supplier,
          promotions: promotions.filter(p => p.isActive),
        };
        
        // Cache supplier details for 30 minutes (1800s)
        await cacheService.set(cacheKey, supplierData, 1800);
      }
      
      res.json(supplierData);
    } catch (error: any) {
      console.error('Get supplier detail error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/supplier/profile
   * Get the current supplier's profile
   */
  app.get('/api/supplier/profile', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can access this' });
      }

      // 🔥 TIER 5: Cache current supplier profile
      const cacheKey = `supplier:profile:${req.user!.id}`;
      let supplier = await cacheService.get(cacheKey);
      
      if (!supplier) {
        supplier = await storage.getSupplier(req.user!.id);
        if (!supplier) {
          return res.status(404).json({ message: 'Supplier profile not found' });
        }
        
        // Cache supplier profile for 30 minutes (1800s)
        await cacheService.set(cacheKey, supplier, 1800);
      }

      res.json(supplier);
    } catch (error: any) {
      console.error('Get supplier profile error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * PATCH /api/supplier/profile
   * Update the current supplier's profile
   */
  app.patch('/api/supplier/profile', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can update profile' });
      }

      const validatedData = updateSupplierProfileSchema.parse(req.body);
      const updated = await storage.updateSupplier(req.user!.id, validatedData);

      if (!updated) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      res.json(updated);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update supplier profile error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/supplier/promotions
   * Get all promotions for the current supplier
   */
  app.get('/api/supplier/promotions', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can view their promotions' });
      }

      const promotions = await storage.getSupplierPromotions(req.user!.id);
      res.json(promotions);
    } catch (error: any) {
      console.error('Get supplier promotions error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/supplier/promotions
   * Create a new promotion
   */
  app.post('/api/supplier/promotions', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can create promotions' });
      }

      const validatedData = insertSupplierPromotionSchema.parse(req.body);
      const promotion = await storage.createSupplierPromotion({
        ...(validatedData as any),
        supplierId: req.user!.id,
      });

      res.status(201).json(promotion);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Create supplier promotion error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  /**
   * PATCH /api/supplier/promotions/:id
   * Update an existing promotion
   */
  app.patch('/api/supplier/promotions/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can update promotions' });
      }
      
      const validatedData = insertSupplierPromotionSchema.partial().parse(req.body);
      const updated = await storage.updateSupplierPromotion(req.params.id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ message: 'Promotion not found' });
      }

      res.json(updated);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update supplier promotion error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  /**
   * DELETE /api/supplier/promotions/:id
   * Delete a promotion
   */
  app.delete('/api/supplier/promotions/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can delete promotions' });
      }
      
      await storage.deleteSupplierPromotion(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Delete supplier promotion error:', error);
      res.status(500).json({ message: error.message });
    }
  });
}
