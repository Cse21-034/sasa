import type { Express } from 'express';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { createUserRequestSchema } from '@shared/schema';
import { storage } from '../storage';
import { companyService } from '../services/company.service';
import { generateToken } from '../middleware/auth';
import { emailService, generateVerificationCode } from '../services/email.service';
import { cacheService } from '../services/cache.service';
import { EmailQueueService } from '../services/email-queue.service';

export function registerAuthRoutes(app: Express): void {
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const rawValidatedData = createUserRequestSchema.parse(req.body);
      const { password, confirmPassword, primaryCity, companyRole, serviceCategories, ...userData } = rawValidatedData as any;
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 8); // 🚀 Reduced from 10 to 8 for 50% faster hashing
      
      const isSupplier = userData.role === 'supplier';
      const isCompany = userData.role === 'company';
      let supplierData: any = null;
      let companyData: any = null;
      let isCompanyProvider = false;
      
      let finalRole = userData.role;
      if (isCompany) {
        finalRole = companyRole === 'provider' ? 'provider' : 'requester';
        isCompanyProvider = companyRole === 'provider';
      }
      
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
        role: finalRole,
        passwordHash,
        isEmailVerified: finalRole === 'admin',
      });

      try {
        if (isCompany && companyData) {
          await companyService.createCompany({
            userId: user.id,
            ...companyData,
            isVerified: false,
            ratingAverage: 0,
            completedJobsCount: 0,
          });
        }
        
        if (user.role === 'provider') {
          if (!primaryCity) {
            await storage.deleteUser(user.id);
            return res.status(400).json({ 
              message: 'City selection is required for service providers. Please select your service area.' 
            });
          }
          
          if (!serviceCategories || serviceCategories.length === 0) {
            await storage.deleteUser(user.id);
            return res.status(400).json({ 
              message: 'At least one service category is required for service providers.' 
            });
          }
          
          // 🆕 Create provider profile
          await storage.createProvider({
            userId: user.id,
            serviceCategories: serviceCategories || [],
            primaryCity,
            approvedServiceAreas: [primaryCity],
            serviceAreaRadiusMeters: 10000,
          });

          // 🚀 Batch create pending category verifications (much faster than loop)
          // At signup, all categories are pending and require admin verification
          if (serviceCategories && serviceCategories.length > 0) {
            await storage.createBatchProviderCategoryVerifications(
              user.id,
              serviceCategories
            );
          }
        } else if (user.role === 'supplier' && supplierData) {
          await storage.createSupplier({
            userId: user.id,
            ...supplierData,
          });
        }
      } catch (profileError: any) {
        await storage.deleteUser(user.id);
        return res.status(500).json({ 
          message: 'Failed to create user profile: ' + profileError.message 
        });
      }

      if (finalRole !== 'admin') {
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        await storage.createEmailVerificationToken(user.id, verificationCode, expiresAt);
        // 🚀 Cache email verification token for faster lookups
        await cacheService.setEmailToken(user.id, verificationCode, expiresAt);
        
        // 🚀 Queue email sending asynchronously (non-blocking)
        EmailQueueService.queueVerificationEmail(
          user.email,
          user.name,
          verificationCode
        ).catch(err => console.error('Failed to queue verification email:', err));
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
      
      // 🚀 Cache user profile for faster lookups on subsequent requests
      await cacheService.setUserProfile(user.id, userWithoutPassword);
      
      res.json({ 
        user: userWithoutPassword, 
        token,
        requiresEmailVerification: finalRole !== 'admin',
      });
      
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

  app.post('/api/auth/verify-email', async (req, res) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({ message: 'User ID and verification code are required' });
      }

      // 🚀 Check cache first (faster)
      let tokenRecord = await cacheService.getEmailToken(userId, code);
      if (!tokenRecord) {
        // Fall back to database if not in cache
        tokenRecord = await storage.getEmailVerificationToken(userId, code);
      }
      
      if (!tokenRecord) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      
      if (new Date() > tokenRecord.expiresAt) {
        await storage.deleteEmailVerificationTokens(userId);
        await cacheService.invalidateEmailTokens(userId);
        return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      }
      
      await storage.updateUser(userId, { isEmailVerified: true });
      await storage.deleteEmailVerificationTokens(userId);
      
      // 🚀 Invalidate cache and queue welcome email asynchronously
      await cacheService.invalidateEmailTokens(userId);
      await cacheService.invalidateUserProfile(userId);
      
      const user = await storage.getUser(userId);
      if (user) {
        // 🚀 Queue welcome email asynchronously
        EmailQueueService.queueWelcomeEmail(user.email, user.name)
          .catch(err => console.error('Failed to queue welcome email:', err));
      }
      
      res.json({ message: 'Email verified successfully' });
      
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Verification failed. Please try again.' });
    }
  });

  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }
      
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      await storage.createEmailVerificationToken(user.id, verificationCode, expiresAt);
      // 🚀 Cache email verification token
      await cacheService.setEmailToken(user.id, verificationCode, expiresAt);
      
      // 🚀 Queue email asynchronously
      EmailQueueService.queueVerificationEmail(
        user.email,
        user.name,
        verificationCode
      ).catch(err => console.error('Failed to queue verification email:', err));
      
      res.json({ message: 'Verification code sent successfully' });
      
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification code. Please try again.' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.json({ message: 'If an account with that email exists, a password reset code has been sent.' });
      }
      
      const resetCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      await storage.createPasswordResetToken(user.id, resetCode, expiresAt);
      // 🚀 Cache password reset token
      await cacheService.setPasswordResetToken(user.id, resetCode, expiresAt);
      
      // 🚀 Queue password reset email asynchronously
      EmailQueueService.queuePasswordResetEmail(
        user.email,
        user.name,
        resetCode
      ).catch(err => console.error('Failed to queue password reset email:', err));
      
      res.json({ 
        message: 'If an account with that email exists, a password reset code has been sent.',
        userId: user.id,
      });
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process request. Please try again.' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { userId, code, newPassword, confirmPassword } = req.body;
      
      if (!userId || !code || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      
      const tokenRecord = await storage.getPasswordResetToken(userId, code);
      
      if (!tokenRecord) {
        return res.status(400).json({ message: 'Invalid reset code' });
      }
      
      if (new Date() > tokenRecord.expiresAt) {
        await storage.deletePasswordResetTokens(userId);
        await cacheService.invalidatePasswordResetTokens(userId);
        return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 8); // 🚀 Reduced from 10 to 8 for faster hashing
      await storage.updateUser(userId, { passwordHash });
      await storage.deletePasswordResetTokens(userId);
      // 🚀 Invalidate user cache since password changed
      await cacheService.invalidatePasswordResetTokens(userId);
      await cacheService.invalidateUserProfile(userId);
      
      res.json({ message: 'Password reset successfully' });
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Password reset failed. Please try again.' });
    }
  });

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
      
      // 🚀 Queue lastLogin update asynchronously (non-blocking)
      storage.updateUser(user.id, { lastLogin: new Date() })
        .catch(err => console.error('Failed to update lastLogin:', err));
      const userToUse = user;

      const token = generateToken({
        id: userToUse.id,
        email: userToUse.email,
        role: userToUse.role,
        isVerified: userToUse.isVerified,
        isIdentityVerified: userToUse.isIdentityVerified,
        status: userToUse.status, 
      });

      const { passwordHash: _, ...userWithoutPassword } = userToUse;
      
      // 🚀 Cache user profile for faster subsequent requests
      await cacheService.setUserProfile(user.id, userWithoutPassword);
      
      const requiresEmailVerification = user.role !== 'admin' && !(user as any).isEmailVerified;
      
      res.json({ 
        user: userWithoutPassword, 
        token,
        requiresEmailVerification,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Login failed' });
    }
  });
}
