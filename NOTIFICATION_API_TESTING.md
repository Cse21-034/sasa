# Notification System - API Testing Guide

## 🧪 Testing with cURL, Postman, or Similar Tools

### Prerequisites
- Valid JWT token from logging in
- Set as `Authorization: Bearer {token}` header on all requests

---

## 📝 Example API Requests

### 1. Get All Notifications

**Request**:
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "recipientId": "660e8400-e29b-41d4-a716-446655440000",
    "jobId": "770e8400-e29b-41d4-a716-446655440000",
    "type": "job_posted",
    "title": "🆕 New Job in Gaborone",
    "message": "A new job has been posted: \"Burst Toilet Repair\". Tap to view details and apply.",
    "isRead": false,
    "readAt": null,
    "createdAt": "2024-01-12T10:30:45.123Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "recipientId": "660e8400-e29b-41d4-a716-446655440000",
    "jobId": "770e8400-e29b-41d4-a716-446655440001",
    "type": "application_received",
    "title": "New Application",
    "message": "John Doe has applied to your job \"Window Installation\". Tap to view their profile.",
    "isRead": false,
    "readAt": null,
    "createdAt": "2024-01-12T09:15:32.456Z"
  }
]
```

---

### 2. Get Unread Notifications Only

**Request**:
```bash
curl -X GET http://localhost:5000/api/notifications/unread \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "recipientId": "660e8400-e29b-41d4-a716-446655440000",
    "jobId": "770e8400-e29b-41d4-a716-446655440000",
    "type": "job_posted",
    "title": "🆕 New Job in Gaborone",
    "message": "A new job has been posted: \"Burst Toilet Repair\". Tap to view details and apply.",
    "isRead": false,
    "readAt": null,
    "createdAt": "2024-01-12T10:30:45.123Z"
  }
]
```

---

### 3. Get Unread Count

**Request**:
```bash
curl -X GET http://localhost:5000/api/notifications/unread/count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "unreadCount": 2
}
```

---

### 4. Mark Single Notification as Read

**Request**:
```bash
curl -X PATCH http://localhost:5000/api/notifications/550e8400-e29b-41d4-a716-446655440000/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "recipientId": "660e8400-e29b-41d4-a716-446655440000",
  "jobId": "770e8400-e29b-41d4-a716-446655440000",
  "type": "job_posted",
  "title": "🆕 New Job in Gaborone",
  "message": "A new job has been posted: \"Burst Toilet Repair\". Tap to view details and apply.",
  "isRead": true,
  "readAt": "2024-01-12T10:35:00.789Z",
  "createdAt": "2024-01-12T10:30:45.123Z"
}
```

---

### 5. Mark All Notifications as Read

**Request**:
```bash
curl -X PATCH http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "message": "All notifications marked as read"
}
```

---

### 6. Delete a Notification

**Request**:
```bash
curl -X DELETE http://localhost:5000/api/notifications/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "message": "Notification deleted successfully"
}
```

---

## 🔄 Complete Testing Flow

### Step 1: Get Your JWT Token

```bash
# Login as a provider
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "plumber@example.com",
    "password": "password123"
  }'

# Response includes token
# Save it as: TOKEN="eyJhbGc..."
```

### Step 2: Verify No Notifications Yet

```bash
export TOKEN="YOUR_JWT_TOKEN_HERE"

curl -X GET http://localhost:5000/api/notifications/unread/count \
  -H "Authorization: Bearer $TOKEN"

# Response: { "unreadCount": 0 }
```

### Step 3: Post a Job (as Different User)

```bash
# Logout and login as requester
# Then post a job in provider's service area

curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer $REQUESTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Burst Toilet Repair",
    "description": "Emergency toilet burst in bathroom",
    "categoryId": 5,
    "city": "Gaborone",
    "latitude": "-24.628366",
    "longitude": "25.923816",
    "urgency": "emergency",
    "allowedProviderType": "both"
  }'
```

### Step 4: Check Notifications Appeared

```bash
# Login back as provider
# Check notifications

curl -X GET http://localhost:5000/api/notifications/unread/count \
  -H "Authorization: Bearer $TOKEN"

# Response: { "unreadCount": 1 }

# Get full notification
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Should see the new job notification
```

### Step 5: Interact with Notification

```bash
# Mark as read
curl -X PATCH http://localhost:5000/api/notifications/{notification_id}/read \
  -H "Authorization: Bearer $TOKEN"

# Check unread count again
curl -X GET http://localhost:5000/api/notifications/unread/count \
  -H "Authorization: Bearer $TOKEN"

# Response: { "unreadCount": 0 }
```

---

## 📊 Postman Collection

Here's a Postman collection you can import:

```json
{
  "info": {
    "name": "Notifications API",
    "description": "Test notification endpoints"
  },
  "item": [
    {
      "name": "Get All Notifications",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/notifications",
          "host": ["{{baseUrl}}"],
          "path": ["api", "notifications"]
        }
      }
    },
    {
      "name": "Get Unread Count",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/notifications/unread/count",
          "host": ["{{baseUrl}}"],
          "path": ["api", "notifications", "unread", "count"]
        }
      }
    },
    {
      "name": "Get Unread Notifications",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/notifications/unread",
          "host": ["{{baseUrl}}"],
          "path": ["api", "notifications", "unread"]
        }
      }
    },
    {
      "name": "Mark as Read",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/notifications/{{notificationId}}/read",
          "host": ["{{baseUrl}}"],
          "path": ["api", "notifications", "{{notificationId}}", "read"]
        }
      }
    },
    {
      "name": "Mark All as Read",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/notifications/read-all",
          "host": ["{{baseUrl}}"],
          "path": ["api", "notifications", "read-all"]
        }
      }
    },
    {
      "name": "Delete Notification",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/notifications/{{notificationId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "notifications", "{{notificationId}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    },
    {
      "key": "notificationId",
      "value": ""
    }
  ]
}
```

**To use this in Postman**:
1. Create new Collection
2. Click "Import" → "Raw text"
3. Paste the JSON above
4. Set variables: `baseUrl`, `token`, `notificationId`
5. Run requests

---

## ✅ Expected Server Logs

When testing, you should see logs like:

```
[12:34:56] Creating job...
[12:34:57] ✅ Job posted successfully. Notifications sent to 5 providers in Gaborone

[12:34:58] GET /api/notifications/unread/count 200 15ms
[12:34:59] PATCH /api/notifications/550e8400-e29b-41d4-a716-446655440000/read 200 8ms
[12:35:00] GET /api/notifications 200 12ms
```

---

## 🐛 Common Issues During Testing

### Issue: 401 Unauthorized
**Solution**: 
- Ensure JWT token is valid
- Check token is not expired
- Add `Bearer ` prefix before token

### Issue: 404 Not Found on Notification ID
**Solution**:
- Verify notification ID is correct
- Check notification still exists (not deleted)
- Verify logged in as correct user (can only see own notifications)

### Issue: 0 notifications despite posting job
**Solution**:
- Ensure provider has the job's category in `serviceCategories`
- Ensure provider's `approvedServiceAreas` includes job's city
- Check provider type matches job's `allowedProviderType`
- Check server logs for errors

### Issue: Response is empty array `[]`
**Solution**:
- This is normal if no notifications exist
- Post a job to generate notifications
- Check you're logged in as the right user

---

## 📈 Load Testing

To test performance with multiple notifications:

```bash
#!/bin/bash
# Create 100 test notifications

TOKEN="your_jwt_token"
NOTIFICATION_ID="550e8400-e29b-41d4-a716-446655440000"

for i in {1..100}; do
  curl -s -X GET http://localhost:5000/api/notifications \
    -H "Authorization: Bearer $TOKEN" > /dev/null &
done

wait
echo "Load test complete"

# Check performance
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -w "Response time: %{time_total}s\n"
```

---

## 🔍 Database Query Testing

If you need to check notifications directly in database:

```sql
-- See all notifications for a user
SELECT * FROM notifications 
WHERE recipient_id = 'user-uuid'
ORDER BY created_at DESC;

-- Count unread
SELECT COUNT(*) as unread_count FROM notifications
WHERE recipient_id = 'user-uuid' AND is_read = false;

-- See notifications for a specific job
SELECT * FROM notifications 
WHERE job_id = 'job-uuid'
ORDER BY created_at DESC;

-- Mark all as read for user
UPDATE notifications 
SET is_read = true, read_at = NOW()
WHERE recipient_id = 'user-uuid' AND is_read = false;

-- Delete old notifications (30+ days)
DELETE FROM notifications
WHERE recipient_id = 'user-uuid' 
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## ✅ Testing Checklist

- [ ] Can GET /api/notifications
- [ ] Can GET /api/notifications/unread
- [ ] Can GET /api/notifications/unread/count
- [ ] Can PATCH notification as read
- [ ] Can PATCH mark all as read
- [ ] Can DELETE notification
- [ ] Unread count decreases when marked as read
- [ ] isRead flag changes to true with timestamp
- [ ] Notifications appear when job posted
- [ ] Wrong provider type doesn't get notified
- [ ] Wrong category doesn't get notified
- [ ] Wrong city doesn't get notified
- [ ] Server logs show notification creation
- [ ] Performance is < 100ms for all queries

---

## 📞 Still Having Issues?

1. Check the [NOTIFICATION_SYSTEM_IMPLEMENTATION.md](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md) for architecture details
2. Review [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) to ensure migration ran
3. Check server console for error messages
4. Verify database has `notifications` table: `SELECT * FROM information_schema.tables WHERE table_name='notifications';`
5. Check notification filtering logic in `server/services/notification.service.ts`

---

**Happy testing! 🚀**
