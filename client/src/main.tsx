// client/src/main.tsx - FIXED VERSION
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA and Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    })
      .then((registration) => {
        console.log('✅ ServiceWorker registered successfully:', registration.scope);
        
        // Check if already subscribed to push
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) {
            console.log('📱 Already subscribed to push notifications');
          } else {
            console.log('📱 Not yet subscribed to push notifications');
          }
        });
      })
      .catch((error) => {
        console.error('❌ ServiceWorker registration failed:', error);
      });
  });

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker updated, reloading page...');
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
