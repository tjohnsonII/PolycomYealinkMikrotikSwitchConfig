import React, { useState } from 'react';





const ExpansionModules: React.FC = () => {
  // Example state for Yealink expansion module
  const [yealinkSection, setYealinkSection] = useState({
    templateType: 'BLF',
    sidecarPage: '1',
    sidecarLine: '1',
    label: '',
    value: '',
    pbxIp: '',
  });
  const [yealinkOutput, setYealinkOutput] = useState('');

  // Example state for Polycom expansion module
  const [polycomSection, setPolycomSection] = useState({
    address: '',
    label: '',
    type: 'automata',
    linekeyCategory: 'BLF',
    linekeyIndex: '',
  });
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
  const generateYealinkExpansion = () => {
    const { templateType, sidecarPage, label, value, pbxIp } = yealinkSection;
    let type = templateType === 'BLF' ? 16 : 13;
    let val = templateType === 'BLF' ? `${value}@${pbxIp}` : value;
    // Preview all 20 keys for the selected page
    let lines = [];
    for (let i = 1; i <= 20; i++) {
      if (i === parseInt(yealinkSection.sidecarLine)) {
        lines.push(
          `expansion_module.${sidecarPage}.key.${i}.label=${label}\n` +
          `expansion_module.${sidecarPage}.key.${i}.type=${type}\n` +
          `expansion_module.${sidecarPage}.key.${i}.value=${val}\n` +
          `expansion_module.${sidecarPage}.key.${i}.line=1`
        );
      } else {
        lines.push(
          `expansion_module.${sidecarPage}.key.${i}.label=\n` +
          `expansion_module.${sidecarPage}.key.${i}.type=\n` +
          `expansion_module.${sidecarPage}.key.${i}.value=\n` +
          `expansion_module.${sidecarPage}.key.${i}.line=1`
        );
      }
    }
    setYealinkOutput(lines.join('\n'));
  };

  // Generate Yealink config for all pages (1-3)
  const generateYealinkAllPages = () => {
    const { templateType, label, value, pbxIp } = yealinkSection;
    let type = templateType === 'BLF' ? 16 : 13;
    let val = templateType === 'BLF' ? `${value}@${pbxIp}` : value;
    let allLines = [];
    for (let page = 1; page <= 3; page++) {
      for (let i = 1; i <= 20; i++) {
        allLines.push(
          `expansion_module.${page}.key.${i}.label=${label}\n` +
          `expansion_module.${page}.key.${i}.type=${type}\n` +
          `expansion_module.${page}.key.${i}.value=${val}\n` +
          `expansion_module.${page}.key.${i}.line=1`
        );
      }
    }
    setYealinkOutput(allLines.join('\n'));
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
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Hosted Config Generator</h1>
      <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>Expansion Module Code Generators</h2>
      <div style={{ display: 'flex', gap: 40, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Yealink Expansion Module */}
        <div style={{ flex: 1, minWidth: 350, background: '#f8fbff', borderRadius: 12, border: '1px solid #cce1fa', padding: 16 }}>
          <img src="/images/yealinkexp40.jpeg" alt="Yealink EXP40" style={{ width: 120, marginBottom: 8 }} />
          <img src="/images/yealinkexp50.jpeg" alt="Yealink EXP50" style={{ width: 120, marginBottom: 8 }} />
          <div style={{ background: '#eaf4fc', border: '1px solid #cce1fa', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 }}>
            <b>Instructions:</b> Fill out the form below to generate a config for a Yealink expansion key. Use the page & key toggles to preview each key visually. Enter any key to preview the full sidecar.
          </div>
          <div className="form-group" style={{ textAlign: 'left', margin: '0 auto', maxWidth: 320 }}>
            <label>Template Type:</label>
            <select value={yealinkSection.templateType} onChange={e => setYealinkSection(s => ({ ...s, templateType: e.target.value }))}>
              <option value="BLF">BLF</option>
              <option value="SpeedDial">Speed Dial</option>
            </select>
            <label style={{ marginLeft: 16 }}>Sidecar Page (1-3):</label>
            <input type="number" min={1} max={3} value={yealinkSection.sidecarPage} onChange={e => setYealinkSection(s => ({ ...s, sidecarPage: e.target.value }))} style={{ width: 60 }} />
            <label style={{ marginLeft: 16 }}>Sidecar Line (1-20):</label>
            <input type="number" min={1} max={20} value={yealinkSection.sidecarLine} onChange={e => setYealinkSection(s => ({ ...s, sidecarLine: e.target.value }))} style={{ width: 60 }} />
            <label style={{ marginLeft: 16 }}>Label:</label>
            <input type="text" value={yealinkSection.label} onChange={e => setYealinkSection(s => ({ ...s, label: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>Value (Phone/ext):</label>
            <input type="text" value={yealinkSection.value} onChange={e => setYealinkSection(s => ({ ...s, value: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>PBX IP:</label>
            <input type="text" value={yealinkSection.pbxIp} onChange={e => setYealinkSection(s => ({ ...s, pbxIp: e.target.value }))} />
          </div>
          <button onClick={generateYealinkExpansion} style={{ marginTop: 8, marginRight: 8 }}>Generate Yealink Expansion Config</button>
          <button onClick={generateYealinkAllPages} style={{ marginTop: 8 }}>Generate All Pages</button>
          <div className="output" style={{ marginTop: 12 }}>
            <textarea value={yealinkOutput} readOnly rows={5} style={{ width: '100%' }} />
            <button onClick={sortYealinkOutputByLabel} style={{ marginTop: 8 }}>Sort Output by Label (A-Z)</button>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Upload & Sort File: <input type="file" accept=".txt,.cfg" onChange={handleYealinkFileUpload} /></label>
              <button onClick={() => downloadTextFile('yealink_expansion_sorted.txt', yealinkOutput)} style={{ fontSize: 13 }}>Download</button>
            </div>
          </div>
          {/* Yealink Preview Grid */}
          <div style={{ background: '#eaf4fc', border: '1px solid #cce1fa', borderRadius: 8, marginTop: 16, padding: 8 }}>
            <b>Preview: Page {yealinkSection.sidecarPage}</b>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginTop: 8 }}>
              {[...Array(20)].map((_, idx) => (
                <div key={idx} style={{ height: 32, border: '1px solid #b3c6e0', borderRadius: 4, background: idx + 1 === parseInt(yealinkSection.sidecarLine) ? '#d1eaff' : '#f4f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: idx + 1 === parseInt(yealinkSection.sidecarLine) ? 700 : 400, color: '#2a3b5c' }}>
                  {idx + 1 === parseInt(yealinkSection.sidecarLine) ? '🟩' : '⬜'}
                  <span style={{ marginLeft: 6 }}>{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Polycom Expansion Module */}
        <div style={{ flex: 1, minWidth: 350, background: '#f8fbff', borderRadius: 12, border: '1px solid #cce1fa', padding: 16 }}>
          <img src="/images/polycomVVX_Color_Exp_Module_2201.jpeg" alt="Polycom VVX Color Expansion" style={{ width: 120, marginBottom: 8 }} />
          <div style={{ background: '#eaf4fc', border: '1px solid #cce1fa', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 }}>
            <b>Instructions:</b> Fill out the form below to generate a config for a Polycom expansion key. The preview grid below shows the button layout. Hover over any key to show the index.
          </div>
          <div className="form-group" style={{ textAlign: 'left', margin: '0 auto', maxWidth: 320 }}>
            <label>Linekey Index (1-28):</label>
            <input type="number" min={1} max={28} value={polycomSection.linekeyIndex} onChange={e => setPolycomSection(s => ({ ...s, linekeyIndex: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>Address (e.g. 100@PBX):</label>
            <input type="text" value={polycomSection.address} onChange={e => setPolycomSection(s => ({ ...s, address: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>Label:</label>
            <input type="text" value={polycomSection.label} onChange={e => setPolycomSection(s => ({ ...s, label: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>Type:</label>
            <select value={polycomSection.type} onChange={e => setPolycomSection(s => ({ ...s, type: e.target.value }))}>
              <option value="automata">Automata</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <button onClick={generatePolycomExpansion} style={{ marginTop: 8, marginRight: 8 }}>Generate Polycom Expansion Config</button>
          <div className="output" style={{ marginTop: 12 }}>
            <textarea value={polycomOutput} readOnly rows={5} style={{ width: '100%' }} />
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
