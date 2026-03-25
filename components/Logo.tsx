import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // pixel size for the SVG (width & height)
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 96 }) => {
  const s = Math.max(48, size);
  return (
    <span
      className={`inline-flex items-center font-black lowercase tracking-[-0.08em] leading-none ${className}`}
      style={{ fontSize: `${Math.round(s * 0.45)}px` }}
      role="img"
      aria-label="audo"
    >
      audo
    </span>
  );
};