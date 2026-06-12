import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Send, ArrowLeft, Phone, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();

  const { data: job } = useQuery({
    queryKey: ['/api/jobs', params?.jobId],
    enabled: !!params?.jobId,
  });

  const { data: messages, isLoading } = useQuery<(Message & { sender: any })[]>({
    queryKey: ['/api/messages', params?.jobId],
    enabled: !!params?.jobId,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest('POST', '/api/messages', { jobId: params?.jobId, messageText: text });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/messages', params?.jobId] });
      setMessageText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiRequest('POST', `/api/messages/job/${jobId}/read-all`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      qc.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages && params?.jobId) markReadMutation.mutate(params.jobId);
  }, [messages, params?.jobId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim()) sendMessageMutation.mutate(messageText.trim());
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const otherUser = job?.requesterId === user?.id ? job?.provider : job?.requester;

  function formatMsgTime(date: any) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function isSameDay(a: any, b: any) {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }

  function dayLabel(date: any) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
  }

  return (
    <div
      className="flex flex-col bg-background"
      style={{ height: 'calc(100dvh - 56px - 60px - env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Chat header ── */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/50 bg-background/95 backdrop-blur-md flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="h-9 w-9 rounded-full flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={otherUser?.profilePhotoUrl} />
          <AvatarFallback className="text-sm font-bold">{otherUser?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{otherUser?.name || '…'}</p>
          <p className="text-[11px] text-muted-foreground truncate">{job?.title || '…'}</p>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-2`}>
              <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
            </div>
          ))
        ) : messages && messages.length > 0 ? (
          messages.map((message, idx) => {
            const isSender = message.senderId === user?.id;
            const prevMsg = messages[idx - 1];
            const showDay = !prevMsg || !isSameDay(prevMsg.createdAt as any, message.createdAt as any);
            const prevSameSender = prevMsg && prevMsg.senderId === message.senderId && !showDay;

            return (
              <div key={message.id}>
                {showDay && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-0.5 rounded-full">
                      {dayLabel(message.createdAt as any)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} ${prevSameSender ? 'mt-0.5' : 'mt-2'}`}>
                  <div
                    className={`max-w-[78%] md:max-w-[60%] px-3.5 py-2 break-words ${
                      isSender
                        ? 'bg-primary text-primary-foreground rounded-t-2xl rounded-l-2xl rounded-br-sm'
                        : 'bg-muted rounded-t-2xl rounded-r-2xl rounded-bl-sm'
                    }`}
                  >
                    <p className="text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap">{message.messageText}</p>
                    <p className={`text-[10px] mt-0.5 text-right ${isSender ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {formatMsgTime(message.createdAt as any)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center">
              <Send className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background px-3 py-2.5">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            className="flex-1 resize-none text-sm rounded-2xl border-border/60 bg-muted/40 px-4 py-2.5 min-h-[40px] max-h-[120px] focus-visible:ring-1 leading-[1.4]"
            data-testid="input-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
            className="h-10 w-10 rounded-full flex-shrink-0 mb-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
