import React from 'react';

export default function Button({ 
  label, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  icon = null 
}) {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
  };

  const variants = {
    primary: {
      background: '#D4AF37',
      color: '#030305',
      padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
    },
    danger: {
      background: '#f87171',
      color: '#fff',
      padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
    },
    secondary: {
      background: '#60a5fa',
      color: '#fff',
      padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
    },
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      style={{ 
        ...baseStyles, 
        ...variants[variant],
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
