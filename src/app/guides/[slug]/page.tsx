import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Article, { articleJsonLd, faqJsonLd } from '@/components/Article';
import { GUIDES } from '@/lib/guides';
import { PLATFORMS } from '@/lib/platforms';
import { SITE } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((doc) => ({ slug: doc.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = GUIDES.find((d) => d.slug === slug);
  if (!doc) return {};

  return {
    title: doc.metaTitle,
    description: doc.description,
    alternates: { canonical: `/guides/${doc.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE}/guides/${doc.slug}`,
      title: doc.metaTitle,
      description: doc.description,
    },
    twitter: { card: 'summary_large_image', title: doc.metaTitle, description: doc.description },
  };
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const doc = GUIDES.find((d) => d.slug === slug);
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
