# Push Notifications - Quick Reference for Developers

## 🚀 Quick Start

### For Users
1. Go to **Profile** page
2. Find **"Push Notifications"** section
3. Toggle checkbox to **enable**
4. Click **"Save Changes"**
5. Grant browser permission when prompted
6. ✅ Done! You'll receive notifications

### For Developers

#### Import the Hook
```tsx
import { usePushNotification } from '@/hooks/use-push-notification';

export function MyComponent() {
  const { 
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isPushNotificationSupported,
    isPushNotificationPermitted
  } = usePushNotification();
  
  // Use the functions...
}
```

#### Send a Push Notification from Backend
```typescript
import { pushNotificationService } from '../services';

// Send to single user
await pushNotificationService.sendPushNotification(userId, {
  title: 'New Message',
  body: 'You have a new message',
  tag: 'message_123',
  data: { url: '/messages', type: 'message' }
});

// Send to multiple users
await pushNotificationService.sendBulkPushNotifications(userIds, {
  title: 'New Job Posted',
  body: 'Check out this job opportunity',
  tag: 'job_456',
  data: { url: '/jobs/456', type: 'job' }
});
```

#### Auto-Notify Helper Methods
```typescript
// Notify when message received
await pushNotificationService.notifyMessageReceived(
  recipientId,
  senderId,
  'Your message preview here'
);

// Notify when job posted
await pushNotificationService.notifyJobPosted(
  userId,
  jobData
);

// Notify on application received
await pushNotificationService.notifyApplicationReceived(
  providerId,
  applicationData
);
```

---

## 📁 File Structure

```
client/
├── src/
│   ├── pages/
│   │   └── profile.tsx         ← Push notification UI
│   └── hooks/
│       └── use-push-notification.ts  ← Main hook
└── public/
    └── service-worker.js       ← Push event handler

server/
├── services/
│   └── push-notification.service.ts  ← Main service
└── routes/
    └── push-notification.routes.ts   ← API endpoints

shared/
└── schema.ts                   ← Updated schemas

drizzle/
└── 0002_add_push_notifications.sql   ← DB migration

.env
├── VITE_VAPID_PUBLIC_KEY
├── VAPID_PRIVATE_KEY
└── VAPID_SUBJECT
```

---

## 🔌 API Endpoints

### 1. Get VAPID Public Key
```
GET /api/push/vapid-public-key

Response:
{
  "key": "base64_encoded_key"
}
```

### 2. Subscribe to Notifications
```
POST /api/push/subscribe
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}

Response:
{
  "success": true,
  "message": "Subscribed to push notifications"
}
```

### 3. Update Preferences
```
PUT /api/push/preferences
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "enableNotifications": true
}

Response:
{
  "success": true
}
```

### 4. Get Preferences
```
GET /api/push/preferences
Authorization: Bearer <token>

Response:
{
  "enableWebPushNotifications": true,
  "subscriptionsCount": 1
}
```

### 5. Unsubscribe
```
DELETE /api/push/unsubscribe
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "endpoint": "https://fcm.googleapis.com/..."
}

Response:
{
  "success": true
}
```

---

## 🗄️ Database Queries

### Check User's Subscriptions
```sql
SELECT * FROM push_subscriptions 
WHERE user_id = 'user-uuid';
```

### Disable All Notifications for User
```sql
UPDATE push_subscriptions 
SET is_enabled = false 
WHERE user_id = 'user-uuid';
```

### Get Enabled Subscriptions
```sql
SELECT * FROM push_subscriptions 
WHERE is_enabled = true;
```

### Delete Invalid Subscriptions
```sql
DELETE FROM push_subscriptions 
WHERE updated_at < NOW() - INTERVAL '30 days';
```

---

## 🧪 Testing Examples

### Manual Test with cURL
```bash
# Get VAPID key
curl http://localhost:5000/api/push/vapid-public-key

# Get preferences (needs auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/push/preferences
```

### Browser Console Test
```javascript
// Check if supported
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('✅ Push notifications supported');
} else {
  console.log('❌ Push notifications not supported');
}

// Check permission status
console.log('Permission:', Notification.permission);

// Request permission
if (Notification.permission === 'default') {
  Notification.requestPermission().then(permission => {
    console.log('Permission:', permission);
  });
}
```

---

## 🐛 Debugging

### Enable Service Worker Debugging
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Check "Show all"
5. Click your service worker to see logs

### Check Push Notifications Log
```javascript
// In service-worker.js console
console.log('🔔 Push notification received:', event);
```

### Verify Subscription in DB
```javascript
// Browser Console
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub?.toJSON());
  });
});
```

---

## 🔐 Environment Variables

### Development
```env
VITE_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:dev@example.com
```

### Production
```env
VITE_VAPID_PUBLIC_KEY=prod_public_key
VAPID_PRIVATE_KEY=prod_private_key
VAPID_SUBJECT=mailto:support@yourdomain.com
```

### Generate Keys
```bash
npx web-push generate-vapid-keys
```

---

## 📊 Notification Payload Format

### Standard Notification
```json
{
  "title": "New Message",
  "body": "Preview of message content",
  "icon": "/icon-192.png",
  "badge": "/badge.png",
  "tag": "unique_tag_to_group_notifications",
  "requireInteraction": true,
  "data": {
    "url": "/messages",
    "type": "message",
    "senderId": "user-123"
  }
}
```

### Job Notification
```json
{
  "title": "New Job: House Renovation",
  "body": "Location: Gaborone | Budget: P5000",
  "tag": "job_456",
  "data": {
    "url": "/jobs/456",
    "type": "job",
    "jobId": 456
  }
}
```

### Application Notification
```json
{
  "title": "New Application",
  "body": "Jane Smith applied for your job",
  "tag": "app_789",
  "data": {
    "url": "/jobs/456/applications",
    "type": "application",
    "applicationId": 789
  }
}
```

---

## ✅ Checklist for Integration

### Before Production
- [ ] Generate production VAPID keys
- [ ] Add keys to environment variables
- [ ] Run database migrations
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Edge
- [ ] Test with app closed
- [ ] Test with app in background
- [ ] Test notification click routing
- [ ] Verify subscription storage in DB
- [ ] Test unsubscribe functionality
- [ ] Clear browser cache before testing

### Integration Points
- [ ] Message service calls `notifyMessageReceived()`
- [ ] Job service calls `notifyJobPosted()`
- [ ] Application service calls `notifyApplicationReceived()`
- [ ] Error handling for failed sends
- [ ] Logging for debugging

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Not supported" | Old browser | Use Chrome/Firefox/Edge |
| "Permission denied" | User rejected | Check browser notification settings |
| No notification received | VAPID keys wrong | Regenerate and redeploy |
| Subscription not saved | Backend error | Check server logs, database |
| App doesn't open on click | URL wrong in data | Verify notification data.url |
| Service Worker doesn't update | Cache issue | Hard refresh (Ctrl+Shift+R) |

---

## 📚 Resources

- [Web Push API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm Package](https://github.com/web-push-libs/web-push)
- [VAPID Specification](https://tools.ietf.org/html/draft-thomson-webpush-vapid)

---

## 💡 Pro Tips

1. **Always test with app closed** to ensure background notifications work
2. **Use unique tags** to group related notifications
3. **Include URL in data** for proper routing
4. **Set requireInteraction: true** for important notifications
5. **Clean up subscriptions** regularly for invalid endpoints
6. **Use bulk send** for notifications to many users
7. **Add meaningful icons** to make notifications stand out
8. **Test across browsers** - they handle PWA differently

---

**Last Updated:** 2024
**Version:** 1.0 Complete
**Status:** ✅ Production Ready
