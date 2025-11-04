 import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import cors from "cors"; // Added for CORS support
import { storage } from "./storage";
import { authMiddleware, generateToken, type AuthRequest } from "./middleware/auth";
import { 
  createUserRequestSchema,
  insertJobSchema, 
  insertMessageSchema, 
  insertRatingSchema,
  updateProfileSchema,
  updateJobStatusSchema,
  // 👇 FIX: Added missing Zod schemas for validation
  setProviderChargeSchema,
  confirmPaymentSchema,
  insertJobFeedbackSchema,
  insertJobReportSchema,
} from "@shared/schema";
import { ZodError } from 'zod'; 

export async function registerRoutes(app: Express): Promise<Server> {
  // Add CORS middleware
  app.use(cors({
    origin: process.env.VERCEL_URL || 'https://sasa-indol.vercel.app', // Adjust to your frontend URL
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
  
  // REPLACE your existing /api/auth/signup route with this:

app.post('/api/auth/signup', async (req, res) => {
  try {
    const rawValidatedData = createUserRequestSchema.parse(req.body);
    const { password, confirmPassword, ...userData } = rawValidatedData;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Extract supplier-specific fields if role is supplier
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
      
      // Use baseUserData for user creation
      Object.keys(userData).forEach(key => {
        if (!(key in baseUserData)) {
          delete (userData as any)[key];
        }
      });
    }

    // Create user account
    const user = await storage.createUser({
      ...userData,
      passwordHash,
    });

    // Create role-specific profile
    if (user.role === 'provider') {
      await storage.createProvider({
        userId: user.id,
        serviceCategories: [],
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
    console.log('Received login request:', req.body); // Log request for debugging
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        console.error('Login failed: Missing email or password', { email });
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.error('Login failed: User not found', { email });
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        console.error('Login failed: Invalid password', { email });
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      console.log('Login successful:', { userId: user.id, email });
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message || 'Login failed' });
    }
  });

  // ==================== JOB ROUTES ====================

  // In server/routes.ts - Update the GET /api/jobs endpoint

app.get('/api/jobs', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { category, status, sort } = req.query;
    const params: any = {};
    
    if (category && category !== 'all') {
      params.categoryId = category as string;
    }
    if (status) {
      params.status = status as string;
    }

    // IMPORTANT: Filter jobs based on user role
    if (req.user!.role === 'requester') {
      // Requesters only see their own jobs
      params.requesterId = req.user!.id;
    } else if (req.user!.role === 'provider') {
      // Providers see all open jobs and jobs assigned to them
      // This is handled in the storage layer below
      params.providerId = req.user!.id;
    }
    // Admins see all jobs (no filter added)

    let jobs = await storage.getJobs(params);

    // If provider, also include open jobs they can accept
    if (req.user!.role === 'provider') {
      const openJobs = await storage.getJobs({ status: 'open' });
      // Merge and deduplicate
      const jobMap = new Map();
      [...jobs, ...openJobs].forEach(job => {
        if (!jobMap.has(job.id)) {
          jobMap.set(job.id, job);
        }
      });
      jobs = Array.from(jobMap.values());
    }

    // Sort based on query parameter
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
      jobs = jobs.sort(() => Math.random() - 0.5);
    }

    res.json(jobs);
  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Also update GET /api/jobs/:id to ensure user can only access their own jobs
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
    
    if (req.user!.role === 'provider' && 
        job.providerId !== req.user!.id && 
        job.status !== 'open') {
      return res.status(403).json({ message: 'Access denied' });
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

  app.post('/api/jobs/:id/accept', authMiddleware, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'provider') {
        return res.status(403).json({ message: 'Only providers can accept jobs' });
      }

      const job = await storage.acceptJob(req.params.id, req.user!.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found or already accepted' });
      }

      res.json(job);
    } catch (error: any) {
      console.error('Accept job error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROVIDER ROUTES ====================

  app.get('/api/providers', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { categoryId, latitude, longitude, radius } = req.query;
      const params: any = {};
      if (categoryId) params.categoryId = parseInt(categoryId as string);
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

    // FIX: setProviderChargeSchema is now imported
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

    // FIX: confirmPaymentSchema is now imported
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

    // FIX: insertJobFeedbackSchema is now imported
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
