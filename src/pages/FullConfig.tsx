import React from 'react';
import { useConfigContext } from '../components/ConfigContext';

const FullConfig: React.FC = () => {
  const { generatedConfig } = useConfigContext();
  // Only show the config code block, no labels, no extra spaces
  return (
    <div>
      <h2 style={{ textAlign: 'center', margin: '16px 0 24px 0', fontWeight: 700, fontSize: 28 }}>Full Generated Config</h2>
      {generatedConfig && (generatedConfig.phoneType === 'Polycom' || generatedConfig.phoneType === 'Yealink') ? (
        <textarea
          value={generatedConfig.config.trim()}
          readOnly
          rows={38}
          style={{ width: '98vw', maxWidth: 1600, minHeight: 600, fontFamily: 'monospace', fontSize: 16, margin: '0 auto', padding: 12, border: '1.5px solid #bbb', borderRadius: 6, resize: 'vertical', display: 'block' }}
        />
      ) : (
        <p>No config generated yet. Use the Phone Config tab to generate a config.</p>
      )}
    </div>
  );
};

export default FullConfig;
