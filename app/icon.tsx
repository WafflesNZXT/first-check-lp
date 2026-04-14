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
          background: 'transparent',
          padding: 56,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 20L32 4L60 20V30L32 14L4 30V20Z" fill="#3B82F6" />
          <path d="M4 34L32 18L60 34V44L32 28L4 44V34Z" fill="#3B82F6" />
          <path d="M4 48L32 32L60 48L44 58L32 50L20 58L4 48Z" fill="#3B82F6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
