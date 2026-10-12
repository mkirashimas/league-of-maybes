/* global importScripts, firebase */
// Firebase Cloud Messaging service worker. It cannot use Vite imports, so it loads the compat SDK
// from the CDN. Keep the version in sync with "firebase" in package.json (currently 12.19.0).
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

// Public web config (same as src/firebase/config.ts).
firebase.initializeApp({
  apiKey: 'AIzaSyA7YrAu7VKoW0WN_GO1FLO8X9U6qS9g-w8',
  authDomain: 'league-of-maybes.firebaseapp.com',
  projectId: 'league-of-maybes',
  storageBucket: 'league-of-maybes.firebasestorage.app',
  messagingSenderId: '393167948351',
  appId: '1:393167948351:web:a918fbeadfd52908e1c68a',
});

// Background pushes with a `notification` payload are shown by the SDK itself. The nudge function
// sets webpush.fcmOptions.link to /roster/{playerId}/chat?nudge=1, which the SDK opens on click.
firebase.messaging();
