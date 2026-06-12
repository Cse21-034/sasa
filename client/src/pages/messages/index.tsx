import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageSquare, Shield, CheckCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';

function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return days === 1 ? 'Yesterday' : `${days}d`;
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'admin'>('all');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
    refetchInterval: 10000,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['/api/messages/unread-count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/messages/unread-count');
      return res.json();
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', userId: user.id, userRole: user.role }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'unread_count' || data.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
      }
    };
    return () => ws.close();
  }, [user]);

  const filteredConversations = conversations?.filter((conv: any) => {
    const matchesSearch =
      conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'unread' && conv.unreadCount > 0) ||
      (filterType === 'admin' && conv.messageType === 'admin_message');
    return matchesSearch && matchesFilter;
  });

  const unreadConversations = conversations?.filter((c: any) => c.unreadCount > 0).length || 0;
  const adminConversations  = conversations?.filter((c: any) => c.messageType === 'admin_message').length || 0;

  const tabs: { key: 'all' | 'unread' | 'admin'; label: string; count: number }[] = [
    { key: 'all',    label: 'All',    count: conversations?.length || 0 },
    { key: 'unread', label: 'Unread', count: unreadConversations },
    { key: 'admin',  label: 'Admin',  count: adminConversations },
  ];

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Sticky header ── */}
      <div className="sticky top-14 md:top-20 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 pt-4 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-tight">
              Messages
              {unreadCount?.count > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                  {unreadCount.count}
                </span>
              )}
            </h1>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search conversations…"
              className="pl-9 h-9 text-sm rounded-full bg-muted/60 border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterType === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.key === 'admin' && <Shield className="h-3 w-3" />}
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] ${filterType === tab.key ? 'opacity-80' : 'opacity-60'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div className="max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-8 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv: any) => (
            <Link
              key={conv.jobId}
              href={conv.jobId === 'admin-messages' ? '/messages/admin-chat' : `/messages/${conv.jobId}`}
            >
              <a className={`flex items-center gap-3 px-4 py-3.5 border-b border-border/30 transition-colors active:bg-muted/60 hover:bg-muted/30 ${
                conv.unreadCount > 0 ? 'bg-primary/[0.03]' : ''
              }`}>
                {/* Avatar + online/unread dot */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.otherUser?.profilePhotoUrl} />
                    <AvatarFallback className="text-sm font-semibold">
                      {conv.otherUser?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.messageType === 'admin_message' && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-amber-500 flex items-center justify-center rounded-full ring-2 ring-background">
                      <Shield className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className={`text-sm leading-snug truncate ${conv.unreadCount > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground/90'}`}>
                      {conv.otherUser?.name}
                    </span>
                    <span className={`text-[11px] flex-shrink-0 ${conv.unreadCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {timeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[13px] truncate leading-snug ${
                      conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <span className="flex-shrink-0 h-5 min-w-[1.25rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{conv.jobTitle}</p>
                </div>
              </a>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No conversations</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {filterType === 'unread'
                ? 'No unread messages right now'
                : filterType === 'admin'
                ? 'No admin messages'
                : 'Conversations appear here once you connect on a job'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
