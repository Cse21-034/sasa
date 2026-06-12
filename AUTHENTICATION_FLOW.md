# Authentication Flow Documentation

This document describes the authentication and verification flow for the system, from signup through login and account verification. It covers user registration, email verification, token issuance, login, password reset, and how access is enforced for protected routes.

## Actors and Roles

- `admin`: Full system access, bypasses verification checks for protected routes.
- `provider`: Service provider who must choose categories at signup and complete verification.
- `supplier`: Supplier account type with company details and profile creation.
- `company`: Company user registration path with provider or requester sub-role.
- `requester`: A user who requests services.

## Core Concepts

- `JWT Bearer token`: Issued on signup and login. Authentication middleware validates it on every protected API request.
- `isVerified`: Indicates whether the account has completed required verification steps.
- `status`: Account state; expected values include `active`, `blocked`, or `deactivated`.
- `isEmailVerified`: Email verification status enforced for non-admin accounts.
- `verifyAccess` middleware: Enforces that non-admin users must be `active` and `isVerified`.

## Signup Flow

Endpoint: `POST /api/auth/signup`

### Input

The request body is validated against `createUserRequestSchema`. Required fields vary by role, but generally include:
- `name`
- `email`
- `password`
- `confirmPassword`
- `role`
- `primaryCity` (for providers)
- `serviceCategories` (for providers)
- company or supplier details when applicable

### Processing

1. Validate request data.
2. Confirm `password` and `confirmPassword` match.
3. Reject duplicate email addresses.
4. Hash password with bcrypt.
5. Normalize role logic for company users and supplier accounts.
6. Create the base user record with `isEmailVerified: false` for non-admins.

### Provider-specific behavior

If the new user is a provider:
- `primaryCity` must be provided.
- `serviceCategories` must contain at least one category.
- A provider profile is created with:
  - `userId`
  - `serviceCategories`
  - `primaryCity`
  - `approvedServiceAreas`
  - `serviceAreaRadiusMeters`
- Pending category verification records are batch-created for the selected service categories.

### Post-signup actions

- Generate an email verification code.
- Persist the email verification token in the database.
- Cache the token for faster verification lookup.
- Queue an email verification message asynchronously.
- Issue a JWT token immediately.
- Cache the user profile for subsequent requests.

### Response

Returns:
- `user`: User profile without password hash.
- `token`: JWT token valid for 7 days.
- `requiresEmailVerification`: `true` for non-admin users who have not verified email.

## Email Verification Flow

Endpoint: `POST /api/auth/verify-email`

### Input

- `userId`
- `code`

### Processing

1. Validate required fields.
2. Attempt to verify the code from cache first.
3. Fallback to database lookup if the cache misses.
4. Reject invalid or expired codes.
5. Mark `isEmailVerified` true on the user.
6. Delete email verification tokens from DB and cache.
7. Invalidate cached user profile.
8. Queue a welcome email asynchronously.

### Response

- `message`: `Email verified successfully`

### Resend verification

Endpoint: `POST /api/auth/resend-verification`

- Validates `userId`.
- Ensures user exists and is not already verified.
- Generates a new code and expiration.
- Persists and caches the token.
- Queues verification email.
- Responds with success.

## Login Flow

Endpoint: `POST /api/auth/login`

### Input

- `email`
- `password`

### Processing

1. Validate required fields.
2. Load user by email.
3. Compare password against stored bcrypt hash.
4. Reject invalid credentials.
5. Reject if user `status` is not `active`.
6. Update `lastLogin` asynchronously.
7. Generate JWT token with payload:
   - `id`
   - `email`
   - `role`
   - `isVerified`
   - `isIdentityVerified`
   - `status`
8. Cache user profile for faster requests.

### Response

Returns:
- `user`: Profile without password hash.
- `token`: JWT bearer token.
- `requiresEmailVerification`: `true` if email is not verified and user is not admin.

## Password Reset Flow

### Request reset

Endpoint: `POST /api/auth/forgot-password`

- Accepts `email`.
- If user exists, generates a reset code and expiration.
- Stores the reset token in DB and cache.
- Queues password reset email asynchronously.
- Always returns a generic success message to avoid account enumeration.

### Reset password

Endpoint: `POST /api/auth/reset-password`

- Accepts `userId`, `code`, `newPassword`, `confirmPassword`.
- Validates all fields and password confirmation.
- Rejects if code is invalid or expired.
- Hashes new password and updates the user.
- Removes reset tokens from DB and cache.
- Invalidates user cache.

## Token Authentication

### Middleware: `authMiddleware`

- Checks `Authorization` header for `Bearer <token>`.
- Verifies JWT using `JWT_SECRET`.
- Attaches decoded payload to `req.user`.
- Responds `401 Unauthorized` if token is missing, invalid, or expired.

### Token payload

Includes:
- `id`
- `email`
- `role`
- `isVerified`
- `isIdentityVerified`
- `status`

### Token lifetime

- Tokens expire in `7d`.

## Protected Access and Verification Enforcement

### `verifyAccess` middleware

Applied to most protected routes after `authMiddleware`.

For non-admin users, it enforces:
- `status === 'active'`
- `isVerified === true`

If either check fails, the request receives `403 Forbidden` with a relevant message and error code.

Admins bypass these checks.

## Verification and Permissions

### Provider verification

- Providers select service categories during signup.
- Each selected category receives a pending verification record.
- Providers must submit supporting category documents later via provider verification endpoints.
- Admins review and approve or reject verification requests.

### Account verification

- `isEmailVerified` is required for standard users.
- `isVerified` is a broader state for account eligibility; it is used by protected routes.
- The system uses both email verification and role-based verification state to control access.

## System Behavior Summary

1. User signs up via `/api/auth/signup`.
2. System creates a user and any related supplier/provider/company profiles.
3. If the account is a provider, related category verification records are created.
4. Email verification code is generated, cached, and emailed.
5. User receives a JWT token immediately.
6. User verifies email via `/api/auth/verify-email`.
7. User logs in via `/api/auth/login`, receiving a fresh JWT.
8. Protected routes require the JWT and the `verifyAccess` check.
9. Admins can access protected routes even before verification.

## API Summary

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Notes

- The system caches email verification tokens and user profiles to improve performance.
- Email sending is queued asynchronously so signup and verification actions do not block on mail delivery.
- Providers are required to select categories and provide a service area during signup.
- Verification state is enforced globally for protected routes via middleware.
