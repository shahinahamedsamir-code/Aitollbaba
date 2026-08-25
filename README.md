# Aitoollbaba

Aitoollbaba is a set of small, free tools for images and file privacy that run
entirely in the browser. Nothing is uploaded, because there is no server-side
code at all — the whole site is static files your browser downloads once.

The homepage is the catalogue. Each tool is its own route.

| Route | Tool | Status |
| --- | --- | --- |
| `/` | the catalogue | — |
| `/remove-ai-label` | AI Label Remover | live |
| `/image-compressor` | Image Compressor | live |
| `/image-converter` | Image Converter | live |
| `/image-resizer` | Image Resizer | live |
| `/qr-generator` | QR Generator | live |
| `/exif-viewer` | EXIF Viewer | live |

## Adding a tool

1. Append an entry to `src/lib/tools.ts` with `status: 'soon'`. The homepage
   grid, the footer, the tool count and the ItemList structured data all read
   from that list, so nothing else needs touching to announce it.
2. Build the tool at `src/app/<slug>/page.tsx` with its own `metadata` export.
3. Flip the entry to `status: 'live'`. That makes the card a link and puts the
   route in the sitemap.

The bar for adding one is that it can run fully client-side. Anything needing a
file sent to a server does not belong here.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm run package    # build, then zip ./out for upload
```

Do not run `npm run build` while `next dev` is running — they share `.next` and
the dev server will start throwing module-not-found errors until restarted.

## The AI label remover

Drop in a JPEG, PNG, WebP, AVIF or HEIC and it reports every embedded block it
finds — EXIF, GPS, XMP, IPTC, C2PA content credentials, PNG prompt chunks, AI
generator signatures — then hands back a copy with all of it gone.

## How the cleaning works

1. The file is read into memory with the File API.
2. `src/lib/scan.ts` walks the container (JPEG segments, PNG chunks, RIFF
   chunks, ISOBMFF boxes) and decodes headline EXIF/GPS tags for the report.
3. `src/lib/clean.ts` decodes the image, bakes in EXIF orientation, paints it to
   a canvas — a canvas holds pixels and nothing else, which is what drops every
   metadata block — and re-encodes it.
4. Optionally a ±1–2 RGB jitter is scattered over roughly one pixel in eight,
   which changes every hash of the file without visibly changing the picture or
   inflating its size.

`src/lib/zip.ts` is a small store-only ZIP writer so "download all" needs no
dependency.

## What it deliberately does not claim

Metadata lives beside the picture; in-pixel watermarks (SynthID and friends) and
statistical AI detectors do not. Removing metadata does not touch either, and
the copy on the site says so.

## Brand

The name is **Aitoollbaba**, set as `ai` in acid over `toollbaba` in foreground.
The mark is an arch — the cave doorway the name plays on — with a spark standing
in the opening; two shapes only, so it holds up at 16px in a tab.

- `src/components/Logo.tsx` — `Logo` (mark + wordmark), `LogoMark` (tile),
  `LogoGlyph` (bare glyph, inherits `currentColor`). Header and footer both
  render `Logo`, so the lockup is defined once.
- `src/app/icon.svg` — favicon.
- `src/app/apple-icon.tsx` — 180px home-screen icon, rendered at build time.
- `src/app/opengraph-image.tsx` — 1200×630 social card. Satori cannot draw SVG
  paths, so the arch there is a bordered box with its bottom edge removed and
  the spark a rotated square — same silhouette, primitives only.
- `public/logo.svg`, `public/logo-mark.svg` — standalone files for anywhere
  outside the app (press, profiles, embeds).

Acid `#c9f24d` on ink `#0a0f04`; both live in `globals.css` as `--color-acid`
and `--color-acid-ink`.

## Before deploying

Set the real origin in `src/lib/site.ts` — it feeds `metadataBase`, the
canonical URL, `robots.txt` and `sitemap.xml`.

## Content pages

Written pages live as data, not JSX, so the article shell, page metadata,
sitemap and FAQ structured data all read from one source:

- `src/lib/platforms.ts` — one page per platform, served at `/<slug>`
  (`/instagram`, `/facebook`, `/threads`, `/pinterest`, `/linkedin`).
- `src/lib/guides.ts` — longer explainers, served at `/guides/<slug>`.
- `src/lib/content.ts` — the `Doc` and `Block` types both files use.
- `src/components/Article.tsx` — renders any `Doc`, plus its Article,
  BreadcrumbList and FAQPage JSON-LD.

To add a page, append a `Doc` to whichever list fits. It is picked up by
`generateStaticParams`, the sitemap and the guides index automatically — no
route file needed.

Note that `/instagram` and `/facebook` intentionally *are* the "how to remove
the label" and "why does it say my photo is AI" articles. Publishing those as
separate blog posts as well would have the two pages competing for the same
query.
