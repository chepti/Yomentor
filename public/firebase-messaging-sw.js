/* Firebase Messaging SW - נוצר אוטומטית */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "REPLACE",
  authDomain: "REPLACE",
  projectId: "REPLACE",
  storageBucket: "REPLACE",
  messagingSenderId: "REPLACE",
  appId: "REPLACE"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const d = payload.data || {};
  const url = d.url || '/write';
  const opts = {
    body: n.body || '',
    icon: '/logo-pisga.png',
    image: n.image,
    data: { url },
    dir: 'rtl',
  };
  return self.registration.showNotification(n.title || 'יומנטור', opts);
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/write';
  const fullUrl = url.startsWith('http') ? url : self.location.origin + url;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    if (list.length > 0) {
      list[0].navigate(fullUrl);
      list[0].focus();
    } else {
      clients.openWindow(fullUrl);
    }
  }));
});
