/**
 * Brand Header Component
 * 
 * Displays the official 123.net logo and branding
 */

import React from 'react';
import Logo123Net from './Logo123Net';
import '../styles/123net-theme.css';

const BrandHeader: React.FC = () => {
  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, #0077bb 100%)',
        color: 'var(--text-white)',
        padding: '1rem 2rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Logo123Net size="medium" showText={true} />
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-white)' }}>
            Polycom/Yealink Configuration Manager
          </h1>
          <p 
            className="brand-tagline"
            style={{ 
              margin: 0, 
              fontSize: '0.875rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '400'
            }}
          >
            THE INTERNET YOU CAN COUNT ON
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandHeader;
