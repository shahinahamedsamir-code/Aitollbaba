import { relatedTools } from '@/lib/tools';

/**
 * The "where to go next" block at the foot of every tool page.
 *
 * The header menu and the footer already link every tool from every page, but
 * that is boilerplate — repeated identically site-wide, it tells a crawler
 * almost nothing about which pages are actually related. This does: a handful
 * of in-content links, each with a sentence explaining the connection, using
 * the tool's real name as the anchor text.
 */
export default function RelatedTools({ slug }: { slug: string }) {
  const related = relatedTools(slug);
  if (!related.length) return null;

  return (
    <section id="next" className="scroll-mt-16 border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">next</span>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
          Where people go from here
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">
          All of these run the same way — in your browser, on your device, with nothing uploaded.
        </p>

        {/* Four or five, depending on the tool — the track count follows so the
            last card never sits alone at the end of a row. */}
        <ul
          className={`mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line ${
            related.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
          }`}
        >
          {related.map(({ tool, why }) => (
            <li key={tool.slug} className="min-w-0">
              <a
                href={`/${tool.slug}`}
                className="group flex h-full flex-col bg-bg p-4 transition-colors hover:bg-raised sm:p-6"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-fg-3 transition-colors group-hover:text-acid"
                  aria-hidden
                >
                  <path d={tool.icon} />
                </svg>
                <h3 className="mt-3 font-display text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-acid sm:text-[17px]">
                  {tool.name}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-fg-2 sm:text-[13.5px]">{why}</p>
                <span className="mt-auto pt-4 font-mono text-[10.5px] text-fg-3 sm:text-[11px]">
                  open →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
