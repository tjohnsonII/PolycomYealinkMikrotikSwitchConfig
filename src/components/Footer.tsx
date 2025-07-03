import React from 'react';

const Footer: React.FC = () => (
  <footer style={{
    width: '100%',
    background: '#eaf4fc',
    borderTop: '1px solid #cce1fa',
    padding: '18px 0',
    marginTop: 40,
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
    letterSpacing: 0.1,
    zIndex: 10,
  }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
      <b>Tips:</b> Use the config generator to quickly create Polycom and Yealink phone/expansion configs. All settings are designed for real-world deployments. For more help, see the Reference tab.<br />
      <span style={{ color: '#0078d4' }}>You can add more tips or info here as needed.</span>
    </div>
  </footer>
);

export default Footer;
