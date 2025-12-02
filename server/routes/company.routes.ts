import type { Express } from 'express';
import { companyService } from '../services/company.service';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY company-related routes
 */

let verifyAccess: any;

export function registerCompanyRoutes(app: Express, injectedVerifyAccess: any): void {
  verifyAccess = injectedVerifyAccess;

  /**
   * GET /api/company/profile
   * Get the current user's company profile
   */
  app.get('/api/company/profile', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'company') {
        return res.status(403).json({ message: 'Only companies can access this' });
      }

      const company = await companyService.getCompany(req.user!.id);
      if (!company) {
        return res.status(404).json({ message: 'Company profile not found' });
      }

      res.json(company);
    } catch (error: any) {
      console.error('Get company profile error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * PATCH /api/company/profile
   * Update the current user's company profile
   */
  app.patch('/api/company/profile', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'company') {
        return res.status(403).json({ message: 'Only companies can update profile' });
      }

      const updated = await companyService.updateCompany(req.user!.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json(updated);
    } catch (error: any) {
      console.error('Update company profile error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/companies
   * Get all verified companies (for display/search)
   */
  app.get('/api/companies', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const companies = await companyService.getVerifiedCompanies();
      res.json(companies);
    } catch (error: any) {
      console.error('Get companies error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/companies/:id
   * Get a single company's profile details
   */
  app.get('/api/companies/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const company = await companyService.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json(company);
    } catch (error: any) {
      console.error('Get company detail error:', error);
      res.status(500).json({ message: error.message });
    }
  });
}
