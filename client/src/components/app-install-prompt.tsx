import { useState, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-provider';

interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface IOSDevice {
  device: 'iPhone' | 'iPad' | 'iPod';
  version?: string;
}

export function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [iosInfo, setIosInfo] = useState<IOSDevice | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<'safari' | 'chrome' | 'firefox' | 'other'>('other');
  const { theme } = useTheme();

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

    // Detect browser
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      setBrowserInfo('safari');
    } else if (userAgent.includes('chrome')) {
      setBrowserInfo('chrome');
    } else if (userAgent.includes('firefox')) {
      setBrowserInfo('firefox');
    }

    // Detect iOS
    const iosMatch = userAgent.match(/(iphone|ipad|ipod).*os (\d+)/);
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       (!(window as any).MSStream || userAgent.includes('iphone') || userAgent.includes('ipad'));
    
    if (isIOSDevice) {
      const device = userAgent.includes('ipad') ? 'iPad' : userAgent.includes('ipod') ? 'iPod' : 'iPhone';
      const version = iosMatch?.[2];
      setIosInfo({ device, version });
      
      // Show iOS prompt
      if (!sessionStorage.getItem('install-prompt-dismissed')) {
        setShowPrompt(true);
      }
    } else {
      // Not iOS, check for Android
      setIsAndroid(/android/i.test(navigator.userAgent));
    }

    // Handle beforeinstallprompt event (Android & Desktop Chrome/Edge)
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      
      // Show prompt on Android
      if (/android/i.test(navigator.userAgent)) {
        if (!sessionStorage.getItem('install-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt?.();
        const { outcome } = await deferredPrompt.userChoice!;
        
        if (outcome === 'accepted') {
          console.log('✅ User installed the app');
          setShowPrompt(false);
        } else {
          console.log('❌ User dismissed install prompt');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install prompt error:', error);
      }
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('install-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  // Don't show if installed or dismissed
  if (isInstalled || !showPrompt || dismissed) {
    return null;
  }

  // iOS Instructions
  if (iosInfo) {
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
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white rounded-lg shadow-2xl p-4 border border-slate-700 dark:border-slate-500 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Share2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Install JobTradeSasa</h3>
                  <div className="text-xs text-slate-300 dark:text-slate-200 mt-2 space-y-2">
                    <p>Add our app to your home screen in 3 steps:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Tap the <span className="font-semibold text-blue-400">Share</span> button</li>
                      <li>Select <span className="font-semibold text-blue-400">Add to Home Screen</span></li>
                      <li>Tap <span className="font-semibold text-blue-400">Add</span> to install</li>
                    </ol>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold"
                >
                  Got It
                </Button>
                <Button
                  onClick={() => {
                    // Try to open share menu if supported
                    if (navigator.share) {
                      navigator.share({
                        title: 'JobTradeSasa',
                        text: 'Install JobTradeSasa app on your home screen',
                        url: window.location.href,
                      }).catch(err => console.log('Share cancelled:', err));
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1 border-blue-500 text-white hover:bg-blue-600/20 dark:hover:bg-blue-600/20 text-xs font-semibold bg-blue-600/10"
                >
                  Show Me How
                </Button>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                {iosInfo.device} ({browserInfo === 'safari' ? 'Safari' : 'Browser'})
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Android/Desktop PWA Installation Prompt (using beforeinstallprompt)
  if (deferredPrompt || isAndroid) {
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
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 text-white rounded-lg shadow-2xl p-4 border border-slate-700 dark:border-slate-500 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-400" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Install JobTradeSasa</h3>
                  <p className="text-xs text-slate-300 dark:text-slate-200 mt-1">
                    Get quick access to your app with one tap. Install now for the best experience!
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleInstall}
                  disabled={!deferredPrompt}
                  size="sm"
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold disabled:opacity-50"
                >
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="flex-1 border-slate-600 dark:border-slate-500 text-white hover:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold"
                >
                  Maybe Later
                </Button>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                {browserInfo === 'chrome' ? 'Chrome' : browserInfo === 'firefox' ? 'Firefox' : 'Browser'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
}
