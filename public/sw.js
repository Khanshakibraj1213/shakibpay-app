// Service Worker for Transaction Push Notifications
const CACHE_NAME = 'payfly-sw-v1';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Handle push events from Web Push server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);
  
  let payload = {
    title: 'ট্রানজেকশন আপডেট (Transaction Update)',
    body: 'আপনার অর্ডারের স্ট্যাটাস আপডেট হয়েছে।',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    url: '/',
    tag: 'transaction-update-' + Date.now()
  };

  if (event.data) {
    try {
      const dataJson = event.data.json();
      payload = { ...payload, ...dataJson };
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-192.png',
    badge: payload.badge || '/pwa-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/',
      orderId: payload.orderId,
      status: payload.status,
      timestamp: Date.now()
    },
    tag: payload.tag || 'transaction-notification',
    renotify: true,
    actions: [
      { action: 'view_details', title: 'বিস্তারিত দেখুন (View)' },
      { action: 'dismiss', title: 'ডিমিস (Dismiss)' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Handle postMessage from main client thread to trigger browser notifications via SW
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message Received:', event.data);

  if (!event.data) return;

  if (event.data.type === 'TRIGGER_TRANSACTION_NOTIFICATION') {
    const { title, body, orderId, status, type } = event.data;

    const notifTitle = title || (status === 'Success' 
      ? '🎉 ট্রানজেকশন সফল হয়েছে!' 
      : status === 'Failed' || status === 'Rejected'
      ? '❌ ট্রানজেকশন বাতিল হয়েছে' 
      : '⏳ ট্রানজেকশন পেন্ডিং');

    const notifBody = body || `আপনার অর্ডার #${orderId || ''} (${type || ''}) স্ট্যাটাস: ${status}`;

    const options = {
      body: notifBody,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      vibrate: status === 'Success' ? [100, 50, 100, 50, 100] : [200, 100, 200],
      tag: `order-${orderId || Date.now()}`,
      renotify: true,
      data: {
        url: '/#history',
        orderId: orderId,
        status: status,
        timestamp: Date.now()
      },
      actions: [
        { action: 'open_history', title: 'হিস্ট্রি দেখুন (View History)' },
        { action: 'close', title: 'বন্ধ করুন' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(notifTitle, options)
    );
  }

  if (event.data.type === 'TEST_PUSH_NOTIFICATION') {
    const options = {
      body: 'সার্ভিস ওয়ার্কারের মাধ্যমে নোটিফিকেশন সিস্টেম সঠিকভাবে কাজ করছে! (Push Notification Working)',
      vibrate: [100, 100, 100],
      tag: 'test-notification',
      data: { url: '/' }
    };

    event.waitUntil(
      self.registration.showNotification('🔔 টেস্ট পুশ নোটিফিকেশন (Test Notification)', options)
    );
  }
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification Clicked:', event.notification.tag, event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            orderId: event.notification.data?.orderId
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
