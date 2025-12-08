import React from 'react';

const Input = ({ label, id, ...props }) => {
  // Gera ID único se não fornecido
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-xs font-medium tracking-wide text-aureon-subtext mb-2"
        >
          {label}
        </label>
      )}
      <input 
        id={inputId}
        className="w-full bg-gradient-to-br from-aureon-surface/50 to-aureon-surface/30 border border-aureon-border rounded-lg px-4 py-3 text-sm font-medium text-aureon-text transition-all duration-300 placeholder-aureon-muted shadow-sm shadow-aureon-shadow hover:border-aureon-gold/50 focus-aureon"
        {...props}
      />
    </div>
  );
};

export default Input;
