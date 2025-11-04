import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  uuid, 
  timestamp, 
  boolean, 
  integer, 
  numeric,
  jsonb,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["requester", "provider", "supplier", "admin"]);
export const urgencyEnum = pgEnum("urgency", ["normal", "emergency"]);
export const jobStatusEnum = pgEnum("job_status", [
  "open",
  "offered", 
  "accepted", 
  "enroute", 
  "onsite", 
  "completed", 
  "cancelled"
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  profilePhotoUrl: text("profile_photo_url"),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Suppliers table - NEW
export const suppliers = pgTable("suppliers", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  physicalAddress: text("physical_address").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactPosition: text("contact_position").notNull(),
  companyEmail: text("company_email").notNull(),
  companyPhone: text("company_phone").notNull(),
  industryType: text("industry_type").notNull(),
  ratingAverage: numeric("rating_average", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0).notNull(),
  specialOffer: text("special_offer"),
  featured: boolean("featured").default(false).notNull(),
  logo: text("logo"),
});

// Categories table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  description: text("description"),
  icon: text("icon"),
});

// Providers extended profile
export const providers = pgTable("providers", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name"),
  serviceCategories: jsonb("service_categories").notNull().$type<number[]>(),
  basePriceInfo: jsonb("base_price_info").$type<Record<string, any>>(),
  serviceAreaRadiusMeters: integer("service_area_radius_meters").default(10000).notNull(),
  averageResponseTimeSeconds: integer("average_response_time_seconds"),
  ratingAverage: numeric("rating_average", { precision: 3, scale: 2 }).default("0"),
  completedJobsCount: integer("completed_jobs_count").default(0).notNull(),
  verificationDocuments: jsonb("verification_documents").$type<string[]>(),
  isOnline: boolean("is_online").default(false).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
});

// Jobs table - UPDATED with budget and payment fields
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").references(() => users.id, { onDelete: "set null" }),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  photos: jsonb("photos").$type<string[]>().default([]),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  address: text("address"),
  urgency: urgencyEnum("urgency").default("normal").notNull(),
  preferredTime: timestamp("preferred_time"),
  status: jobStatusEnum("status").default("open").notNull(),
  budgetMin: numeric("budget_min", { precision: 10, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 10, scale: 2 }),
  providerCharge: numeric("provider_charge", { precision: 10, scale: 2 }),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
  priceAgreed: numeric("price_agreed", { precision: 10, scale: 2 }),
  pricePaid: numeric("price_paid", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table for chat
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  messageText: text("message_text").notNull(),
  attachments: jsonb("attachments").$type<string[]>(),
  voiceNoteUrl: text("voice_note_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ratings table
export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: uuid("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job Feedback table - NEW
export const jobFeedback = pgTable("job_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedbackText: text("feedback_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job Reports table - NEW
export const jobReports = pgTable("job_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Promotions table
export const promotions = pgTable("promotions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  providerId: uuid("provider_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  media: jsonb("media").$type<string[]>(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  providerProfile: one(providers, {
    fields: [users.id],
    references: [providers.userId],
  }),
  supplierProfile: one(suppliers, {
    fields: [users.id],
    references: [suppliers.userId],
  }),
  jobsAsRequester: many(jobs, { relationName: "requester" }),
  jobsAsProvider: many(jobs, { relationName: "provider" }),
  messagesSent: many(messages),
  ratingsGiven: many(ratings, { relationName: "ratingFrom" }),
  ratingsReceived: many(ratings, { relationName: "ratingTo" }),
  jobFeedback: many(jobFeedback),
  jobReports: many(jobReports),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
}));

export const providersRelations = relations(providers, ({ one }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  requester: one(users, {
    fields: [jobs.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  provider: one(users, {
    fields: [jobs.providerId],
    references: [users.id],
    relationName: "provider",
  }),
  category: one(categories, {
    fields: [jobs.categoryId],
    references: [categories.id],
  }),
  messages: many(messages),
  ratings: many(ratings),
  feedback: many(jobFeedback),
  reports: many(jobReports),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  job: one(jobs, {
    fields: [messages.jobId],
    references: [jobs.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  job: one(jobs, {
    fields: [ratings.jobId],
    references: [jobs.id],
  }),
  fromUser: one(users, {
    fields: [ratings.fromUserId],
    references: [users.id],
    relationName: "ratingFrom",
  }),
  toUser: one(users, {
    fields: [ratings.toUserId],
    references: [users.id],
    relationName: "ratingTo",
  }),
}));

export const jobFeedbackRelations = relations(jobFeedback, ({ one }) => ({
  job: one(jobs, {
    fields: [jobFeedback.jobId],
    references: [jobs.id],
  }),
  provider: one(users, {
    fields: [jobFeedback.providerId],
    references: [users.id],
  }),
}));

export const jobReportsRelations = relations(jobReports, ({ one }) => ({
  job: one(jobs, {
    fields: [jobReports.jobId],
    references: [jobs.id],
  }),
  reporter: one(users, {
    fields: [jobReports.reporterId],
    references: [users.id],
  }),
}));

// ============ SCHEMAS ============

// User Schemas
export const baseUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  passwordHash: true,
});

// Supplier signup schema
export const supplierSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  confirmPassword: z.string(),
  role: z.literal('supplier'),
  companyName: z.string().min(2),
  physicalAddress: z.string().min(5),
  contactPerson: z.string().min(2),
  contactPosition: z.string().min(2),
  companyEmail: z.string().email(),
  companyPhone: z.string().min(5),
  industryType: z.string().min(2),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Schema for signup request from frontend
export const createUserRequestSchema = z.union([
  baseUserSchema.extend({
    password: z.string().min(6),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }),
  supplierSignupSchema,
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
});

// Provider Schema
export const insertProviderSchema = createInsertSchema(providers).omit({
  userId: true,
});

// Supplier Schema
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  userId: true,
});

// Job Schema - UPDATED with budget fields
export const insertJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number().int().positive(),
  latitude: z.string(),
  longitude: z.string(),
  address: z.string().optional(),
  urgency: z.enum(["normal", "emergency"]).default("normal"),
  preferredTime: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return undefined;
    return val instanceof Date ? val : new Date(val);
  }),
  photos: z.array(z.string()).optional().default([]),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
});

// Message Schema
export const insertMessageSchema = z.object({
  jobId: z.string().uuid(),
  messageText: z.string().min(1, "Message cannot be empty"),
  attachments: z.array(z.string()).optional(),
  voiceNoteUrl: z.string().optional(),
});

// Rating Schema
export const insertRatingSchema = z.object({
  jobId: z.string().uuid(),
  toUserId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Job Feedback Schema - NEW
export const insertJobFeedbackSchema = z.object({
  jobId: z.string().uuid(),
  feedbackText: z.string().min(1, "Feedback cannot be empty"),
});

// Job Report Schema - NEW
export const insertJobReportSchema = z.object({
  jobId: z.string().uuid(),
  reason: z.string().min(10, "Please provide a detailed reason"),
});

// Provider Charge Schema - NEW
export const setProviderChargeSchema = z.object({
  providerCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
});

// Payment Confirmation Schema - NEW
export const confirmPaymentSchema = z.object({
  amountPaid: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
});

// Category Schema
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

// Update Job Status Schema
export const updateJobStatusSchema = z.object({
  status: z.enum(["open", "offered", "accepted", "enroute", "onsite", "completed", "cancelled"]),
});

// ============ TYPES ============

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;

export type JobFeedback = typeof jobFeedback.$inferSelect;
export type InsertJobFeedback = z.infer<typeof insertJobFeedbackSchema>;

export type JobReport = typeof jobReports.$inferSelect;
export type InsertJobReport = z.infer<typeof insertJobReportSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Promotion = typeof promotions.$inferSelect;

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UpdateJobStatus = z.infer<typeof updateJobStatusSchema>;
export type SetProviderCharge = z.infer<typeof setProviderChargeSchema>;
export type ConfirmPayment = z.infer<typeof confirmPaymentSchema>;
