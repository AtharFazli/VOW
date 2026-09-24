import type { MetadataRoute } from 'next'

// ponytail: same base as layout.tsx metadataBase — absolute URLs required in
// robots/sitemap output, so one env var drives both.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/create', '/my-vows'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
