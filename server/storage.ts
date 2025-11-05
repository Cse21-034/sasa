import { 
  users, 
  providers,
  suppliers,
  jobs, 
  messages, 
  ratings,
  categories,
  jobFeedback,
  jobReports,
  serviceAreaMigrations,
  type User, 
  type InsertUser,
  type Provider,
  type InsertProvider,
  type Supplier,
  type InsertSupplier,
  type Job,
  type InsertJob, 
  type Message,
  type InsertMessage,
  type Rating,
  type InsertRating,
  type JobFeedback,
  type InsertJobFeedback,
  type JobReport,
  type InsertJobReport,
  type ServiceAreaMigration,
  type InsertServiceAreaMigration,
  type Category,
  type InsertCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import { InferSelectModel } from 'drizzle-orm'; 

type JobWithRelations = Job & {
  requester: User;
  provider?: (User & { ratingAverage?: string; completedJobsCount?: number }) | null;
  category: Category;
};

type ProviderSearchResult = InferSelectModel<typeof providers> & {
  user: User;
};

type SupplierWithUser = Supplier & {
  user: User;
};

type MessageWithSender = Message & {
  sender: User;
};

type RatingWithFromUser = Rating & {
  fromUser: User;
};

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Providers
  getProvider(userId: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider & { userId: string }): Promise<Provider>;
  updateProvider(userId: string, data: Partial<Provider>): Promise<Provider | undefined>;
  updateProviderServiceArea(userId: string, primaryCity: string, primaryRegion?: string): Promise<Provider | undefined>;
  searchProviders(params: {
    categoryId?: number;
    city?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<ProviderSearchResult[]>;

  // Suppliers
  getSupplier(userId: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier & { userId: string }): Promise<Supplier>;
  updateSupplier(userId: string, data: Partial<Supplier>): Promise<Supplier | undefined>;
  getSuppliers(): Promise<SupplierWithUser[]>;

  // Service Area Migrations
  createServiceAreaMigration(migration: InsertServiceAreaMigration & { providerId: string }): Promise<ServiceAreaMigration>;
  getProviderMigrations(providerId: string): Promise<ServiceAreaMigration[]>;
  getPendingMigrations(): Promise<ServiceAreaMigration[]>;
  approveMigration(migrationId: string, reviewerId: string, notes?: string): Promise<ServiceAreaMigration | undefined>;
  rejectMigration(migrationId: string, reviewerId: string, notes?: string): Promise<ServiceAreaMigration | undefined>;

  // Jobs
  getJob(id: string): Promise<JobWithRelations | undefined>;
  getJobs(params: {
    categoryId?: string;
    status?: string;
    requesterId?: string;
    providerId?: string;
    city?: string;
  }): Promise<JobWithRelations[]>;
  getJobsByCity(cities: string[]): Promise<JobWithRelations[]>;
  createJob(job: InsertJob & { requesterId: string }): Promise<Job>;
  updateJob(id: string, data: Partial<Job>): Promise<Job | undefined>;
  acceptJob(jobId: string, providerId: string): Promise<Job | undefined>;
  setProviderCharge(jobId: string, charge: string): Promise<Job | undefined>;
  confirmPayment(jobId: string, amount: string): Promise<Job | undefined>;

  // Messages
  getMessages(jobId: string): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getConversations(userId: string): Promise<any[]>; 

  // Ratings
  createRating(rating: InsertRating & { fromUserId: string }): Promise<Rating>;
  getProviderRatings(providerId: string): Promise<RatingWithFromUser[]>;

  // Job Feedback
  createJobFeedback(feedback: InsertJobFeedback & { providerId: string }): Promise<JobFeedback>;
  getJobFeedback(jobId: string): Promise<JobFeedback[]>;

  // Job Reports
  createJobReport(report: InsertJobReport & { reporterId: string }): Promise<JobReport>;
  getJobReports(jobId: string): Promise<JobReport[]>;

  // Analytics
  getRequesterStats(requesterId: string): Promise<any>;
  getProviderStats(providerId: string): Promise<any>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // Providers
  async getProvider(userId: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider || undefined;
  }

  async createProvider(provider: InsertProvider & { userId: string }): Promise<Provider> {
    const [created] = await db.insert(providers).values(provider).returning();
    return created;
  }

  async updateProvider(userId: string, data: Partial<Provider>): Promise<Provider | undefined> {
    const [updated] = await db
      .update(providers)
      .set(data)
      .where(eq(providers.userId, userId))
      .returning();
    return updated || undefined;
  }

  async updateProviderServiceArea(userId: string, primaryCity: string, primaryRegion?: string): Promise<Provider | undefined> {
    const [updated] = await db
      .update(providers)
      .set({ 
        primaryCity, 
        primaryRegion,
      })
      .where(eq(providers.userId, userId))
      .returning();
    return updated || undefined;
  }

  async searchProviders(params: {
    categoryId?: number;
    city?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<ProviderSearchResult[]> {
    let query = db
      .select({
        userId: providers.userId,
        companyName: providers.companyName,
        serviceCategories: providers.serviceCategories,
        ratingAverage: providers.ratingAverage,
        completedJobsCount: providers.completedJobsCount,
        isOnline: providers.isOnline,
        latitude: providers.latitude,
        longitude: providers.longitude,
        primaryCity: providers.primaryCity,
        approvedServiceAreas: providers.approvedServiceAreas,
        user: users,
      })
      .from(providers)
      .leftJoin(users, eq(providers.userId, users.id))
      .where(eq(providers.isOnline, true));

    // Filter by city if provided
    if (params.city) {
      const results = await query;
      return results.filter(r => 
        r.approvedServiceAreas && 
        (r.approvedServiceAreas as string[]).includes(params.city!)
      ).map((r) => ({ ...r, user: r.user })) as ProviderSearchResult[];
    }

    const results = await query;
    return results.map((r) => ({ ...r, user: r.user })) as ProviderSearchResult[];
  }

  // Suppliers
  async getSupplier(userId: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.userId, userId));
    return supplier || undefined;
  }

  async createSupplier(supplier: InsertSupplier & { userId: string }): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  async updateSupplier(userId: string, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const [updated] = await db
      .update(suppliers)
      .set(data)
      .where(eq(suppliers.userId, userId))
      .returning();
    return updated || undefined;
  }

  async getSuppliers(): Promise<SupplierWithUser[]> {
    const results = await db
      .select({
        supplier: suppliers,
        user: users,
      })
      .from(suppliers)
      .leftJoin(users, eq(suppliers.userId, users.id));

    return results.map(r => ({
      ...r.supplier,
      user: r.user,
    })) as SupplierWithUser[];
  }

  // Service Area Migrations
  async createServiceAreaMigration(migration: InsertServiceAreaMigration & { providerId: string }): Promise<ServiceAreaMigration> {
    const [created] = await db.insert(serviceAreaMigrations).values(migration).returning();
    return created;
  }

  async getProviderMigrations(providerId: string): Promise<ServiceAreaMigration[]> {
    return await db
      .select()
      .from(serviceAreaMigrations)
      .where(eq(serviceAreaMigrations.providerId, providerId))
      .orderBy(desc(serviceAreaMigrations.createdAt));
  }

  async getPendingMigrations(): Promise<ServiceAreaMigration[]> {
    return await db
      .select()
      .from(serviceAreaMigrations)
      .where(eq(serviceAreaMigrations.status, 'pending'))
      .orderBy(desc(serviceAreaMigrations.createdAt));
  }

  async approveMigration(migrationId: string, reviewerId: string, notes?: string): Promise<ServiceAreaMigration | undefined> {
    const [migration] = await db
      .select()
      .from(serviceAreaMigrations)
      .where(eq(serviceAreaMigrations.id, migrationId));

    if (!migration) return undefined;

    // Add city to provider's approved service areas
    const provider = await this.getProvider(migration.providerId);
    if (provider) {
      const currentAreas = (provider.approvedServiceAreas as string[]) || [];
      if (!currentAreas.includes(migration.requestedCity)) {
        await db
          .update(providers)
          .set({
            approvedServiceAreas: [...currentAreas, migration.requestedCity],
          })
          .where(eq(providers.userId, migration.providerId));
      }
    }

    // Update migration status
    const [updated] = await db
      .update(serviceAreaMigrations)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      })
      .where(eq(serviceAreaMigrations.id, migrationId))
      .returning();

    return updated || undefined;
  }

  async rejectMigration(migrationId: string, reviewerId: string, notes?: string): Promise<ServiceAreaMigration | undefined> {
    const [updated] = await db
      .update(serviceAreaMigrations)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      })
      .where(eq(serviceAreaMigrations.id, migrationId))
      .returning();

    return updated || undefined;
  }

  // Jobs
  async getJob(id: string): Promise<JobWithRelations | undefined> {
    const [jobSelect] = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(eq(jobs.id, id));

    if (!jobSelect) return undefined;

    let provider = null;
    if (jobSelect.job.providerId) {
      const [providerData] = await db
        .select()
        .from(users)
        .where(eq(users.id, jobSelect.job.providerId));
      
      const [providerProfile] = await db
        .select()
        .from(providers)
        .where(eq(providers.userId, jobSelect.job.providerId));
      
      if (providerData) {
        provider = {
          ...providerData,
          ratingAverage: providerProfile?.ratingAverage || '0',
          completedJobsCount: providerProfile?.completedJobsCount || 0,
          isVerified: providerProfile?.isVerified || false,
        };
      }
    }

    return {
      ...jobSelect.job,
      requester: jobSelect.requester,
      provider,
      category: jobSelect.category,
    };
  }

  async getJobs(params: {
    categoryId?: string;
    status?: string;
    requesterId?: string;
    providerId?: string;
    city?: string;
  }): Promise<JobWithRelations[]> {
    const conditions = [];

    if (params.categoryId) conditions.push(eq(jobs.categoryId, parseInt(params.categoryId)));
    if (params.status) conditions.push(eq(jobs.status, params.status as Job['status']));
    if (params.requesterId) conditions.push(eq(jobs.requesterId, params.requesterId));
    if (params.providerId) conditions.push(eq(jobs.providerId, params.providerId));
    if (params.city) conditions.push(eq(jobs.city, params.city));

    const results = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt));

    return results.map((r) => ({
      ...r.job,
      requester: r.requester,
      category: r.category,
    })) as JobWithRelations[];
  }

  async getJobsByCity(cities: string[]): Promise<JobWithRelations[]> {
    if (!cities || cities.length === 0) return [];

    const results = await db
      .select({
        job: jobs,
        requester: users,
        category: categories,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .leftJoin(categories, eq(jobs.categoryId, categories.id))
      .where(sql`${jobs.city} = ANY(${cities})`)
      .orderBy(desc(jobs.createdAt));

    return results.map((r) => ({
      ...r.job,
      requester: r.requester,
      category: r.category,
    })) as JobWithRelations[];
  }

  async createJob(insertJob: InsertJob & { requesterId: string }): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updated || undefined;
  }

  async acceptJob(jobId: string, providerId: string): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ providerId, status: 'accepted', updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    return updated || undefined;
  }

  async setProviderCharge(jobId: string, charge: string): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ providerCharge: charge, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    return updated || undefined;
  }

  async confirmPayment(jobId: string, amount: string): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set({ amountPaid: amount, updatedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    return updated || undefined;
  }

  // Messages
  async getMessages(jobId: string): Promise<MessageWithSender[]> {
    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.jobId, jobId))
      .orderBy(asc(messages.createdAt));

    return results.map((r) => ({
      ...r.message,
      sender: r.sender,
    }));
  }

  async createMessage(insertMessage: InsertMessage & { senderId: string }): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getConversations(userId: string): Promise<any[]> {
    const userJobs = await db
      .select({
        job: jobs,
        requester: users,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.requesterId, users.id))
      .where(sql`${jobs.requesterId} = ${userId} OR ${jobs.providerId} = ${userId}`);

    const conversations = [];
    for (const { job, requester } of userJobs) {
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.jobId, job.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      if (lastMessage) {
        const otherUserId = job.requesterId === userId ? job.providerId : job.requesterId;
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId!));

        conversations.push({
          jobId: job.id,
          jobTitle: job.title,
          otherUser,
          lastMessage: lastMessage.messageText,
          lastMessageTime: lastMessage.createdAt,
          unreadCount: 0,
        });
      }
    }

    return conversations;
  }

  // Ratings
  async createRating(insertRating: InsertRating & { fromUserId: string }): Promise<Rating> {
    const [rating] = await db.insert(ratings).values(insertRating).returning();

    const providerRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.toUserId, insertRating.toUserId));

    const avgRating =
      providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length;

    await db
      .update(providers)
      .set({ ratingAverage: avgRating.toFixed(2).toString() })
      .where(eq(providers.userId, insertRating.toUserId));

    return rating;
  }

  async getProviderRatings(providerId: string): Promise<RatingWithFromUser[]> {
    const results = await db
      .select({
        rating: ratings,
        fromUser: users,
      })
      .from(ratings)
      .leftJoin(users, eq(ratings.fromUserId, users.id))
      .where(eq(ratings.toUserId, providerId))
      .orderBy(desc(ratings.createdAt));

    return results.map((r) => ({
      ...r.rating,
      fromUser: r.fromUser,
    }));
  }

  // Job Feedback
  async createJobFeedback(feedback: InsertJobFeedback & { providerId: string }): Promise<JobFeedback> {
    const [created] = await db.insert(jobFeedback).values(feedback).returning();
    return created;
  }

  async getJobFeedback(jobId: string): Promise<JobFeedback[]> {
    return await db.select().from(jobFeedback).where(eq(jobFeedback.jobId, jobId));
  }

  // Job Reports
  async createJobReport(report: InsertJobReport & { reporterId: string }): Promise<JobReport> {
    const [created] = await db.insert(jobReports).values(report).returning();
    return created;
  }

  async getJobReports(jobId: string): Promise<JobReport[]> {
    return await db.select().from(jobReports).where(eq(jobReports.jobId, jobId));
  }

  // Analytics
  async getRequesterStats(requesterId: string): Promise<any> {
    const userJobs = await db.select().from(jobs).where(eq(jobs.requesterId, requesterId));

    const totalJobs = userJobs.length;
    const completedJobs = userJobs.filter(j => j.status === 'completed').length;
    const totalSpent = userJobs
      .filter(j => j.amountPaid)
      .reduce((sum, j) => sum + parseFloat(j.amountPaid || '0'), 0);

    const jobsByCategory = userJobs.reduce((acc, job) => {
      const catId = job.categoryId.toString();
      acc[catId] = (acc[catId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalJobs,
      completedJobs,
      totalSpent,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      jobsByCategory,
      recentJobs: userJobs.slice(0, 10),
    };
  }

  async getProviderStats(providerId: string): Promise<any> {
    const providerJobs = await db.select().from(jobs).where(eq(jobs.providerId, providerId));

    const totalJobs = providerJobs.length;
    const completedJobs = providerJobs.filter(j => j.status === 'completed').length;
    const totalEarnings = providerJobs
      .filter(j => j.providerCharge)
      .reduce((sum, j) => sum + parseFloat(j.providerCharge || '0'), 0);

    const providerRatings = await db.select().from(ratings).where(eq(ratings.toUserId, providerId));

    const avgRating =
      providerRatings.length > 0
        ? providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length
        : 0;

    return {
      totalEarnings,
      completedJobs,
      averageRating: avgRating.toFixed(1),
      avgResponseTime: 12,
    };
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }
}

export const storage = new DatabaseStorage();