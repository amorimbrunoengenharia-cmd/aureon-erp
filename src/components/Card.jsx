import React from 'react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-gradient-to-br from-aureon-surface via-aureon-surface to-aureon-bg border border-aureon-border rounded-xl p-6 shadow-xl shadow-aureon-shadow transition-all duration-300 hover:border-aureon-border/60 hover:shadow-2xl hover:shadow-aureon-gold/10 ${className}`}>
    {children}
  </div>
);

export default Card;
