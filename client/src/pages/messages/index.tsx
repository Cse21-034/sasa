import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageSquare, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Messages() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'admin'>('all');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['/api/messages/unread-count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/messages/unread-count');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Setup WebSocket for real-time unread count updates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ 
        type: 'auth', 
        userId: user.id,
        userRole: user.role 
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'unread_count' || data.type === 'message') {
        // Refetch conversations to update counts
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
      }
    };

    return () => ws.close();
  }, [user]);

  const filteredConversations = conversations?.filter((conv: any) => {
    const matchesSearch = conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'unread' && conv.unreadCount > 0) ||
      (filterType === 'admin' && conv.messageType === 'admin_message');
    
    return matchesSearch && matchesFilter;
  });

  const unreadConversations = conversations?.filter((c: any) => c.unreadCount > 0).length || 0;
  const adminConversations = conversations?.filter((c: any) => c.messageType === 'admin_message').length || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 flex-wrap">
          Messages
          {unreadCount?.count > 0 && (
            <Badge variant="destructive" className="text-base md:text-lg">
              {unreadCount.count} new
            </Badge>
          )}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">Your conversations</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mb-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
              <TabsTrigger value="all" className="text-xs md:text-sm">
                All ({conversations?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs md:text-sm">
                Unread ({unreadConversations})
              </TabsTrigger>
              <TabsTrigger value="admin" className="col-span-2 md:col-span-1 text-xs md:text-sm">
                <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Admin ({adminConversations})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-messages"
            />
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-12 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv: any) => (
            <Link 
              key={conv.jobId} 
              href={conv.jobId === 'admin-messages' ? '/messages/admin-chat' : `/messages/${conv.jobId}`}
            >
              <a>
                <Card className={`hover-elevate active-elevate-2 transition-all ${
                  conv.unreadCount > 0 ? 'border-2 border-primary/50 bg-primary/5' : ''
                }`}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12">
                          <AvatarImage src={conv.otherUser?.profilePhotoUrl} />
                          <AvatarFallback>{conv.otherUser?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full animate-pulse">
                            {conv.unreadCount}
                          </div>
                        )}
                        {conv.messageType === 'admin_message' && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-warning text-warning-foreground flex items-center justify-center rounded-full">
                            <Shield className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className={`font-semibold truncate text-sm md:text-base ${
                            conv.unreadCount > 0 ? 'text-primary' : ''
                          }`}>
                            {conv.otherUser?.name}
                          </h3>
                          {conv.messageType === 'admin_message' && (
                            <Badge variant="warning" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs md:text-sm truncate ${
                          conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>
                          {conv.lastMessage}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{conv.jobTitle}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(conv.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <MessageSquare className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {filterType === 'unread' 
                  ? 'You have no unread messages'
                  : filterType === 'admin'
                  ? 'No admin messages'
                  : 'Start a conversation by accepting a job or posting a request'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
