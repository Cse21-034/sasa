import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      setDismissed(true);
      return;
    }

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Handle beforeinstallprompt event (Android & Desktop)
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      
      // Don't show if dismissed already
      if (!sessionStorage.getItem('install-prompt-dismissed')) {
        setShowPrompt(true);
      }
    };

    // Show prompt for iOS users
    if (isIOSDevice) {
      // Check if not already dismissed
      if (!sessionStorage.getItem('install-prompt-dismissed')) {
        setShowPrompt(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt?.();
      const { outcome } = await deferredPrompt.userChoice!;
      
      if (outcome === 'accepted') {
        console.log('✅ User installed the app');
        setShowPrompt(false);
      } else {
        console.log('❌ User dismissed install prompt');
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('install-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  // Don't show if installed or dismissed or not applicable
  if (isInstalled || !showPrompt || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">Install JobTradeSasa</h3>
                <p className="text-xs text-blue-100 mt-1">
                  {isIOS 
                    ? 'Get quick access to your app with one tap. Tap Share, then Add to Home Screen.'
                    : 'Get quick access to your app with one tap. Install now for the best experience!'}
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-blue-100 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isIOS && (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 bg-white text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                >
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="flex-1 border-blue-300 text-white hover:bg-blue-600 text-xs font-semibold"
                >
                  Maybe Later
                </Button>
              </div>
            )}

            {isIOS && (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  className="flex-1 bg-white text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                >
                  Got It
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
