/**
 * Shape of every written page on the site. Content lives as data rather than
 * JSX so the article shell, the metadata, the sitemap and the FAQ structured
 * data all read from one source and cannot drift apart.
 */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'h3'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'steps'; items: { title: string; text: string }[] }
  | { t: 'note'; title: string; text: string }
  | { t: 'warn'; title: string; text: string }
  | { t: 'tool' };

export interface Doc {
  /** URL segment. Platform docs live at /<slug>, guides at /guides/<slug>. */
  slug: string;
  kind: 'platform' | 'guide';
  /** Page H1 — carries the query people actually type. */
  title: string;
  /** <title> tag; keep the keyword at the front and under ~60 characters. */
  metaTitle: string;
  description: string;
  eyebrow: string;
  /** The short answer, printed above the fold for the snippet. */
  answer: string;
  updated: string;
  blocks: Block[];
  faq: [string, string][];
  /** Slugs of related docs, rendered as internal links at the foot. */
  related: string[];
}

export function docHref(doc: Pick<Doc, 'slug' | 'kind'>): string {
  return doc.kind === 'platform' ? `/${doc.slug}` : `/guides/${doc.slug}`;
}
