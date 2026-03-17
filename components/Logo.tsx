import React from 'react';
import { Check } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: number; // pixel size for the SVG (width & height)
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 96 }) => {
  const s = Math.max(48, size);
  // SVG viewBox is 0..200, we'll scale via width/height
  return (
    <svg
      className={className}
      width={s}
      height={s}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="First Check"
    >
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="g2" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#0EA5FF" />
        </linearGradient>
      </defs>

      {/* Outer decorative rounded badge */}
      <rect x="14" y="14" width="172" height="172" rx="34" stroke="url(#g1)" strokeWidth="8" fill="none" opacity="0.95" />

      {/* Inner decorative rotated diamond */}
      <g transform="translate(100 100)">
        <rect x="-34" y="-34" width="68" height="68" rx="8" transform="rotate(45)" fill="url(#g2)" stroke="#022F40" strokeOpacity="0.08" strokeWidth="2" />

        {/* Center letter */}
        <text x="0" y="6" textAnchor="middle" fontFamily="Inter, Arial, Helvetica, sans-serif" fontWeight={800} fontSize="28" fill="#FFFFFF">F</text>
      </g>

      {/* Small accent path to echo the attached style */}
      <path d="M40 100 C48 70, 70 48, 100 40 C130 48, 152 70, 160 100 C152 130, 130 152, 100 160 C70 152, 48 130, 40 100 Z" stroke="url(#g2)" strokeWidth="4" fill="none" strokeOpacity="0.12" />
    </svg>
  );
};