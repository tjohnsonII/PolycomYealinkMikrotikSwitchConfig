import React from 'react';
import TerminalPanel from '../components/TerminalPanel';

const Diagnostic: React.FC = () => {
  return (
    <div style={{ padding: 32 }}>
      <h1>Diagnostics</h1>
      <p>This page will provide diagnostic tools and system information for troubleshooting and support.</p>
      <div style={{ margin: '32px 0', maxWidth: 900 }}>
        <h2>SSH Terminal (Beta)</h2>
        <TerminalPanel />
      </div>
      {/* Add diagnostic widgets, logs, or tools here as needed */}
    </div>
  );
};

export default Diagnostic;
