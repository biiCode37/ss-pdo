import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  build: {
    // PERF: Pisahkan chunk vendor agar cache browser lebih efektif & parse
    // awal lebih ringan (chunk tunggal >500kB memicu warning & TTI lambat
    // pada jaringan lapangan yang lambat).
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("sweetalert2")) return "vendor-swal";
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg", "app-logo.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "PUSM - PDO Utara Spreadsheet Mobile",
        short_name: "PUSM",
        description: "PUSM - PDO Utara Spreadsheet Mobile",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
