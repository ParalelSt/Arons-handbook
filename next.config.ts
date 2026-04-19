import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  // Force the new SW to take over immediately and wipe stale caches, so
  // returning users see updates on their next page load instead of only
  // after every tab has been closed.
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  output: "standalone",
};

export default withPWA(nextConfig);
