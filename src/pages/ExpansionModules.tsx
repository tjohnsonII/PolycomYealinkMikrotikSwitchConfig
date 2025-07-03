import React, { useState, useEffect } from 'react';

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
  const generatePolycomExpansion = (slotIndex: number) => {
    let lines = [];
    for (let i = 0; i < polycomSlots.length; i++) {
      const slot = polycomSlots[i];
      lines.push(
        `attendant.resourcelist.${i + 1}.address=${slot.address}\n` +
        `attendant.resourcelist.${i + 1}.label=${slot.label}\n` +
        `attendant.resourcelist.${i + 1}.type=${slot.type}`
      );
    }
    setPolycomOutput(lines.join('\n'));
    try {
      localStorage.setItem('expansionConfig', lines.join('\n'));
    } catch {}
  };

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
    } catch {}
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
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: 16 }}>
      <button onClick={handleClearExpansionConfig} style={{ float: 'right', marginBottom: 8, background: '#f44336', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>
        Clear Config
      </button>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Hosted Config Generator</h1>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Expansion Module Code Generators</h2>
      <div style={{ display: 'flex', gap: 40, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Yealink Expansion Module */}
        <div style={{ flex: 1, minWidth: 350, background: '#f8fbff', borderRadius: 12, border: '1px solid #cce1fa', padding: 16 }}>
          <img src="/images/yealinkexp40.jpeg" alt="Yealink EXP40" style={{ width: 120, marginBottom: 8 }} title="Yealink EXP40 Sidecar: 20 keys per page, up to 3 pages" />
          <img src="/images/yealinkexp50.jpeg" alt="Yealink EXP50" style={{ width: 120, marginBottom: 8 }} title="Yealink EXP50 Sidecar: 20 keys per page, up to 3 pages" />
          <div style={{ background: '#eaf4fc', border: '1px solid #cce1fa', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 }}>
            <b>Instructions:</b> Fill out the form below to generate a config for a Yealink expansion key. Use the page & key toggles to preview each key visually. Enter any key to preview the full sidecar.
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Template Type: </label>
            <select value={yealinkTemplateType} onChange={e => setYealinkTemplateType(e.target.value as 'BLF' | 'SpeedDial')}>
              <option value="BLF">BLF</option>
              <option value="SpeedDial">Speed Dial</option>
            </select>
            <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#eaf4fc' }}>
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
                    }} style={{ width: 100 }} /></td>
                    <td><input type="text" value={slot.value} onChange={e => {
                      const newSlots = [...yealinkSlots];
                      newSlots[idx].value = e.target.value;
                      setYealinkSlots(newSlots);
                    }} style={{ width: 100 }} /></td>
                    <td><input type="text" value={slot.pbxIp} onChange={e => {
                      const newSlots = [...yealinkSlots];
                      newSlots[idx].pbxIp = e.target.value;
                      setYealinkSlots(newSlots);
                    }} style={{ width: 100 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Yealink Preview Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            margin: '16px 0',
            justifyItems: 'center',
          }}>
            {yealinkSlots.map((slot, idx) => (
              <div key={idx} style={{
                width: 70,
                height: 38,
                background: slot.label ? '#0078d4' : '#e0e0e0',
                color: slot.label ? '#fff' : '#888',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 500,
                fontSize: 14,
                border: '1px solid #b0c4d4',
                boxShadow: slot.label ? '0 2px 6px rgba(0,120,212,0.10)' : 'none',
                transition: 'background 0.2s',
                cursor: slot.label ? 'pointer' : 'default',
              }} title={slot.label || `Slot ${idx + 1}`}>
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
            } catch {}
          }} style={{ marginTop: 8, marginRight: 8 }}>Generate Yealink Expansion Config</button>
          <div className="output" style={{ marginTop: 12 }}>
            <textarea value={yealinkOutput} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
            <button onClick={sortYealinkOutputByLabel} style={{ marginTop: 8 }}>Sort Output by Label (A-Z)</button>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Upload & Sort File: <input type="file" accept=".txt,.cfg" onChange={handleYealinkFileUpload} /></label>
              <button onClick={() => downloadTextFile('yealink_expansion_sorted.txt', yealinkOutput)} style={{ fontSize: 13 }}>Download</button>
            </div>
          </div>
        </div>
        {/* Polycom Expansion Module */}
        <div style={{ flex: 1, minWidth: 350, background: '#f8fbff', borderRadius: 12, border: '1px solid #cce1fa', padding: 16 }}>
          <img src="/images/polycomVVX_Color_Exp_Module_2201.jpeg" alt="Polycom VVX Color Expansion" style={{ width: 120, marginBottom: 8 }} />
          <div style={{ background: '#eaf4fc', border: '1px solid #cce1fa', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 }}>
            <b>Instructions:</b> Edit each slot below. Label, Address/Ext, and Type are editable for each key. Click "Generate" to update the config output.
          </div>
          <div style={{ marginBottom: 12 }}>
            <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#eaf4fc' }}>
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
                    }} style={{ width: 100 }} /></td>
                    <td><input type="text" value={slot.address} onChange={e => {
                      const newSlots = [...polycomSlots];
                      newSlots[idx].address = e.target.value;
                      setPolycomSlots(newSlots);
                    }} style={{ width: 100 }} /></td>
                    <td>
                      <select value={slot.type} onChange={e => {
                        const newSlots = [...polycomSlots];
                        newSlots[idx].type = e.target.value;
                        setPolycomSlots(newSlots);
                      }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            margin: '16px 0',
            justifyItems: 'center',
          }}>
            {polycomSlots.map((slot, idx) => (
              <div key={idx} style={{
                width: 60,
                height: 34,
                background: slot.label ? '#2d7d46' : '#e0e0e0',
                color: slot.label ? '#fff' : '#888',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 500,
                fontSize: 13,
                border: '1px solid #b0c4d4',
                boxShadow: slot.label ? '0 2px 6px rgba(45,125,70,0.10)' : 'none',
                transition: 'background 0.2s',
                cursor: slot.label ? 'pointer' : 'default',
              }} title={slot.label || `Slot ${idx + 1}`}>
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
            } catch {}
          }} style={{ marginTop: 8, marginRight: 8 }}>Generate Polycom Expansion Config</button>
          <div className="output" style={{ marginTop: 12 }}>
            <textarea value={polycomOutput} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
            <button onClick={sortPolycomOutputByLabel} style={{ marginTop: 8 }}>Sort Output by Label (A-Z)</button>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Upload & Sort File: <input type="file" accept=".txt,.cfg" onChange={handlePolycomFileUpload} /></label>
              <button onClick={() => downloadTextFile('polycom_expansion_sorted.txt', polycomOutput)} style={{ fontSize: 13 }}>Download</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpansionModules;
