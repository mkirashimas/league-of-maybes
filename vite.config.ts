import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed port: the Firebase browser API key only allows http://localhost:5173/* as a dev referrer.
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  build: {
    // The Firebase core chunk (App, Auth, Firestore, App Check) is ~550 kB; everything else stays well below.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Vendor libraries in their own long-lived chunks; app features are split by route.
        codeSplitting: {
          groups: [
            // AI Logic and Messaging are used by the chat feature only: keep them out of startup.
            { name: 'firebase-ai', test: /node_modules[\\/]@firebase[\\/]ai[\\/]/, priority: 2 },
            {
              name: 'firebase-messaging',
              test: /node_modules[\\/]@firebase[\\/]messaging[\\/]/,
              priority: 2,
            },
            // Functions are called from the Account page only.
            {
              name: 'firebase-functions',
              test: /node_modules[\\/]@firebase[\\/]functions[\\/]/,
              priority: 2,
            },
            {
              name: 'firebase',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 1,
            },
            { name: 'mui', test: /node_modules[\\/](@mui|@emotion)[\\/]/ },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
