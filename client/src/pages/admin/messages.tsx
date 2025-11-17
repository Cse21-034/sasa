// client/src/pages/admin/messages.tsx - NEW ADMIN MESSAGES LIST

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Send, ArrowLeft, Shield, Search, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';


// --- ADMIN MESSAGES LIST COMPONENT ---
function AdminMessagesList() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['adminConversations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/conversations');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const filteredConversations = conversations?.filter((conv: any) =>
    conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-7 w-7 text-warning" />
          Admin Messages
        </h1>
        <p className="text-muted-foreground">Communicate with users about reports and issues</p>
      </div>

      {/* Search */}
      <Card className="mb-6 border-2">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conversations */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv: any) => (
            <Link key={conv.userId} href={`/admin/messages/${conv.userId}`}>
              <a>
                <Card className="hover-elevate transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.user?.profilePhotoUrl} />
                        <AvatarFallback>{conv.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{conv.user?.name}</h3>
                          <Badge variant="outline" className="capitalize">
                            {conv.user?.role}
                          </Badge>
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive">{conv.unreadCount} new</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
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
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


// --- ADMIN CHAT DETAIL COMPONENT (Exported as default) ---

export function AdminChatDetail() {
  const [, params] = useRoute('/admin/messages/:userId');
  const { user } =  useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [ws, setWs] = useState<WebSocket | null>(null);

  const userId = params?.userId;

  // Get user details
  const { data: targetUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      // 🚨 FIX: Using the /api/admin/users endpoint to fetch user details
      const res = await apiRequest('GET', `/api/admin/users`);
      const users = await res.json();
      return users.find((u: any) => u.id === userId);
    },
    enabled: !!userId,
  });

  // Get admin messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['adminMessages', userId],
    queryFn: async () => {
      // 🚨 FIX: Use the new route that correctly filters messages by target userId in the backend (Issue 1)
      const res = await apiRequest('GET', `/api/admin/messages/${userId}`); 
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 3000,
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      // 🚨 FIX: Send dedicated admin message payload
      const res = await apiRequest('POST', '/api/admin/messages', {
        receiverId: userId,
        messageText: text,
        messageType: 'admin_message',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages', userId] });
      queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
      setMessageText('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // 🚨 FIX: Using config.apiUrl to correctly build WebSocket URL if not on same host
    const apiUrl = queryClient.getQueryData(['/api/config']) || window.location.host;
    const wsUrl = apiUrl.toString().replace('http', 'ws');
    const websocket = new WebSocket(`${wsUrl}/ws`);

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ 
        type: 'auth', 
        userId: user.id,
        userRole: user.role 
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        // Only invalidate if the message is from or to the current user
        if (data.payload.senderId === userId || data.payload.receiverId === userId) {
            queryClient.invalidateQueries({ queryKey: ['adminMessages', userId] });
            queryClient.invalidateQueries({ queryKey: ['adminConversations'] });
        }
      }
    };

    setWs(websocket);

    return () => websocket.close();
  }, [user, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Invalidate conversation list when chat opens to clear badge on desktop header
    queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive font-semibold">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!targetUser) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col">
            <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
            <Card><CardContent className="p-12 text-center">User not found</CardContent></Card>
        </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl h-[calc(100vh-8rem)]">
      <Card className="h-full flex flex-col border-2">
        {/* Header */}
        <CardHeader className="border-b bg-warning/10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={targetUser?.profilePhotoUrl} />
              <AvatarFallback>{targetUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{targetUser?.name}</h2>
                <Badge variant="warning" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Support
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{targetUser?.email}</p>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
            ))
          ) : messages && messages.length > 0 ? (
            messages.map((message: any) => {
              const isSender = message.senderId === user.id;
              const isAdmin = message.sender?.role === 'admin';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div className="flex flex-col max-w-[70%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isAdmin
                          ? 'bg-warning text-warning-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {isAdmin && (
                        <div className="flex items-center gap-1 mb-1">
                          <Shield className="h-3 w-3" />
                          <span className="text-xs font-semibold">Admin Support</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.messageText}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isAdmin ? 'text-warning-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Shield className="h-12 w-12 mx-auto text-warning mb-4" />
                <p className="text-muted-foreground">
                  Start a conversation with {targetUser?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Messages will be marked as Admin Support
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4 bg-warning/5">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message as Admin..."
              className="flex-1 border-warning/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default AdminMessagesList;
