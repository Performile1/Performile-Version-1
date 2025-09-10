import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables with VITE_ prefix
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: env.VITE_BASE_URL || '/',
    root: process.cwd(),
    publicDir: 'public',
    plugins: [
      react(),
      tsconfigPaths({
        loose: true
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Performile',
          short_name: 'Performile',
          description: 'Logistics Performance Platform',
          theme_color: '#1976d2',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true
    },
    preview: {
      port: 3000,
      strictPort: true,
      host: true
    },
    build: {
      assetsDir: 'assets',
      emptyOutDir: true,
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('@mui')) return 'vendor_mui';
              if (id.includes('react')) return 'vendor_react';
              if (id.includes('@stripe')) return 'vendor_stripe';
              return 'vendor';
            }
            return null;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][ext]'
        }
      }
    }
  };
});
