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
export const providerTypeEnum = pgEnum("provider_type", ["individual", "company", "both"]);
export const jobStatusEnum = pgEnum("job_status", [
  "open",
  "pending_selection",
  "offered", 
  "accepted", 
  "enroute", 
  "onsite", 
  "completed", 
  "cancelled"
]);

export const jobApplicationStatusEnum = pgEnum("job_application_status", [
  "pending",
  "selected",
  "rejected"
]);
// 🆕 User Status Enum
export const userStatusEnum = pgEnum("user_status", ["active", "blocked", "deactivated"]);

// Migration status enum
export const migrationStatusEnum = pgEnum("migration_status", ["pending", "approved", "rejected"]);

// 🆕 Verification Enums
export const verificationTypeEnum = pgEnum("verification_type", ["identity", "document"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);

export const messageTypeEnum = pgEnum("message_type", ["job_message", "admin_message", "system_notification"]);

// 🆕 Notification Type Enum
export const notificationTypeEnum = pgEnum("notification_type", ["job_posted", "job_accepted", "application_received", "application_accepted", "application_rejected"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  phoneCountryCode: text("phone_country_code").default("+267"), // Default to Botswana
  phoneCountry: text("phone_country").default("Botswana"),
  passwordHash: text("password_hash").notNull(),
  profilePhotoUrl: text("profile_photo_url"),
  bio: text("bio"),
  isVerified: boolean("is_verified").default(false).notNull(),
  isIdentityVerified: boolean("is_identity_verified").default(false).notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  status: userStatusEnum("status").default("active").notNull(), 
  preferredLanguage: text("preferred_language").default("en").notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  physicalAddress: text("physical_address").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactPosition: text("contact_position").notNull(),
  companyEmail: text("company_email").notNull(),
  companyPhone: text("company_phone").notNull(),
  companyPhoneCountryCode: text("company_phone_country_code").default("+267"),
  companyPhoneCountry: text("company_phone_country").default("Botswana"),
  industryType: text("industry_type").notNull(),
  ratingAverage: numeric("rating_average", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0).notNull(),
  specialOffer: text("special_offer"),
  featured: boolean("featured").default(false).notNull(),
  logo: text("logo"),
    websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  whatsappNumber: text("whatsapp_number"),
  aboutUs: text("about_us"),
});

// Supplier Promotions table
export const supplierPromotions = pgTable("supplier_promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  discountPercentage: integer("discount_percentage"),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  termsAndConditions: text("terms_and_conditions"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 🆕 Companies table (for company requesters and company service providers)
export const companies = pgTable("companies", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  taxNumber: text("tax_number"),
  physicalAddress: text("physical_address").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactPosition: text("contact_position").notNull(),
  companyEmail: text("company_email").notNull(),
  companyPhone: text("company_phone").notNull(),
  companyPhoneCountryCode: text("company_phone_country_code").default("+267"),
  companyPhoneCountry: text("company_phone_country").default("Botswana"),
  companyWebsite: text("company_website"),
  industryType: text("industry_type").notNull(),
  numberOfEmployees: integer("number_of_employees"),
  yearsInBusiness: integer("years_in_business"),
  businessLicense: text("business_license"), // Document URL
  registrationCertificate: text("registration_certificate"), // Document URL
  bankDetails: jsonb("bank_details").$type<{ bankName: string; accountNumber: string; accountHolder: string }>(),
  logo: text("logo"),
  ratingAverage: numeric("rating_average", { precision: 3, scale: 2 }).default("0"),
  completedJobsCount: integer("completed_jobs_count").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  description: text("description"),
  icon: text("icon"),
});

// Providers extended profile with service areas
export const providers = pgTable("providers", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name"),
  serviceCategories: jsonb("service_categories").notNull().$type<number[]>(),
  basePriceInfo: jsonb("base_price_info").$type<Record<string, any>>(),
  serviceAreaRadiusMeters: integer("service_area_radius_meters").default(10000).notNull(),
  // Primary service city/area
  primaryCity: text("primary_city").notNull(),
  primaryRegion: text("primary_region"),
  // Approved service areas (array of cities)
  approvedServiceAreas: jsonb("approved_service_areas").default([]).$type<string[]>(),
  averageResponseTimeSeconds: integer("average_response_time_seconds"),
  ratingAverage: numeric("rating_average", { precision: 3, scale: 2 }).default("0"),
  completedJobsCount: integer("completed_jobs_count").default(0).notNull(),
  verificationDocuments: jsonb("verification_documents").$type<string[]>(),
  isOnline: boolean("is_online").default(false).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
});

// Service Area Migration Requests table
export const serviceAreaMigrations = pgTable("service_area_migrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestedCity: text("requested_city").notNull(),
  requestedRegion: text("requested_region"),
  reason: text("reason").notNull(),
  status: migrationStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table for chat
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }), // Made nullable for admin messages
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").references(() => users.id, { onDelete: "cascade" }), // New: explicit receiver
  messageText: text("message_text").notNull(),
  messageType: messageTypeEnum("message_type").default("job_message").notNull(),
  attachments: jsonb("attachments").$type<string[]>(),
  voiceNoteUrl: text("voice_note_url"),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageThreads = pgTable("message_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  reportId: uuid("report_id").references(() => jobReports.id, { onDelete: "cascade" }),
  participants: jsonb("participants").$type<string[]>().notNull(), // Array of user IDs
  subject: text("subject"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
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

// Job Feedback table
export const jobFeedback = pgTable("job_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedbackText: text("feedback_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Job Reports table
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

// 🆕 Verification Submissions table
export const verificationSubmissions = pgTable("verification_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: verificationTypeEnum("type").notNull(), // 'identity' or 'document'
  documents: jsonb("documents").$type<{ name: string; url: string }[]>().default([]).notNull(), // Base64 strings are stored here
  status: verificationStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jobs table (defined later due to referencing other tables)
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
    // City and region for filtering
    city: text("city").notNull(),
    region: text("region"),
    urgency: urgencyEnum("urgency").default("normal").notNull(),
    preferredTime: timestamp("preferred_time"),
    startDate: timestamp("start_date"),
    expiryDate: timestamp("expiry_date"),
    status: jobStatusEnum("status").default("open").notNull(),
    budgetMin: numeric("budget_min", { precision: 10, scale: 2 }),
    budgetMax: numeric("budget_max", { precision: 10, scale: 2 }),
    providerCharge: numeric("provider_charge", { precision: 10, scale: 2 }),
    amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
    priceAgreed: numeric("price_agreed", { precision: 10, scale: 2 }),
    pricePaid: numeric("price_paid", { precision: 10, scale: 2 }),
    allowedProviderType: providerTypeEnum("allowed_provider_type").default("both").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

// Job Applications table (for multi-provider selection system)
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: jobApplicationStatusEnum("status").default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 🆕 Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  migrationRequests: many(serviceAreaMigrations),
  verificationSubmissions: many(verificationSubmissions),
  jobApplications: many(jobApplications),
  notifications: many(notifications),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
}));

// Relations
export const supplierPromotionsRelations = relations(supplierPromotions, ({ one }) => ({
  supplier: one(users, {
    fields: [supplierPromotions.supplierId],
    references: [users.id],
  }),
}));

// Add to suppliers relations
export const suppliersRelationsExtended = relations(suppliers, ({ one, many }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
  promotions: many(supplierPromotions),
}));

export const providersRelations = relations(providers, ({ one }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
}));

export const serviceAreaMigrationsRelations = relations(serviceAreaMigrations, ({ one }) => ({
  provider: one(users, {
    fields: [serviceAreaMigrations.providerId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [serviceAreaMigrations.reviewedBy],
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
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, {
    fields: [jobApplications.jobId],
    references: [jobs.id],
  }),
  provider: one(users, {
    fields: [jobApplications.providerId],
    references: [users.id],
  }),
}));

// 🆕 Notifications Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [notifications.jobId],
    references: [jobs.id],
  }),
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

// 🆕 Verification Submissions Relations
export const verificationSubmissionsRelations = relations(verificationSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [verificationSubmissions.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [verificationSubmissions.reviewedBy],
    references: [users.id],
  }),
}));


// ============ SCHEMAS ============

// Cities list for Botswana
export const botswanaCities = [
  "Gaborone",
  "Francistown",
  "Molepolole",
  "Maun",
  "Serowe",
  "Selibe-Phikwe",
  "Kanye",
  "Mochudi",
  "Mahalapye",
  "Palapye",
  "Tlokweng",
  "Lobatse",
  "Ramotswa",
  "Letlhakane",
  "Tonota",
  "Moshupa",
  "Thamaga",
  "Jwaneng",
  "Orapa",
] as const;

// User Schemas
export const baseUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  isIdentityVerified: true,
  passwordHash: true,
  status: true,
  lastLogin: true,
});

// Updated individual signup schema (NO physical address)
export const individualSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  phoneCountryCode: z.string().default('+267'),
  phoneCountry: z.string().default('Botswana'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['requester', 'provider']),
  primaryCity: z.string().optional(), // Changed from z.enum() to z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'provider') {
    return !!data.primaryCity;
  }
  return true;
}, {
  message: "City is required for service providers",
  path: ['primaryCity'],
});

// Supplier signup schema (WITH physical address)
export const supplierSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  phoneCountryCode: z.string().default('+267'),
  phoneCountry: z.string().default('Botswana'),
  password: z.string().min(6),
  confirmPassword: z.string(),
  role: z.literal('supplier'),
  companyName: z.string().min(2),
  physicalAddress: z.string().min(5),
  contactPerson: z.string().min(2),
  contactPosition: z.string().min(2),
  companyEmail: z.string().email(),
  companyPhone: z.string().min(5),
  companyPhoneCountryCode: z.string().default('+267'),
  companyPhoneCountry: z.string().default('Botswana'),
  industryType: z.string().min(2),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const insertSupplierPromotionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  discountPercentage: z.number().min(0).max(100).optional(),
  validFrom: z.union([z.string(), z.date()]).transform(val => {
    return val instanceof Date ? val : new Date(val);
  }),
  validUntil: z.union([z.string(), z.date()]).transform(val => {
    return val instanceof Date ? val : new Date(val);
  }),
  images: z.array(z.string()).optional().default([]),
  termsAndConditions: z.string().optional(),
});

export const updateSupplierProfileSchema = z.object({
  websiteUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  whatsappNumber: z.string().optional(),
  aboutUs: z.string().optional(),
  specialOffer: z.string().optional(),
});

// Company signup schema (FOR company requesters/service providers)
export const companySignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.literal('company'),
  companyRole: z.enum(['requester', 'provider']), // Companies can request or provide services
  companyName: z.string().min(2, 'Company name is required'),
  registrationNumber: z.string().min(3, 'Registration number is required'),
  taxNumber: z.string().optional(),
  physicalAddress: z.string().min(5, 'Physical address is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  contactPosition: z.string().min(2, 'Position/role is required'),
  companyEmail: z.string().email('Invalid company email'),
  companyPhone: z.string().min(5, 'Company phone is required'),
  companyPhoneCountryCode: z.string().default('+267'),
  companyPhoneCountry: z.string().default('Botswana'),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  industryType: z.string().min(2, 'Industry type is required'),
  numberOfEmployees: z.number().optional(),
  yearsInBusiness: z.number().optional(),
  primaryCity: z.string().optional(), // Required for company providers
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.companyRole === 'provider') {
    return !!data.primaryCity;
  }
  return true;
}, {
  message: "City is required for company service providers",
  path: ['primaryCity'],
});

// Schema for signup request from frontend
export const createUserRequestSchema = z.union([
  individualSignupSchema,
  supplierSignupSchema,
  companySignupSchema,
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  isIdentityVerified: true,
  passwordHash: true,
  status: true,
  lastLogin: true,
});

// Provider Schema with city
export const insertProviderSchema = z.object({
  companyName: z.string().optional(),
  serviceCategories: z.array(z.number()),
  basePriceInfo: z.record(z.any()).optional(),
  serviceAreaRadiusMeters: z.number().default(10000),
  primaryCity: z.enum(botswanaCities),
  primaryRegion: z.string().optional(),
  approvedServiceAreas: z.array(z.string()).default([]),
  verificationDocuments: z.array(z.string()).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

// Supplier Schema
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  userId: true,
});

// Job Schema with city
export const insertJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number().int().positive(),
  latitude: z.string(),
  longitude: z.string(),
  address: z.string().optional(),
  city: z.enum(botswanaCities),
  region: z.string().optional(),
  urgency: z.enum(["normal", "emergency"]).default("normal"),
  preferredTime: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return undefined;
    return val instanceof Date ? val : new Date(val);
  }),
  photos: z.array(z.string()).optional().default([]),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  allowedProviderType: z.enum(["individual", "company", "both"]).default("both"),
});

// Service Area Migration Schema
export const insertServiceAreaMigrationSchema = z.object({
  requestedCity: z.enum(botswanaCities),
  requestedRegion: z.string().optional(),
  reason: z.string().min(20, "Please provide a detailed reason (minimum 20 characters)"),
});

// Message Schema
export const insertMessageSchema = z.object({
jobId: z.string().uuid().optional(), // Made optional for admin messages
  receiverId: z.string().uuid().optional(), // For direct admin messages
  messageText: z.string().min(1, "Message cannot be empty"),
  messageType: z.enum(["job_message", "admin_message", "system_notification"]).default("job_message"),
  attachments: z.array(z.string()).optional(),
  voiceNoteUrl: z.string().optional(),
});

// Mark message as read schema
export const markMessageReadSchema = z.object({
  messageId: z.string().uuid(),
});

// Rating Schema
export const insertRatingSchema = z.object({
  jobId: z.string().uuid(),
  toUserId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Job Feedback Schema
export const insertJobFeedbackSchema = z.object({
  jobId: z.string().uuid(),
  feedbackText: z.string().min(1, "Feedback cannot be empty"),
});

// Job Report Schema
export const insertJobReportSchema = z.object({
  jobId: z.string().uuid(),
  reason: z.string().min(10, "Please provide a detailed reason"),
});

// Provider Charge Schema
export const setProviderChargeSchema = z.object({
  providerCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
});

// Payment Confirmation Schema
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
  profilePhotoUrl: z.string().optional(), 
});

// Update Provider Service Area Schema
export const updateProviderServiceAreaSchema = z.object({
  primaryCity: z.enum(botswanaCities),
  primaryRegion: z.string().optional(),
});

// Update Job Status Schema
export const updateJobStatusSchema = z.object({
  status: z.enum(["open", "pending_selection", "offered", "accepted", "enroute", "onsite", "completed", "cancelled"]),
});

// Job Application Schema
export const insertJobApplicationSchema = z.object({
  jobId: z.string().uuid(),
  message: z.string().optional(),
});

// Select Provider Schema (for requester to choose a provider)
export const selectProviderSchema = z.object({
  applicationId: z.string().uuid(),
});

// 🆕 Schema for Admin Update User Status
export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'blocked', 'deactivated']),
  reason: z.string().optional(),
});


// 🆕 Schema for Verification Submissions
export const insertVerificationSubmissionSchema = z.object({
  type: z.enum(['identity', 'document']),
  documents: z.array(z.object({
    name: z.string().max(255, "File name is too long"),
    url: z.string().min(10, "Document URL/Base64 is required"),
  })).min(1, "At least one document/photo is required."),
});

// 🆕 Schema for Admin Approval/Rejection
export const updateVerificationStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});


// ============ TYPES ============

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;

export type ServiceAreaMigration = typeof serviceAreaMigrations.$inferSelect;
export type InsertServiceAreaMigration = z.infer<typeof insertServiceAreaMigrationSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageThread = typeof messageThreads.$inferSelect;

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
export type UpdateProviderServiceArea = z.infer<typeof updateProviderServiceAreaSchema>;
export type UpdateJobStatus = z.infer<typeof updateJobStatusSchema>;
export type SetProviderCharge = z.infer<typeof setProviderChargeSchema>;
export type ConfirmPayment = z.infer<typeof confirmPaymentSchema>;

export type VerificationSubmission = typeof verificationSubmissions.$inferSelect;
export type InsertVerificationSubmission = z.infer<typeof insertVerificationSubmissionSchema>;
export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;

export type SupplierPromotion = typeof supplierPromotions.$inferSelect;
export type InsertSupplierPromotion = z.infer<typeof insertSupplierPromotionSchema>;
export type UpdateSupplierProfile = z.infer<typeof updateSupplierProfileSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type SelectProvider = z.infer<typeof selectProviderSchema>;

// 🆕 Notification Schema
export const insertNotificationSchema = z.object({
  recipientId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  type: z.enum(["job_posted", "job_accepted", "application_received", "application_accepted", "application_rejected"]),
  title: z.string().min(1),
  message: z.string().min(1),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
