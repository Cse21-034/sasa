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
  insertVerificationSubmissionSchema, 
  updateVerificationStatusSchema, 
  updateUserStatusSchema, 
  insertSupplierPromotionSchema, 
  updateSupplierProfileSchema,
} from "@shared/schema";
import { ZodError } from 'zod'; 
import { NextFunction, Response } from "express"; 
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowedOrigins = isDevelopment 
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    : [process.env.VERCEL_URL || 'https://sasa-indol.vercel.app'];
  
  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const httpServer = createServer(app);

  // ==================== VERIFICATION MIDDLEWARE (MOVED TO TOP) ====================
  // 🔥 FIX: Define verifyAccess BEFORE using it
  const verifyAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Admins always have access
    if (req.user!.role === 'admin') {
      return next();
    }
    
    // Check the user status - if blocked, deny access
    if (req.user!.status !== 'active') {
        return res.status(403).json({
            message: 'Access denied. Your account is currently blocked or deactivated.',
            code: 'ACCOUNT_BLOCKED' 
        });
    }

    // Check the isVerified flag from the token payload
    if (!req.user!.isVerified) {
      return res.status(403).json({
        message: 'Access denied. Account is not fully verified. Please complete verification steps.',
        code: 'NOT_VERIFIED' 
      });
    }
    next();
  };

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket, req) => {
    let userId: string | null = null;
    let userRole: string | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          userId = data.userId;
          userRole = data.userRole;
          if (userId) {
            clients.set(userId, ws);
            
            // Send unread count on connection
            const unreadCount = await storage.getUnreadMessageCount(userId);
            ws.send(JSON.stringify({ 
              type: 'unread_count', 
              payload: { count: unreadCount } 
            }));
          }
        } else if (data.type === 'message' && userId) {
          const msg = await storage.createMessage({
            ...data.payload,
            senderId: userId,
          });

          // Determine receiver(s)
          let receiverIds: string[] = [];
          
          if (data.payload.messageType === 'admin_message') {
            if (data.payload.receiverId) {
              receiverIds = [data.payload.receiverId];
            }
          } else if (data.payload.jobId) {
            const job = await storage.getJob(data.payload.jobId);
            if (job) {
              const otherUserId = job.requesterId === userId ? job.providerId : job.requesterId;
              if (otherUserId) receiverIds = [otherUserId];
            }
          }

          // Send to all receivers
          for (const receiverId of receiverIds) {
            if (clients.has(receiverId)) {
              const receiverWs = clients.get(receiverId);
              if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({ 
                  type: 'message', 
                  payload: msg 
                }));
                
                const unreadCount = await storage.getUnreadMessageCount(receiverId);
                receiverWs.send(JSON.stringify({ 
                  type: 'unread_count', 
                  payload: { count: unreadCount } 
                }));
              }
            }
          }
          
          ws.send(JSON.stringify({ 
            type: 'message_sent', 
            payload: msg 
          }));
        } else if (data.type === 'mark_read' && userId) {
          await storage.markMessageAsRead(data.payload.messageId, userId);
          
          const unreadCount = await storage.getUnreadMessageCount(userId);
          ws.send(JSON.stringify({ 
            type: 'unread_count', 
            payload: { count: unreadCount } 
          }));
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

  // ==================== MESSAGE ROUTES ====================

  app.get('/api/messages/unread-count', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/messages/:messageId/read', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.messageId, req.user!.id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found or not authorized' });
      }
      
      res.json(message);
    } catch (error: any) {
      console.error('Mark message read error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/messages/job/:jobId/read-all', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      await storage.markAllMessagesRead(req.params.jobId, req.user!.id);
      
      const unreadCount = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ success: true, unreadCount });
    } catch (error: any) {
      console.error('Mark all messages read error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // FIX: Admin Chat - Get all messages between Admin and target User (Used by both admin and reporter)
  app.get('/api/admin/messages/:userId', authMiddleware, async (req: AuthRequest, res) => {
    
    // Authorization: User must be Admin OR the ID requested must be their own ID.
    if (req.user!.role !== 'admin' && req.user!.id !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied: Cannot view other users\' admin chats.' });
    }
    
    try {
      const targetUserId = req.user!.role === 'admin' ? req.params.userId : req.user!.id; // Use self ID if not admin
      const adminUser = await storage.getAdminUser();

      if (!adminUser) {
           return res.status(500).json({ message: 'System Admin account required to fetch chat.' });
      }
      
      // Use the dedicated storage method to fetch only messages exchanged between admin and target user
      const messages = await storage.getAdminChatMessages(adminUser.id, targetUserId); 
      res.json(messages);
    } catch (error: any) {
      console.error('Get admin messages error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Reporter: Send a private message to Admin (using static path to avoid UUID conflict)
  app.post('/api/messages/admin-chat', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
        const validatedData = insertMessageSchema.partial().parse(req.body);

        const adminUser = await storage.getAdminUser(); 
        
        if (!adminUser) {
            return res.status(500).json({ message: 'System Admin not found.' });
        }

        const message = await storage.createMessage({
            messageText: validatedData.messageText,
            senderId: req.user!.id,
            receiverId: adminUser.id, // Explicitly target the Admin
            messageType: 'admin_message',
            // Note: jobId is null here, relying on sender/receiverId
        });

        // Notify Admin via WebSocket (if client is open)
        if (clients.has(adminUser.id)) {
            const adminWs = clients.get(adminUser.id);
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                adminWs.send(JSON.stringify({ 
                    type: 'message', 
                    payload: message 
                }));
                const unreadCount = await storage.getUnreadMessageCount(adminUser.id);
                adminWs.send(JSON.stringify({ 
                    type: 'unread_count', 
                    payload: { count: unreadCount } 
                }));
            }
        }
        
        res.status(201).json(message);
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
            });
        }
        console.error('Reporter send admin message error:', error);
        res.status(400).json({ message: error.message });
    }
  });

  // Reporter: Mark all Admin messages as read
  app.post('/api/messages/admin-chat/read-all', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
        // Mark messages where the current user is the receiver and the sender is the Admin
        await storage.markAllAdminMessagesRead(req.user!.id);
        
        const unreadCount = await storage.getUnreadMessageCount(req.user!.id);
        res.json({ success: true, unreadCount });
    } catch (error: any) {
        console.error('Mark all admin messages read error:', error);
        res.status(500).json({ message: error.message });
    }
  });


  // Admin Chat - Get list of users Admin has conversations with
  app.get('/api/admin/conversations', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    try {
      const conversations = await storage.getAdminConversations();
      res.json(conversations);
    } catch (error: any) {
      console.error('Get admin conversations error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Chat - Send a message from Admin to a target user
  app.post('/api/admin/messages', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    try {
      const validatedData = insertMessageSchema.partial().parse(req.body);
      
      if (!validatedData.receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required for admin messages' });
      }
      
      const message = await storage.createMessage({
        ...validatedData as any,
        senderId: req.user!.id,
        messageType: 'admin_message',
      });

      if (clients.has(validatedData.receiverId)) {
        const receiverWs = clients.get(validatedData.receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({ 
            type: 'message', 
            payload: message 
          }));
          
          const unreadCount = await storage.getUnreadMessageCount(validatedData.receiverId);
          receiverWs.send(JSON.stringify({ 
            type: 'unread_count', 
            payload: { count: unreadCount } 
          }));
        }
      }

      res.status(201).json(message);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Admin send message error:', error);
      res.status(400).json({ message: error.message });
    }
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


  // ==================== JOB ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.get('/api/jobs', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.get('/api/jobs/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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
        const provider = await storage.getProvider(req.user!.id);
        const approvedCities = (provider?.approvedServiceAreas as string[]) || [provider?.primaryCity];

        // Access is granted if assigned OR job is open and in an approved city
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

  // 🆕 Added verifyAccess
  app.post('/api/jobs', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
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

  // 🆕 Added verifyAccess
  app.post('/api/jobs/:id/accept', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // ==================== SERVICE AREA MIGRATION ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.post('/api/provider/migration-request', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.get('/api/provider/migrations', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // Admin: Get pending migrations (No verifyAccess needed, but checks for admin role)
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

  // Admin: Approve migration (No verifyAccess needed, but checks for admin role)
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

  // Admin: Reject migration (No verifyAccess needed, but checks for admin role)
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

  // 🆕 Added verifyAccess
  app.patch('/api/provider/service-area', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // ==================== PROVIDER ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.get('/api/providers', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.get('/api/provider/stats', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.get('/api/provider/recent-jobs', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // ==================== MESSAGE ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.get('/api/messages/conversations', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error: any) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // 🆕 Added verifyAccess
  app.get('/api/messages/:jobId', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      // NOTE: This endpoint handles job chat and expects a UUID. 
      const messages = await storage.getMessages(req.params.jobId);
      res.json(messages);
    } catch (error: any) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Reporter: Static GET route for Admin chat
  app.get('/api/messages/admin-chat', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    // This effectively routes to the same logic as /api/admin/messages/:userId with self-ID
     try {
      const adminUser = await storage.getAdminUser();

      if (!adminUser) {
           return res.status(500).json({ message: 'System Admin account required to fetch chat.' });
      }
      
      const messages = await storage.getAdminChatMessages(adminUser.id, req.user!.id); 
      res.json(messages);
    } catch (error: any) {
      console.error('Get reporter admin chat messages error:', error);
      res.status(500).json({ message: error.message });
    }
  });


  // 🆕 Added verifyAccess
  app.post('/api/messages', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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
  
  // Reporter: Send a private message to Admin (using static path to avoid UUID conflict)
  app.post('/api/messages/admin-chat', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
        // We only allow messageText here, forcing receiver to be Admin and type to be admin_message
        const { messageText } = insertMessageSchema.partial().parse(req.body);

        const adminUser = await storage.getAdminUser(); 
        
        if (!adminUser) {
            return res.status(500).json({ message: 'System Admin not found.' });
        }

        const message = await storage.createMessage({
            messageText,
            senderId: req.user!.id,
            receiverId: adminUser.id, // Explicitly target the Admin
            messageType: 'admin_message',
        });

        // Notify Admin via WebSocket (if client is open)
        if (clients.has(adminUser.id)) {
            const adminWs = clients.get(adminUser.id);
            if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                adminWs.send(JSON.stringify({ 
                    type: 'message', 
                    payload: message 
                }));
                const unreadCount = await storage.getUnreadMessageCount(adminUser.id);
                adminWs.send(JSON.stringify({ 
                    type: 'unread_count', 
                    payload: { count: unreadCount } 
                }));
            }
        }
        
        res.status(201).json(message);
    } catch (error: any) {
        if (error instanceof ZodError) {
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
            });
        }
        console.error('Reporter send admin message error:', error);
        res.status(400).json({ message: error.message });
    }
  });

  // Reporter: Mark all Admin messages as read
  app.post('/api/messages/admin-chat/read-all', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
        // Mark messages where the current user is the receiver and the sender is the Admin
        await storage.markAllAdminMessagesRead(req.user!.id);
        
        const unreadCount = await storage.getUnreadMessageCount(req.user!.id);
        res.json({ success: true, unreadCount });
    } catch (error: any) {
        console.error('Mark all admin messages read error:', error);
        res.status(500).json({ message: error.message });
    }
  });

  // ==================== PROFILE ROUTES (Not Protected as verification starts here) ====================

 app.patch('/api/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    
    // Log what we're trying to update (for debugging)
    console.log('Updating profile for user:', req.user!.id);
    console.log('Update data keys:', Object.keys(validatedData));
    console.log('Has profilePhotoUrl:', !!validatedData.profilePhotoUrl);
    
    const updated = await storage.updateUser(req.user!.id, validatedData);

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = updated;
    
    // Return the updated user (must send a new token to keep status fresh)
    res.json({ 
      ...userWithoutPassword,
      token: generateToken(userWithoutPassword)
    });
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

  // ==================== ENHANCED PROFILE ROUTES - PROTECTED BY verifyAccess ====================

// 🆕 Added verifyAccess
app.get('/api/provider/profile', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can access this' });
    }

    const provider = await storage.getProvider(req.user!.id);
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(provider);
  } catch (error: any) {
    console.error('Get provider profile error:', error);
    res.status(500).json({ message: error.message });
  }
});

// 🆕 Added verifyAccess
app.patch('/api/provider/categories', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can update categories' });
    }

    const { serviceCategories } = req.body;

    if (!Array.isArray(serviceCategories)) {
      return res.status(400).json({ message: 'Service categories must be an array' });
    }

    const updated = await storage.updateProvider(req.user!.id, {
      serviceCategories,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Update categories error:', error);
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

  // ==================== RATING ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.post('/api/ratings', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.get('/api/ratings/:providerId', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const ratings = await storage.getProviderRatings(req.params.providerId);
      res.json(ratings);
    } catch (error: any) {
      console.error('Get ratings error:', error);
      res.status(500).json({ message: error.message });
    }
  });


  // ==================== SUPPLIER ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess (for getting Supplier list - important for requesters)
  app.get('/api/suppliers', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error: any) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // 🆕 NEW: Get single supplier details by ID
  app.get('/api/suppliers/:id/details', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      // Get supplier promotions
      const promotions = await storage.getSupplierPromotions(req.params.id);
      
      res.json({
        ...supplier,
        promotions: promotions.filter(p => p.isActive), // Only return active promotions
      });
    } catch (error: any) {
      console.error('Get supplier detail error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/supplier/profile - Get supplier profile
  app.get('/api/supplier/profile', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      if (req.user!.role !== 'supplier') {
        return res.status(403).json({ message: 'Only suppliers can access this' });
      }

      const supplier = await storage.getSupplier(req.user!.id);
      
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier profile not found' });
      }

      res.json(supplier);
    } catch (error: any) {
      console.error('Get supplier profile error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/supplier/profile - Update supplier profile
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


  // ==================== SUPPLIER PROMOTIONS ROUTES - PROTECTED BY verifyAccess (NEW) ====================

// GET /api/supplier/promotions (Used by client/src/pages/supplier/dashboard.tsx)
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

// POST /api/supplier/promotions (Used by client/src/pages/supplier/dashboard.tsx)
// 🚨 THIS FIXES THE "unexpected token '<'" ERROR
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

// PATCH /api/supplier/promotions/:id
app.patch('/api/supplier/promotions/:id', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'supplier') {
      return res.status(403).json({ message: 'Only suppliers can update promotions' });
    }
    
    // Note: Using insertSupplierPromotionSchema.partial() to allow partial updates
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

// DELETE /api/supplier/promotions/:id
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
  
  // ==================== JOB PAYMENT ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.post('/api/jobs/:id/set-charge', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.post('/api/jobs/:id/confirm-payment', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // ==================== JOB FEEDBACK ROUTES - PROTECTED BY verifyAccess ====================

  // 🆕 Added verifyAccess
  app.post('/api/jobs/:id/feedback', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

  // 🆕 Added verifyAccess
  app.get('/api/jobs/:id/feedback', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
    try {
      const feedback = await storage.getJobFeedback(req.params.id);
      res.json(feedback);
    } catch (error: any) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== JOB REPORT ROUTES - PROTECTED BY verifyAccess ====================

// 🆕 Added verifyAccess
app.post('/api/jobs/:id/report', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
  try {
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

// ==================== ANALYTICS/REPORTS ROUTES - PROTECTED BY verifyAccess ====================

// 🆕 Added verifyAccess
app.get('/api/reports/requester', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

// 🆕 Added verifyAccess
app.get('/api/reports/provider', authMiddleware, verifyAccess, async (req: AuthRequest, res) => {
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

// ==================== VERIFICATION ROUTES (NEW) ====================

// 🆕 POST /api/verification/submit - Submit identity or document verification
app.post('/api/verification/submit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Note: No verifyAccess is needed here as this is the action to GET verified

    const validatedData = insertVerificationSubmissionSchema.parse(req.body);

    if (validatedData.type === 'identity' && validatedData.documents.length < 2) {
      return res.status(400).json({ message: 'Identity verification requires ID and Selfie photos.' });
    }
    
    // Check file size (A very rough estimate since we're using base64: 3MB limit for combined payload)
    const payloadSize = req.rawBody ? Buffer.byteLength(req.rawBody as any, 'utf8') : 0;
    if (payloadSize > 3 * 1024 * 1024) {
      return res.status(400).json({ message: 'Total payload size exceeds 3MB limit. Please reduce image quality/size.' });
    }

    const submission = await storage.createVerificationSubmission({
      ...validatedData,
      userId: req.user!.id,
    });
    
    const updatedUser = await storage.getUser(req.user!.id);
    
    // AUTO-APPROVE IDENTITY FOR REQUIESTERS:
    if (submission.type === 'identity' && updatedUser!.role === 'requester') {
        const approvedSubmission = await storage.updateVerificationSubmissionStatus(
            submission.id, 
            'approved', 
            'system' // System approval
        );
        
        const finalUser = await storage.getUser(req.user!.id); // Get user with final status
        const { passwordHash: _, ...userWithoutPassword } = finalUser!;
        
        // Overwrite token data on the client immediately for seamless flow
        return res.status(200).json({ 
          message: 'Identity Verified Automatically. Access Granted.',
          submission: approvedSubmission,
          user: userWithoutPassword,
          token: generateToken(userWithoutPassword) // Resend new token with updated status
        });
    }

    res.status(201).json({ 
      message: `${validatedData.type} submission received. Status is pending.`, 
      submission 
    });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
    }
    console.error('Verification submission error:', error);
    res.status(500).json({ message: error.message || 'Submission failed' });
  }
});


// 🆕 GET /api/verification/status - Get current verification status
app.get('/api/verification/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const identity = await storage.getVerificationSubmission(req.user!.id, 'identity');
        const document = (req.user!.role === 'provider' || req.user!.role === 'supplier') 
            ? await storage.getVerificationSubmission(req.user!.id, 'document')
            : null;
            
        // Return latest status from DB, but rely on token for protected access checks
        const userStatus = await storage.getUser(req.user!.id);

        res.json({
            isIdentityVerified: userStatus?.isIdentityVerified,
            isVerified: userStatus?.isVerified,
            identitySubmission: identity,
            documentSubmission: document,
            role: req.user!.role
        });
    } catch (error: any) {
        console.error('Get verification status error:', error);
        res.status(500).json({ message: error.message || 'Failed to get verification status' });
    }
});


// ==================== ADMIN MANAGEMENT ROUTES (NEW) ====================

// 🆕 GET /api/admin/users - List all users
app.get('/api/admin/users', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    try {
      const { role, status, search } = req.query;
      const usersList = await storage.getUsers({ 
        role: role as string, 
        status: status as string, 
        search: search as string 
      });
      res.json(usersList);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ message: error.message || 'Failed to list users' });
    }
});

// 🆕 PATCH /api/admin/users/:id/update-status - Block/Deactivate User
app.patch('/api/admin/users/:id/update-status', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const validatedData = updateUserStatusSchema.parse(req.body);
      const updatedUser = await storage.updateUserStatus(req.params.id, validatedData.status);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
      }
      
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        });
      }
      console.error('Update user status error:', error);
      res.status(500).json({ message: error.message || 'Failed to update user status' });
    }
});

// 🆕 GET /api/admin/reports - List all job reports
app.get('/api/admin/reports', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    try {
      const statusParam = req.query.status as string | undefined;
      let filterStatus: 'resolved' | 'unresolved' | undefined;
      
      if (statusParam === 'resolved') {
        filterStatus = 'resolved';
      } else if (statusParam === 'unresolved') {
        filterStatus = 'unresolved';
      }
      
      const reports = await storage.getJobReports({ status: filterStatus });
      
      console.log(`Admin fetching reports with status: ${filterStatus || 'all'}, found: ${reports.length}`);
      
      res.json(reports);
    } catch (error: any) {
      console.error('Get admin reports error:', error);
      res.status(500).json({ message: error.message || 'Failed to list reports' });
    }
});

// 🆕 PATCH /api/admin/reports/:id/resolve - Resolve a report
app.patch('/api/admin/reports/:id/resolve', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    try {
      const updated = await storage.resolveJobReport(req.params.id);

      if (!updated) {
         return res.status(404).json({ message: 'Report not found.' });
      }

      res.json(updated);
    } catch (error: any) {
      console.error('Resolve report error:', error);
      res.status(500).json({ message: error.message || 'Failed to resolve report' });
    }
});


// 🆕 GET /api/admin/analytics - Get platform-wide analytics
app.get('/api/admin/analytics', authMiddleware, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    try {
      const analytics = await storage.getAdminJobAnalytics();
      res.json(analytics);
    } catch (error: any) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: error.message || 'Failed to get analytics' });
    }
});

// ==================== ADMIN VERIFICATION ROUTES (EXISTING, KEPT FOR COMPLETENESS) ====================

// 🆕 GET /api/admin/verification/pending - List pending submissions
app.get('/api/admin/verification/pending', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  try {
    const pending = await storage.getPendingVerificationSubmissions();
    res.json(pending);
  } catch (error: any) {
    console.error('Get pending verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to list pending verifications' });
  }
});

// 🆕 PATCH /api/admin/verification/:id/update-status - Approve/Reject submission
app.patch('/api/admin/verification/:id/update-status', authMiddleware, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const validatedData = updateVerificationStatusSchema.parse(req.body);
    
    const updatedSubmission = await storage.updateVerificationSubmissionStatus(
      req.params.id,
      validatedData.status,
      req.user!.id,
      validatedData.rejectionReason
    );
    
    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }
    
    // IMPORTANT: Return the new full user object and token if approved/rejected
    const finalUser = await storage.getUser(updatedSubmission.userId);
    const { passwordHash: _, ...userWithoutPassword } = finalUser!;

    res.json({
        message: `Submission ${updatedSubmission.status}`,
        submission: updatedSubmission,
        user: userWithoutPassword,
        token: generateToken(userWithoutPassword) // Send new token with updated status
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      });
    }
    console.error('Update verification status error:', error);
    res.status(500).json({ message: error.message || 'Failed to update verification status' });
  }
});


  return httpServer;
}
