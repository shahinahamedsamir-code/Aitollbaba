import Cleaner from '@/components/Cleaner';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { docHref, type Block, type Doc } from '@/lib/content';

/** Renders one content block. Kept dumb so the data files stay the source. */
function Chunk({ block }: { block: Block }) {
  switch (block.t) {
    case 'h2':
      return (
        <h2 className="mt-14 font-display text-2xl font-semibold leading-snug tracking-[-0.02em] first:mt-0 sm:text-3xl">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-9 font-display text-lg font-semibold tracking-tight">{block.text}</h3>
      );
    case 'p':
      return <p className="mt-4 text-[15.5px] leading-[1.75] text-fg-2">{block.text}</p>;
    case 'ul':
      return (
        <ul className="mt-5 space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-[1.7] text-fg-2">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-acid" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="mt-6 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-4 bg-surface p-5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-acid font-mono text-[11px] font-medium text-acid-ink">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[15px] font-semibold tracking-tight">
                  {item.title}
                </span>
                <span className="mt-1.5 block text-[14px] leading-[1.7] text-fg-2">{item.text}</span>
              </span>
            </li>
          ))}
        </ol>
      );
    case 'note':
      return (
        <aside className="mt-7 rounded-xl border border-line bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">{block.title}</p>
          <p className="mt-2.5 text-[14px] leading-[1.7] text-fg-2">{block.text}</p>
        </aside>
      );
    case 'warn':
      return (
        <aside className="mt-7 rounded-xl border border-flag/40 bg-flag-wash p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-flag">{block.title}</p>
          <p className="mt-2.5 text-[14px] leading-[1.7] text-fg-2">{block.text}</p>
        </aside>
      );
    case 'tool':
      return (
        <div className="mt-10 mb-2">
          <Cleaner />
        </div>
      );
  }
}

export default function Article({ doc, all }: { doc: Doc; all: Doc[] }) {
  const related = doc.related
    .map((slug) => all.find((d) => d.slug === slug))
    .filter((d): d is Doc => Boolean(d));

  return (
    <>
      <Header />

      <main>
        {/* ------------------------------------------------------------ head */}
        <section className="halo relative overflow-hidden border-b border-line">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-12 sm:px-8 sm:pt-16">
            <nav aria-label="Breadcrumb" className="font-mono text-[11px] text-fg-3">
              <a href="/" className="transition-colors hover:text-acid">
                home
              </a>
              <span className="mx-2 text-line-2">/</span>
              {doc.kind === 'guide' ? (
                <>
                  <a href="/guides" className="transition-colors hover:text-acid">
                    guides
                  </a>
                  <span className="mx-2 text-line-2">/</span>
                </>
              ) : null}
              <span className="text-acid">{doc.eyebrow}</span>
            </nav>

            <h1 className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[2.9rem]">
              {doc.title}
            </h1>

            {/* The short answer sits first: it is what a search snippet lifts. */}
            <div className="mt-7 rounded-xl border border-acid/30 bg-acid-wash/60 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">short answer</p>
              <p className="mt-2.5 text-[15px] leading-[1.7] text-fg">{doc.answer}</p>
            </div>

            <p className="mt-5 font-mono text-[11px] text-fg-3">
              Updated{' '}
              {new Date(doc.updated).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {' · runs in your browser · nothing uploaded'}
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ body */}
        <article className="border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
            {doc.blocks.map((block, i) => (
              <Chunk key={i} block={block} />
            ))}

            {/* --------------------------------------------------------- faq */}
            {doc.faq.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                  Common questions
                </h2>
                <div className="mt-6 border-t border-line">
                  {doc.faq.map(([q, a]) => (
                    <details key={q} className="group border-b border-line py-4">
                      <summary className="flex items-start justify-between gap-6 text-[15px] text-fg transition-colors hover:text-acid">
                        <span>{q}</span>
                        <span className="plus mt-0.5 shrink-0 font-mono text-lg leading-none text-acid transition-transform duration-200">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-[14px] leading-[1.7] text-fg-2">{a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* ----------------------------------------------------- related */}
            {related.length > 0 && (
              <section className="mt-16">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  read next
                </h2>
                <ul className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <a
                        href={docHref(item)}
                        className="flex h-full flex-col bg-surface p-5 transition-colors hover:bg-raised"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-3">
                          {item.eyebrow}
                        </span>
                        <span className="mt-2 font-display text-[15px] font-semibold leading-snug tracking-tight">
                          {item.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

/** FAQPage structured data, so the questions can surface as a rich result. */
export function faqJsonLd(doc: Doc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: doc.faq.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/** Article + breadcrumb data for the same page. */
export function articleJsonLd(doc: Doc, site: string) {
  const url = `${site}${docHref(doc)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: doc.title,
        description: doc.description,
        datePublished: doc.updated,
        dateModified: doc.updated,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Aitoollbaba', url: site },
        publisher: { '@type': 'Organization', name: 'Aitoollbaba', url: site },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site },
          ...(doc.kind === 'guide'
            ? [{ '@type': 'ListItem', position: 2, name: 'Guides', item: `${site}/guides` }]
            : []),
          {
            '@type': 'ListItem',
            position: doc.kind === 'guide' ? 3 : 2,
            name: doc.title,
            item: url,
          },
        ],
      },
    ],
  };
}
