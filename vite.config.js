import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable source maps to reduce memory usage
    sourcemap: false,
    // Use esbuild for minification (lighter than Terser)
    minify: 'esbuild',
    // Reduce chunk size to avoid memory issues
    chunkSizeWarningLimit: 1000,
    // Reduce parallel operations to minimize memory usage
    target: 'es2015',
    rollupOptions: {
      output: {
        // Limit the number of chunks to reduce memory usage
        manualChunks: {
          // Split large vendor dependencies into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@douyinfe/semi-ui', 'framer-motion'],
          'editor-vendor': ['lexical', '@monaco-editor/react'],
          'lexical-vendor': [
            '@lexical/react/LexicalComposer', 
            '@lexical/react/LexicalComposerContext',
            '@lexical/html',
            '@lexical/rich-text',
            '@lexical/utils',
            '@lexical/selection'
          ],
          'utils-vendor': ['lodash', 'axios', 'nanoid', 'dexie', 'jszip', 'jspdf']
        },
      },
    },
  },
  // Optimize dependencies to reduce processing time
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'lexical',
      '@lexical/react/LexicalComposer',
      '@lexical/react/LexicalComposerContext',
      '@lexical/html',
      '@lexical/rich-text',
      '@lexical/utils',
      '@lexical/selection'
    ],
    esbuildOptions: {
      // Fix for ESM/CJS interop issues
      preserveSymlinks: true,
    },
  },
});

