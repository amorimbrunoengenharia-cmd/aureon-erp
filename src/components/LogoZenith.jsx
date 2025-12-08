import React from 'react';

const LogoZenith = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" className="text-aureon-gold">
    <defs>
      <linearGradient id="zenithGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F3E5AB" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="var(--aureon-muted)" />
      </linearGradient>
    </defs>
    <g transform="translate(50, 30)">
      <path d="M50 15 Q 42 45 20 85" stroke="url(#zenithGold)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M50 15 Q 45 45 28 85" stroke="url(#zenithGold)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M50 15 Q 58 45 80 85" stroke="url(#zenithGold)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M50 15 Q 55 45 72 85" stroke="url(#zenithGold)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M37 68 Q 50 63 63 68" stroke="url(#zenithGold)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="15" r="4" fill="url(#zenithGold)" />
      <path d="M50 8 L50 22 M43 15 L57 15" stroke="url(#zenithGold)" strokeWidth="1.5" opacity="0.8" />
    </g>
  </svg>
);

export default LogoZenith;