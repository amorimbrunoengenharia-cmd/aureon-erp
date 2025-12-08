import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (libraries)
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts', 'chart.js'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas', 'html2pdf.js'],
          'xlsx-vendor': ['xlsx', 'xlsx-js-style'],
          
          // Core modules
          'auth': [
            './src/context/AuthContextAPI.jsx',
            './src/context/ThemeContext.jsx',
            './src/context/DataContext.jsx'
          ],
          
          // Services
          'services': [
            './src/services/ApiService.js',
            './src/services/EventBus.js',
            './src/services/OpenAIService.js'
          ],
          
          // Heavy pages (lazy-loaded routes)
          'financial': [
            './src/pages/UnifiedDashboard.jsx',
            './src/pages/ReceivablesManager.jsx',
            './src/pages/ExpensesManager.jsx',
            './src/pages/BankAccountsManager.jsx'
          ],
          
          'inventory': [
            './src/pages/UnifiedInventory.jsx',
            './src/pages/StockMovements.jsx',
            './src/pages/PurchaseCenter.jsx'
          ],
          
          'sales': [
            './src/pages/Sales.jsx',
            './src/pages/UnifiedCRM.jsx',
            './src/pages/Reports.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600 // Aumenta limite para 600KB
  }
})