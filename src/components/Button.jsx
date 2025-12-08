import React from 'react';

const Button = ({ children, variant = 'primary', onClick, className = "", ...props }) => {
  const baseClass = "px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-aureon-shadow hover:shadow-xl hover:shadow-aureon-shadow focus-aureon";
  
  const variants = {
    primary: "bg-gradient-to-br from-aureon-gold to-aureon-gold-strong text-aureon-bg hover:shadow-lg hover:shadow-aureon-gold/30 hover:-translate-y-0.5 active:translate-y-0",
    secondary: "bg-aureon-muted-surface text-aureon-text border border-aureon-border hover:bg-aureon-muted-surface/80 hover:border-aureon-border/60 hover:-translate-y-0.5",
    danger: "bg-aureon-red/20 text-aureon-red border border-aureon-red/40 hover:bg-aureon-red hover:text-white hover:border-aureon-red hover:-translate-y-0.5",
    outline: "border border-aureon-border text-aureon-subtext hover:border-aureon-gold hover:text-aureon-gold hover:bg-aureon-gold/5 hover:-translate-y-0.5"
  };

  return (
    <button onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;