import type { NextConfig } from "next";

// ponytail: hardcoded RPC origins, not read from env. The two chains this app
// supports are fixed in src/lib/chain.ts; if a third chain is ever added, its
// origin must be appended to connect-src here too.
const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  // ponytail: 'unsafe-inline' is required by Next's inline bootstrap scripts.
  // 'unsafe-eval' is dev-only: React uses eval() for callstack reconstruction.
  // Upgrade path: nonce-based CSP via middleware if strict script-src matters.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // next/font and Tailwind both emit inline <style>, so 'unsafe-inline' stays.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Chain RPC endpoints — the app reads chain state directly from the browser.
  "connect-src 'self' https://rpc.bohr.life https://rpc.botchain.ai",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
