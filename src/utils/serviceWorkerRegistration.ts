// Service Worker registration & Transaction Push Notification Utilities

export interface NotificationPermissionState {
  isSupported: boolean;
  permission: NotificationPermission;
  swRegistered: boolean;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers the Service Worker (/sw.js)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    swRegistration = registration;
    console.log('[SW Registration] Service Worker registered successfully with scope:', registration.scope);

    // Listen for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW Registration] New SW content available; please refresh.');
            } else {
              console.log('[SW Registration] Content cached for offline use.');
            }
          }
        };
      }
    };

    return registration;
  } catch (error) {
    console.error('[SW Registration] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Gets current Notification permission state
 */
export function getNotificationPermissionState(): NotificationPermissionState {
  const isSupported = 'serviceWorker' in navigator && 'Notification' in window;
  const permission = isSupported ? Notification.permission : 'denied';
  const swRegistered = !!swRegistration;

  return {
    isSupported,
    permission,
    swRegistered
  };
}

/**
 * Requests browser permission for Push Notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    alert('এই ব্রাউজারে নোটিফিকেশন সুবিধা নেই। (Notifications not supported)');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push Notification] Permission response:', permission);

    if (permission === 'granted') {
      // Ensure service worker is registered
      await registerServiceWorker();
    }

    return permission;
  } catch (error) {
    console.error('[Push Notification] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Trigger a transaction notification through the Service Worker
 */
export async function showTransactionNotification(options: {
  title: string;
  body: string;
  orderId?: string;
  status?: 'Pending' | 'Success' | 'Failed' | 'Rejected';
  type?: string;
}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('[Push Notification] Permission not granted, skipping browser push notification.');
    return;
  }

  if (!swRegistration) {
    swRegistration = await registerServiceWorker();
  }

  if (swRegistration) {
    // Attempt sending via postMessage to active Service Worker controller
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_TRANSACTION_NOTIFICATION',
        ...options
      });
    } else if (swRegistration.active) {
      swRegistration.active.postMessage({
        type: 'TRIGGER_TRANSACTION_NOTIFICATION',
        ...options
      });
    } else {
      // Direct call on swRegistration
      const notifTitle = options.title || 'ট্রানজেকশন আপডেট (Transaction Update)';
      swRegistration.showNotification(notifTitle, {
        body: options.body,
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        vibrate: [200, 100, 200],
        tag: `order-${options.orderId || Date.now()}`,
        renotify: true,
        data: {
          url: '/#history',
          orderId: options.orderId,
          status: options.status
        }
      } as any);
    }
  } else {
    // Fallback to standard Notification constructor if SW failed
    try {
      if (window.Notification) {
        new window.Notification(options.title, {
          body: options.body,
          icon: '/pwa-192.png'
        });
      }
    } catch (e) {
      console.error('Fallback Notification failed:', e);
    }
  }
}

/**
 * Triggers a test notification to verify the Service Worker implementation
 */
export async function triggerTestPushNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  if (!swRegistration) {
    swRegistration = await registerServiceWorker();
  }

  if (swRegistration) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TEST_PUSH_NOTIFICATION'
      });
      return true;
    } else if (swRegistration.active) {
      swRegistration.active.postMessage({
        type: 'TEST_PUSH_NOTIFICATION'
      });
      return true;
    } else {
      await swRegistration.showNotification('🔔 টেস্ট পুশ নোটিফিকেশন (Test Notification)', {
        body: 'সার্ভিস ওয়ার্কারের মাধ্যমে নোটিফিকেশন কাজ করছে!',
        vibrate: [100, 100, 100]
      } as any);
      return true;
    }
  }
  return false;
}
