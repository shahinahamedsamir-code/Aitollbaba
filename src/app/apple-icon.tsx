import { ImageResponse } from 'next/og';

// Static export needs this emitted as a file at build time.
export const dynamic = 'force-static';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * The mark at home-screen size. Satori has no SVG path support, so the arch is
 * rebuilt from a bordered box with its bottom edge removed — same silhouette,
 * primitives only.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#c9f24d',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 104,
            height: 124,
            border: '18px solid #0a0f04',
            borderBottom: 'none',
            borderRadius: '52px 52px 0 0',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: '#0a0f04',
              transform: 'rotate(45deg)',
              borderRadius: 9,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
