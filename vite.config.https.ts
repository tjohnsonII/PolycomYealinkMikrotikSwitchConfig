import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// HTTPS Configuration for Vite
// This file will replace vite.config.ts when enabling HTTPS

const httpsOptions = () => {
  // Try Let's Encrypt certificates first
  const letsEncryptPath = '/etc/letsencrypt/live/123hostedtools.com/';
  const selfSignedPath = './ssl/';
  
  try {
    if (fs.existsSync(letsEncryptPath + 'fullchain.pem')) {
      console.log('📱 Using Let\'s Encrypt certificates');
      return {
        key: fs.readFileSync(letsEncryptPath + 'privkey.pem'),
        cert: fs.readFileSync(letsEncryptPath + 'fullchain.pem')
      };
    }
  } catch (error) {
    console.warn('⚠️  Let\'s Encrypt certificates not accessible:', error.message);
  }
  
  // Fallback to self-signed certificates
  try {
    if (fs.existsSync(selfSignedPath + 'private-key.pem')) {
      console.log('🔒 Using self-signed certificates');
      return {
        key: fs.readFileSync(selfSignedPath + 'private-key.pem'),
        cert: fs.readFileSync(selfSignedPath + 'certificate.pem')
      };
    }
  } catch (error) {
    console.warn('⚠️  Self-signed certificates not found:', error.message);
  }
  
  console.error('❌ No SSL certificates found! Please generate certificates first.');
  process.exit(1);
};

export default defineConfig({
  server: {
    https: httpsOptions(),
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    open: false, // Don't auto-open browser with HTTPS warnings
    allowedHosts: ['123hostedtools.com', 'localhost', '67.149.139.23', '192.168.254.253']
  },
  plugins: [react()],
  // Environment variables for HTTPS API calls
  define: {
    'process.env.VITE_API_URL': JSON.stringify('https://123hostedtools.com:3002'),
    'process.env.VITE_WS_URL': JSON.stringify('wss://123hostedtools.com:3001'),
    'process.env.VITE_HTTPS_ENABLED': JSON.stringify('true')
  }
})
