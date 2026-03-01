/* נוצר אוטומטית מ-.env - אל תערוך ידנית */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "REPLACE_IN_ENV",
  authDomain: "REPLACE_IN_ENV",
  projectId: "REPLACE_IN_ENV",
  storageBucket: "REPLACE_IN_ENV",
  messagingSenderId: "REPLACE_IN_ENV",
  appId: "REPLACE_IN_ENV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (title || body) {
    self.registration.showNotification(title || 'התראה', {
      body: body || '',
      icon: '/logo-pisga.png',
      dir: 'rtl'
    });
  }
});
