import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite configuration
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
        target: 'http://0.0.0.0:5050',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable Socket.io support
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
    },
    hmr: {
      clientPort: 5173, // Fix HMR through proxy
    }
  }
})
