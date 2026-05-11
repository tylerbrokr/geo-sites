const { setupDevPlatform } = process.env.NODE_ENV === "development"
  ? require("@cloudflare/next-on-pages/next-dev")
  : { setupDevPlatform: () => {} };

if (process.env.NODE_ENV === "development") {
  (async () => await setupDevPlatform())();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
