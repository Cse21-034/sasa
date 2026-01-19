import { useState } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotification } from '@/hooks/use-push-notification';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PushNotificationTest() {
  const { 
    subscribeToPushNotifications, 
    unsubscribeFromPushNotifications,
    isPushNotificationSupported,
    isPushNotificationPermitted
  } = usePushNotification();
  
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    const success = await subscribeToPushNotifications();
    setIsLoading(false);
    
    if (success) {
      setIsSubscribed(true);
      toast({
        title: "✅ Subscribed!",
        description: "You will now receive push notifications.",
      });
    } else {
      toast({
        title: "❌ Subscription Failed",
        description: "Could not subscribe to push notifications.",
        variant: "destructive",
      });
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    const success = await unsubscribeFromPushNotifications();
    setIsLoading(false);
    
    if (success) {
      setIsSubscribed(false);
      toast({
        title: "Unsubscribed",
        description: "You will no longer receive push notifications.",
      });
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/push/test', {});
      const data = await response.json();
      
      toast({
        title: data.success ? "✅ Test Sent!" : "❌ Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPushNotificationSupported()) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Not Supported
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Test push notification functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm">
            <strong>Status:</strong> {isPushNotificationPermitted() ? '✅ Permitted' : '❌ Not Permitted'}
          </div>
          <div className="text-sm">
            <strong>Subscribed:</strong> {isSubscribed ? '✅ Yes' : '❌ No'}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!isSubscribed ? (
            <Button 
              onClick={handleSubscribe} 
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Subscribing...' : 'Enable Push Notifications'}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleTestNotification} 
                disabled={isLoading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </Button>
              
              <Button 
                onClick={handleUnsubscribe} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <BellOff className="h-4 w-4 mr-2" />
                {isLoading ? 'Unsubscribing...' : 'Disable Notifications'}
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>How to test:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Click "Enable Push Notifications"</li>
            <li>Grant permission when prompted</li>
            <li>Click "Send Test Notification"</li>
            <li>You should see a notification appear</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
