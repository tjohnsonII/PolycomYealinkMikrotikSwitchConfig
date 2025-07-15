import React, { useState } from 'react';

const ExpansionModules: React.FC = () => {
  const [yealinkOutput, setYealinkOutput] = useState<string>('');
  const [polycomOutput, setPolycomOutput] = useState<string>('');
  // You may need to declare other state variables (e.g., yealinkSlots, yealinkTemplateType, etc.) if not already present.

  // Add Yealink slots state
  // Yealink state with localStorage persistence
  const [yealinkSlots, setYealinkSlots] = useState<{ label: string; value: string; pbxIp: string }[]>(() => {
    const saved = localStorage.getItem('yealinkSlots');
    return saved ? JSON.parse(saved) : Array.from({ length: 20 }, () => ({ label: '', value: '', pbxIp: '' }));
  });
  const [yealinkTemplateType, setYealinkTemplateType] = useState<'BLF' | 'SpeedDial'>(() => {
    const saved = localStorage.getItem('yealinkTemplateType');
    return saved === 'SpeedDial' ? 'SpeedDial' : 'BLF';
  });

  // Polycom state with localStorage persistence
  const [polycomSlots, setPolycomSlots] = useState<{ label: string; address: string; type: string }[]>(() => {
    const saved = localStorage.getItem('polycomSlots');
    return saved ? JSON.parse(saved) : Array.from({ length: 28 }, () => ({ label: '', address: '', type: 'automata' }));
  });
  // Persist Yealink and Polycom state to localStorage
  React.useEffect(() => {
    localStorage.setItem('yealinkSlots', JSON.stringify(yealinkSlots));
  }, [yealinkSlots]);
  React.useEffect(() => {
    localStorage.setItem('yealinkTemplateType', yealinkTemplateType);
  }, [yealinkTemplateType]);
  React.useEffect(() => {
    localStorage.setItem('polycomSlots', JSON.stringify(polycomSlots));
  }, [polycomSlots]);

  // Sort Yealink output by label (A-Z)
  const sortYealinkOutputByLabel = () => {
    const lines = yealinkOutput.split(/\n/).filter(Boolean);
    // Group by key (4 lines per key)
    const keys = [];
    for (let i = 0; i < lines.length; i += 4) {
      keys.push(lines.slice(i, i + 4));
    }
    keys.sort((a, b) => {
      const aLabel = a[0]?.split('=')[1] || '';
      const bLabel = b[0]?.split('=')[1] || '';
      return aLabel.localeCompare(bLabel);
    });
    setYealinkOutput(keys.map(k => k.join('\n')).join('\n'));
  };

  // File upload handler for Yealink: parse, sort, and display sorted config
  const handleYealinkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\n/).filter(Boolean);
      const keys = [];
      for (let i = 0; i < lines.length; i += 4) {
        keys.push(lines.slice(i, i + 4));
      }
      keys.sort((a, b) => {
        const aLabel = a[0]?.split('=')[1] || '';
        const bLabel = b[0]?.split('=')[1] || '';
        return aLabel.localeCompare(bLabel);
      });
      setYealinkOutput(keys.map(k => k.join('\n')).join('\n'));
    };
    reader.readAsText(file);
  };

  // Sort Polycom output by label (A-Z)
  const sortPolycomOutputByLabel = () => {
    const lines = polycomOutput.split(/\n/).filter(Boolean);
    // Group by key (3 lines per key)
    const keys = [];
    for (let i = 0; i < lines.length; i += 3) {
      keys.push(lines.slice(i, i + 3));
    }
    keys.sort((a, b) => {
      const aLabel = a[1]?.split('=')[1] || '';
      const bLabel = b[1]?.split('=')[1] || '';
      return aLabel.localeCompare(bLabel);
    });
    setPolycomOutput(keys.map(k => k.join('\n')).join('\n'));
  };

  // File upload handler for Polycom: parse, sort, and display sorted config
  const handlePolycomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\n/).filter(Boolean);
      const keys = [];
      for (let i = 0; i < lines.length; i += 3) {
        keys.push(lines.slice(i, i + 3));
      }
      keys.sort((a, b) => {
        const aLabel = a[1]?.split('=')[1] || '';
        const bLabel = b[1]?.split('=')[1] || '';
        return aLabel.localeCompare(bLabel);
      });
      setPolycomOutput(keys.map(k => k.join('\n')).join('\n'));
    };
    reader.readAsText(file);
  };

  // Generate Polycom expansion config line and preview all keys for the page
  // (This function is not used in the current UI, but if needed, you can implement it using polycomSlots)
  // Example: generate config for a specific slot index
  // const generatePolycomExpansion = (slotIndex: number) => {
  //   let lines = [];
  //   for (let i = 0; i < polycomSlots.length; i++) {
  //     const slot = polycomSlots[i];
  //     lines.push(
  //       `attendant.resourcelist.${i + 1}.address=${slot.address}\n` +
  //       `attendant.resourcelist.${i + 1}.label=${slot.label}\n` +
  //       `attendant.resourcelist.${i + 1}.type=${slot.type}`
  //     );
  //   }
  //   setPolycomOutput(lines.join('\n'));
  //   try {
  //     localStorage.setItem('expansionConfig', lines.join('\n'));
  //   } catch {}
  // };

  // Clear config handler
  const handleClearExpansionConfig = () => {
    setYealinkOutput('');
    setPolycomOutput('');
    setYealinkSlots(Array.from({ length: 20 }, () => ({ label: '', value: '', pbxIp: '' })));
    setPolycomSlots(Array.from({ length: 28 }, () => ({ label: '', address: '', type: 'automata' })));
    try {
      localStorage.removeItem('expansionConfig');
      localStorage.removeItem('yealinkSlots');
      localStorage.removeItem('yealinkTemplateType');
      localStorage.removeItem('polycomSlots');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  // Utility function to download text as a file
  const downloadTextFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
    return (
      <div className="expansion-modules-container">
      <button onClick={handleClearExpansionConfig} className="expansion-modules-clear-btn">
        Clear Config
      </button>
      <h1 className="expansion-modules-title">Hosted Config Generator</h1>
      <h2 className="expansion-modules-subtitle">Expansion Module Code Generators</h2>
      <div className="expansion-modules-grid">
        {/* Yealink Expansion Module */}
        <div className="expansion-module-card">
          <img src="/images/yealinkexp40.jpeg" alt="Yealink EXP40" className="expansion-module-image" title="Yealink EXP40 Sidecar: 20 keys per page, up to 3 pages" />
          <img src="/images/yealinkexp50.jpeg" alt="Yealink EXP50" className="expansion-module-image" title="Yealink EXP50 Sidecar: 20 keys per page, up to 3 pages" />
          <div className="expansion-module-instructions">
            <b>Instructions:</b> Fill out the form below to generate a config for a Yealink expansion key. Use the page & key toggles to preview each key visually. Enter any key to preview the full sidecar.
          </div>
          <div className="expansion-module-form-container">
            <label>Template Type: 
            <select value={yealinkTemplateType} onChange={e => setYealinkTemplateType(e.target.value as 'BLF' | 'SpeedDial')} className="expansion-module-template-select" title="Template Type">
              <option value="BLF">BLF</option>
              <option value="SpeedDial">Speed Dial</option>
            </select>
            </label>
            <table className="expansion-module-table">
              <thead>
                <tr className="expansion-module-table-header">
                  <th>Slot</th>
                  <th>Label</th>
                  <th>Value/Ext</th>
                  <th>PBX IP</th>
                </tr>
              </thead>
              <tbody>
                {yealinkSlots.map((slot, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><input type="text" value={slot.label} onChange={e => {
                      const newSlots = [...yealinkSlots];
                      newSlots[idx].label = e.target.value;
                      setYealinkSlots(newSlots);
                    }} className="expansion-module-table-input" title="Label" placeholder="Enter label" /></td>
                    <td><input type="text" value={slot.value} onChange={e => {
                      const newSlots = [...yealinkSlots];
                      newSlots[idx].value = e.target.value;
                      setYealinkSlots(newSlots);
                    }} className="expansion-module-table-input" title="Value/Extension" placeholder="Enter value/ext" /></td>
                    <td><input type="text" value={slot.pbxIp} onChange={e => {
                      const newSlots = [...yealinkSlots];
                      newSlots[idx].pbxIp = e.target.value;
                      setYealinkSlots(newSlots);
                    }} className="expansion-module-table-input" title="PBX IP" placeholder="Enter PBX IP" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Yealink Preview Grid */}
          <div className="expansion-module-preview-grid">
            {yealinkSlots.map((slot, idx) => (
              <div key={idx} className={`expansion-module-preview-key ${slot.label ? 'active' : 'inactive'}`} title={slot.label || `Slot ${idx + 1}`}>
                {slot.label || idx + 1}
              </div>
            ))}
          </div>
          <button onClick={() => {
            const type = yealinkTemplateType === 'BLF' ? 16 : 13;
            const lines = yealinkSlots.map((slot, i) => (
              `expansion_module.1.key.${i + 1}.label=${slot.label}\n` +
              `expansion_module.1.key.${i + 1}.type=${slot.label ? type : ''}\n` +
              `expansion_module.1.key.${i + 1}.value=${slot.label ? (yealinkTemplateType === 'BLF' ? `${slot.value}@${slot.pbxIp}` : slot.value) : ''}\n` +
              `expansion_module.1.key.${i + 1}.line=1`
            ));
            setYealinkOutput(lines.join('\n'));
            try {
              localStorage.setItem('expansionConfig', lines.join('\n'));
            } catch (error) {
              console.warn('Failed to save to localStorage:', error);
            }
          }} className="expansion-module-generate-btn">Generate Yealink Expansion Config</button>
          <div className="expansion-module-output">
            <textarea value={yealinkOutput} readOnly rows={14} className="expansion-module-output-textarea" title="Yealink Configuration Output" />
            <button onClick={sortYealinkOutputByLabel} className="expansion-module-sort-btn">Sort Output by Label (A-Z)</button>
            <div className="expansion-module-file-actions">
              <label className="expansion-module-file-label">Upload & Sort File: <input type="file" accept=".txt,.cfg" onChange={handleYealinkFileUpload} /></label>
              <button onClick={() => downloadTextFile('yealink_expansion_sorted.txt', yealinkOutput)} className="expansion-module-download-btn">Download</button>
            </div>
          </div>
        </div>
        {/* Polycom Expansion Module */}
        <div className="expansion-module-card">
          <img src="/images/polycomVVX_Color_Exp_Module_2201.jpeg" alt="Polycom VVX Color Expansion" className="expansion-module-image" />
          <div className="expansion-module-instructions">
            <b>Instructions:</b> Edit each slot below. Label, Address/Ext, and Type are editable for each key. Click "Generate" to update the config output.
          </div>
          <div className="expansion-module-form-container">
            <table className="expansion-module-table">
              <thead>
                <tr className="expansion-module-table-header">
                  <th>Slot</th>
                  <th>Label</th>
                  <th>Address/Ext</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {polycomSlots.map((slot, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td><input type="text" value={slot.label} onChange={e => {
                      const newSlots = [...polycomSlots];
                      newSlots[idx].label = e.target.value;
                      setPolycomSlots(newSlots);
                    }} className="expansion-module-table-input" title="Label" placeholder="Enter label" /></td>
                    <td><input type="text" value={slot.address} onChange={e => {
                      const newSlots = [...polycomSlots];
                      newSlots[idx].address = e.target.value;
                      setPolycomSlots(newSlots);
                    }} className="expansion-module-table-input" title="Address/Extension" placeholder="Enter address/ext" /></td>
                    <td>
                      <select value={slot.type} onChange={e => {
                        const newSlots = [...polycomSlots];
                        newSlots[idx].type = e.target.value;
                        setPolycomSlots(newSlots);
                      }} className="expansion-module-table-select" title="Type">
                        <option value="automata">Automata</option>
                        <option value="normal">Normal</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Polycom Preview Grid */}
          <div className="expansion-module-preview-grid">
            {polycomSlots.map((slot, idx) => (
              <div key={idx} className={`expansion-module-preview-key expansion-module-preview-key-polycom ${slot.label ? 'active' : 'inactive'}`} title={slot.label || `Slot ${idx + 1}`}>
                {slot.label || idx + 1}
              </div>
            ))}
          </div>
          <button onClick={() => {
            const lines = polycomSlots.map((slot, i) => (
              `attendant.resourcelist.${i + 1}.address=${slot.address}\n` +
              `attendant.resourcelist.${i + 1}.label=${slot.label}\n` +
              `attendant.resourcelist.${i + 1}.type=${slot.type}`
            ));
            setPolycomOutput(lines.join('\n'));
            try {
              localStorage.setItem('expansionConfig', lines.join('\n'));
            } catch (error) {
              console.warn('Failed to save to localStorage:', error);
            }
          }} className="expansion-module-generate-btn">Generate Polycom Expansion Config</button>
          <div className="expansion-module-output">
            <textarea value={polycomOutput} readOnly rows={14} className="expansion-module-output-textarea" title="Polycom Configuration Output" />
            <button onClick={sortPolycomOutputByLabel} className="expansion-module-sort-btn">Sort Output by Label (A-Z)</button>
            <div className="expansion-module-file-actions">
              <label className="expansion-module-file-label">Upload & Sort File: <input type="file" accept=".txt,.cfg" onChange={handlePolycomFileUpload} /></label>
              <button onClick={() => downloadTextFile('polycom_expansion_sorted.txt', polycomOutput)} className="expansion-module-download-btn">Download</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpansionModules;
