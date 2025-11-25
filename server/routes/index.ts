/**
 * routes/index.ts - MODULAR ROUTES SETUP
 * 
 * SOLID Principle Implementation:
 * - Single Responsibility: Each route module has one purpose
 * - Dependency Injection: verifyAccess is injected into each module
 * - Composition: Main registerRoutes() composes all route modules
 * 
 * Usage in server/routes.ts:
 * 
 * import { registerAuthRoutes } from './routes/auth.routes';
 * import { registerJobRoutes } from './routes/jobs.routes';
 * import { registerCompanyRoutes } from './routes/company.routes';
 * import { registerSupplierRoutes } from './routes/supplier.routes';
 * import { registerProviderRoutes } from './routes/provider.routes';
 * import { registerVerificationRoutes } from './routes/verification.routes';
 * import { registerAdminRoutes } from './routes/admin.routes';
 * import { registerPaymentRoutes } from './routes/payment.routes';
 * import { registerMessagingRoutes } from './routes/messages.routes';
 * 
 * // Inside registerRoutes():
 * registerAuthRoutes(app);
 * registerJobRoutes(app, verifyAccess);
 * registerCompanyRoutes(app, verifyAccess);
 * registerSupplierRoutes(app, verifyAccess);
 * registerProviderRoutes(app, verifyAccess);
 * registerVerificationRoutes(app, verifyAccess);
 * registerAdminRoutes(app, verifyAccess);
 * registerPaymentRoutes(app, verifyAccess);
 * registerMessagingRoutes(app, verifyAccess);
 */

export { registerAuthRoutes } from './auth.routes';
export { registerJobRoutes } from './jobs.routes';
export { registerCompanyRoutes } from './company.routes';
export { registerSupplierRoutes } from './supplier.routes';
// export { registerProviderRoutes } from './provider.routes';
// export { registerVerificationRoutes } from './verification.routes';
// export { registerAdminRoutes } from './admin.routes';
// export { registerPaymentRoutes } from './payment.routes';
// export { registerMessagingRoutes } from './messages.routes';
