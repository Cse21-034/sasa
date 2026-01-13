import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications');
      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds (faster than before)
  });

  // Fetch unread notification count
  const { data: unreadCountData } = useQuery({
    queryKey: ['/api/notifications/unread/count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications/unread/count');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const unreadCount = unreadCountData?.unreadCount || 0;

  // WebSocket setup for real-time notification updates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('🔗 WebSocket connected for notifications');
      ws.send(JSON.stringify({ 
        type: 'auth', 
        userId: user.id,
        userRole: user.role 
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Refetch notifications immediately when any message or notification event arrives
      if (data.type === 'unread_count' || data.type === 'message' || data.type === 'notification') {
        console.log('📬 Notification update received via WebSocket, refetching...', data.type);
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [user, queryClient]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/notifications/read-all');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiRequest('DELETE', `/api/notifications/${notificationId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  return {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    markAsRead: (notificationId: string) => markAsReadMutation.mutate(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (notificationId: string) => deleteNotificationMutation.mutate(notificationId),
  };
}
