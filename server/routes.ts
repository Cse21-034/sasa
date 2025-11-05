import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import cors from "cors";
import { storage } from "./storage";
import { authMiddleware, generateToken, type AuthRequest } from "./middleware/auth";
import { 
  createUserRequestSchema,
  insertJobSchema, 
  insertMessageSchema, 
  insertRatingSchema,
  updateProfileSchema,
  updateJobStatusSchema,
  setProviderChargeSchema,
  confirmPaymentSchema,
  insertJobFeedbackSchema,
  insertJobReportSchema,
  insertServiceAreaMigrationSchema,
  updateProviderServiceAreaSchema,
} from "@shared/schema";
import { ZodError } from 'zod'; 

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors({
    origin: process.env.VERCEL_URL || 'https://sasa-indol.vercel.app',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    let userId: string | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          userId = data.userId;
          if (userId) {
            clients.set(userId, ws);
          }
        } else if (data.type === 'message' && userId) {
          const msg = await storage.createMessage({
            ...data.payload,
            senderId: userId,
          });

          const job = await storage.getJob(data.payload.jobId);
          const otherUserId = job.requesterId === userId ? job.providerId : job.requesterId;

          if (otherUserId && clients.has(otherUserId)) {
            const otherWs = clients.get(otherUserId);
            if (otherWs && otherWs.readyState === WebSocket.OPEN) {
              otherWs.send(JSON.stringify({ type: 'message', payload: msg }));
            }
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  // ==================== AUTH ROUTES ====================
  
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
      let supplierData: any = null;
      
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
      }

      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Create role-specific profile
      if (user.role === 'provider') {
        if (!primaryCity) {
          return res.status(400).json({ message: 'City is required for service providers' });
        }
        
        await storage.createProvider({
          userId: user.id,
          serviceCategories: [],
          primaryCity,
          approvedServiceAreas: [primaryCity], // Initially just their primary city
          serviceAreaRadiusMeters: 10000,
        });
      } else if (user.role === 'supplier' && supplierData) {
        await storage.createSupplier({
          userId: user.id,
          ...supplierData,
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Signup error:', error);
      res.status(400).json({ message: error.message || 'Signup failed' });
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

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Login failed' });
    }
  });

  // ==================== JOB ROUTES ====================

  // 🆕 UPDATED: Get jobs with city-based filtering for providers
  app.get('/api/jobs', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { category, status, sort } = req.query;
      
      if (req.user!.role === 'requester') {
        // Requesters only see their own jobs
        const params: any = { requesterId: req.user!.id };
        if (category && category !== 'all') params.categoryId = category as string;
        if (status) params.status = status as string;
        
        const jobs = await storage.getJobs(params);
        res.json(jobs);
      } else if (req.user!.role === 'provider') {
        // Providers see:
        // 1. Jobs in their approved service areas (open jobs)
        // 2. Jobs they are assigned to (any status)
        
        const provider = await storage.getProvider(req.user!.id);
        if (!provider) {
          return res.status(404).json({ message: 'Provider profile not found' });
        }

        const approvedCities = (provider.approvedServiceAreas as string[]) || [provider.primaryCity];
        
        // Get open jobs in approved cities
        const openJobs = await storage.getJobsByCity(approvedCities);
        const openJobsFiltered = openJobs.filter(j => j.status === 'open');
        
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

        // Apply filters
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

  app.get('/api/jobs/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check permissions based on role
      if (req.user!.role === 'requester' && job.requesterId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (req.user!.role === 'provider') {
        // Provider can see if:
        // 1. They are assigned to it
        // 2. It's open and in their approved service areas
        if (job.providerId !== req.user!.id && job.status !== 'open') {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        if (job.status === 'open') {
          const provider = await storage.getProvider(req.user!.id);
          const approvedCities = (provider?.approvedServiceAreas as string[]) || [provider?.primaryCity];
          
          if (!approvedCities.includes(job.city)) {
            return res.status(403).json({ message: 'This job is not in your service area' });
          }
        }
      }

      res.json(job);
    } catch (error: any) {
      console.error('Get job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/jobs', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'requester') {
        return res.status(403).json({ message: 'Only requesters can post jobs' });
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

  app.patch('/api/jobs/:id', authMiddleware, async (req: AuthRequest, res) => {
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

  // 🆕 UPDATED: Accept job with city validation
  app.post('/api/jobs/:id/accept', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can accept jobs' });
      }

      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check if job is in provider's approved service areas
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

  // ==================== SERVICE AREA MIGRATION ROUTES ====================

  // 🆕 Request migration to new service area
  app.post('/api/provider/migration-request', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can request migrations' });
      }

      const validatedData = insertServiceAreaMigrationSchema.parse(req.body);
      
      // Check if already approved for this city
      const provider = await storage.getProvider(req.user!.id);
      const approvedCities = (provider?.approvedServiceAreas as string[]) || [];
      
      if (approvedCities.includes(validatedData.requestedCity)) {
        return res.status(400).json({ message: 'You are already approved to work in this city' });
      }

      const migration = await storage.createServiceAreaMigration({
        ...validatedData,
        providerId: req.user!.id,
      });

      res.status(201).json(migration);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Migration request error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get provider's migration requests
  app.get('/api/provider/migrations', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can view migrations' });
      }

      const migrations = await storage.getProviderMigrations(req.user!.id);
      res.json(migrations);
    } catch (error: any) {
      console.error('Get migrations error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Get pending migrations
  app.get('/api/admin/migrations/pending', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const migrations = await storage.getPendingMigrations();
      res.json(migrations);
    } catch (error: any) {
      console.error('Get pending migrations error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Approve migration
  app.post('/api/admin/migrations/:id/approve', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { notes } = req.body;
      const migration = await storage.approveMigration(req.params.id, req.user!.id, notes);

      if (!migration) {
        return res.status(404).json({ message: 'Migration request not found' });
      }

      res.json(migration);
    } catch (error: any) {
      console.error('Approve migration error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Reject migration
  app.post('/api/admin/migrations/:id/reject', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { notes } = req.body;
      const migration = await storage.rejectMigration(req.params.id, req.user!.id, notes);

      if (!migration) {
        return res.status(404).json({ message: 'Migration request not found' });
      }

      res.json(migration);
    } catch (error: any) {
      console.error('Reject migration error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // 🆕 Update provider's primary service area
  app.patch('/api/provider/service-area', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can update service area' });
      }

      const validatedData = updateProviderServiceAreaSchema.parse(req.body);
      const updated = await storage.updateProviderServiceArea(
        req.user!.id,
        validatedData.primaryCity,
        validatedData.primaryRegion
      );

      if (!updated) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      res.json(updated);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update service area error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROVIDER ROUTES ====================

  app.get('/api/providers', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { categoryId, city, latitude, longitude, radius } = req.query;
      const params: any = {};
      if (categoryId) params.categoryId = parseInt(categoryId as string);
      if (city) params.city = city as string;
      if (latitude) params.latitude = parseFloat(latitude as string);
      if (longitude) params.longitude = parseFloat(longitude as string);
      if (radius) params.radius = parseInt(radius as string);

      const providers = await storage.searchProviders(params);
      res.json(providers);
    } catch (error: any) {
      console.error('Get providers error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/provider/stats', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can access stats' });
      }

      const stats = await storage.getProviderStats(req.user!.id);
      res.json(stats);
    } catch (error: any) {
      console.error('Get provider stats error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/provider/recent-jobs', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can access this' });
      }

      const jobs = await storage.getJobs({ providerId: req.user!.id });
      const recentJobs = jobs.slice(0, 10);
      res.json(recentJobs);
    } catch (error: any) {
      console.error('Get recent jobs error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== MESSAGE ROUTES ====================

  app.get('/api/messages/conversations', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error: any) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/messages/:jobId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getMessages(req.params.jobId);
      res.json(messages);
    } catch (error: any) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage({
        ...validatedData,
        senderId: req.user!.id,
      });

      res.status(201).json(message);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Create message error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== PROFILE ROUTES ====================

  app.patch('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await storage.updateUser(req.user!.id, validatedData);

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { passwordHash: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update profile error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== CATEGORY ROUTES ====================

  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== RATING ROUTES ====================

  app.post('/api/ratings', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating({
        ...validatedData,
        fromUserId: req.user!.id,
      });

      res.json(rating);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Create rating error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/ratings/:providerId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const ratings = await storage.getProviderRatings(req.params.providerId);
      res.json(ratings);
    } catch (error: any) {
      console.error('Get ratings error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== SUPPLIER ROUTES ====================

  app.get('/api/suppliers', async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error: any) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== JOB PAYMENT ROUTES ====================

  app.post('/api/jobs/:id/set-charge', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can set charges' });
      }

      const { providerCharge } = setProviderChargeSchema.parse(req.body);
      const job = await storage.setProviderCharge(req.params.id, providerCharge);

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
      console.error('Set charge error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/jobs/:id/confirm-payment', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'requester') {
        return res.status(403).json({ message: 'Only requesters can confirm payment' });
      }

      const { amountPaid } = confirmPaymentSchema.parse(req.body);
      const job = await storage.confirmPayment(req.params.id, amountPaid);

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
      console.error('Confirm payment error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== JOB FEEDBACK ROUTES ====================

  app.post('/api/jobs/:id/feedback', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can submit feedback' });
      }

      const validatedData = insertJobFeedbackSchema.parse(req.body);
      const feedback = await storage.createJobFeedback({
        ...validatedData,
        providerId: req.user!.id,
      });

      res.json(feedback);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Submit feedback error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/jobs/:id/feedback', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const feedback = await storage.getJobFeedback(req.params.id);
      res.json(feedback);
    } catch (error: any) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== JOB REPORT ROUTES ====================
// ==================== JOB REPORT ROUTES (ADD THESE) ====================

app.post('/api/jobs/:id/report', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // FIX: insertJobReportSchema is now imported
    const validatedData = insertJobReportSchema.parse(req.body);
    const report = await storage.createJobReport({
      ...validatedData,
      reporterId: req.user!.id,
    });

    res.json(report);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
    }
    console.error('Submit report error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ANALYTICS/REPORTS ROUTES (ADD THESE) ====================

app.get('/api/reports/requester', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'requester') {
      return res.status(403).json({ message: 'Only requesters can access this' });
    }

    const stats = await storage.getRequesterStats(req.user!.id);
    res.json(stats);
  } catch (error: any) {
    console.error('Get requester stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reports/provider', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can access this' });
    }

    const stats = await storage.getProviderStats(req.user!.id);
    res.json(stats);
  } catch (error: any) {
    console.error('Get provider stats error:', error);
    res.status(500).json({ message: error.message });
  }
});
  return httpServer;
}