import { Platform } from 'react-native';

/**
 * Register the service worker for PWA functionality.
 * Only runs on web platform.
 */
export function registerServiceWorker() {
  if (Platform.OS !== 'web') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);

          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60 * 1000);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}
