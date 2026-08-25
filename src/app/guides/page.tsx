import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { docHref, type Doc } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { PLATFORMS } from '@/lib/platforms';

export const metadata: Metadata = {
  title: 'Guides — AI labels, C2PA and image metadata explained',
  description:
    'How platforms decide to put an AI label on an image, what C2PA content credentials contain, and how to remove the metadata behind both. Plain explanations, no upload required.',
  alternates: { canonical: '/guides' },
};

function Card({ doc }: { doc: Doc }) {
  return (
    <li>
      <a
        href={docHref(doc)}
        className="flex h-full flex-col bg-surface p-6 transition-colors hover:bg-raised"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">
          {doc.eyebrow}
        </span>
        <span className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
          {doc.title}
        </span>
        <span className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{doc.description}</span>
        <span className="mt-4 font-mono text-[11px] text-fg-3">read →</span>
      </a>
    </li>
  );
}

export default function GuidesIndex() {
  return (
    <>
      <Header />

      <main>
        <section className="halo relative overflow-hidden border-b border-line">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 sm:px-8 sm:pt-20">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">guides</span>
            <h1 className="mt-4 max-w-3xl font-display text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[3rem]">
              How AI labels actually work, and what to do about them
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-fg-2">
              Every one of these comes down to the same mechanism: platforms read fields inside your file
              rather than looking at the picture. These pages explain which fields, on which platform, and
              what removing them does and does not achieve.
            </p>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-3">by platform</h2>
            <ul className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
              {PLATFORMS.map((doc) => (
                <Card key={doc.slug} doc={doc} />
              ))}
            </ul>

            <h2 className="mt-14 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-3">
              how it works
            </h2>
            <ul className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
              {GUIDES.map((doc) => (
                <Card key={doc.slug} doc={doc} />
              ))}
            </ul>

            <div className="mt-14 rounded-xl border border-line bg-surface p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Just want to clean a file?
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-fg-2">
                The scanner on the home page reads any image, reports every metadata block inside it, and
                hands back a cleaned copy — without uploading anything.
              </p>
              <a
                href="/remove-ai-label#tool"
                className="mt-5 inline-block rounded-md bg-acid px-5 py-2.5 font-mono text-[12px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                run a scan
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
