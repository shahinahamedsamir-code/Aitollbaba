import type { MetadataRoute } from 'next';
import { docHref } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { PLATFORMS } from '@/lib/platforms';
import { SITE } from '@/lib/site';
import { LIVE_TOOLS } from '@/lib/tools';

// Static export needs these emitted as files at build time.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = [...PLATFORMS, ...GUIDES].map((doc) => ({
    url: `${SITE}${docHref(doc)}`,
    lastModified: new Date(doc.updated),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const tools = LIVE_TOOLS.map((tool) => ({
    url: `${SITE}/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE}/guides`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Site pages. Lower priority than the tools, but Search Console and
    // AdSense both look for them, and they are how a visitor checks who is
    // behind the site.
    ...["/about", "/contact", "/privacy"].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
    ...tools,
    ...docs,
  ];
}
