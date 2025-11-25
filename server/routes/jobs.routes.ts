import type { Express } from 'express';
import { ZodError } from 'zod';
import { insertJobSchema, updateJobStatusSchema } from '@shared/schema';
import { storage } from '../storage';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

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
      
      if (req.user!.role === 'requester' || req.user!.role === 'company') {
        // Requesters and companies only see their own jobs
        const params: any = { requesterId: req.user!.id };
        if (category && category !== 'all') params.categoryId = category as string;
        if (status) params.status = status as string;
        
        const jobs = await storage.getJobs(params);
        res.json(jobs);
      } else if (req.user!.role === 'provider') {
        // 🆕 ENHANCED: Filter by provider's selected service categories
        const provider = await storage.getProvider(req.user!.id);
        if (!provider) {
          return res.status(404).json({ message: 'Provider profile not found' });
        }

        const approvedCities = (provider.approvedServiceAreas as string[]) || [provider.primaryCity];
        const serviceCategories = (provider.serviceCategories as number[]) || [];

        // Get open jobs in approved cities
        const openJobs = await storage.getJobsByCity(approvedCities);
        
        // 🆕 Filter by service categories if provider has selected any
        const openJobsFiltered = openJobs.filter(j => {
          const matchesStatus = j.status === 'open';
          const matchesCategory = serviceCategories.length === 0 || 
            serviceCategories.includes(j.categoryId);
          return matchesStatus && matchesCategory;
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
        if (status) {
          jobs = jobs.filter(j => j.status === status);
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
        }

        res.json(jobs);
      } else {
        // Admin sees all jobs
        const jobs = await storage.getJobs({});
        res.json(jobs);
      }
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

      // Check permissions based on role
      if ((req.user!.role === 'requester' || req.user!.role === 'company') && job.requesterId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (req.user!.role === 'provider') {
        const provider = await storage.getProvider(req.user!.id);
        const approvedCities = (provider?.approvedServiceAreas as string[]) || [provider?.primaryCity];

        const isAssigned = job.providerId === req.user!.id;
        const isAvailableOpenJob = job.status === 'open' && approvedCities.includes(job.city);
        
        if (!isAssigned && !isAvailableOpenJob) {
          return res.status(403).json({ message: 'Access denied to this job' });
        }
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
   * Accept a job as a provider
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
}
