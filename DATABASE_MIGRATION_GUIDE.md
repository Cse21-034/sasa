# Running Database Migration for Notifications

## Prerequisites
Ensure you have Drizzle ORM properly configured in your project.

## Steps to Apply Migration

### Option 1: Using Drizzle Kit (Recommended)

1. **Generate Migration**:
   ```bash
   npm run db:generate
   # or
   yarn db:generate
   ```
   This will:
   - Read your updated `shared/schema.ts`
   - Generate migration files for the new notification table
   - Create the SQL needed to modify your database

2. **Apply Migration**:
   ```bash
   npm run db:migrate
   # or
   yarn db:migrate
   ```
   This will:
   - Execute the migration against your PostgreSQL database
   - Create the `notifications` table
   - Create the `notification_type` enum

3. **Verify Migration**:
   ```bash
   npm run db:studio
   # or
   yarn db:studio
   ```
   Open Drizzle Studio to verify the new table exists and is properly structured.

### Option 2: Manual SQL (If Needed)

If you prefer to run SQL directly:

```sql
-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'job_posted',
  'job_accepted',
  'application_received',
  'application_accepted',
  'application_rejected'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  
  -- Indexes for performance
  UNIQUE(id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
```

## Verification Commands

After migration, verify everything is set up correctly:

```bash
# Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'notifications';

# Check columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'notifications';

# Check enum exists
SELECT typname FROM pg_type WHERE typname = 'notification_type';
```

## What the Migration Does

1. ✅ Creates `notification_type` enum with 5 values
2. ✅ Creates `notifications` table with:
   - UUID primary key
   - Foreign key to users (recipientId)
   - Optional foreign key to jobs
   - Type, title, message fields
   - isRead boolean flag
   - readAt timestamp
   - createdAt timestamp
3. ✅ Creates indexes for performance on frequently queried columns

## Rollback (If Needed)

If you need to rollback the migration:

```bash
npm run db:rollback
# or
yarn db:rollback
```

This will:
- Remove the notifications table
- Remove the notification_type enum
- Restore database to previous state

## Next Steps

After migration is complete:

1. Restart your server:
   ```bash
   npm run dev
   ```

2. Test the notification system:
   - Login as a requester/company
   - Post a job
   - Login as a provider in the same city with matching category
   - Verify notification appears in bell icon
   - Test marking as read/deleting

3. Check server logs for:
   ```
   ✅ Job posted successfully. Notifications sent to X providers in [City]
   ```

## Troubleshooting

### Migration fails with "enum already exists"
- The enum might already exist from a previous partial deployment
- Use: `DROP TYPE IF EXISTS notification_type;` first

### Notifications table already exists
- The table might exist from a previous partial deployment
- Use: `DROP TABLE IF EXISTS notifications CASCADE;` first

### Foreign key constraint error
- Ensure the `users` and `jobs` tables exist
- Run: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`

### Permissions error
- Ensure your database user has CREATE TABLE and CREATE TYPE permissions
- Contact your database administrator if needed

## Testing the Notification Flow

```typescript
// 1. Create a test job
POST /api/jobs
{
  "title": "Test Job",
  "categoryId": 1,
  "city": "Gaborone",
  "latitude": "-24.628366",
  "longitude": "25.923816",
  "description": "Test description",
  "allowedProviderType": "both"
}

// 2. Check if notifications were created
SELECT * FROM notifications;

// 3. Get notifications for a provider
GET /api/notifications

// 4. Mark notification as read
PATCH /api/notifications/{notificationId}/read

// 5. Check unread count
GET /api/notifications/unread/count
```

## Performance Notes

The notification system includes automatic indexing on:
- `recipient_id` - for fast lookups by user
- `is_read` - for unread notification queries
- `created_at` - for ordering/filtering by time

For high-volume applications, consider:
1. Archiving old notifications (move to separate table)
2. Adding pagination to notification list
3. Implementing WebSocket for real-time updates
4. Caching unread counts with Redis

---

See [NOTIFICATION_SYSTEM_IMPLEMENTATION.md](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md) for detailed architecture documentation.
