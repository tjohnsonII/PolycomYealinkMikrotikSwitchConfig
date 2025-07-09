import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: true,
    allowedHosts: ['timsablab.com', 'timsablab.ddn.net', 'localhost'],
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/private-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certificate.pem')),
    }
  },
  plugins: [react()],
  define: {
    // Update API URLs to use HTTPS
    'process.env.VITE_API_BASE_URL': JSON.stringify('https://timsablab.com:3001'),
    'process.env.VITE_WS_URL': JSON.stringify('wss://timsablab.com:3001'),
    'process.env.VITE_AUTH_URL': JSON.stringify('https://timsablab.com:3002')
  }
})
