// Single source for the site's absolute origin. NEXT_PUBLIC_* is inlined at build
// time, so set it before `next build`.
//
// The fallback is the production domain, not localhost: metadata is emitted into
// the built HTML, so an unset var would otherwise bake localhost:3000 into
// og:url, og:image, robots.txt and sitemap.xml in the shipped artifact.
//
// ponytail: new URL() doubles as validation — a malformed value fails the build
// here, once, instead of silently emitting broken absolute URLs in four places.
// .origin also strips any trailing path/slash, so `${SITE_URL}/create` never
// doubles up. No basePath in next.config.ts, so origin is the correct root.
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vowprotocol.web.id"
).origin;
