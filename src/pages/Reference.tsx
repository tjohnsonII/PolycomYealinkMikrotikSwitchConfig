import React, { useState } from 'react';

const REFERENCE_SUBTABS = [
  { key: 'phones', label: 'Phones' },
  { key: 'mikrotik', label: 'Mikrotik' },
  { key: 'switches', label: 'Switches' },
  { key: 'pbx', label: "PBX's" },
];

const Reference: React.FC = () => {
  const [referenceSubtab, setReferenceSubtab] = useState('phones');

  return (
    <div style={{ margin: '24px 0', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ alignSelf: 'flex-start', textAlign: 'left', width: '100%' }}>Reference</h2>
      {/* Sub-navigation menu */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignSelf: 'center' }}>
        {REFERENCE_SUBTABS.map(sub => (
          <button
            key={sub.key}
            className={referenceSubtab === sub.key ? 'active' : ''}
            onClick={() => setReferenceSubtab(sub.key)}
            style={{
              border: 'none',
              borderBottom: referenceSubtab === sub.key ? '3px solid #0078d4' : '2px solid #ccc',
              background: referenceSubtab === sub.key ? '#f7fbff' : '#f4f4f4',
              color: referenceSubtab === sub.key ? '#0078d4' : '#333',
              fontWeight: referenceSubtab === sub.key ? 600 : 400,
              padding: '8px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              minWidth: 100,
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>
      {/* Subtab content (to be filled in next step) */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {referenceSubtab === 'phones' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2 style={{ textAlign: 'left' }}>Phone Config Reference (Legend)</h2>
            {/* ... Polycom/Yealink reference tables ... */}
          </div>
        )}
        {referenceSubtab === 'mikrotik' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h3>Mikrotik Reference</h3>
            {/* ... Mikrotik reference content ... */}
          </div>
        )}
        {referenceSubtab === 'switches' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h3>Switches Reference</h3>
            {/* ... Switches reference content ... */}
          </div>
        )}
        {referenceSubtab === 'pbx' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h3>PBX Reference</h3>
            {/* ... PBX reference content ... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reference;
