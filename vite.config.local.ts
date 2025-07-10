import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Local development configuration
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: true,
    allowedHosts: ['localhost', '127.0.0.1', 'timsablab.com', 'timsablab.ddns.net'],
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/private-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certificate.pem')),
    }
  },
  plugins: [react()],
  define: {
    // Local development API URLs
    'process.env.VITE_API_BASE_URL': JSON.stringify('https://localhost:3001'),
    'process.env.VITE_WS_URL': JSON.stringify('wss://localhost:3001'),
    'process.env.VITE_AUTH_URL': JSON.stringify('https://localhost:3002')
  }
})
