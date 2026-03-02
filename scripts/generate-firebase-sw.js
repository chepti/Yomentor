/**
 * יוצר firebase-messaging-sw.js מ-.env
 * Firebase משתמש בקובץ זה כ-Service Worker נפרד להתראות
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPath = resolve(root, '.env')
const outPath = resolve(root, 'public', 'firebase-messaging-sw.js')

const env = {}
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const m = line.match(/^VITE_FIREBASE_(\w+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

const config = {
  apiKey: env.API_KEY || 'REPLACE',
  authDomain: env.AUTH_DOMAIN || 'REPLACE',
  projectId: env.PROJECT_ID || 'REPLACE',
  storageBucket: env.STORAGE_BUCKET || 'REPLACE',
  messagingSenderId: env.MESSAGING_SENDER_ID || 'REPLACE',
  appId: env.APP_ID || 'REPLACE',
}

const swContent = `/* Firebase Messaging SW - נוצר אוטומטית */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${config.apiKey}",
  authDomain: "${config.authDomain}",
  projectId: "${config.projectId}",
  storageBucket: "${config.storageBucket}",
  messagingSenderId: "${config.messagingSenderId}",
  appId: "${config.appId}"
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
`

writeFileSync(outPath, swContent)
console.log('firebase-messaging-sw.js נוצר')
