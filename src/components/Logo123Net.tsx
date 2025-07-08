import React from 'react';

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

  const { fontSize, blockSize } = dimensions[size];

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

  const colorScheme = colors[variant];

  return (
    <div 
      className={`logo-123net ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        ...style
      }}
    >
      {/* 123 Blocks */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {/* Red "1" Block */}
        <div style={{
          width: blockSize,
          height: blockSize,
          backgroundColor: colorScheme.red,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          color: variant === 'white' ? '#e53e3e' : 'white',
          fontSize: fontSize * 0.75,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          border: variant === 'white' ? '2px solid #e53e3e' : 'none'
        }}>
          1
        </div>
        
        {/* Green "2" Block */}
        <div style={{
          width: blockSize,
          height: blockSize,
          backgroundColor: colorScheme.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          color: variant === 'white' ? '#38a169' : 'white',
          fontSize: fontSize * 0.75,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          border: variant === 'white' ? '2px solid #38a169' : 'none'
        }}>
          2
        </div>
        
        {/* Blue "3" Block */}
        <div style={{
          width: blockSize,
          height: blockSize,
          backgroundColor: colorScheme.blue,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          color: variant === 'white' ? '#3182ce' : 'white',
          fontSize: fontSize * 0.75,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          border: variant === 'white' ? '2px solid #3182ce' : 'none'
        }}>
          3
        </div>
      </div>

      {/* NET Text and Connection Icon */}
      {showText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            fontSize: fontSize,
            fontWeight: 'bold',
            color: colorScheme.text,
            fontFamily: 'Arial, sans-serif'
          }}>
            NET
          </span>
          
          {/* Connection Icon */}
          <div style={{ position: 'relative', width: '24px', height: '20px' }}>
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '2px',
              width: '6px',
              height: '6px',
              backgroundColor: colorScheme.text,
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              backgroundColor: colorScheme.text,
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '8px',
              width: '12px',
              height: '2px',
              backgroundColor: colorScheme.text,
              transform: 'rotate(-25deg)',
              transformOrigin: 'left center'
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo123Net;
