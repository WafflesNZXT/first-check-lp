import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          background: 'linear-gradient(135deg, #0b1020 0%, #111827 45%, #172554 100%)',
          color: '#ffffff',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg
            width="52"
            height="52"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 20L32 4L60 20V30L32 14L4 30V20Z" fill="#3B82F6" />
            <path d="M4 34L32 18L60 34V44L32 28L4 44V34Z" fill="#3B82F6" />
            <path d="M4 48L32 32L60 48L44 58L32 50L20 58L4 48Z" fill="#3B82F6" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-1px' }}>audo</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.04, maxWidth: 980, letterSpacing: '-1.2px' }}>
            Fix conversion problems on your landing page.
          </div>
          <div style={{ fontSize: 30, color: '#bfdbfe', lineHeight: 1.3, maxWidth: 960 }}>
            Conversion-focused audits with prioritized fixes, built for founders shipping fast.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 24, color: '#cbd5e1' }}>useaudo.com</div>
      </div>
    ),
    {
      ...size,
    }
  );
}
