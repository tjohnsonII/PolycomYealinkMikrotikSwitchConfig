import React from 'react';
import { useConfigContext } from '../components/ConfigContext';

const FullConfig: React.FC = () => {
  const { generatedConfig } = useConfigContext();
  // Only show the config code block, no labels, no extra spaces
  return (
    <div>
      {generatedConfig && (generatedConfig.phoneType === 'Polycom' || generatedConfig.phoneType === 'Yealink') ? (
        <textarea
          value={generatedConfig.config.trim()}
          readOnly
          rows={18}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 14, margin: 0, padding: 0, border: '1px solid #ccc', borderRadius: 4 }}
        />
      ) : (
        <p>No config generated yet. Use the Phone Config tab to generate a config.</p>
      )}
    </div>
  );
};

export default FullConfig;
