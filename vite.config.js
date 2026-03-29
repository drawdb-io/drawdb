import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@douyinfe/semi-ui") || id.includes("@douyinfe/semi-icons")) {
              return "semi-ui";
            }
            if (id.includes("@lexical") || id.includes("lexical")) {
              return "lexical";
            }
            if (id.includes("node-sql-parser") || id.includes("oracle-sql-parser")) {
              return "sql-parser";
            }
            if (id.includes("lodash") || id.includes("luxon") || id.includes("axios")) {
              return "utils";
            }
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
