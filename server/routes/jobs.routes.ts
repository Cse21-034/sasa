import type { Express } from 'express';
import { ZodError } from 'zod';
import { insertJobSchema, updateJobStatusSchema, insertJobApplicationSchema, selectProviderSchema } from '@shared/schema';
import { storage } from '../storage';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { companyService } from '../services/company.service';

/**
 * SOLID Principle: Single Responsibility
 * This module handles ONLY job-related routes (CRUD, accept, etc.)
 */

// Injected from main registerRoutes function
let verifyAccess: any;

export function registerJobRoutes(app: Express, injectedVerifyAccess: any): void {
  verifyAccess = injectedVerifyAccess;

  /**
   * GET /api/jobs
   * Get jobs based on user role (requester, provider, or admin)
   */
  app.get('/api/jobs', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const { category, status, sort } = req.query;
      
      // Check if user has a provider profile
      const providerProfile = await storage.getProvider(req.user!.id);
      
      // Determine if user should see provider view
      const isProvider = req.user!.role === 'provider' || 
                        (req.user!.role === 'company' && providerProfile);
      
      if (!isProvider && req.user!.role !== 'admin') {
        // Requesters and company requesters (without provider profile) only see their own jobs
        const params: any = { requesterId: req.user!.id };
        if (category && category !== 'all') params.categoryId = category as string;
        if (status) params.status = status as string;
        
        const jobs = await storage.getJobs(params);
        return res.json(jobs);
      }
      
      if (isProvider && providerProfile) {
        // Provider view (individual or company provider)
        const provider = providerProfile;
        
        // Determine provider type (company or individual)
        const providerType = req.user!.role === 'company' ? 'company' : 'individual';
        const approvedCities = (provider.approvedServiceAreas as string[]) || [provider.primaryCity];
        const serviceCategories = (provider.serviceCategories as number[]) || [];

        // Get open AND pending_selection jobs in approved cities
        const openJobs = await storage.getJobsByCity(approvedCities);
        
        // Filter by service categories, status, AND allowedProviderType
        const openJobsFiltered = openJobs.filter(j => {
          // Include open jobs AND pending_selection jobs
          const matchesStatus = j.status === 'open' || j.status === 'pending_selection';
          const matchesCategory = serviceCategories.length === 0 || 
            serviceCategories.includes(j.categoryId);
          
          // Filter by allowedProviderType
          const jobProviderType = (j as any).allowedProviderType || 'both';
          const matchesProviderType = jobProviderType === 'both' || 
            jobProviderType === providerType;
          
          return matchesStatus && matchesCategory && matchesProviderType;
        });
        
        // Get jobs assigned to this provider
        const assignedJobs = await storage.getJobs({ providerId: req.user!.id });
        
        // Merge and deduplicate
        const jobMap = new Map();
        [...openJobsFiltered, ...assignedJobs].forEach(job => {
          if (!jobMap.has(job.id)) {
            jobMap.set(job.id, job);
          }
        });
        
        let jobs = Array.from(jobMap.values());

        // Apply additional filters
        if (category && category !== 'all') {
          jobs = jobs.filter(j => j.categoryId === parseInt(category as string));
        }
        
        if (status && status !== 'all') {
          if (status === 'open' || status === 'browsing') {
            jobs = jobs.filter(j => j.status === 'open' || j.status === 'pending_selection');
          } else if (status === 'pending_selection') {
            jobs = jobs.filter(j => j.status === 'pending_selection');
          } else {
            jobs = jobs.filter(j => j.status === status);
          }
        }

        // Sort
        if (sort === 'urgent') {
          jobs = jobs.sort((a, b) => {
            if (a.urgency === 'emergency' && b.urgency !== 'emergency') return -1;
            if (a.urgency !== 'emergency' && b.urgency === 'emergency') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        } else if (sort === 'recent') {
          jobs = jobs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (sort === 'distance') {
          // For distance sorting, you would need provider location
          // This is a placeholder - implement actual distance calculation if needed
          jobs = jobs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        return res.json(jobs);
      }
      
      // Admin sees all jobs
      const jobs = await storage.getJobs({});
      res.json(jobs);
    } catch (error: any) {
      console.error('Get jobs error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/jobs/:id
   * Get a single job by ID with access control
   */
  app.get('/api/jobs/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user has a provider profile
      const providerProfile = await storage.getProvider(req.user!.id);
      const hasProviderProfile = !!providerProfile;
      const isCompanyProvider = req.user!.role === 'company' && hasProviderProfile;
      const shouldSeeProviderView = req.user!.role === 'provider' || isCompanyProvider;

      // Requesters and company requesters (without provider profile) can only see their own jobs
      if (!shouldSeeProviderView && job.requesterId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Check access for providers (individual or company providers)
      if (providerProfile) {
        const approvedCities = (providerProfile.approvedServiceAreas as string[]) || [providerProfile.primaryCity];
        
        // Check if provider is a company provider
        const isCompany = isCompanyProvider;

        const isAssigned = job.providerId === req.user!.id;
        const isAvailableJob = (job.status === 'open' || job.status === 'pending_selection') && 
          approvedCities.includes(job.city);
        
        // Check provider type filter
        const providerType = (job as any).allowedProviderType || 'both';
        const matchesProviderType = providerType === 'both' || 
          (isCompany && providerType === 'company') ||
          (!isCompany && providerType === 'individual');
        
        if (!isAssigned && (!isAvailableJob || !matchesProviderType)) {
          return res.status(403).json({ message: 'Access denied to this job' });
        }
      } else if (req.user!.role === 'provider') {
        // Provider role but no provider profile
        return res.status(404).json({ message: 'Provider profile not found' });
      }

      res.json(job);
    } catch (error: any) {
      console.error('Get job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/jobs
   * Create a new job (requesters and companies only)
   */
  app.post('/api/jobs', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'requester' && req.user!.role !== 'company') {
        return res.status(403).json({ message: 'Only requesters and companies can post jobs' });
      }

      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob({
        ...validatedData,
        requesterId: req.user!.id,
      });

      res.status(201).json(job);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Create job error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  /**
   * PUT /api/jobs/:id
   * Update a job (requester only)
   */
  app.put('/api/jobs/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Only requester can update their job
      if (job.requesterId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Only the job requester can update this job' });
      }

      // Parse and validate update data
      const validatedData = insertJobSchema.partial().parse(req.body);
      const updatedJob = await storage.updateJob(req.params.id, validatedData);

      if (!updatedJob) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json(updatedJob);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * PATCH /api/jobs/:id
   * Update job status
   */
  app.patch('/api/jobs/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = updateJobStatusSchema.parse(req.body);
      const job = await storage.updateJob(req.params.id, validatedData);

      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json(job);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/jobs/:id/accept
   * Accept a job as a provider (legacy - kept for backward compatibility)
   * Note: New flow uses /api/jobs/:id/apply
   */
  app.post('/api/jobs/:id/accept', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can accept jobs' });
      }

      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const provider = await storage.getProvider(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: 'Provider profile not found' });
      }

      const approvedCities = (provider.approvedServiceAreas as string[]) || [provider.primaryCity];
      if (!approvedCities.includes(job.city)) {
        return res.status(403).json({ 
          message: `This job is in ${job.city}. You can only accept jobs in: ${approvedCities.join(', ')}. Apply for migration to work in other cities.` 
        });
      }

      const acceptedJob = await storage.acceptJob(req.params.id, req.user!.id);
      
      if (!acceptedJob) {
        return res.status(404).json({ message: 'Job not found or already accepted' });
      }

      res.json(acceptedJob);
    } catch (error: any) {
      console.error('Accept job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * DELETE /api/jobs/:id
   * Delete a job (requester only)
   */
  app.delete('/api/jobs/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Only requester can delete their job
      if (job.requesterId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Only the job requester can delete this job' });
      }

      const deleted = await storage.deleteJob(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json({ message: 'Job deleted successfully' });
    } catch (error: any) {
      console.error('Delete job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // =====================================================
  // JOB APPLICATION ROUTES (Multi-provider selection system)
  // =====================================================

  /**
   * POST /api/jobs/:id/apply
   * Apply to a job as a provider (new multi-provider flow)
   * Max 4 providers can apply to a single job
   */
  app.post('/api/jobs/:id/apply', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // Allow both individual providers and companies with provider profiles
      const isProvider = req.user!.role === 'provider' || 
                        (req.user!.role === 'company' && await storage.getProvider(req.user!.id));
      
      if (!isProvider) {
        return res.status(403).json({ message: 'Only providers can apply for jobs' });
      }

      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      if (job.status !== 'open' && job.status !== 'pending_selection') {
        return res.status(400).json({ message: 'This job is no longer accepting applications' });
      }

      const provider = await storage.getProvider(req.user!.id);
      if (!provider) {
        return res.status(404).json({ message: 'Provider profile not found' });
      }

      const approvedCities = (provider.approvedServiceAreas as string[]) || [provider.primaryCity];
      if (!approvedCities.includes(job.city)) {
        return res.status(403).json({ 
          message: `This job is in ${job.city}. You can only apply for jobs in: ${approvedCities.join(', ')}.` 
        });
      }

      const { message } = req.body;
      const application = await storage.applyToJob(req.params.id, req.user!.id, message);
      
      if (!application) {
        const hasApplied = await storage.hasProviderApplied(req.params.id, req.user!.id);
        if (hasApplied) {
          return res.status(400).json({ message: 'You have already applied to this job' });
        }
        return res.status(400).json({ message: 'This job has reached the maximum number of applicants (4)' });
      }

      res.status(201).json({ 
        message: 'Application submitted successfully. Please wait for the requester to select a provider.',
        application 
      });
    } catch (error: any) {
      console.error('Apply to job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/jobs/:id/applications
   * Get all applications for a job (requester only)
   */
  app.get('/api/jobs/:id/applications', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      if (job.requesterId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Only the job requester can view applications' });
      }

      const applications = await storage.getJobApplications(req.params.id);
      res.json(applications);
    } catch (error: any) {
      console.error('Get job applications error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/jobs/:id/application-status
   * Check if current provider has applied to this job
   */
  app.get('/api/jobs/:id/application-status', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // Allow both individual providers and companies with provider profiles
      const isProvider = req.user!.role === 'provider' || 
                        (req.user!.role === 'company' && await storage.getProvider(req.user!.id));
      
      if (!isProvider) {
        return res.status(403).json({ message: 'Only providers can check application status' });
      }

      const hasApplied = await storage.hasProviderApplied(req.params.id, req.user!.id);
      const applicationCount = await storage.getJobApplicationCount(req.params.id);
      
      res.json({ 
        hasApplied, 
        applicationCount,
        maxApplications: 4,
        canApply: !hasApplied && applicationCount < 4
      });
    } catch (error: any) {
      console.error('Get application status error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/jobs/:id/select-provider
   * Select a provider from applications (requester only)
   */
  app.post('/api/jobs/:id/select-provider', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      if (job.requesterId !== req.user!.id) {
        return res.status(403).json({ message: 'Only the job requester can select a provider' });
      }

      if (job.status !== 'pending_selection') {
        return res.status(400).json({ message: 'This job is not in the selection phase' });
      }

      const validatedData = selectProviderSchema.parse(req.body);
      const updatedJob = await storage.selectProvider(validatedData.applicationId, req.user!.id);
      
      if (!updatedJob) {
        return res.status(400).json({ message: 'Failed to select provider. Application may not exist.' });
      }

      res.json({ 
        message: 'Provider selected successfully. The job has been assigned.',
        job: updatedJob 
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Select provider error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * GET /api/provider/applications
   * Get all applications for the current provider
   */
  app.get('/api/provider/applications', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // Allow both individual providers and companies with provider profiles
      const isProvider = req.user!.role === 'provider' || 
                        (req.user!.role === 'company' && await storage.getProvider(req.user!.id));
      
      if (!isProvider) {
        return res.status(403).json({ message: 'Only providers can view their applications' });
      }

      const applications = await storage.getProviderApplications(req.user!.id);
      res.json(applications);
    } catch (error: any) {
      console.error('Get provider applications error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * DELETE /api/applications/:id
   * Withdraw an application (provider only)
   */
  app.delete('/api/applications/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // Allow both individual providers and companies with provider profiles
      const isProvider = req.user!.role === 'provider' || 
                        (req.user!.role === 'company' && await storage.getProvider(req.user!.id));
      
      if (!isProvider) {
        return res.status(403).json({ message: 'Only providers can withdraw applications' });
      }

      const success = await storage.withdrawApplication(req.params.id, req.user!.id);
      
      if (!success) {
        return res.status(400).json({ message: 'Application not found or cannot be withdrawn' });
      }

      res.json({ message: 'Application withdrawn successfully' });
    } catch (error: any) {
      console.error('Withdraw application error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/jobs/:id/start
   * Start working on a job (provider only)
   */
  app.post('/api/jobs/:id/start', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user is the assigned provider
      if (job.providerId !== req.user!.id) {
        return res.status(403).json({ message: 'Only the assigned provider can start this job' });
      }

      if (job.status !== 'accepted') {
        return res.status(400).json({ message: 'Job must be in accepted status to start' });
      }

      const updatedJob = await storage.updateJob(req.params.id, { status: 'enroute' });
      res.json(updatedJob);
    } catch (error: any) {
      console.error('Start job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/jobs/:id/complete
   * Mark a job as completed (provider only)
   */
  app.post('/api/jobs/:id/complete', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user is the assigned provider
      if (job.providerId !== req.user!.id) {
        return res.status(403).json({ message: 'Only the assigned provider can complete this job' });
      }

      if (!['enroute', 'onsite'].includes(job.status)) {
        return res.status(400).json({ message: 'Job must be in progress to complete' });
      }

      const { providerCharge, notes } = req.body;
      const updateData: any = { status: 'completed' };
      
      if (providerCharge) {
        updateData.providerCharge = providerCharge;
      }
      
      const updatedJob = await storage.updateJob(req.params.id, updateData);
      res.json(updatedJob);
    } catch (error: any) {
      console.error('Complete job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * POST /api/jobs/:id/cancel
   * Cancel a job (requester or provider)
   */
  app.post('/api/jobs/:id/cancel', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if user has permission to cancel
      const isRequester = job.requesterId === req.user!.id;
      const isProvider = job.providerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isRequester && !isProvider && !isAdmin) {
        return res.status(403).json({ message: 'Only the requester, assigned provider, or admin can cancel this job' });
      }

      if (['completed', 'cancelled'].includes(job.status)) {
        return res.status(400).json({ message: 'Job cannot be cancelled in its current status' });
      }

      const { reason } = req.body;
      const updatedJob = await storage.updateJob(req.params.id, { 
        status: 'cancelled',
        cancellationReason: reason || 'No reason provided'
      });

      res.json(updatedJob);
    } catch (error: any) {
      console.error('Cancel job error:', error);
      res.status(500).json({ message: error.message });
    }
  });
}
