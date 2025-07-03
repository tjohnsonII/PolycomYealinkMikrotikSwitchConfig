
import React, { useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const FIELD_TOOLTIPS: Record<string, string> = {
  linekeyNum: 'The key/button number on the phone to assign this function (usually starts at 1).',
  linekeyLabel: 'Text label that will appear on the phone’s display for this key.',
  linekeyRegLine: 'Select the line (account) this key should be associated with, usually Line 1.',
  linekeyType: 'Choose the key function type (e.g., BLF, speed dial, transfer, etc.).',
  linekeyValue: 'The target number, extension, or function code to assign to the key.',
  externalBrand: 'Choose the phone brand for which you are creating the external dial key.',
  externalLineNum: 'The programmable key/button number to assign this speed dial.',
  externalLabel: 'Label to display for the external number on the phone’s screen.',
  externalNumber: 'Enter the external phone number this key will dial when pressed.'
};

const YEALINK_LINEKEY_TYPES = [
  { code: 0, label: 'NA' },
  { code: 1, label: 'Conference' },
  { code: 2, label: 'Forward' },
  { code: 3, label: 'Transfer' },
  { code: 4, label: 'Hold' },
  { code: 5, label: 'DND' },
  { code: 7, label: 'Call Return' },
  { code: 8, label: 'SMS' },
  { code: 9, label: 'Directed Pickup' },
  { code: 10, label: 'Call Park' },
  { code: 11, label: 'DTMF' },
  { code: 12, label: 'Voice Mail' },
  { code: 13, label: 'Speed Dial' },
  { code: 14, label: 'Intercom' },
  { code: 15, label: 'Line' },
  { code: 16, label: 'BLF' },
  { code: 17, label: 'URL' },
  { code: 18, label: 'Group Listening' },
  { code: 20, label: 'Private Hold' },
  { code: 22, label: 'XML Group' },
  { code: 23, label: 'Group Pickup' },
  { code: 24, label: 'Multicast Paging' },
  { code: 25, label: 'Record' },
  { code: 27, label: 'XML Browser' },
  { code: 34, label: 'Hot Desking' },
  { code: 35, label: 'URL Record' },
  { code: 38, label: 'LDAP' },
  { code: 39, label: 'BLF List' },
  { code: 40, label: 'Prefix' },
  { code: 41, label: 'Zero Touch' },
  { code: 42, label: 'ACD' },
  { code: 45, label: 'Local Group' },
  { code: 46, label: 'Network Group' },
  { code: 49, label: 'Custom Button' },
  { code: 50, label: 'Keypad Lock' },
  { code: 55, label: 'Meet-Me Conference' },
  { code: 56, label: 'Retrieve Park' },
  { code: 57, label: 'Hoteling' },
  { code: 58, label: 'ACD Grace' },
  { code: 59, label: 'Sisp Code' },
  { code: 60, label: 'Emergency' },
  { code: 61, label: 'Directory' },
  { code: 73, label: 'MACRO' },
];

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

  // Placeholder for config generation logic
  const generateYealinkExpansion = () => {
    setYealinkOutput(`# Yealink Expansion Config\n# (Logic goes here)`);
  };
  const generatePolycomExpansion = () => {
    setPolycomOutput(`# Polycom Expansion Config\n# (Logic goes here)`);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: 24 }}>Expansion Module Code Generators</h2>
      <div style={{ display: 'flex', gap: 40, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Yealink Section */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <div style={{ background: '#eef6fb', border: '1px solid #cce1fa', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 }}>
            <b>Instructions:</b> Fill out the form below to generate a config for a Yealink expansion key.
          </div>
          <div className="form-group" style={{ textAlign: 'left', margin: '0 auto', maxWidth: 320 }}>
            <label>Template Type:</label>
            <select value={yealinkSection.templateType} onChange={e => setYealinkSection(s => ({ ...s, templateType: e.target.value }))}>
              <option value="BLF">BLF</option>
              <option value="SpeedDial">Speed Dial</option>
            </select>
            <label style={{ marginLeft: 16 }}>Sidecar Page:</label>
            <input type="number" min={1} max={3} value={yealinkSection.sidecarPage} onChange={e => setYealinkSection(s => ({ ...s, sidecarPage: e.target.value }))} style={{ width: 60 }} />
            <label style={{ marginLeft: 16 }}>Sidecar Line:</label>
            <input type="number" min={1} max={20} value={yealinkSection.sidecarLine} onChange={e => setYealinkSection(s => ({ ...s, sidecarLine: e.target.value }))} style={{ width: 60 }} />
            <label style={{ marginLeft: 16 }}>Label:</label>
            <input type="text" value={yealinkSection.label} onChange={e => setYealinkSection(s => ({ ...s, label: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>Value (Phone/ext):</label>
            <input type="text" value={yealinkSection.value} onChange={e => setYealinkSection(s => ({ ...s, value: e.target.value }))} />
            <label style={{ marginLeft: 16 }}>PBX IP:</label>
            <input type="text" value={yealinkSection.pbxIp} onChange={e => setYealinkSection(s => ({ ...s, pbxIp: e.target.value }))} />
          </div>
          <button onClick={generateYealinkExpansion} style={{ marginTop: 8, marginRight: 8 }}>Generate Yealink Expansion Config</button>
          <div className="output" style={{ marginTop: 12 }}>
            <textarea value={yealinkOutput} readOnly rows={5} style={{ width: '100%' }} />
          </div>
        </div>
        {/* Polycom Section */}
        <div style={{ flex: 1, minWidth: 350 }}>
          <div style={{ background: '#eef6fb', border: '1px solid #cce1fa', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 }}>
            <b>Instructions:</b> Fill out the form below to generate a config for a Polycom expansion key.
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
            <label style={{ marginLeft: 16 }}>Linekey Category:</label>
            <input type="text" value={polycomSection.linekeyCategory} onChange={e => setPolycomSection(s => ({ ...s, linekeyCategory: e.target.value }))} />
          </div>
          <button onClick={generatePolycomExpansion} style={{ marginTop: 8, marginRight: 8 }}>Generate Polycom Expansion Config</button>
          <div className="output" style={{ marginTop: 12 }}>
            <textarea value={polycomOutput} readOnly rows={5} style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpansionModules;
