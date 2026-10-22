import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from "path";
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  plugins: [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate',
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.js',
    manifest: {
      name: 'ManologAI',
      short_name: 'ManologAI',
      description: 'Advanced Agentic Personal Growth Platform',
      start_url: '/',
      scope: '/',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'fullscreen',
      display_override: ['fullscreen', 'standalone'],
      orientation: 'portrait',
      icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }]

    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
    }
  })],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
