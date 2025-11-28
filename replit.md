# JobTradeSasa - Local Service Marketplace

## Overview

JobTradeSasa is a comprehensive local service marketplace platform that connects requesters (individuals and companies) with service providers, while also featuring a supplier directory for building materials and services. The platform facilitates job postings, provider applications, real-time messaging, payments, ratings, and admin oversight.

**Core Value Proposition**: Connect users who need services (plumbers, electricians, carpenters, etc.) with verified local providers in their area, with built-in verification, messaging, and payment tracking.

**Tech Stack**:
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Radix UI (shadcn/ui), Wouter (routing), React Query
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: WebSocket for messaging
- **Deployment**: Vercel (frontend), Render/Replit (backend)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### 1. Multi-Role User System

The platform supports four distinct user roles, each with different capabilities and workflows:

**Roles**:
- **Requester**: Posts jobs, browses providers, hires for tasks
- **Provider**: Browses open jobs, applies to jobs, manages service areas and categories
- **Supplier**: Manages company profile, posts promotional materials for building supplies
- **Admin**: Manages user verification, resolves reports, monitors platform analytics

**Design Decision**: Single `users` table with role-based polymorphism. Related profile data stored in separate tables (`providers`, `suppliers`, `companies`) linked by `userId`. This keeps the core user authentication clean while allowing role-specific attributes.

**User Verification System**:
- Two-tier verification: Identity verification (ID + selfie) and document verification (business licenses, certifications)
- Automatic approval for requesters upon identity submission
- Manual admin review for providers (to ensure quality control)
- Unverified users have restricted access (verification gate middleware)
- User status tracking: `active`, `blocked`, `deactivated`

### 2. Modular Route Architecture (SOLID Refactoring)

**Problem Solved**: Originally had a monolithic 1,874-line `routes.ts` file containing all API endpoints. This violated Single Responsibility Principle and made maintenance difficult.

**Solution**: Routes refactored into focused, domain-specific modules following SOLID principles:

```
server/routes/
├── auth.routes.ts          - Signup, login
├── jobs.routes.ts          - Job CRUD, applications, status updates
├── company.routes.ts       - Company profile management
├── supplier.routes.ts      - Supplier profiles, promotions
├── provider.routes.ts      - Provider profiles, service areas, migrations
├── verification.routes.ts  - Identity/document verification submissions
├── admin.routes.ts         - Admin user management, verification approval
├── messages.routes.ts      - Conversations, job chat, admin messaging
├── misc.routes.ts          - Profile updates, categories, ratings, payments
└── index.ts               - Central export point
```

**Key Pattern**: Each route module receives injected dependencies (like `verifyAccess` middleware) to maintain loose coupling. Main `routes.ts` orchestrates module registration.

**Benefits**:
- Average file size reduced from 1,874 lines to ~150 lines per module
- Single Responsibility: Each module handles one domain
- Easier testing and maintenance
- New developers can navigate codebase intuitively

### 3. Service Layer Architecture

**Pattern**: Business logic extracted from routes into dedicated service classes. Each service handles a specific domain entity.

**Services**:
- `UserService`: User CRUD, authentication, status management
- `JobService`: Job lifecycle, applications, payments
- `MessagingService`: Conversations, messages, unread counts
- `ProviderService`: Provider profiles, service area management, search
- `SupplierService`: Supplier profiles, promotions
- `CompanyService`: Company profile management
- `VerificationService`: Verification workflow, submission management
- `AnalyticsService`: Stats, reports, admin analytics

**Rationale**: Separates data access logic from HTTP request handling. Routes become thin controllers that validate input and call service methods. Services encapsulate business rules and database queries.

**Example Flow**:
```
Route (jobs.routes.ts) 
  → Validates request with Zod schema
  → Calls JobService.createJob()
  → JobService interacts with Drizzle ORM
  → Returns structured data to route
  → Route sends HTTP response
```

### 4. Database Schema Design

**ORM Choice**: Drizzle ORM with PostgreSQL
- Type-safe queries with full TypeScript inference
- Schema defined in `shared/schema.ts` for code sharing between client/server
- Migrations managed with `drizzle-kit`

**Core Tables**:
- `users` - Base user authentication and profile
- `providers` - Provider-specific data (service areas, categories, type)
- `suppliers` - Supplier company information
- `companies` - Company requester profiles
- `jobs` - Job postings with status workflow
- `jobApplications` - Provider applications to jobs (new feature)
- `messages` - Chat messages for jobs and admin communication
- `ratings` - Provider ratings after job completion
- `verificationSubmissions` - Identity/document verification data
- `categories` - Service categories (plumbing, electrical, etc.)
- `supplierPromotions` - Supplier promotional campaigns

**Job Workflow States**:
```
open → pending_selection → offered → accepted → enroute → onsite → completed
                                              ↘ cancelled
```

**Design Decision**: Job applications system allows multiple providers to apply before requester selects one. This replaced direct provider assignment, giving requesters more choice.

### 5. Authentication & Authorization

**JWT-based Authentication**:
- Tokens generated on login with 7-day expiration
- Token payload includes: `id`, `email`, `role`, `isVerified`, `isIdentityVerified`, `status`
- Stored in localStorage on client, sent as `Authorization: Bearer <token>` header
- `authMiddleware` verifies token and attaches `req.user` to all protected routes

**Verification Gate**:
- `verifyAccess` middleware blocks unverified users from accessing core features
- Admin users bypass all verification checks
- Unverified users redirected to `/verification` page

**Authorization Pattern**:
```typescript
// Middleware chain
authMiddleware → verifyAccess → role check → business logic
```

### 6. Real-Time Messaging (WebSocket)

**Implementation**: WebSocket server on `/ws` path using `ws` library
- Client-server bidirectional messaging
- User authentication via WebSocket message (`auth` type with JWT)
- Active connections tracked in `Map<userId, WebSocket>`

**Message Types**:
- `job_message` - Job-specific conversations between requester and provider
- `admin_message` - User-to-admin support messages
- `system_notification` - Platform notifications

**Delivery Pattern**:
- Messages stored in database immediately
- If recipient online, pushed via WebSocket
- If offline, queued for retrieval on next connection

### 7. Image Upload & Storage

**Current Implementation**: Base64 encoding for profile photos
- Images converted to base64 strings on client
- Stored directly in database as `TEXT` fields (`profilePhotoUrl`)

**Limitations**: Not scalable for large images or many files (verification documents use base64 arrays)

**Future Recommendation**: Migrate to cloud storage (Cloudinary, AWS S3) with signed URLs

### 8. Frontend Architecture

**Routing**: Wouter (lightweight React Router alternative)
- Role-based route protection via `ProtectedRoute` component
- Verification gate redirects for unverified users
- Separate route structures for each role

**State Management**:
- React Query for server state (caching, refetching, mutations)
- React Context for auth state (`AuthProvider`)
- Local component state for UI interactions

**UI Framework**: shadcn/ui (Radix primitives + TailwindCSS)
- Theming via CSS variables (light/dark mode support)
- Corporate color scheme: Orange (#F8992D) + Dark Teal (#274345)
- Responsive design with mobile-first approach

**Key Pages by Role**:
- **Requester**: Jobs list, post job, job detail, suppliers, messages
- **Provider**: Browse jobs, applications, dashboard, profile with service categories
- **Supplier**: Dashboard with promotions, supplier settings
- **Admin**: Verification approval, user management, reports, analytics

### 9. Deployment Architecture

**Frontend (Vercel)**:
- Static build from Vite
- `vercel.json` configured for SPA routing (all routes → `index.html`)
- Service worker for PWA capabilities

**Backend (Render/Replit)**:
- Express server bundled with esbuild
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`
- Database migrations run on startup: `npm run db:push`

**CORS Configuration**: Allows both local development and production frontend origins

**Database**: Neon PostgreSQL (serverless, websocket-enabled for low latency)

### 10. Key Business Logic Patterns

**Provider Service Area Management**:
- Providers can request to expand service areas via migration requests
- Admins approve/reject migrations
- `approvedServiceAreas` array tracks allowed cities
- Job filtering based on provider's approved areas

**Job Application Flow**:
1. Provider applies to open job
2. Requester reviews applications
3. Requester selects preferred provider
4. Job status changes to `offered`
5. Provider accepts/rejects offer
6. If accepted → job proceeds to `enroute` → `onsite` → `completed`

**Payment Tracking**:
- Provider sets charge amount when job completed
- Requester confirms payment (manual confirmation, not integrated payment gateway)
- `amountPaid` field tracks final payment

**Rating System**:
- One rating per completed job
- Ratings include score (1-5) and optional comment
- Provider stats calculate average rating and completion count

## External Dependencies

### NPM Packages (Core)
- `express` - HTTP server framework
- `drizzle-orm` - TypeScript ORM
- `@neondatabase/serverless` - Neon PostgreSQL client
- `ws` - WebSocket server
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `zod` - Schema validation
- `cors` - Cross-origin resource sharing

### Frontend Libraries
- `react` + `react-dom` - UI framework
- `@tanstack/react-query` - Server state management
- `wouter` - Routing
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Zod integration for forms
- Radix UI components (`@radix-ui/*`) - Accessible primitives
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icon library

### Build Tools
- `vite` - Build tool and dev server
- `esbuild` - Production bundler for backend
- `typescript` - Type checking
- `drizzle-kit` - Database migrations

### Database
- **Neon PostgreSQL** (serverless)
  - Connection via `@neondatabase/serverless` with WebSocket support
  - Connection string in `DATABASE_URL` environment variable
  - Schema migrations via Drizzle Kit

### Future Integrations (Not Yet Implemented)
- Payment gateway (Stripe, PayPal, local payment providers)
- SMS notifications (Twilio, Africa's Talking)
- Email service (SendGrid, AWS SES)
- Cloud file storage (Cloudinary, AWS S3) for images/documents
- Google Maps API for location services