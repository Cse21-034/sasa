# 🔧 Troubleshooting & FAQ

## Common Issues & Solutions

---

## Push Notifications Not Showing

### Problem
Notifications aren't displaying when you call `addNotification()`

### Solutions

**Solution 1: Check PushNotificationContainer**
```tsx
// Make sure this is in App.tsx:
import { PushNotificationContainer } from "@/components/push-notification";

export default function App() {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
            <PushNotificationContainer />  // ← Must be here
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Solution 2: Verify Import**
```tsx
// Make sure you import correctly
import { usePushNotification } from '@/components/push-notification';

// NOT from other paths
```

**Solution 3: Required Fields**
```tsx
// Make sure to include required fields
addNotification({
  title: 'Required',    // ← Required
  message: 'Required',  // ← Required
  type: 'success'       // Optional (default: 'info')
});
```

---

## Mobile Layout Still Broken

### Problem
Responsive layout not working properly on mobile

### Solutions

**Solution 1: Clear Cache**
```bash
# Hard refresh in browser
Ctrl+Shift+Delete (Windows)
Cmd+Shift+Delete (Mac)
```

**Solution 2: Rebuild**
```bash
npm run dev
# or
npm run build
```

**Solution 3: Check Tailwind**
Make sure `tailwind.config.ts` has the correct content path:
```ts
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

---

## Colors Don't Match iOS 26

### Problem
Colors look different than expected

### Solutions

**Solution 1: Check Theme Provider**
```tsx
// Make sure ThemeProvider is wrapping the app
<ThemeProvider>
  <App />
</ThemeProvider>
```

**Solution 2: CSS Variables**
Open DevTools and check if CSS variables are set:
```css
/* Should show in :root */
--primary: 199 89% 48%;
--secondary: 33 100% 60%;
```

**Solution 3: Dark Mode**
Check if dark mode is affecting colors:
```tsx
// Toggle dark mode in browser DevTools
<html class="dark"> <!-- check if this is present -->
```

---

## Notifications Too Fast/Slow

### Problem
Notifications disappearing too quickly or staying too long

### Solutions

**Solution 1: Change Duration**
```tsx
addNotification({
  title: 'My Notification',
  message: 'Takes longer to dismiss',
  type: 'success',
  duration: 10000  // 10 seconds instead of 5
});
```

**Solution 2: No Auto-Dismiss**
```tsx
addNotification({
  title: 'Important',
  message: 'User must click to close',
  duration: 0  // Never auto-dismiss
});
```

---

## Mobile Nav Not Showing Messages

### Problem
Messages link not appearing in mobile navigation

### Solutions

**Solution 1: Check Navigation Bar**
```tsx
// In mobile-nav.tsx, verify all role arrays include:
const providerItems = [
  { href: '/jobs', icon: Home, label: 'Browse', testId: 'nav-home' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', testId: 'nav-messages' },
  // ...
];
```

**Solution 2: Import MessageSquare Icon**
```tsx
import { MessageSquare } from 'lucide-react';
// Make sure this import exists
```

---

## Buttons Look Wrong

### Problem
Buttons don't match iOS 26 style

### Solutions

**Solution 1: Check Button Component**
```tsx
// Verify rounded-xl is applied
className={cn(buttonVariants({ variant, size, className }))}
// Should result in rounded-xl
```

**Solution 2: Override Class**
If some buttons look off, you can override:
```tsx
<Button className="rounded-2xl">Custom Button</Button>
```

---

## Text Overflowing on Mobile

### Problem
Text still breaking layout on mobile phones

### Solutions

**Solution 1: Add Responsive Classes**
```tsx
// Example for job description
<p className="text-xs md:text-sm break-words whitespace-normal">
  {job.description}
</p>
```

**Solution 2: Adjust Container Width**
```tsx
// Ensure container has proper constraints
<div className="max-w-full px-4">
  {/* Content */}
</div>
```

---

## Dark Mode Issues

### Problem
Colors look wrong in dark mode

### Solutions

**Solution 1: Check Dark Mode Class**
```tsx
// Make sure dark class is on html element
<html class="dark">
```

**Solution 2: Verify Dark CSS**
```css
/* Check .dark section in index.css exists */
.dark {
  --background: 0 0% 10%;
  --primary: 199 89% 55%;
  /* etc */
}
```

---

## Performance Issues

### Problem
App feels slow after update

### Solutions

**Solution 1: Clear Browser Cache**
```
Settings → Clear browsing data → All time
```

**Solution 2: Check Bundle Size**
```bash
npm run build
# Check terminal output for size
```

**Solution 3: Disable Animations**
If animations cause lag:
```tsx
// In push-notification.tsx
// Remove animate classes if needed
className="...animate-in slide-in-from-top-full..."
// Can remove animation classes
```

---

## Notifications on Wrong Position

### Problem
Push notifications appear in wrong place

### Solutions

**Solution 1: Check Z-Index**
```tsx
// Should be highest z-index
className="fixed top-0 left-0 right-0 z-[9999]"
```

**Solution 2: Check if Mobile Nav Blocking**
If mobile nav is covering:
```tsx
// Mobile nav should be: z-50
// Push notifications: z-[9999] (higher)
```

---

## Cards Not Rounded Properly

### Problem
Cards not showing rounded corners

### Solutions

**Solution 1: Check Card CSS**
```tsx
// Should use rounded-2xl
className={cn(
  "ios-card rounded-2xl border bg-card text-card-foreground",
  className
)}
```

**Solution 2: No Conflicting Classes**
Remove conflicting tailwind classes:
```tsx
// ❌ Don't do this
<Card className="rounded-none"> 

// ✅ Do this
<Card>
```

---

## Issues Not Listed Here?

### Debug Steps

1. **Check Console**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Note the error message

2. **Check CSS**
   - Inspect element (F12)
   - Check if classes are applied
   - Verify CSS is loading

3. **Check Network**
   - DevTools → Network tab
   - Reload page
   - Check for failed requests

4. **Test in Incognito**
   - Open in private/incognito window
   - This disables extensions
   - If works in incognito, extension issue

---

## Getting Help

### Before Asking for Help

1. ✅ Clear cache and reload
2. ✅ Check console for errors
3. ✅ Try in different browser
4. ✅ Check if issue reproduces
5. ✅ Review the documentation

### When Reporting Issues

Include:
- Browser (Chrome, Safari, Firefox)
- Device (Desktop, iPhone, Android)
- Error message (from console)
- Steps to reproduce
- Screenshots if possible

---

## Performance Optimization Tips

If app feels slow:

1. **Reduce Notification Duration**
   ```tsx
   duration: 3000 // Instead of 5000
   ```

2. **Lazy Load Pages**
   ```tsx
   const BrowseJobs = lazy(() => import('./pages/jobs/browse'));
   ```

3. **Optimize Images**
   - Compress images
   - Use proper formats (WebP)

4. **Enable Caching**
   - Use proper HTTP cache headers
   - Cache API responses

---

## Common Mistakes to Avoid

### ❌ Wrong Import Path
```tsx
// Wrong
import { usePushNotification } from '@/hooks/push-notification';

// Correct
import { usePushNotification } from '@/components/push-notification';
```

### ❌ Missing Required Fields
```tsx
// Wrong
addNotification({ type: 'success' }); // No title or message

// Correct
addNotification({
  title: 'Success',
  message: 'Operation completed',
  type: 'success'
});
```

### ❌ Not Using Responsive Classes
```tsx
// Wrong
<p className="text-lg">Description</p> // Always large

// Correct
<p className="text-sm md:text-base lg:text-lg">Description</p>
```

### ❌ Removing Important Classes
```tsx
// Wrong - removing ios-card
<Card className="rounded-md">

// Correct
<Card>
```

---

## Browser Compatibility Check

| Feature | Chrome | Firefox | Safari | Mobile |
|---------|--------|---------|--------|--------|
| Push Notifications | ✅ | ✅ | ✅ | ✅ |
| iOS Theme | ✅ | ✅ | ✅ | ✅ |
| Responsive | ✅ | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ✅ | ✅ | ✅ |
| Animations | ✅ | ✅ | ✅ | ✅ |

---

## Still Having Issues?

**Next Steps:**
1. Check the full documentation files
2. Review the implementation guide
3. Look at example usage in components
4. Contact support with detailed information

---

**Remember:** Most issues are resolved by clearing cache and reloading! 🚀
