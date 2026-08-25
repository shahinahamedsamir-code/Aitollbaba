import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Article, { articleJsonLd, faqJsonLd } from '@/components/Article';
import { GUIDES } from '@/lib/guides';
import { PLATFORMS } from '@/lib/platforms';
import { SITE } from '@/lib/site';

/** Only the platform slugs resolve here; anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return PLATFORMS.map((doc) => ({ platform: doc.slug }));
}

type Params = { params: Promise<{ platform: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { platform } = await params;
  const doc = PLATFORMS.find((d) => d.slug === platform);
  if (!doc) return {};

  return {
    title: doc.metaTitle,
    description: doc.description,
    alternates: { canonical: `/${doc.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE}/${doc.slug}`,
      title: doc.metaTitle,
      description: doc.description,
    },
    twitter: { card: 'summary_large_image', title: doc.metaTitle, description: doc.description },
  };
}

export default async function PlatformPage({ params }: Params) {
  const { platform } = await params;
  const doc = PLATFORMS.find((d) => d.slug === platform);
  if (!doc) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(doc, SITE)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(doc)) }}
      />
      <Article doc={doc} all={[...PLATFORMS, ...GUIDES]} />
    </>
  );
}
