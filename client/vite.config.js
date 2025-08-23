import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Development server configuration
  server: {
    port: 5173,
    host: 'localhost',
    open: true,
    cors: true,
    hmr: {
      port: 5174
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'colyseus': ['colyseus.js'],
          'vendor': ['axios', '@tweenjs/tween.js'],
          // Ajout du chunk pour le système de menu
          'clash-menu': [
            './src/clashmenu/index.js',
            './src/clashmenu/components/TabNavigation.js',
            './src/clashmenu/tabs/BattleTab.js',
            './src/clashmenu/utils/MenuAnimations.js'
          ]
        }
      }
    },
    // Optimize for game assets
    assetsInlineLimit: 0, // Don't inline assets for better caching
    chunkSizeWarningLimit: 1000
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@scenes': resolve(__dirname, 'src/scenes'),
      '@services': resolve(__dirname, 'src/services'),
      '@components': resolve(__dirname, 'src/components'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@utils': resolve(__dirname, 'src/utils'),
      
      // Alias pour le système de menu Clash
      '@clashmenu': resolve(__dirname, 'src/clashmenu'),
      '@clashmenu/components': resolve(__dirname, 'src/clashmenu/components'),
      '@clashmenu/tabs': resolve(__dirname, 'src/clashmenu/tabs'),
      '@clashmenu/utils': resolve(__dirname, 'src/clashmenu/utils'),
      '@clashmenu/styles': resolve(__dirname, 'src/clashmenu/styles')
    }
  },
  
  // Asset handling
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.fbx', '**/*.obj'],
  
  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __API_URL__: JSON.stringify(process.env.VITE_API_URL),
    __SERVER_URL__: JSON.stringify(process.env.VITE_SERVER_URL)
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['three', 'colyseus.js', 'axios', '@tweenjs/tween.js'],
    exclude: ['draco3d']
  },
  
  // Preview configuration (for production preview)
  preview: {
    port: 4173,
    host: 'localhost'
  }
});
