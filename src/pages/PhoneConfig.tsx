
import React, { useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

// These should be imported from a shared constants file in a real refactor
const MODEL_OPTIONS = [
  'VVX 400', 'VVX 500', 'VVX 600', 'CP-7841-3PCC', 'CP-8832-K9', 'CP-7832-3PCC',
  'CP-8832-3PCC', 'SPA-122 ATA', 'SSIP6000', 'CP-7811-3PCC', 'SSIP7000', 'SSIP330',
  'D230', 'Trio 8500 Confernce', 'SSIP700-Mic', 'Yealink T54W', 'Yealink T57W',
  'CP960', 'Yealink SIP-T46S', 'SIP-T46U', 'SIP-T48S', 'SIP-T48U', 'i12 Door Strike',
  '8180 IP Loud Ringer', '8301 Paging Server', 'Yealink W56P', 'Yealink W60P',
  'HT813 ATA', '8186', 'Yealink 56h Dect w/ 60p Base', 'Yealink 56h Dect w/ 76p Base',
  'Yealink 56h Dect Handset'
];

const FIELD_TOOLTIPS: Record<string, string> = {
  ip: "Enter the IP address of the phone you are configuring. Used to identify the device on the network.",
  phoneType: "Select the brand of phone (Polycom or Yealink) you are generating the configuration for.",
  model: "Choose the specific model of the phone. This determines the correct configuration format.",
  startExt: "Enter the starting extension number. Used to auto-fill settings across multiple phones.",
  endExt: "Enter the ending extension number. Used to generate config for a range of extensions.",
  labelPrefix: "Prefix added to the label shown on each phone’s screen (e.g., company name or department).",
  timeOffset: "Adjusts the phone’s time display relative to UTC (e.g., -5 for EST).",
  adminPassword: "Sets the admin password for the phone’s web interface. Ensure it meets your security requirements.",
  yealinkLabelLength: "When checked, uses the full label text for BLF/speed dial keys. May affect layout on small screens.",
  yealinkDisableMissedCall: "Prevents the phone from displaying missed call alerts. Useful in shared environments.",
  yealinkCallStealing: "Allows users to pick up active calls from another BLF-monitored extension."
};

const PhoneConfig: React.FC = () => {
  const [phoneType, setPhoneType] = useState<'Polycom' | 'Yealink'>('Polycom');
  const [model, setModel] = useState(MODEL_OPTIONS[0]);
  const [ip, setIp] = useState('');
  const [startExt, setStartExt] = useState('71');
  const [endExt, setEndExt] = useState('73');
  const [labelPrefix, setLabelPrefix] = useState('Park');
  const [timeOffset, setTimeOffset] = useState('-5');
  const [adminPassword, setAdminPassword] = useState('admin:08520852');
  const [yealinkLabelLength, setYealinkLabelLength] = useState(false);
  const [yealinkDisableMissedCall, setYealinkDisableMissedCall] = useState(false);
  const [yealinkCallStealing, setYealinkCallStealing] = useState(false);
  const [output, setOutput] = useState('');

  // Placeholder for config generation logic
  const generateConfig = () => {
    setOutput(`# Model: ${model}\n# (Config generation logic goes here)`);
  };

  return (
    <>
      <h2 style={{marginTop:0}}>Phone Config Generator</h2>
      <div style={{ background: '#f7fbff', border: '1px solid #cce1fa', borderRadius: 8, padding: 16, marginBottom: 24, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>
        <h3 style={{ marginTop: 0 }}>What does each config generator do?</h3>
        <ul style={{ marginLeft: 20 }}>
          <li><b>Base Config Options:</b> Generates the main configuration for Polycom or Yealink phones, including park/BLF keys, static settings, and model-specific options.</li>
        </ul>
      </div>
      {/* Base Config Options Form */}
      <div className="form-section" style={{marginBottom:24}}>
        <h3>Base Config Options</h3>
        <div className="form-group">
          <label>Phone Type:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.phoneType}>
              <FaInfoCircle />
            </span>
          </label>
          <select value={phoneType} onChange={e => setPhoneType(e.target.value as 'Polycom' | 'Yealink')}>
            <option value="Polycom">Polycom</option>
            <option value="Yealink">Yealink</option>
          </select>
          <label style={{marginLeft:16}}>Model:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.model}>
              <FaInfoCircle />
            </span>
          </label>
          <select value={model} onChange={e => setModel(e.target.value)}>
            {MODEL_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>IP Address:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.ip}>
              <FaInfoCircle />
            </span>
          </label>
          <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.100" />
          <label style={{marginLeft:16}}>Start Extension:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.startExt}>
              <FaInfoCircle />
            </span>
          </label>
          <input type="number" value={startExt} onChange={e => setStartExt(e.target.value)} />
          <label style={{marginLeft:16}}>End Extension:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.endExt}>
              <FaInfoCircle />
            </span>
          </label>
          <input type="number" value={endExt} onChange={e => setEndExt(e.target.value)} />
          <label style={{marginLeft:16}}>Label Prefix:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.labelPrefix}>
              <FaInfoCircle />
            </span>
          </label>
          <input type="text" value={labelPrefix} onChange={e => setLabelPrefix(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Time Offset (e.g. -5):
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.timeOffset}>
              <FaInfoCircle />
            </span>
          </label>
          <input type="number" value={timeOffset} onChange={e => setTimeOffset(e.target.value)} />
          <label style={{marginLeft:16}}>Admin Password:
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.adminPassword}>
              <FaInfoCircle />
            </span>
          </label>
          <input type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label><input type="checkbox" checked={yealinkLabelLength} onChange={e => setYealinkLabelLength(e.target.checked)} /> Enable long DSS key labels
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.yealinkLabelLength}>
              <FaInfoCircle />
            </span>
          </label>
          <label style={{ marginLeft: 16 }}><input type="checkbox" checked={yealinkDisableMissedCall} onChange={e => setYealinkDisableMissedCall(e.target.checked)} /> Disable missed call notification
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.yealinkDisableMissedCall}>
              <FaInfoCircle />
            </span>
          </label>
          <label style={{ marginLeft: 16 }}><input type="checkbox" checked={yealinkCallStealing} onChange={e => setYealinkCallStealing(e.target.checked)} /> Enable BLF call stealing
            <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.yealinkCallStealing}>
              <FaInfoCircle />
            </span>
          </label>
        </div>
        <button onClick={generateConfig} style={{marginTop:8}}>Generate Config</button>
        <div className="output">
          <textarea value={output} readOnly rows={10} style={{ width: '100%', marginTop: 16 }} />
        </div>
      </div>
    </>
  );
};

export default PhoneConfig;
