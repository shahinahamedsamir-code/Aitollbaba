import { ImageResponse } from 'next/og';

// Static export needs these emitted as files at build time.
export const dynamic = 'force-static';

export const alt = 'Aitoollbaba — remove AI metadata, C2PA and EXIF from images';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Rendered once at build time into a static PNG for search and social cards. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#07090c',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* The mark, rebuilt from primitives: Satori draws no SVG paths, so the
              arch is a bordered box with its bottom edge removed and the spark a
              rotated square. Same silhouette as icon.svg. */}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 15,
              background: '#c9f24d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 31,
                height: 37,
                border: '5px solid #0a0f04',
                borderBottom: 'none',
                borderRadius: '16px 16px 0 0',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: '#0a0f04',
                  transform: 'rotate(45deg)',
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#e8eef6', letterSpacing: -0.5 }}>
            <span style={{ color: '#c9f24d' }}>ai</span>
            <span>toollbaba</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, color: '#e8eef6', lineHeight: 1.05, letterSpacing: -2.5 }}>
            Remove the AI label.
          </div>
          <div style={{ fontSize: 76, color: '#5f6d80', lineHeight: 1.05, letterSpacing: -2.5 }}>
            And everything else.
          </div>
          <div style={{ marginTop: 28, fontSize: 27, color: '#97a5b6', maxWidth: 900, lineHeight: 1.4 }}>
            Strips C2PA content credentials, AI generator tags, EXIF and GPS — entirely in your browser.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['C2PA', 'digitalSourceType', 'XMP', 'EXIF', 'GPS'].map((tag) => (
            <div
              key={tag}
              style={{
                border: '1px solid #2c3744',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 21,
                color: '#97a5b6',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
