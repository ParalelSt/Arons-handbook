import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

/** Emits ads.txt into the build output from the VITE_ADSENSE_CLIENT_ID env var */
function adsTxtPlugin(): Plugin {
  return {
    name: "generate-ads-txt",
    apply: "build",
    generateBundle() {
      const clientId = process.env.VITE_ADSENSE_CLIENT_ID;
      if (clientId && clientId !== "ca-pub-XXXXXXXXXXXXXXXX") {
        this.emitFile({
          type: "asset",
          fileName: "ads.txt",
          source: `google.com, ${clientId}, DIRECT, f08c47fec0942fa0\n`,
        });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    adsTxtPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["vite.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Gym Logbook",
        short_name: "Gym Log",
        description: "Track your gym workouts and progress",
        theme_color: "#1e293b",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === "https://xqzmrevgiucwhiiwyiew.supabase.co",
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
