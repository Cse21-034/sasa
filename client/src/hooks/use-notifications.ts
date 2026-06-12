import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user, refreshAuth } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1000);

  // Fetch all notifications — 30s interval as fallback; WebSocket handles real-time
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  // Fetch unread notification count — same 30s fallback
  const { data: unreadCountData } = useQuery({
    queryKey: ['/api/notifications/unread/count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications/unread/count');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const unreadCount = unreadCountData?.unreadCount || 0;

  // ── Centralised WebSocket with auto-reconnect ──────────────────────────────
  useEffect(() => {
    if (!user) return;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelayRef.current = 1000; // reset backoff on successful connect
        ws.send(JSON.stringify({ type: 'auth', userId: user!.id, userRole: user!.role }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            // ── Chat / notifications (existing) ───────────────────────────
            case 'unread_count':
            case 'message':
            case 'notification':
              queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
              queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
              break;

            // ── Verification approved / rejected ─────────────────────────
            // Server pushes this the instant admin clicks Approve or Reject.
            // We refresh the JWT immediately so user.isVerified is current,
            // then invalidate the verification status query so the UI updates.
            case 'verification:updated':
              refreshAuth();
              queryClient.invalidateQueries({ queryKey: ['verificationStatus', user!.id] });
              queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
              queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
              break;

            // ── New job posted ────────────────────────────────────────────
            // Broadcast from server whenever any requester posts a job.
            // All connected providers/suppliers see the new listing immediately.
            case 'job:created':
              queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
              break;

            default:
              break;
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        // error always precedes close — let onclose handle reconnect
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Exponential backoff: 1s → 2s → 4s → … capped at 30s
        const delay = Math.min(reconnectDelayRef.current, 30_000);
        reconnectDelayRef.current = delay * 2;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [user?.id]); // reconnect only when the logged-in user changes

  // ── Mutations ──────────────────────────────────────────────────────────────
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
