const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
const PARTYKIT_PROTOCOL =
  PARTYKIT_HOST?.startsWith("localhost") ||
  PARTYKIT_HOST?.startsWith("127.0.0.1")
    ? "http"
    : "https";
const PARTYKIT_URL = `${PARTYKIT_PROTOCOL}://${PARTYKIT_HOST}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "pbs.twimg.com" },
      { hostname: "i.pravatar.cc" },
    ],
  },
  rewrites: async () => [
    {
      // forward room authentication request to partykit
      source: "/:roomId/auth",
      // include connection id in the query
      has: [{ type: "query", key: "_pk", value: "(?<pk>.*)" }],
      destination: PARTYKIT_URL + "/party/:roomId/auth?_pk=:pk",
    },
  ],
};

module.exports = nextConfig;
