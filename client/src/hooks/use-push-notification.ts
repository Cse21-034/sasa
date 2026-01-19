// client/src/hooks/use-push-notification.ts - FIXED VERSION
import { useCallback, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

export function usePushNotification() {
  const { user } = useAuth();

  // Auto-subscribe authenticated users
  useEffect(() => {
    if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
      // Request permission and subscribe after a short delay
      const timer = setTimeout(() => {
        subscribeToPushNotifications();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const subscribeToPushNotifications = useCallback(async () => {
    try {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('⚠️ Push notifications not supported in this browser');
        return false;
      }

      // Request notification permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('❌ Notification permission denied by user');
          return false;
        }
      }

      if (Notification.permission !== 'granted') {
        console.log('❌ Notifications are not permitted');
        return false;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready:', registration);

      // Get VAPID public key from server
      const vapidResponse = await apiRequest('GET', '/api/push/vapid-public-key');
      const { key: vapidPublicKey } = await vapidResponse.json();

      if (!vapidPublicKey) {
        throw new Error('VAPID public key not received from server');
      }

      console.log('🔑 VAPID key received:', vapidPublicKey.substring(0, 20) + '...');

      // Convert base64 string to Uint8Array for PushManager
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        console.log('📝 New push subscription created');
      } else {
        console.log('📝 Using existing push subscription');
      }

      // Send subscription to backend
      const subscribeResponse = await apiRequest('POST', '/api/push/subscribe', {
        subscription: subscription.toJSON(),
        enableNotifications: true,
      });

      if (!subscribeResponse.ok) {
        throw new Error(`Failed to save subscription: ${subscribeResponse.statusText}`);
      }

      console.log('✅ Successfully subscribed to push notifications');
      
      // Show a test notification to confirm it works
      new Notification('Push Notifications Enabled! 🎉', {
        body: 'You will now receive job alerts and messages.',
        icon: '/icon-192.png',
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      return false;
    }
  }, []);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('No push subscription to unsubscribe from');
        return false;
      }

      // Unsubscribe from browser push manager
      const unsubscribed = await subscription.unsubscribe();

      if (unsubscribed) {
        // Notify backend
        const response = await apiRequest('DELETE', '/api/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });

        if (!response.ok) {
          console.warn('Failed to notify backend of unsubscription');
        }
      }

      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }, []);

  const isPushNotificationSupported = useCallback(() => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }, []);

  const isPushNotificationPermitted = useCallback(() => {
    return Notification.permission === 'granted';
  }, []);

  return {
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    isPushNotificationSupported,
    isPushNotificationPermitted,
  };
}
