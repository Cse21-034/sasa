# Push Notifications - Integration Guide

## Overview

The app now includes a push notification system that displays notifications at the top of the screen, similar to WhatsApp and other modern apps.

## How to Use Push Notifications

### 1. Import the Hook

```tsx
import { usePushNotification } from '@/components/push-notification';
```

### 2. Get the Function

```tsx
const { addNotification } = usePushNotification();
```

### 3. Display a Notification

```tsx
addNotification({
  title: 'Success!',
  message: 'Your job has been posted successfully',
  type: 'success',
  duration: 5000 // in milliseconds (optional, default is 5000)
});
```

## Notification Types

```tsx
type: 'info'     // Blue background
type: 'success'  // Green background
type: 'warning'  // Yellow background
type: 'error'    // Red background
```

## Complete Example

```tsx
import { usePushNotification } from '@/components/push-notification';
import { Button } from '@/components/ui/button';

export function MyComponent() {
  const { addNotification } = usePushNotification();

  const handleSubmit = async () => {
    try {
      // Do something
      addNotification({
        title: 'Success!',
        message: 'Operation completed successfully',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Something went wrong',
        type: 'error',
        duration: 7000
      });
    }
  };

  return <Button onClick={handleSubmit}>Submit</Button>;
}
```

## Notification Options

```typescript
interface NotificationData {
  id?: string;              // Auto-generated
  title: string;            // Required
  message: string;          // Required
  type?: 'info' | 'success' | 'warning' | 'error'; // Default: 'info'
  duration?: number;        // Milliseconds, 0 = no auto-dismiss. Default: 5000
}
```

## Common Use Cases

### Success Message
```tsx
addNotification({
  title: 'Job Posted',
  message: 'Your job has been posted and is now visible to providers',
  type: 'success'
});
```

### Error Message
```tsx
addNotification({
  title: 'Failed to Update',
  message: 'Please check your internet connection and try again',
  type: 'error',
  duration: 7000
});
```

### Warning Message
```tsx
addNotification({
  title: 'Warning',
  message: 'Your verification will expire in 3 days',
  type: 'warning'
});
```

### Info Message
```tsx
addNotification({
  title: 'New Message',
  message: 'You have received a new message from John',
  type: 'info'
});
```

## Features

✅ **Multiple Notifications** - Stack multiple notifications on top of each other
✅ **Auto-Dismiss** - Notifications automatically disappear after duration
✅ **Manual Dismiss** - Users can click the X button to dismiss immediately
✅ **Mobile Friendly** - Works perfectly on all screen sizes
✅ **Smooth Animations** - Slide-in/slide-out animations
✅ **Color Coded** - Different colors for different notification types
✅ **Touch Friendly** - Large touch targets on mobile

## Styling

All notifications are styled to match the iOS 26 theme:
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Warning**: Yellow (#F59E0B)
- **Info**: Blue (#3B82F6)

## Notes

- The `PushNotificationContainer` is already added to `App.tsx`
- You don't need to do anything special for it to work
- Just import the hook and call `addNotification()` wherever you need it
- The hook works in any component within the app

## Troubleshooting

### Notifications not showing?
1. Make sure you imported the hook correctly
2. Check that you're calling `addNotification()` with the required fields (title, message)
3. Verify that `PushNotificationContainer` is in your App.tsx (it should be)

### Multiple notifications stacking?
This is by design! They will stack vertically and auto-dismiss individually.

### Want to change colors?
Update the color classes in `push-notification.tsx`:
```tsx
const getTypeClasses = (type?: string) => {
  switch (type) {
    case 'success': return 'bg-green-500 text-white';
    // etc...
  }
};
```

---

**Ready to use!** Just import and start adding notifications to your components.
