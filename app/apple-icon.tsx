import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

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
          background: '#ffffff',
          color: '#111111',
          fontSize: 144,
          fontWeight: 900,
          fontFamily: 'Arial, Helvetica, sans-serif',
          lineHeight: 1,
          letterSpacing: '-0.08em',
          textTransform: 'lowercase',
          textAlign: 'center',
        }}
      >
        a
      </div>
    ),
    {
      ...size,
    }
  );
}
