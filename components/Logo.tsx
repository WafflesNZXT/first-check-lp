import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const LogoMark: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 40 }) => {
  const s = Math.max(20, size)

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M4 20L32 4L60 20V30L32 14L4 30V20Z" fill="#3B82F6" />
      <path d="M4 34L32 18L60 34V44L32 28L4 44V34Z" fill="#3B82F6" />
      <path d="M4 48L32 32L60 48L44 58L32 50L20 58L4 48Z" fill="#3B82F6" />
    </svg>
  )
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 96 }) => {
  const s = Math.max(24, size);
  const markW = Math.round(s * 0.84);
  const markH = Math.round(s * 0.84);

  return (
    <span
      className={`inline-flex items-center gap-3 leading-none ${className}`}
      role="img"
      aria-label="audo"
    >
      <LogoMark size={Math.min(markW, markH)} />
      <span
        className="font-black lowercase tracking-[-0.05em]"
        style={{ fontSize: `${Math.round(s * 0.48)}px` }}
      >
        audo
      </span>
    </span>
  );
};
