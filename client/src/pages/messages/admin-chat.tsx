import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, ArrowLeft, Shield, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminChatUserView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // The logic here relies on the backend's getAdminChatMessages which fetches messages
  // where senderId is user OR senderId is Admin AND receiverId is user.
  const { data: messages, isLoading } = useQuery({
    queryKey: ['userAdminMessages'],
    queryFn: async () => {
      // Endpoint is the Admin chat endpoint, using the current user's ID as the target/other user
      const res = await apiRequest('GET', `/api/admin/messages/${user?.id}`); 
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      // When the user (reporter) sends a message, they send it via the /api/messages/admin-chat 
      // endpoint which knows to forward it to the primary admin.
      
      const res = await apiRequest('POST', '/api/messages/admin-chat', {
        messageText: text,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAdminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] }); // Update conversation list
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
  
  const markReadMutation = useMutation({
      mutationFn: async () => {
        // Endpoint to mark all admin messages read for the current user
        await apiRequest('POST', `/api/messages/admin-chat/read-all`, {});
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] }); 
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
      },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark as read whenever messages load successfully
    if (messages && user?.id) {
      markReadMutation.mutate();
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const isReporter = user?.role === 'requester' || user?.role === 'provider' || user?.role === 'supplier';
  
  if (!isReporter) {
      return <Alert variant="destructive">Not authorized to view admin chat.</Alert>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl h-[calc(100vh-8rem)]">
      <Card className="h-full flex flex-col border-2">
        {/* Header */}
        <CardHeader className="border-b bg-primary/10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 bg-warning text-warning-foreground">
              <AvatarFallback><Shield className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Admin Support</h2>
                <Badge variant="warning" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Staff
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Private and secure channel</p>
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
              const isSender = message.senderId === user!.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div className="flex flex-col max-w-[70%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isSender
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {!isSender && (
                        <div className="flex items-center gap-1 mb-1">
                          <Shield className="h-3 w-3 text-warning" />
                          <span className="text-xs font-semibold text-warning">Admin</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.messageText}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
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
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  This is a private chat with the Admin team.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Start by asking about your report or issue.
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4 bg-primary/5">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message to Admin Support..."
              className="flex-1 border-primary/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
