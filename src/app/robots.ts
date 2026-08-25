import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Static export needs these emitted as files at build time.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
