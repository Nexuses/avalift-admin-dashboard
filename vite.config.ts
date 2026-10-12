import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const cacheBustPlugin = () => {
  return {
    name: "cache-bust",
    transformIndexHtml(html: string) {
      const version = Date.now().toString(); // Use timestamp or app version
      return html.replace(/(\.js|\.css)/g, `$1?v=${version}`);
    },
  };
};

export default defineConfig({
  plugins: [react(), cacheBustPlugin()], // Add cache-bust plugin if query parameters are needed
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist", // Output directory
    sourcemap: false, // Disable sourcemaps for production (optional)
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`, // e.g., assets/main.123abc.js
        chunkFileNames: `assets/[name].[hash].js`, // e.g., assets/chunk.123abc.js
        assetFileNames: `assets/[name].[hash][extname]`, // e.g., assets/style.123abc.css
      },
    },
  },
  server: {
    headers: {
      // Optional: Set Cache-Control for development server
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  },
});