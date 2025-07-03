  // Clear all expansion config fields and outputs
// ...existing code...
  // Clear all expansion config fields and outputs
  const handleClearExpansionConfig = () => {
    setYealinkSection({
      templateType: 'BLF',
      sidecarPage: '1',
      sidecarLine: '1',
      label: '',
      value: '',
      pbxIp: '',
    });
    setYealinkOutput('');
    setPolycomSection({
      address: '',
      label: '',
      type: 'automata',
      linekeyCategory: 'BLF',
      linekeyIndex: '',
    });
    setPolycomOutput('');
    try {
      localStorage.removeItem('expansionConfig');
    } catch {}
  };
import React, { useState } from 'react';





const ExpansionModules: React.FC = () => {
  // Yealink: 20 slots per page
  const [yealinkTemplateType, setYealinkTemplateType] = useState('BLF');
  const [yealinkSlots, setYealinkSlots] = useState(Array(20).fill(0).map(() => ({ label: '', value: '', pbxIp: '' })));
  const [yealinkOutput, setYealinkOutput] = useState('');

  // Polycom: 28 slots
  const [polycomSlots, setPolycomSlots] = useState(Array(28).fill(0).map(() => ({ label: '', address: '', type: 'automata' })));
  const [polycomOutput, setPolycomOutput] = useState('');

  // Utility: Download text as file
  const downloadTextFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

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
  const generatePolycomExpansion = () => {
    const { linekeyIndex, address, label, type } = polycomSection;
    // Preview all 28 keys for the Polycom module
    let lines = [];
    for (let i = 1; i <= 28; i++) {
      if (i === parseInt(linekeyIndex)) {
        lines.push(
          `attendant.resourcelist.${i}.address=${address}\n` +
          `attendant.resourcelist.${i}.label=${label}\n` +
          `attendant.resourcelist.${i}.type=${type}`
        );
      } else {
        lines.push(
          `attendant.resourcelist.${i}.address=\n` +
          `attendant.resourcelist.${i}.label=\n` +
          `attendant.resourcelist.${i}.type=`
        );
      }
    }
    setPolycomOutput(lines.join('\n'));
    try {
      localStorage.setItem('expansionConfig', lines.join('\n'));
    } catch {}
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
            <select value={yealinkTemplateType} onChange={e => setYealinkTemplateType(e.target.value)}>
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
            <b>Instructions:</b> Fill out the form below to generate a config for a Polycom expansion key. The preview grid below shows the button layout. Hover over any key to show the index.
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
          {/* Polycom Preview Grid */}
          <div style={{ background: '#eaf4fc', border: '1px solid #cce1fa', borderRadius: 8, marginTop: 16, padding: 8 }}>
            <b>Preview: 28 keys (2 columns × 14 rows)</b>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginTop: 8 }}>
              {[...Array(28)].map((_, idx) => (
                <div key={idx} title={`Key ${idx + 1}`} style={{ height: 32, border: '1px solid #b3c6e0', borderRadius: 4, background: idx + 1 === parseInt(polycomSection.linekeyIndex) ? '#d1eaff' : '#f4f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: idx + 1 === parseInt(polycomSection.linekeyIndex) ? 700 : 400, color: '#2a3b5c' }}>
                  {idx + 1 === parseInt(polycomSection.linekeyIndex) ? '🟩' : '⬜'}
                  <span style={{ marginLeft: 6 }}>{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpansionModules;
