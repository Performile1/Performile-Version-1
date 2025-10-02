import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    base: env.VITE_BASE_URL || '/',
    publicDir: 'public',
    define: { 'process.env': {} },
    
    plugins: [
      react(),
      tsconfigPaths({ loose: true }),
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
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      emptyOutDir: true,
      target: 'es2020',
      rollupOptions: {
        input: 'index.html',
        output: {
          manualChunks: undefined,
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash][ext]'
        }
      }
    }
  };
});
