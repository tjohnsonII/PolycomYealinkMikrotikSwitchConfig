// Import React hooks for state and ref management
import { useState, useRef } from 'react'
// Import main CSS for styling
import './App.css'
// Import PapaParse for CSV import/export
import Papa from 'papaparse';
// Import custom dynamic switch config components
import SwitchDynamicTemplate from './SwitchDynamicTemplate';
import Switch24DynamicTemplate from './Switch24DynamicTemplate';
import Switch8DynamicTemplate from './Switch8DynamicTemplate';
import StrettoImportExportTab from './StrettoImportExportTab';

// List of supported phone models for config generation
const MODEL_OPTIONS = [
  'VVX 400', 'VVX 500', 'VVX 600', 'CP-7841-3PCC', 'CP-8832-K9', 'CP-7832-3PCC',
  'CP-8832-3PCC', 'SPA-122 ATA', 'SSIP6000', 'CP-7811-3PCC', 'SSIP7000', 'SSIP330',
  'D230', 'Trio 8500 Confernce', 'SSIP700-Mic', 'Yealink T54W', 'Yealink T57W',
  'CP960', 'Yealink SIP-T46S', 'SIP-T46U', 'SIP-T48S', 'SIP-T48U', 'i12 Door Strike',
  '8180 IP Loud Ringer', '8301 Paging Server', 'Yealink W56P', 'Yealink W60P',
  'HT813 ATA', '8186', 'Yealink 56h Dect w/ 60p Base', 'Yealink 56h Dect w/ 76p Base',
  'Yealink 56h Dect Handset'
];

// Tab definitions for navigation, including the Reference tab
const TABS = [
  { key: 'phone', label: 'Phone Configs' },
  { key: 'fbpx', label: 'FBPX Import Template' },
  { key: 'vpbx', label: 'VPBX Import Template' },
  { key: 'streeto', label: 'Streeto Import Template' },
  { key: 'mikrotik', label: 'Mikrotik Template' },
  { key: 'switch', label: 'Switch Template' },
  { key: 'reference', label: 'Reference' }, // Dedicated reference/legend tab
];

// Field definitions for FBPX import/export template (PBX user fields)
const FPBX_FIELDS = [
  "extension",
  "name",
  "description",
  "tech",
  "secret",
  "callwaiting_enable",
  "voicemail",
  "voicemail_enable",
  "voicemail_vmpwd",
  "voicemail_email",
  "voicemail_pager",
  "voicemail_options",
  "voicemail_same_exten",
  "outboundcid",
  "id",
  "dial",
  "user",
  "max_contacts",
  "accountcode"
];

// Field definitions for VPBX import/export template (adds MAC/model)
const VPBX_FIELDS = [
  "mac",
  "model",
  "extension",
  ...FPBX_FIELDS.filter(f => !["extension"].includes(f)),
];

// Type definitions for FBPX and VPBX forms (for type safety)
type FpbxFormType = Record<typeof FPBX_FIELDS[number], string>;
type VpbxFormType = Record<typeof VPBX_FIELDS[number], string>;

function App() {
  // State for active tab selection
  const [activeTab, setActiveTab] = useState('phone');
  // State for phone type (Polycom or Yealink)
  const [phoneType, setPhoneType] = useState<'Polycom' | 'Yealink'>('Polycom');
  // State for selected phone model
  const [model, setModel] = useState(MODEL_OPTIONS[0]);
  // State for IP address input
  const [ip, setIp] = useState('');
  // State for extension range and label prefix
  const [startExt, setStartExt] = useState('71');
  const [endExt, setEndExt] = useState('73');
  const [labelPrefix, setLabelPrefix] = useState('Park');
  // State for generated config output
  const [output, setOutput] = useState('');

  // State for Yealink expansion module section
  const [yealinkSection, setYealinkSection] = useState({
    templateType: 'BLF', // 'BLF' or 'SpeedDial'
    sidecarPage: '1',
    sidecarLine: '1',
    label: '',
    value: '',
    pbxIp: '',
  });
  // State for Yealink expansion config output
  const [yealinkOutput, setYealinkOutput] = useState('');

  // Generate Yealink expansion module config (sidecar keys)
  const generateYealinkExpansion = () => {
    const { templateType, sidecarPage, sidecarLine, label, value, pbxIp } = yealinkSection;
    let config = '';
    if (templateType === 'SpeedDial') {
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.label=${label}\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.type=13\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.value=${value}\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.line=1\n`;
    } else {
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.label=${label}\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.type=16\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.value=${value}@${pbxIp}\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.line=1\n`;
    }
    setYealinkOutput(config);
  };

  // State for Polycom expansion module section
  const [polycomSection, setPolycomSection] = useState({
    address: '',
    label: '',
    type: 'automata',
    linekeyCategory: 'BLF',
    linekeyIndex: '',
  });
  // State for Polycom expansion config output
  const [polycomOutput, setPolycomOutput] = useState('');

  // Generate Polycom expansion module config (sidecar keys)
  const generatePolycomExpansion = () => {
    const { address, label, type, linekeyCategory, linekeyIndex } = polycomSection;
    let config = '';
    config += `attendant.resourcelist.${linekeyIndex}.address=${address}\n`;
    config += `attendant.resourcelist.${linekeyIndex}.label=${label}\n`;
    config += `attendant.resourcelist.${linekeyIndex}.type=${type}\n`;
    config += `linekey.${linekeyIndex}.category=${linekeyCategory}\n`;
    config += `linekey.${linekeyIndex}.index=${linekeyIndex}\n`;
    setPolycomOutput(config);
  };

  // Helper: Generate Polycom park lines config for selected model
  function generatePolycomParkLines(model: string, start: number, end: number, ip: string) {
    let config = '';
    if (model === 'VVX 400') {
      let linekey = 7;
      for (let i = start; i <= end; i++, linekey++) {
        config += `attendant.resourcelist.${linekey}.address=${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.calladdress=*85${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.label=Park ${linekey - 6}\n`;
        config += `attendant.resourcelist.${linekey}.type=automata\n`;
      }
      for (let linekey = 7; linekey < 7 + (end - start + 1); linekey++) {
        config += `linekey.${linekey}.category=BLF\n`;
        config += `linekey.${linekey}.index=${linekey}\n`;
      }
    } else if (model === 'VVX 500') {
      let linekey = 9;
      for (let i = start; i <= end; i++, linekey++) {
        config += `attendant.resourcelist.${linekey}.address=${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.calladdress=*85${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.label=Park ${linekey - 8}\n`;
        config += `attendant.resourcelist.${linekey}.type=automata\n`;
      }
      for (let linekey = 9; linekey < 9 + (end - start + 1); linekey++) {
        config += `linekey.${linekey}.category=BLF\n`;
        config += `linekey.${linekey}.index=${linekey}\n`;
      }
    } else if (model === 'VVX 600') {
      let linekeys = [13, 14, 15];
      let exts = [];
      for (let i = start; i <= end; i++) exts.push(i);
      for (let idx = 0; idx < exts.length; idx++) {
        let linekey = linekeys[idx];
        let ext = exts[idx];
        config += `attendant.resourcelist.${linekey}.address=${ext}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.calladdress=*85${ext}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.label=Park ${idx + 1}\n`;
        config += `attendant.resourcelist.${linekey}.type=automata\n`;
      }
      for (let idx = 0; idx < exts.length; idx++) {
        let linekey = linekeys[idx];
        config += `linekey.${linekey}.category=BLF\n`;
        config += `linekey.${linekey}.index=${linekey}\n`;
      }
    } else {
      // Default Polycom template
      for (let i = start; i <= end; i++) {
        config += `attendant.resourcelist.${i}.address=${i}@${ip}\n`;
        config += `attendant.resourcelist.${i}.calladdress=*85${i}@${ip}\n`;
        config += `attendant.resourcelist.${i}.label=Park${i - start + 1}\n`;
        config += `attendant.resourcelist.${i}.type=automata\n`;
        config += `linekey.${i}.category=BLF\n`;
        config += `linekey.${i}.index=${i}\n`;
      }
    }
    return config;
  }

  // Helper: Generate Yealink park lines config for selected model
  function generateYealinkParkLines(model: string, start: number, end: number, ip: string) {
    let config = '';
    if (model === 'Yealink SIP-T46S' || model === 'Yealink T54W') {
      let linekey = 6;
      for (let i = start; i <= end; i++, linekey++) {
        config += `linekey.${linekey}.extension=${i}\n`;
        config += `linekey.${linekey}.label=Park ${linekey - 5}\n`;
        config += `linekey.${linekey}.line=1\n`;
        config += `linekey.${linekey}.type=10\n`;
        config += `linekey.${linekey}.value=${i}@${ip}\n`;
      }
    } else if (model === 'SIP-T48S' || model === 'Yealink T57W') {
      let linekey = 7;
      for (let i = start; i <= end; i++, linekey++) {
        config += `linekey.${linekey}.extension=${i}\n`;
        config += `linekey.${linekey}.label=Park ${linekey - 6}\n`;
        config += `linekey.${linekey}.line=1\n`;
        config += `linekey.${linekey}.type=10\n`;
        config += `linekey.${linekey}.value=${i}@${ip}\n`;
      }
    } else {
      // Default Yealink template
      for (let i = start; i <= end; i++) {
        config += `linekey.${i}.extension=${i}\n`;
        config += `linekey.${i}.label=Park ${i - start + 1}\n`;
        config += `linekey.${i}.line=1\n`;
        config += `linekey.${i}.type=10\n`;
        config += `linekey.${i}.value=${i}@${ip}\n`;
      }
    }
    return config;
  }

  // Global/Required attributes for Yealink phones (toggle advanced features)
  const yealinkOptions = {
    callStealing: false,
    labelLength: false,
    disableMissedCall: false,
  };

  // Helper: Generate Yealink global attributes config
  function getYealinkGlobalAttributes(opts: typeof yealinkOptions) {
    let config = '';
    if (opts.callStealing) {
      config += 'features.pickup.direct_pickup_code=**\n';
      config += 'features.pickup.direct_pickup_enable=1\n';
    }
    if (opts.labelLength) {
      config += 'features.config_dsskey_length=1\n';
    }
    if (opts.disableMissedCall) {
      config += 'phone_setting.missed_call_power_led_flash.enable=0\n';
      config += 'features.missed_call_popup.enable=0\n';
    }
    return config;
  }

  // State for feature key template section (advanced programmable keys)
  const [featureKey, setFeatureKey] = useState({
    brand: 'Yealink',
    lineNum: '',
    buttonLabel: '',
    featureCode: '',
    promptLabel: '',
    promptTitle: '',
    promptLength: '',
    efkIndex: '',
  });
  // State for feature key config output
  const [featureKeyOutput, setFeatureKeyOutput] = useState('');

  // Generate feature key config for Yealink or Polycom (macros, prompts)
  function generateFeatureKeyConfig() {
    if (featureKey.brand === 'Yealink') {
      setFeatureKeyOutput(
        'features.enhanced_dss_keys.enable=1\n' +
        'feature.enhancedFeatureKeys.enabled=1\n' +
        `linekey.${featureKey.lineNum}.label=${featureKey.buttonLabel}\n` +
        `linekey.${featureKey.lineNum}.line=0\n` +
        'linekey.' + featureKey.lineNum + '.type=73\n' +
        `linekey.${featureKey.lineNum}.value=${featureKey.featureCode}$P${featureKey.promptLabel}&T${featureKey.promptTitle}&C${featureKey.promptLength}&N$$Tinvite$\n`
      );
    } else {
      setFeatureKeyOutput(
        'feature.enhancedFeatureKeys.enabled=1\n' +
        'feature.EFKLineKey.enabled=1\n' +
        `efk.efklist.${featureKey.efkIndex}.mname=${featureKey.buttonLabel}\n` +
        `efk.efklist.${featureKey.efkIndex}.status=1\n` +
        `efk.efklist.${featureKey.efkIndex}.action.string=${featureKey.featureCode}$P${featureKey.promptLength}$$Tinvite$\n` +
        `efk.efklist.${featureKey.efkIndex}.label=${featureKey.promptTitle}\n` +
        `efk.efkprompt.${featureKey.efkIndex}.label=${featureKey.promptLabel}\n` +
        `efk.efkprompt.${featureKey.efkIndex}.status=1\n` +
        `efk.efkprompt.${featureKey.efkIndex}.type=numeric\n` +
        `linekey.${featureKey.lineNum}.category=EFK\n` +
        `linekey.${featureKey.lineNum}.index=${featureKey.efkIndex}\n`
      );
    }
  }

  // Yealink record templates for quick config (voicemail, busy, etc)
  const yealinkRecordTemplates = [
    { label: 'Record Unavailable', value: '*97$Cwc$$Cp1$01$Tdtmf$' },
    { label: 'Record Busy', value: '*97$Cwc$$Cp1$02$Tdtmf$' },
    { label: 'Record Name', value: '*97$Cwc$$Cp1$03$Tdtmf$' },
    { label: 'Record Unreachable/DND', value: '*97$Cwc$$Cp1$04$Tdtmf$' },
  ];

  // Polycom record templates for quick config (voicemail, busy, etc)
  const polycomRecordTemplates = [
    { label: 'Record Unavailable', value: '*97$Tinvite$$Cpause2$01$Tdtmf$' },
    { label: 'Record Busy', value: '*97$Tinvite$$Cpause2$02$Tdtmf$' },
    { label: 'Record Name', value: '*97$Tinvite$$Cpause2$03$Tdtmf$' },
    { label: 'Record DND', value: '*97$Tinvite$$Cpause2$04$Tdtmf$' },
  ];

  // State for record template section (quick record macros)
  const [recordTemplate, setRecordTemplate] = useState({
    brand: 'Yealink',
    lineNum: '',
    macroNum: '', // Polycom only
    label: '',
    templateIdx: 0,
  });
  // State for record config output
  const [recordOutput, setRecordOutput] = useState('');

  // Generate record config for Yealink or Polycom (quick record macros)
  function generateRecordConfig() {
    if (recordTemplate.brand === 'Yealink') {
      const t = yealinkRecordTemplates[recordTemplate.templateIdx];
      setRecordOutput(
        'features.enhanced_dss_keys.enable=1\n' +
        `linekey.${recordTemplate.lineNum}.label=${t.label}\n` +
        `linekey.${recordTemplate.lineNum}.line=0\n` +
        'linekey.' + recordTemplate.lineNum + '.type=73\n' +
        `linekey.${recordTemplate.lineNum}.value=${t.value}\n`
      );
    } else {
      const t = polycomRecordTemplates[recordTemplate.templateIdx];
      setRecordOutput(
        'feature.efklinekey.enabled=1\n' +
        'feature.enhancedfeaturekeys.enabled=1\n' +
        `efk.efklist.${recordTemplate.macroNum}.action.string=${t.value}\n` +
        `efk.efklist.${recordTemplate.macroNum}.mname=${t.label}\n` +
        `efk.efklist.${recordTemplate.macroNum}.status=1\n` +
        `linekey.${recordTemplate.lineNum}.category=EFK\n` +
        `linekey.${recordTemplate.lineNum}.index=${recordTemplate.macroNum}\n`
      );
    }
  }

  // Helper: Generate Yealink transfer-to-VM config (special feature)
  function generateYealinkTransferToVM(lineNum: string, extNum: string, pbxIp: string) {
    return (
      `linekey.${lineNum}.extension=${extNum}\n` +
      `linekey.${lineNum}.label=Transfer-2-VM\n` +
      `linekey.${lineNum}.line=1\n` +
      `linekey.${lineNum}.type=3\n` +
      `linekey.${lineNum}.value=*${extNum}@${pbxIp}\n`
    );
  }

  // Helper: Generate Yealink speed dial config (special feature)
  function generateYealinkSpeedDial(lineNum: string, label: string, value: string) {
    return (
      `linekey.${lineNum}.line=1\n` +
      `linekey.${lineNum}.label=${label}\n` +
      `linekey.${lineNum}.type=13\n` +
      `linekey.${lineNum}.value=${value}\n`
    );
  }

  // Helper: Generate Polycom external number config (special feature)
  function generatePolycomExternal(lineNum: string, macroNum: string, label: string, externalNum: string) {
    return (
      'feature.enhancedFeatureKeys.enabled=1\n' +
      'feature.EFKLineKey.enabled=1\n' +
      `efk.efklist.${macroNum}.mname=${label}\n` +
      `efk.efklist.${macroNum}.status=1\n` +
      `efk.efklist.${macroNum}.action.string=${externalNum}$Tinvite$\n` +
      `linekey.${lineNum}.category=EFK\n` +
      `linekey.${lineNum}.index=${macroNum}\n`
    );
  }

  // State for selected feature template and its inputs (for advanced features)
  const [selectedFeature, setSelectedFeature] = useState('');
  const [featureInputs, setFeatureInputs] = useState({
    lineNum: '',
    extNum: '',
    pbxIp: '',
    label: '',
    value: '',
    macroNum: '',
    externalNum: '',
  });
  // State for feature template config output
  const [featureOutput, setFeatureOutput] = useState('');

  // Generate config for selected feature template (advanced feature generator)
  function handleFeatureGenerate() {
    let out = '';
    switch (selectedFeature) {
      case 'YealinkTransferToVM':
        out = generateYealinkTransferToVM(featureInputs.lineNum, featureInputs.extNum, featureInputs.pbxIp);
        break;
      case 'YealinkSpeedDial':
        out = generateYealinkSpeedDial(featureInputs.lineNum, featureInputs.label, featureInputs.value);
        break;
      case 'PolycomExternal':
        out = generatePolycomExternal(featureInputs.lineNum, featureInputs.macroNum, featureInputs.label, featureInputs.externalNum);
        break;
      default:
        out = '';
    }
    setFeatureOutput(out);
  }

  // Generate main config for Polycom or Yealink park lines (main output)
  const generateConfig = () => {
    const start = parseInt(startExt, 10);
    const end = parseInt(endExt, 10);
    if (isNaN(start) || isNaN(end) || !ip) {
      setOutput('Please enter valid extension numbers and IP address.');
      return;
    }
    let config = `# Model: ${model}\n`;
    if (phoneType === 'Polycom') {
      config += generatePolycomParkLines(model, start, end, ip);
    } else {
      config += getYealinkGlobalAttributes(yealinkOptions);
      config += generateYealinkParkLines(model, start, end, ip);
    }
    setOutput(config);
  };

  // State and handlers for FBPX import/export form (PBX CSV import/export)
  const [fpbxForm, setFpbxForm] = useState<FpbxFormType>(() => FPBX_FIELDS.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as FpbxFormType));
  const fpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  function handleFpbxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFpbxForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFpbxExport() {
    const csvHeader = FPBX_FIELDS.join(',') + '\n';
    const csvRow = FPBX_FIELDS.map(f => `"${(fpbxForm[f] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    const csv = csvHeader + csvRow;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    if (fpbxDownloadRef.current) {
      fpbxDownloadRef.current.href = url;
      fpbxDownloadRef.current.download = 'fpbx_import.csv';
      fpbxDownloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function handleFpbxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const row = results.data[0];
        if (row) {
          // Only assign known fields, default to empty string if missing
          setFpbxForm(f => {
            const updated: FpbxFormType = { ...f };
            FPBX_FIELDS.forEach(field => {
              updated[field] = row[field] ?? '';
            });
            return updated;
          });
        }
      },
    });
  }

  // State and handlers for VPBX import/export form (PBX CSV import/export)
  const [vpbxForm, setVpbxForm] = useState<VpbxFormType>(() => VPBX_FIELDS.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as VpbxFormType));
  const vpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  function handleVpbxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setVpbxForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleVpbxExport() {
    const csvHeader = VPBX_FIELDS.join(',') + '\n';
    const csvRow = VPBX_FIELDS.map(f => `"${(vpbxForm[f] || '').replace(/"/g, '""')}"`).join(',') + '\n';
    const csv = csvHeader + csvRow;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    if (vpbxDownloadRef.current) {
      vpbxDownloadRef.current.href = url;
      vpbxDownloadRef.current.download = 'vpbx_import.csv';
      vpbxDownloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function handleVpbxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const row = results.data[0];
        if (row) {
          setVpbxForm(f => {
            const updated: VpbxFormType = { ...f };
            VPBX_FIELDS.forEach(field => {
              updated[field] = row[field] ?? '';
            });
            return updated;
          });
        }
      },
    });
  }

  // Main UI rendering
  return (
    <div className="container">
      {/* App title and tab navigation */}
      <h1>Hosted Config Generator</h1>
      <div className="tabs" style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
            style={{
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #0078d4' : '2px solid #ccc',
              background: activeTab === tab.key ? '#f7fbff' : '#f4f4f4',
              color: activeTab === tab.key ? '#0078d4' : '#333',
              fontWeight: activeTab === tab.key ? 600 : 400,
              padding: '10px 24px',
              borderTopLeftRadius: idx === 0 ? 8 : 0,
              borderTopRightRadius: idx === TABS.length - 1 ? 8 : 0,
              marginRight: 2,
              outline: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s, border-bottom 0.2s',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
              minWidth: 120,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <hr />
      {/* Reference Tab for Phone Configs (moved to its own tab) */}
      {activeTab === 'reference' && (
        <div style={{ margin: '24px 0', maxWidth: 900 }}>
          <h2>Phone Config Reference (Legend)</h2>
          <div style={{ marginTop: 16, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {/* Polycom Reference Table */}
            <div style={{ flex: 1, minWidth: 350 }}>
              <h3>Polycom</h3>
              <table className="reference-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#f4f4f4' }}>
                    <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>Setting</th>
                    <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code>attendant.resourcelist.X.address</code></td><td>BLF/park/extension address (e.g. 1001@ip)</td></tr>
                  <tr><td><code>attendant.resourcelist.X.label</code></td><td>Button label (displayed on phone)</td></tr>
                  <tr><td><code>attendant.resourcelist.X.type</code></td><td>Type of key (<b>automata</b> for BLF/park, <b>normal</b> for speed dial)</td></tr>
                  <tr><td><code>linekey.X.category</code></td><td>Key category (<b>BLF</b>, <b>EFK</b>)</td></tr>
                  <tr><td><code>efk.efklist.X.action.string</code></td><td>Macro or feature key action (e.g. transfer, record, external number)</td></tr>
                  <tr><td><code>feature.enhancedFeatureKeys.enabled</code></td><td>Enable enhanced feature keys (macros, advanced features)</td></tr>
                  <tr><td><code>linekey.X.index</code></td><td>Index of the key (matches resourcelist or efklist)</td></tr>
                  <tr><td><code>efk.efkprompt.X.label</code></td><td>Prompt label for user input (numeric, string, etc.)</td></tr>
                  <tr><td><code>feature.EFKLineKey.enabled</code></td><td>Enable EFK line key macros</td></tr>
                </tbody>
              </table>
              <h4 style={{ marginTop: 12 }}>Common Polycom Features</h4>
              <ul style={{ marginLeft: 20 }}>
                <li><b>BLF (Busy Lamp Field):</b> Monitors extension/park status, lights up when in use.</li>
                <li><b>Speed Dial:</b> Quick dial to a number or extension.</li>
                <li><b>EFK (Enhanced Feature Key):</b> Macro for advanced actions (e.g. transfer, record, external call).</li>
                <li><b>Expansion Module:</b> Extra programmable keys for sidecar modules.</li>
              </ul>
            </div>
            {/* Yealink Reference Table */}
            <div style={{ flex: 1, minWidth: 350 }}>
              <h3>Yealink</h3>
              <table className="reference-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#f4f4f4' }}>
                    <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>Setting</th>
                    <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><code>linekey.X.extension</code></td><td>Extension or park number assigned to key</td></tr>
                  <tr><td><code>linekey.X.label</code></td><td>Button label (displayed on phone)</td></tr>
                  <tr><td><code>linekey.X.type</code></td><td>Type of key (<b>10</b> for BLF, <b>13</b> for speed dial, <b>3</b> for transfer-to-VM)</td></tr>
                  <tr><td><code>linekey.X.value</code></td><td>Value for the key (e.g. extension@ip, feature code)</td></tr>
                  <tr><td><code>features.enhanced_dss_keys.enable</code></td><td>Enable enhanced DSS keys (advanced features/macros)</td></tr>
                  <tr><td><code>feature.enhancedFeatureKeys.enabled</code></td><td>Enable enhanced feature keys (macros, advanced features)</td></tr>
                  <tr><td><code>expansion_module.Y.key.Z.label</code></td><td>Label for expansion module key (sidecar)</td></tr>
                  <tr><td><code>expansion_module.Y.key.Z.type</code></td><td>Type of expansion key (<b>16</b> for BLF, <b>13</b> for speed dial)</td></tr>
                  <tr><td><code>expansion_module.Y.key.Z.value</code></td><td>Value for expansion key (e.g. extension@ip)</td></tr>
                </tbody>
              </table>
              <h4 style={{ marginTop: 12 }}>Common Yealink Features</h4>
              <ul style={{ marginLeft: 20 }}>
                <li><b>BLF (Busy Lamp Field):</b> Monitors extension/park status, lights up when in use (type=10).</li>
                <li><b>Speed Dial:</b> Quick dial to a number or extension (type=13).</li>
                <li><b>Transfer to VM:</b> Direct transfer to voicemail (type=3, value=*ext@ip).</li>
                <li><b>Expansion Module:</b> Extra programmable keys for sidecar modules (expansion_module.Y.key.Z.*).</li>
                <li><b>Enhanced DSS/Feature Keys:</b> Enable advanced macros and prompts.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Phone Configs Tab */}
      {activeTab === 'phone' && (
        <>
          {/* Phone type/model/extension input form */}
          <div className="form-group">
            <label>Phone Type:</label>
            <select value={phoneType} onChange={e => setPhoneType(e.target.value as 'Polycom' | 'Yealink')}>
              <option value="Polycom">Polycom</option>
              <option value="Yealink">Yealink</option>
            </select>
          </div>
          <div className="form-group">
            <label>Model:</label>
            <select value={model} onChange={e => setModel(e.target.value)}>
              {MODEL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>IP Address:</label>
            <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.100" />
          </div>
          <div className="form-group">
            <label>Start Extension:</label>
            <input type="number" value={startExt} onChange={e => setStartExt(e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Extension:</label>
            <input type="number" value={endExt} onChange={e => setEndExt(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Label Prefix:</label>
            <input type="text" value={labelPrefix} onChange={e => setLabelPrefix(e.target.value)} />
          </div>
          <button onClick={generateConfig}>Generate Config</button>
          <div className="output">
            <textarea value={output} readOnly rows={10} style={{ width: '100%', marginTop: 16 }} />
          </div>

          {/* Yealink Expansion Module Section */}
          <hr />
          <h2>Yealink Expansion Module</h2>
          <div className="form-group">
            <label>Template Type:</label>
            <select value={yealinkSection.templateType} onChange={e => setYealinkSection(s => ({ ...s, templateType: e.target.value }))}>
              <option value="BLF">BLF</option>
              <option value="SpeedDial">SpeedDial</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sidecar Page (Y):</label>
            <input type="number" value={yealinkSection.sidecarPage} onChange={e => setYealinkSection(s => ({ ...s, sidecarPage: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Sidecar Line (Z):</label>
            <input type="number" value={yealinkSection.sidecarLine} onChange={e => setYealinkSection(s => ({ ...s, sidecarLine: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Label:</label>
            <input type="text" value={yealinkSection.label} onChange={e => setYealinkSection(s => ({ ...s, label: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Value (Phone/Ext):</label>
            <input type="text" value={yealinkSection.value} onChange={e => setYealinkSection(s => ({ ...s, value: e.target.value }))} />
          </div>
          {yealinkSection.templateType === 'BLF' && (
            <div className="form-group">
              <label>PBX IP:</label>
              <input type="text" value={yealinkSection.pbxIp} onChange={e => setYealinkSection(s => ({ ...s, pbxIp: e.target.value }))} />
            </div>
          )}
          <button onClick={generateYealinkExpansion}>Generate Yealink Expansion Config</button>
          <div className="output">
            <textarea value={yealinkOutput} readOnly rows={6} style={{ width: '100%', marginTop: 8 }} />
          </div>

          {/* Polycom Expansion Module Section */}
          <hr />
          <h2>Polycom Expansion Module</h2>
          <div className="form-group">
            <label>Linekey Index:</label>
            <input type="number" value={polycomSection.linekeyIndex} onChange={e => setPolycomSection(s => ({ ...s, linekeyIndex: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Address (e.g. 1001@ip):</label>
            <input type="text" value={polycomSection.address} onChange={e => setPolycomSection(s => ({ ...s, address: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Label:</label>
            <input type="text" value={polycomSection.label} onChange={e => setPolycomSection(s => ({ ...s, label: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <input type="text" value={polycomSection.type} onChange={e => setPolycomSection(s => ({ ...s, type: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Linekey Category:</label>
            <input type="text" value={polycomSection.linekeyCategory} onChange={e => setPolycomSection(s => ({ ...s, linekeyCategory: e.target.value }))} />
          </div>
          <button onClick={generatePolycomExpansion}>Generate Polycom Expansion Config</button>
          <div className="output">
            <textarea value={polycomOutput} readOnly rows={6} style={{ width: '100%', marginTop: 8 }} />
          </div>

          {/* Feature Key Template Section */}
          <hr />
          <h2>Feature Key Template</h2>
          <div className="form-group">
            <label>Brand:</label>
            <select value={featureKey.brand} onChange={e => setFeatureKey(s => ({ ...s, brand: e.target.value }))}>
              <option value="Yealink">Yealink</option>
              <option value="Polycom">Polycom</option>
            </select>
          </div>
          <div className="form-group">
            <label>Line Number:</label>
            <input type="text" value={featureKey.lineNum} onChange={e => setFeatureKey(s => ({ ...s, lineNum: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Button Label:</label>
            <input type="text" value={featureKey.buttonLabel} onChange={e => setFeatureKey(s => ({ ...s, buttonLabel: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Feature Code:</label>
            <input type="text" value={featureKey.featureCode} onChange={e => setFeatureKey(s => ({ ...s, featureCode: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Prompt Label:</label>
            <input type="text" value={featureKey.promptLabel} onChange={e => setFeatureKey(s => ({ ...s, promptLabel: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Prompt Title:</label>
            <input type="text" value={featureKey.promptTitle} onChange={e => setFeatureKey(s => ({ ...s, promptTitle: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Prompt Length:</label>
            <input type="text" value={featureKey.promptLength} onChange={e => setFeatureKey(s => ({ ...s, promptLength: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>EFK Index:</label>
            <input type="text" value={featureKey.efkIndex} onChange={e => setFeatureKey(s => ({ ...s, efkIndex: e.target.value }))} />
          </div>
          <button onClick={generateFeatureKeyConfig}>Generate Feature Key Config</button>
          <div className="output">
            <textarea value={featureKeyOutput} readOnly rows={6} style={{ width: '100%', marginTop: 8 }} />
          </div>

          {/* Record Template Section */}
          <hr />
          <h2>Record Template</h2>
          <div className="form-group">
            <label>Brand:</label>
            <select value={recordTemplate.brand} onChange={e => setRecordTemplate(s => ({ ...s, brand: e.target.value }))}>
              <option value="Yealink">Yealink</option>
              <option value="Polycom">Polycom</option>
            </select>
          </div>
          <div className="form-group">
            <label>Line Number:</label>
            <input type="text" value={recordTemplate.lineNum} onChange={e => setRecordTemplate(s => ({ ...s, lineNum: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Macro Number (Polycom only):</label>
            <input type="text" value={recordTemplate.macroNum} onChange={e => setRecordTemplate(s => ({ ...s, macroNum: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Template:</label>
            <select value={recordTemplate.templateIdx} onChange={e => setRecordTemplate(s => ({ ...s, templateIdx: parseInt(e.target.value, 10) }))}>
              {yealinkRecordTemplates.map((t, idx) => (
                <option key={idx} value={idx}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Label:</label>
            <input type="text" value={recordTemplate.label} onChange={e => setRecordTemplate(s => ({ ...s, label: e.target.value }))} />
          </div>
          <button onClick={generateRecordConfig}>Generate Record Config</button>
          <div className="output">
            <textarea value={recordOutput} readOnly rows={6} style={{ width: '100%', marginTop: 8 }} />
          </div>

          {/* Feature Templates Section */}
          <hr />
          <h2>Feature Templates</h2>
          <div className="form-group">
            <label>Select Feature Template:</label>
            <select value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="YealinkTransferToVM">Yealink Transfer to VM</option>
              <option value="YealinkSpeedDial">Yealink Speed Dial</option>
              <option value="PolycomExternal">Polycom External Number</option>
            </select>
          </div>
          {selectedFeature === 'YealinkTransferToVM' && (
            <>
              <div className="form-group">
                <label>Line Number:</label>
                <input type="text" value={featureInputs.lineNum} onChange={e => setFeatureInputs(s => ({ ...s, lineNum: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Extension Number:</label>
                <input type="text" value={featureInputs.extNum} onChange={e => setFeatureInputs(s => ({ ...s, extNum: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>PBX IP:</label>
                <input type="text" value={featureInputs.pbxIp} onChange={e => setFeatureInputs(s => ({ ...s, pbxIp: e.target.value }))} />
              </div>
            </>
          )}
          {selectedFeature === 'YealinkSpeedDial' && (
            <>
              <div className="form-group">
                <label>Line Number:</label>
                <input type="text" value={featureInputs.lineNum} onChange={e => setFeatureInputs(s => ({ ...s, lineNum: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Label:</label>
                <input type="text" value={featureInputs.label} onChange={e => setFeatureInputs(s => ({ ...s, label: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input type="text" value={featureInputs.value} onChange={e => setFeatureInputs(s => ({ ...s, value: e.target.value }))} />
              </div>
            </>
          )}
          {selectedFeature === 'PolycomExternal' && (
            <>
              <div className="form-group">
                <label>Line Number:</label>
                <input type="text" value={featureInputs.lineNum} onChange={e => setFeatureInputs(s => ({ ...s, lineNum: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Macro Number:</label>
                <input type="text" value={featureInputs.macroNum} onChange={e => setFeatureInputs(s => ({ ...s, macroNum: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Label:</label>
                <input type="text" value={featureInputs.label} onChange={e => setFeatureInputs(s => ({ ...s, label: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>External Number:</label>
                <input type="text" value={featureInputs.externalNum} onChange={e => setFeatureInputs(s => ({ ...s, externalNum: e.target.value }))} />
              </div>
            </>
          )}
          <button onClick={handleFeatureGenerate}>Generate Feature Config</button>
          <div className="output">
            <textarea value={featureOutput} readOnly rows={6} style={{ width: '100%', marginTop: 8 }} />
          </div>
        </>
      )}
      {/* FBPX Import Template Tab */}
      {activeTab === 'fbpx' && (
        <div>
          {/* FBPX import/export form UI as a table */}
          <h2>FBPX Import Template</h2>
          <form style={{ maxWidth: 900 }} onSubmit={e => e.preventDefault()}>
            <div style={{ marginBottom: 12 }}>
              <input type="file" accept=".csv" onChange={handleFpbxImport} />
            </div>
            <table className="import-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {FPBX_FIELDS.map(f => (
                    <th key={f} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {FPBX_FIELDS.map(f => (
                    <td key={f} style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>
                      <input
                        id={f}
                        name={f}
                        type="text"
                        value={fpbxForm[f]}
                        onChange={handleFpbxChange}
                        style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <button type="button" onClick={handleFpbxExport} style={{ marginTop: 12 }}>
              Export as CSV
            </button>
            <a ref={fpbxDownloadRef} style={{ display: 'none' }}>Download</a>
          </form>
        </div>
      )}
      {/* VPBX Import Template Tab */}
      {activeTab === 'vpbx' && (
        <div>
          {/* VPBX import/export form UI as a table */}
          <h2>VPBX Import Template</h2>
          <form style={{ maxWidth: 900 }} onSubmit={e => e.preventDefault()}>
            <div style={{ marginBottom: 12 }}>
              <input type="file" accept=".csv" onChange={handleVpbxImport} />
            </div>
            <table className="import-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {VPBX_FIELDS.map(f => (
                    <th key={f} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {VPBX_FIELDS.map(f => (
                    <td key={f} style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>
                      <input
                        id={f}
                        name={f}
                        type="text"
                        value={vpbxForm[f]}
                        onChange={handleVpbxChange}
                        style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <button type="button" onClick={handleVpbxExport} style={{ marginTop: 12 }}>
              Export as CSV
            </button>
            <a ref={vpbxDownloadRef} style={{ display: 'none' }}>Download</a>
          </form>
        </div>
      )}
      {/* Streeto Import Template Tab */}
      {activeTab === 'streeto' && (
        <StrettoImportExportTab />
      )}
      {/* Mikrotik Template Tab */}
      {activeTab === 'mikrotik' && (
        <>
          {/* Mikrotik static config templates */}
          <hr style={{ margin: '32px 0' }} />
          <h2>Mikrotik 5009 Bridge Template</h2>
          <textarea
            readOnly
            rows={20}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
            value={`/interface bridge
add name=Phones
/interface ethernet
set [ find default-name=ether4 ] comment="HOSTED PHONE"
set [ find default-name=ether5 ] comment="HOSTED PHONE"
/interface vlan
add interface=Phones name=vlan202 vlan-id=202
/ip pool
add name=Phones ranges=172.16.1.3-172.16.1.10
/ip dhcp-server
add address-pool=Phones interface=Phones name="Phone DHCP NETWORK"
/interface bridge port
add bridge=Phones interface=ether4
add bridge=Phones interface=ether5
/ip firewall connection tracking
set udp-timeout=1m30s
/ip address
add address=172.16.1.1/24 interface=Phones network=172.16.1.0
/ip dhcp-server network
add address=172.16.1.0/24 dns-server=1.1.1.1,8.8.8.8 gateway=172.16.1.1 \
    netmask=24
/ip firewall.address-list
add address=172.16.1.0/24 list=MGMT
add address=216.109.194.21 list=MGMT
/ip firewall nat
add action=masquerade chain=srcnat src-address=172.16.1.0/24
/ip firewall service-port
set ftp disabled=yes
set tftp disabled=yes
set h323 disabled=yes
set sip disabled=yes
set pptp disabled=yes`}
          />
          <hr style={{ margin: '32px 0' }} />
          <h2>Mikrotik 5009 Alternate Config</h2>
          <textarea
            readOnly
            rows={22}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
            value={`/interface ethernet
set [ find default-name=ether7 ] comment="Uplink to 123Net Switch"
/interface vlan
add interface=ether7 name=vlan102 vlan-id=102
add interface=ether7 name=vlan202 vlan-id=202
/ip dhcp-server option
add code=2 name="GMT Offset -5" value=0xFFFFB9B0
add code=42 name=NTP value="'184.105.182.16'"
add code=160 name=prov_160 value="'http://provisioner.123.net'"
add code=66 name=prov_66 value="'http://provisioner.123.net'"
add code=202 name=Phone_vlan value="'VLAN-A=202'"
/ip dhcp-server option sets
add name=Phones_Options options="GMT Offset -5,NTP,prov_66,prov_160,Phone_vlan"
/ip pool
add name=Phones_IP_Pool ranges=172.16.1.30-172.16.1.250
/ip dhcp-server
add address-pool=Phones_IP_Pool authoritative=after-2sec-delay dhcp-option-set=Phones_Options disabled=no interface=vlan202 name=\
    "Phones DHCP"
/ip address
add address=192.168.10.1/24 interface=vlan102 network=192.168.10.0
add address=172.16.1.1/24 interface=vlan202 network=172.16.1.0
/ip dhcp-server network
add address=172.16.1.0/24 dhcp-option-set=Phones_Options dns-server=8.8.8.8,216.234.97.2,216.234.97.3 gateway=172.16.1.1 \
    netmask=24 ntp-server=184.105.182.16
/ip firewall address-list
add address=192.168.10.0/24 list=MGMT
add address=172.16.1.0/24 list=PHONEVLAN
add address=205.251.183.0/24 list=PBX
add address=69.39.69.0/24 list=PBX
add address=216.109.194.50 list=PBX
add address=184.105.182.16 comment=NTP list=PBX
/ip firewall connection tracking
set udp-timeout=1m30s
/ip firewall filter
add action=accept chain=forward comment="ALLOW CUSTOMER PASSTHROUGH"
add action=accept chain=input comment=ALLOW_PBX src-address-list=PBX
add action=accept chain=input comment=ALLOW_PHONES src-address-list=PHONEVLAN
/ip firewall nat
add action=masquerade chain=srcnat src-address=172.16.1.0/24
/ip firewall service-port
set ftp disabled=yes
set tftp disabled=yes
set irc disabled=yes
set h323 disabled=yes
set sip disabled=yes
set pptp disabled=yes
set udplite disabled=yes
set dccp disabled=yes
set sctp disabled=yes`}
          />
        </>
      )}
      {/* Switch Template Tab */}
      {activeTab === 'switch' && (
        <>
          {/* Dynamic/static switch config templates */}
          <SwitchDynamicTemplate />
          <hr style={{ margin: '32px 0' }} />
          <Switch24DynamicTemplate />
          <hr style={{ margin: '32px 0' }} />
          <Switch8DynamicTemplate />
        </>
      )}
    </div>
  );
}

// Export main App component
export default App
