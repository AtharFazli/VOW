import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// ponytail: static routes only. /vow/[id] is unbounded and wallet-scoped, so it
// cannot be enumerated without a chain read at build time — skipped deliberately.
// No lastModified: a build timestamp would change every deploy and misreport the
// content as freshly updated.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/create`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/my-vows`, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
