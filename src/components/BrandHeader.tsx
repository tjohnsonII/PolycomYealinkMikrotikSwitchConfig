/**
 * Brand Header Component
 * 
 * Displays the official 123.net logo and branding
 */

import React from 'react';
import Logo123Net from './Logo123Net';
import '../styles/123net-theme.css';
import '../styles/inline-styles-fix.css';

const BrandHeader: React.FC = () => {
  return (
    <div className="brand-header-container">
      <div className="brand-header-content">
        <Logo123Net size="medium" showText={true} />
        <div className="brand-header-text">
          <h1 className="brand-header-title">
            Polycom/Yealink Configuration Manager
          </h1>
          <p className="brand-header-tagline">
            THE INTERNET YOU CAN COUNT ON
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrandHeader;
