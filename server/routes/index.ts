/**
 * routes/index.ts - MODULAR ROUTES SETUP
 *
 * SOLID Principle Implementation:
 * - Single Responsibility: Each route module has one purpose
 * - Dependency Injection: verifyAccess is injected into each module
 * - Composition: Main registerRoutes() composes all route modules
 */

export { registerAuthRoutes } from "./auth.routes"
export { registerJobRoutes } from "./jobs.routes"
export { registerCompanyRoutes } from "./company.routes"
export { registerSupplierRoutes } from "./supplier.routes"
export { registerProviderRoutes } from "./provider.routes"
export { registerVerificationRoutes } from "./verification.routes"
export { registerAdminRoutes } from "./admin.routes"
export { registerMessagingRoutes } from "./messages.routes"
export { registerMiscRoutes } from "./misc.routes"
export { registerNotificationRoutes } from "./notifications.routes"
export { registerCategoryRoutes } from "./categories.routes"
export { registerPushNotificationRoutes } from "./push-notification.routes"

