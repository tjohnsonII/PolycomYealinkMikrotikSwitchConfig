import React from 'react';
import { useConfigContext } from '../components/ConfigContext';

const FullConfig: React.FC = () => {
  const { generatedConfig } = useConfigContext();
  return (
    <div>
      <h2>Full Config</h2>
      {generatedConfig && (generatedConfig.phoneType === 'Polycom' || generatedConfig.phoneType === 'Yealink') ? (
        <>
          <div style={{ margin: '16px 0', fontWeight: 500 }}>
            Model: {generatedConfig.model} ({generatedConfig.phoneType})
          </div>
          <textarea value={generatedConfig.config} readOnly rows={18} style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }} />
        </>
      ) : (
        <p>No config generated yet. Use the Phone Config tab to generate a config.</p>
      )}
    </div>
  );
};

export default FullConfig;
