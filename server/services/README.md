# Server Services Architecture

This directory contains modular, domain-specific services following SOLID principles. Each service is responsible for a specific business domain, making the codebase more maintainable, testable, and scalable.

## Services Overview

### 1. **UserService** (`user.service.ts`)
Handles all user management operations including authentication and admin functions.
- **Responsibilities**: User CRUD, email lookup, user filtering, status management
- **Key Methods**: `getUser()`, `getUserByEmail()`, `createUser()`, `updateUser()`, `getUsers()`, `updateUserStatus()`
- **Single Responsibility**: User entity management only

### 2. **JobService** (`job.service.ts`)
Manages all job-related operations from creation to completion.
- **Responsibilities**: Job CRUD, job acceptance, payments, filtering
- **Key Methods**: `getJob()`, `getJobs()`, `createJob()`, `updateJob()`, `acceptJob()`, `setProviderCharge()`, `confirmPayment()`
- **Single Responsibility**: Job entity and job workflow management

### 3. **MessagingService** (`messaging.service.ts`)
Handles all messaging including job conversations and admin chat.
- **Responsibilities**: Message CRUD, conversations, unread counts, admin messaging
- **Key Methods**: `getMessages()`, `createMessage()`, `markMessageAsRead()`, `getConversations()`, `getAdminConversations()`, `getAdminChatMessages()`
- **Single Responsibility**: Messaging and communication operations

### 4. **ProviderService** (`provider.service.ts`)
Manages provider profiles and provider-specific operations.
- **Responsibilities**: Provider CRUD, service area updates, provider search
- **Key Methods**: `getProvider()`, `createProvider()`, `updateProvider()`, `updateProviderServiceArea()`, `searchProviders()`
- **Single Responsibility**: Provider entity management

### 5. **VerificationService** (`verification.service.ts`)
Handles user verification submissions and approval workflow.
- **Responsibilities**: Verification submission CRUD, status updates, pending submissions
- **Key Methods**: `createVerificationSubmission()`, `getVerificationSubmission()`, `getPendingVerificationSubmissions()`, `updateVerificationSubmissionStatus()`
- **Single Responsibility**: Verification workflow management

### 6. **SupplierService** (`supplier.service.ts`)
Manages supplier profiles and promotional campaigns.
- **Responsibilities**: Supplier CRUD, promotion management
- **Key Methods**: `getSupplier()`, `createSupplier()`, `updateSupplier()`, `getSupplierPromotions()`, `createSupplierPromotion()`, `updateSupplierPromotion()`
- **Single Responsibility**: Supplier entity and promotion management

### 7. **AnalyticsService** (`analytics.service.ts`)
Provides analytics and reporting across the platform.
- **Responsibilities**: User stats, provider stats, admin analytics, job reports
- **Key Methods**: `getRequesterStats()`, `getProviderStats()`, `getAdminJobAnalytics()`, `getJobReports()`, `resolveJobReport()`
- **Single Responsibility**: Analytics and reporting operations

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
✅ Each service handles one business domain
- Example: `JobService` handles jobs only, not messages or users

### Open/Closed Principle (OCP)
✅ Services are open for extension (new methods) but closed for modification
- New job features can be added without changing existing methods

### Liskov Substitution Principle (LSP)
✅ Services can be replaced with compatible implementations
- Easy to create mock services for testing

### Interface Segregation Principle (ISP)
✅ Each service exports only what's needed
- Clients don't depend on methods they don't use

### Dependency Inversion Principle (DIP)
✅ Services depend on abstractions (database interface), not concrete implementations
- Easy to swap database providers

## Usage Example

```typescript
import { userService, jobService, messagingService } from './services';

// Use services
const user = await userService.getUser(userId);
const job = await jobService.getJob(jobId);
const messages = await messagingService.getMessages(jobId);
```

## Migration from Old Storage.ts

The old `storage.ts` contained ~1300 lines of mixed concerns. Now:
- ✅ Code split into 7 focused services (~150-300 lines each)
- ✅ Each service has clear responsibilities
- ✅ Easier to test individual services
- ✅ Easier to find related code
- ✅ Better code reusability

## Adding New Services

To add a new service:

1. Create `new-domain.service.ts` in this directory
2. Implement domain-specific methods
3. Export singleton in `index.ts`
4. Import and use in routes

Example template:
```typescript
export class NewDomainService {
  async getItem(id: string): Promise<Item | undefined> {
    // Implementation
  }
}
export const newDomainService = new NewDomainService();
```

## Performance Considerations

- Services use database connections efficiently
- Singleton pattern ensures single instance per service
- Consider caching for frequently accessed data
- Add pagination for large result sets

## Testing

Each service can be tested independently:
```typescript
import { jobService } from '../services';

describe('JobService', () => {
  it('should get job with relations', async () => {
    const job = await jobService.getJob('job-id');
    expect(job).toBeDefined();
  });
});
```
