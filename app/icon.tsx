import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
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
          fontSize: 410,
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
