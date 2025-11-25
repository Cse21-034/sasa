import type { Express } from 'express';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { createUserRequestSchema } from '@shared/schema';
import { storage } from '../storage';
import { companyService } from '../services/company.service';
import { generateToken } from '../middleware/auth';

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY authentication routes (signup, login)
 */

export function registerAuthRoutes(app: Express): void {
  /**
   * POST /api/auth/signup
   * Create a new user account (individual, supplier, or company)
   */
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const rawValidatedData = createUserRequestSchema.parse(req.body);
      const { password, confirmPassword, primaryCity, ...userData } = rawValidatedData as any;
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const isSupplier = userData.role === 'supplier';
      const isCompany = userData.role === 'company';
      let supplierData: any = null;
      let companyData: any = null;
      
      if (isSupplier) {
        const {
          companyName,
          physicalAddress,
          contactPerson,
          contactPosition,
          companyEmail,
          companyPhone,
          industryType,
          ...baseUserData
        } = userData as any;
        
        supplierData = {
          companyName,
          physicalAddress,
          contactPerson,
          contactPosition,
          companyEmail,
          companyPhone,
          industryType,
        };
        
        Object.keys(userData).forEach(key => {
          if (!(key in baseUserData)) {
            delete (userData as any)[key];
          }
        });
      } else if (isCompany) {
        const {
          companyName,
          registrationNumber,
          taxNumber,
          physicalAddress,
          contactPerson,
          contactPosition,
          companyEmail,
          companyPhone,
          companyWebsite,
          industryType,
          numberOfEmployees,
          yearsInBusiness,
          ...baseUserData
        } = userData as any;
        
        companyData = {
          companyName,
          registrationNumber,
          taxNumber,
          physicalAddress,
          contactPerson,
          contactPosition,
          companyEmail,
          companyPhone,
          companyWebsite,
          industryType,
          numberOfEmployees,
          yearsInBusiness,
        };
        
        Object.keys(userData).forEach(key => {
          if (!(key in baseUserData)) {
            delete (userData as any)[key];
          }
        });
      }

      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      try {
        if (user.role === 'provider') {
          if (!primaryCity) {
            await storage.deleteUser(user.id);
            return res.status(400).json({ 
              message: 'City selection is required for service providers. Please select your service area.' 
            });
          }
          
          await storage.createProvider({
            userId: user.id,
            serviceCategories: [],
            primaryCity,
            approvedServiceAreas: [primaryCity],
            serviceAreaRadiusMeters: 10000,
          });
          
        } else if (user.role === 'supplier' && supplierData) {
          await storage.createSupplier({
            userId: user.id,
            ...supplierData,
          });
        } else if (user.role === 'company' && companyData) {
          await companyService.createCompany({
            userId: user.id,
            ...companyData,
            isVerified: false,
            ratingAverage: 0,
            completedJobsCount: 0,
          });
        }
      } catch (profileError: any) {
        await storage.deleteUser(user.id);
        return res.status(500).json({ 
          message: 'Failed to create user profile: ' + profileError.message 
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isIdentityVerified: user.isIdentityVerified,
        status: user.status, 
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, token });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ 
            field: i.path.join('.'), 
            message: i.message 
          }))
        });
      }
      
      res.status(400).json({ 
        message: error.message || 'Signup failed. Please try again.' 
      });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      if (user.status !== 'active') {
         return res.status(403).json({ message: `Your account is currently ${user.status}. Please contact support.` });
      }
      
      const updatedUser = await storage.updateUser(user.id, { lastLogin: new Date() });
      const userToUse = updatedUser || user;

      const token = generateToken({
        id: userToUse.id,
        email: userToUse.email,
        role: userToUse.role,
        isVerified: userToUse.isVerified,
        isIdentityVerified: userToUse.isIdentityVerified,
        status: userToUse.status, 
      });

      const { passwordHash: _, ...userWithoutPassword } = userToUse;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Login failed' });
    }
  });
}
