import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 🚨 FIXED: Imported useMutation and useQueryClient
import { useRoute } from 'wouter';
import { Send, ArrowLeft, Paperclip, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Message } from '@shared/schema';

export default function Chat() {
  const [, params] = useRoute('/messages/:jobId');
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { data: job } = useQuery({
    queryKey: ['/api/jobs', params?.jobId],
    enabled: !!params?.jobId,
  });

  const { data: messages, isLoading } = useQuery<(Message & { sender: any })[]>({
    queryKey: ['/api/messages', params?.jobId],
    enabled: !!params?.jobId,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest('POST', '/api/messages', {
        jobId: params?.jobId,
        messageText: text,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', params?.jobId] });
      setMessageText('');
      
      // Request notification permission and show push notification if possible
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        } else if (Notification.permission === 'granted') {
          new Notification('Message Sent', {
            body: 'Your message has been sent successfully.',
            icon: '/favicon.ico'
          });
        }
      }
    },
  });
  
const markReadMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiRequest('POST', `/api/messages/job/${jobId}/read-all`, {});
    },
    onSuccess: () => {
      // 🚨 FIXED: Invalidate global conversation list/count to update the badge immediately
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
  });
  
useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark as read whenever messages load successfully
    if (messages && params?.jobId) {
      markReadMutation.mutate(params.jobId);
    }
  }, [messages, params?.jobId]); // Removed markReadMutation from dependency list


  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const otherUser = job?.requesterId === user?.id ? job?.provider : job?.requester;

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-4xl h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)]">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="border-b p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back" className="h-8 w-8 md:h-10 md:w-10">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarImage src={otherUser?.profilePhotoUrl} />
              <AvatarFallback>{otherUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm md:text-base truncate">{otherUser?.name}</h2>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{job?.title}</p>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <Skeleton className="h-12 md:h-16 w-40 md:w-64 rounded-2xl" />
              </div>
            ))
          ) : messages && messages.length > 0 ? (
            messages.map((message) => {
              const isSender = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2 break-words ${
                      isSender
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs md:text-sm leading-relaxed">{message.messageText}</p>
                    <p
                      className={`text-[10px] md:text-xs mt-1 ${
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
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-xs md:text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-2 md:p-4">
          <form onSubmit={handleSendMessage} className="flex gap-1 md:gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-xs md:text-sm h-9 md:h-10"
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
