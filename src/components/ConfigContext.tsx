import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { GeneratedConfig } from '../types/config';

interface ConfigContextType {
  generatedConfig: GeneratedConfig | null;
  setGeneratedConfig: (cfg: GeneratedConfig) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [generatedConfig, setGeneratedConfig] = useState<GeneratedConfig | null>(null);
  return (
    <ConfigContext.Provider value={{ generatedConfig, setGeneratedConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useConfigContext() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfigContext must be used within ConfigProvider');
  return ctx;
}
