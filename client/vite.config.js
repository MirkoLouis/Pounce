import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🐾 Proxy Error:', err); 
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🐾 Proxying Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => { 
            console.log('🐾 Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/socket.io': {
        target: 'http://0.0.0.0:5000',
        ws: true, // Enable WebSocket proxying
      },
    },
    hmr: {
      clientPort: 5173, // Ensure HMR works across the proxy
    }
  }
})
