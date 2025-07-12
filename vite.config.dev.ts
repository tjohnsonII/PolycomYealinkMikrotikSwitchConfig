import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Development build config (no HTTPS required)
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_API_BASE_URL': JSON.stringify('https://timsablab.com:3001'),
    'process.env.VITE_WS_URL': JSON.stringify('wss://timsablab.com:3001'),
    'process.env.VITE_AUTH_URL': JSON.stringify('https://timsablab.com:3002')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false,
    target: 'es2018',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
