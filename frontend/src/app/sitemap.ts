import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site'

// ponytail: static routes only. /vow/[id] is unbounded and wallet-scoped, so it
// cannot be enumerated without a chain read at build time — skipped deliberately.
// No lastModified: a build timestamp would change every deploy and misreport the
// content as freshly updated.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/create`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/my-vows`, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
