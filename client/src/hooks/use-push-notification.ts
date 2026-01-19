import { useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function usePushNotification() {
  const subscribeToPushNotifications = useCallback(async () => {
    try {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported in this browser');
        return false;
      }

      // Request notification permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied by user');
          return false;
        }
      }

      if (Notification.permission !== 'granted') {
        console.log('Notifications are not permitted');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const vapidResponse = await apiRequest('GET', '/api/push/vapid-public-key');
      const { key: vapidPublicKey } = await vapidResponse.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Send subscription to backend
      const subscribeResponse = await apiRequest('POST', '/api/push/subscribe', {
        subscription: subscription.toJSON(),
      });

      if (!subscribeResponse.ok) {
        throw new Error(`Failed to save subscription: ${subscribeResponse.statusText}`);
      }

      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
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
