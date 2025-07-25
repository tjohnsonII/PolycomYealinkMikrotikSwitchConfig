import * as React from 'react';
import '../styles/Logo123Net.css';

interface Logo123NetProps {
  size?: 'small' | 'medium' | 'large' | 'compact';
  showText?: boolean;
  variant?: 'default' | 'white';
  className?: string;
  style?: React.CSSProperties;
}

const Logo123Net: React.FC<Logo123NetProps> = ({ 
  size = 'medium', 
  showText = true, 
  variant = 'default',
  className = '',
  style = {} 
}) => {
  const dimensions = {
    compact: { fontSize: 16, blockSize: 24 },
    small: { fontSize: 20, blockSize: 32 },
    medium: { fontSize: 32, blockSize: 48 },
    large: { fontSize: 48, blockSize: 72 }
  };

  const { fontSize, blockSize } = dimensions[size as keyof typeof dimensions];

  // Color variants for different backgrounds
  const colors = {
    default: {
      red: '#e53e3e',
      green: '#38a169',
      blue: '#3182ce',
      text: '#2d3748'
    },
    white: {
      red: '#ffffff',
      green: '#ffffff', 
      blue: '#ffffff',
      text: '#ffffff'
    }
  };

  const colorScheme = colors[variant as keyof typeof colors];

  // Create CSS custom properties for dynamic styling
  const cssVars = {
    '--logo-block-size': `${blockSize}px`,
    '--logo-block-font-size': `${fontSize * 0.75}px`,
    '--logo-text-font-size': `${fontSize}px`,
    '--logo-red-bg': colorScheme.red,
    '--logo-red-text': variant === 'white' ? '#e53e3e' : 'white',
    '--logo-red-border': variant === 'white' ? '2px solid #e53e3e' : 'none',
    '--logo-green-bg': colorScheme.green,
    '--logo-green-text': variant === 'white' ? '#38a169' : 'white',
    '--logo-green-border': variant === 'white' ? '2px solid #38a169' : 'none',
    '--logo-blue-bg': colorScheme.blue,
    '--logo-blue-text': variant === 'white' ? '#3182ce' : 'white',
    '--logo-blue-border': variant === 'white' ? '2px solid #3182ce' : 'none',
    '--logo-text-color': colorScheme.text,
  } as React.CSSProperties;

  return (
    <div
      className={`logo-123net modern-logo-123net ${className}`}
      style={{ ...cssVars, ...style }}
    >
      <div className="logo-123net-blocks">
        <div className="logo-123net-block logo-123net-block-1">1</div>
        <div className="logo-123net-block logo-123net-block-2">2</div>
        <div className="logo-123net-block logo-123net-block-3">3</div>
      </div>
      {showText && (
        <div className="logo-123net-text-container">
          <span className="logo-123net-text">NET</span>
          <div className="logo-123net-connection-icon">
            <div className="logo-123net-connection-dot-left" />
            <div className="logo-123net-connection-line" />
            <div className="logo-123net-connection-dot-right" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo123Net;
