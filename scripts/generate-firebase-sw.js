/**
 * יוצר את firebase-messaging-sw.js מתוך .env
 * יש להריץ לפני build: node scripts/generate-firebase-sw.js
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
  apiKey: env.API_KEY || 'REPLACE_IN_ENV',
  authDomain: env.AUTH_DOMAIN || 'REPLACE_IN_ENV',
  projectId: env.PROJECT_ID || 'REPLACE_IN_ENV',
  storageBucket: env.STORAGE_BUCKET || 'REPLACE_IN_ENV',
  messagingSenderId: env.MESSAGING_SENDER_ID || 'REPLACE_IN_ENV',
  appId: env.APP_ID || 'REPLACE_IN_ENV',
}

const swContent = `/* נוצר אוטומטית מ-.env - אל תערוך ידנית */
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
  const { title, body } = payload.notification || {};
  if (title || body) {
    self.registration.showNotification(title || 'התראה', {
      body: body || '',
      icon: '/logo-pisga.png',
      dir: 'rtl'
    });
  }
});
`

if (config.apiKey === 'REPLACE_IN_ENV') {
  console.warn('אזהרה: .env חסר או לא מלא. וודאי ש-VITE_FIREBASE_* מוגדרים. התראות לא יעבדו עד אז.')
}
writeFileSync(outPath, swContent)
console.log('firebase-messaging-sw.js נוצר בהצלחה')
