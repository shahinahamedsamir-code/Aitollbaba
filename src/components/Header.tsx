import Logo from './Logo';

const LINKS = [
  { href: '/guides', label: 'Guides' },
  { href: '/#why', label: 'No upload' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3 sm:px-8">
        <a href="/" aria-label="Aitoollbaba home">
          <Logo size={28} />
        </a>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 font-mono text-[12px] text-fg-2 transition-colors hover:bg-raised hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <span className="hidden items-center gap-2 font-mono text-[11px] text-fg-3 lg:flex">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
            no server connection
          </span>
          <a
            href="/#tools"
            className="rounded-md bg-acid px-3.5 py-1.5 font-mono text-[12px] font-medium text-acid-ink transition-colors hover:bg-fg"
          >
            all tools
          </a>
        </div>
      </div>
    </header>
  );
}
