'use client';

import { useEffect, useRef, useState } from 'react';
import { IMAGE_TOOLS } from '@/lib/tools';
import Logo from './Logo';

const LINKS = [
  { href: '/guides', label: 'Guides' },
  { href: '/#why', label: 'No upload' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // A disclosure, not a menubar: it is a list of links, so Escape and an
  // outside click are the only behaviours it owes anyone.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 sm:gap-6 sm:px-8">
        <a href="/" aria-label="Aitoollbaba home">
          <Logo size={28} />
        </a>

        <nav className="ml-auto flex items-center gap-1">
          <div ref={wrap} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="image-tools-menu"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[12px] transition-colors ${
                open ? 'bg-raised text-fg' : 'text-fg-2 hover:bg-raised hover:text-fg'
              }`}
            >
              Image tools
              <svg
                width="9"
                height="9"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <path d="M2 4.5 6 8.5 10 4.5" />
              </svg>
            </button>

            {open && (
              <div
                id="image-tools-menu"
                className="rise absolute right-0 z-50 mt-2 w-[17.5rem] overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/50"
              >
                <ul>
                  {IMAGE_TOOLS.map((tool) => (
                    <li key={tool.slug}>
                      <a
                        href={`/${tool.slug}`}
                        onClick={() => setOpen(false)}
                        className="group block border-b border-line px-3.5 py-2.5 transition-colors hover:bg-raised"
                      >
                        <span className="block font-mono text-[12px] text-fg-2 transition-colors group-hover:text-acid">
                          {tool.name}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-snug text-fg-3">
                          {tool.short}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Everything not image-shaped still has to be reachable. */}
                <a
                  href="/#tools"
                  onClick={() => setOpen(false)}
                  className="block px-3.5 py-2.5 font-mono text-[11px] text-fg-3 transition-colors hover:bg-raised hover:text-acid"
                >
                  all tools, including QR →
                </a>

                {/* On a phone this menu is the whole navigation, so the links
                    that sit in the bar on desktop live in here too. */}
                <div className="border-t border-line md:hidden">
                  {LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block px-3.5 py-2 font-mono text-[11px] text-fg-3 transition-colors hover:bg-raised hover:text-fg"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="hidden items-center md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 font-mono text-[12px] text-fg-2 transition-colors hover:bg-raised hover:text-fg"
              >
                {link.label}
              </a>
            ))}
          </span>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 font-mono text-[11px] text-fg-3 lg:flex">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
            no server connection
          </span>
          <a
            href="/#tools"
            className="hidden rounded-md bg-acid px-3.5 py-1.5 font-mono text-[12px] font-medium text-acid-ink transition-colors hover:bg-fg sm:block"
          >
            all tools
          </a>
        </div>
      </div>
    </header>
  );
}
