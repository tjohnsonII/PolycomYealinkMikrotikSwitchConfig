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
          rows={28}
          style={{ width: '100%', minHeight: 400, fontFamily: 'monospace', fontSize: 15, margin: 0, padding: 8, border: '1px solid #ccc', borderRadius: 4, resize: 'vertical' }}
        />
      ) : (
        <p>No config generated yet. Use the Phone Config tab to generate a config.</p>
      )}
    </div>
  );
};

export default FullConfig;
