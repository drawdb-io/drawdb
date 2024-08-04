import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      workbox: {
        globPatterns: ["**/*"],
        maximumFileSizeToCacheInBytes: 15_000_000,
      },
      includeAssets: ["**/*"],
      registerType: "prompt",
      manifest: {
        name: "DrawDB",
        short_name: "DrawDB",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        scope: "/",
        start_url: "/editor",
        display: "standalone",
        background_color: "#14475b",
        theme_color: "#14475b",
        description:
          "Free, simple, and intuitive database design tool and SQL generator.",
      },
    }),
  ],
});
