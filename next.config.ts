import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Server Actions carry small form payloads only. Large binaries (PDF, page
    // images, covers) are uploaded directly to Supabase Storage via short-lived
    // signed upload URLs, so this limit only needs to cover metadata forms.
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
