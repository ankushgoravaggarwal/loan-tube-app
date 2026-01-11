import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'form-vendor': ['react-google-recaptcha', 'react-google-recaptcha-v3'],
          'api-vendor': ['axios', '@supabase/supabase-js'],
          'utils-vendor': ['lucide-react', 'html-to-image']
        }
      }
    },
    // Enable compression and minification
    minify: 'esbuild',
    cssMinify: true,
    // Split large chunks
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging but optimize for production
    sourcemap: false
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      '@supabase/supabase-js'
    ],
    exclude: ['lucide-react'],
  },
  
  // CSS processing
  css: {
    // CSS code splitting
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        // Enable CSS custom properties for better performance
        additionalData: ':root { color-scheme: light; }'
      }
    }
  },
  
  // Server configuration for development
  server: {
    hmr: {
      overlay: false
    }
  }
});
