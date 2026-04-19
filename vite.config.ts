import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          ui: ["react-hook-form", "zod", "axios", "react-hot-toast"],
        },
      },
    },
  },
});
