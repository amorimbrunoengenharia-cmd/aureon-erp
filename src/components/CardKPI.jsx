import React from 'react';

export default function CardKPI({ title, value, subtitle = '', color = 'var(--aureon-gold)' }) {
  return (
    <div 
      className="card-aureon hover:scale-105 transition-all cursor-pointer focus-aureon"
      tabIndex={0}
      style={{ 
        padding: 16, 
        background: 'var(--aureon-surface)', 
        borderRadius: 8, 
        border: `2px solid ${color}`, 
        boxShadow: `0 2px 8px var(--aureon-focus)`,
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 2px 8px var(--aureon-focus)`;
      }}>
      <p className="text-aureon-muted text-xs mb-2">{title}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {subtitle && <p className="text-aureon-subtext text-xs mt-1">{subtitle}</p>}
    </div>
  );
}
