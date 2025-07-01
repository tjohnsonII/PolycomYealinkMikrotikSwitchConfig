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
import HostedOrderTrackerTab from './HostedOrderTrackerTab';

// Import Mikrotik template modules
import { mikrotik5009Bridge } from './mikrotik5009BridgeTemplate';
import { mikrotik5009Passthrough } from './mikrotik5009PassthroughTemplate';
import { onNetMikrotikConfigTemplate } from './onNetMikrotikConfigTemplate';
import { ottMikrotikTemplate } from './ottMikrotikTemplate';
import { mikrotikStandAloneATATemplate } from './mikrotikStandAloneATATemplate';
import { mikrotikDhcpOptions } from './mikrotikDhcpOptionsTemplate';

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
  { key: 'fullconfig', label: 'Full Config' },
  { key: 'expansion', label: 'Expansion Modules' },
  { key: 'fbpx', label: 'FBPX Import Template' },
  { key: 'vpbx', label: 'VPBX Import Template' },
  { key: 'streeto', label: 'Streeto Import Template' },
  { key: 'mikrotik', label: 'Mikrotik Template' },
  { key: 'switch', label: 'Switch Template' },
  { key: 'reference', label: 'Reference' }, // Dedicated reference/legend tab
  { key: 'ordertracker', label: 'Order Tracker' },
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

// Helper to create an empty FBPX row
const createEmptyFpbxRow = (): FpbxFormType => FPBX_FIELDS.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as FpbxFormType);
// Helper to create an empty VPBX row
const createEmptyVpbxRow = (): VpbxFormType => VPBX_FIELDS.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as VpbxFormType);

// --- Static config blocks for Yealink/Polycom ---
const DEFAULT_TIME_OFFSET = '-5';
const DEFAULT_ADMIN_PASSWORD = 'admin:08520852';

// Tooltips for Phone Config tab fields
const FIELD_TOOLTIPS: Record<string, string> = {
  // Base Config Options
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
  yealinkCallStealing: "Allows users to pick up active calls from another BLF-monitored extension.",
  // Polycom MWI
  polycomMWIExt: "Enter the extension number whose voicemail status should be monitored.",
  polycomMWIPbxIp: "Enter the IP address of the PBX server that the phone will connect to for MWI.",
  // Linekey/BLF/Speed/Transfer/Hotkey Generator
  linekeyBrand: "Select the phone brand (Yealink or Polycom) for which the key will be configured.",
  linekeyNum: "The key/button number on the phone to assign this function (usually starts at 1).",
  linekeyLabel: "Text label that will appear on the phone’s display for this key.",
  linekeyRegLine: "Select the line (account) this key should be associated with, usually Line 1.",
  linekeyType: "Choose the key function type (e.g., BLF, speed dial, transfer, etc.).",
  linekeyValue: "The target number, extension, or function code to assign to the key.",
  // External Number Speed Dial
  externalBrand: "Choose the phone brand for which you are creating the external dial key.",
  externalLineNum: "The programmable key/button number to assign this speed dial.",
  externalLabel: "Label to display for the external number on the phone’s screen.",
  externalNumber: "Enter the external phone number this key will dial when pressed."
};

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
      for (let l = 7; l < linekey; l++) {
        config += `linekey.${l}.category=BLF\n`;
        config += `linekey.${l}.index=${l}\n`;
      }
    } else if (model === 'VVX 500') {
      let linekey = 9;
      for (let i = start; i <= end; i++, linekey++) {
        config += `attendant.resourcelist.${linekey}.address=${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.calladdress=*85${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.label=Park ${linekey - 8}\n`;
        config += `attendant.resourcelist.${linekey}.type=automata\n`;
      }
      for (let l = 9; l < linekey; l++) {
        config += `linekey.${l}.category=BLF\n`;
        config += `linekey.${l}.index=${l}\n`;
      }
    } else if (model === 'VVX 600') {
      // 13,14,15 for 71,72,73
      const keys = [13, 14, 15];
      let idx = 0;
      for (let i = start; i <= end; i++, idx++) {
        let linekey = keys[idx];
        config += `attendant.resourcelist.${linekey}.address=${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.calladdress=*85${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.label=Park ${idx + 1}\n`;
        config += `attendant.resourcelist.${linekey}.type=automata\n`;
      }
      for (let j = 0; j < idx; j++) {
        let linekey = keys[j];
        config += `linekey.${linekey}.category=BLF\n`;
        config += `linekey.${linekey}.index=${linekey}\n`;
      }
    } else {
      // Generic Polycom template
      let linekey = start;
      for (let i = start; i <= end; i++, linekey++) {
        config += `attendant.resourcelist.${linekey}.address=${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.calladdress=${i}@${ip}\n`;
        config += `attendant.resourcelist.${linekey}.label=Park\n`;
        config += `attendant.resourcelist.${linekey}.type=automata\n`;
        config += `linekey.${linekey}.category=BLF\n`;
        config += `linekey.${linekey}.index=${linekey}\n`;
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
      let linekey = start;
      for (let i = start; i <= end; i++, linekey++) {
        config += `linekey.${linekey}.extension=${i}\n`;
        config += `linekey.${linekey}.label=Park\n`;
        config += `linekey.${linekey}.line=1\n`;
        config += `linekey.${linekey}.type=10\n`;
        config += `linekey.${linekey}.value=${i}@${ip}\n`;
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
    // --- Insert static config blocks for W56P/W60P, Yealink, Polycom ---
    if (model === 'Yealink W56P' || model === 'Yealink W60P' || model === 'Yealink 56h Dect w/ 60p Base' || model === 'Yealink 56h Dect w/ 76p Base' || model === 'Yealink 56h Dect Handset') {
      config += [
        'account.1.subscribe_mwi_to_vm=1',
        'custom.handset.time_format=0',
        'features.remote_phonebook.enable=1',
        'features.remote_phonebook.flash_time=3600',
        'local_time.dhcp_time=0',
        'local_time.ntp_server1=pool.ntp.org',
        'local_time.summer_time=2',
        `local_time.time_format=0`,
        `local_time.time_zone=${DEFAULT_TIME_OFFSET}`,
        'local_time.time_zone_name=United States-Eastern Time',
        'programablekey.2.label=Directory',
        'programablekey.2.line=%EMPTY%',
        'programablekey.2.type=47',
        'programablekey.2.xml_phonebook=-1',
        'sip.mac_in_ua=1',
        'sip.trust_ctrl=1',
        'static.auto_provision.custom.protect=1',
        'static.auto_provision.server.url= http://provisioner.123.net/',
        'voice_mail.number.1=*97',
        `static.security.user_password=${DEFAULT_ADMIN_PASSWORD}`,
        ''
      ].join('\n');
    } else if (phoneType === 'Yealink') {
      config += [
        'static.network.ip_address_mode=0',
        'static.network.static_dns_enable=1',
        'static.network.primary_dns=8.8.8.8',
        'static.network.secondary_dns=8.8.4.4',
        'account.1.subscribe_mwi_to_vm=1',
        'account.1.cid_source=1',
        'custom.handset.time_format=0',
        'features.remote_phonebook.enable=1',
        'features.remote_phonebook.flash_time=3600',
        'features.call_log_show_num=2',
        'features.enhanced_dss_keys.enable=1',
        'feature.enhancedFeatureKeys.enabled=1',
        'local_time.dhcp_time=0',
        'local_time.ntp_server1=pool.ntp.org',
        'local_time.summer_time=2',
        `local_time.time_format=0`,
        `local_time.time_zone=${DEFAULT_TIME_OFFSET}`,
        'local_time.time_zone_name=United States-Eastern Time',
        'programablekey.2.label=Directory',
        'programablekey.2.line=%EMPTY%',
        'programablekey.2.type=47',
        'programablekey.2.xml_phonebook=-1',
        'sip.mac_in_ua=1',
        'sip.trust_ctrl=1',
        'static.auto_provision.custom.protect=1',
        'static.auto_provision.server.url=http://provisioner.123.net/',
        'voice_mail.number.1=*97',
        `static.security.user_password=${DEFAULT_ADMIN_PASSWORD}`,
        ''
      ].join('\n');
    } else if (phoneType === 'Polycom') {
      config += [
        'device.sntp.gmtoffsetcityid=16',
        'device.sntp.gmtoffsetcityid.set=1',
        'device.sntp.servername=north-america.pool.ntp.org',
        'device.sntp.servername.set=1',
        'lcl.datetime.date.format=D,dM',
        'lcl.datetime.date.longformat=0',
        'tcpipapp.sntp.address=pool.ntp.org',
        'tcpipapp.sntp.address.overridedhcp=1',
        `tcpipapp.sntp.gmtoffset=${parseInt(DEFAULT_TIME_OFFSET) * 3600}`,
        'tcpipapp.sntp.gmtoffset.overridedhcp=1',
        'tcpipapp.sntp.gmtoffsetcityid=16',
        ''
      ].join('\n');
    }
    // --- End static config blocks ---
    if (phoneType === 'Polycom') {
      config += generatePolycomParkLines(model, start, end, ip);
    } else {
      config += getYealinkGlobalAttributes(yealinkOptions);
      config += generateYealinkParkLines(model, start, end, ip);
    }
    setOutput(config);
  };

  // State and handlers for FBPX import/export form (PBX CSV import/export)
  const [fpbxRows, setFpbxRows] = useState<FpbxFormType[]>(Array(10).fill(0).map(createEmptyFpbxRow));
  const fpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  // FBPX dynamic fields (columns)
  const [fpbxFields, setFpbxFields] = useState([...FPBX_FIELDS]);
  function handleFpbxDeleteField(field: string) {
    setFpbxFields(fields => fields.filter(f => f !== field));
    setFpbxRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[field];
      return newRow;
    }));
  }

  function handleFpbxChange(rowIdx: number, e: React.ChangeEvent<HTMLInputElement>) {
    setFpbxRows(rows => {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [e.target.name]: e.target.value };
      return updated;
    });
  }

  function handleFpbxExport() {
    const csvHeader = FPBX_FIELDS.join(',') + '\n';
    const csvRows = fpbxRows.map(row => FPBX_FIELDS.map(f => `"${(row[f] || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    const csv = csvHeader + csvRows;
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
        const rows = (results.data as FpbxFormType[]).filter(row => row && Object.values(row).some(Boolean));
        setFpbxRows(rows.length ? rows : [createEmptyFpbxRow()]);
      },
    });
  }

  function handleFpbxAddRow(count = 1) {
    setFpbxRows(rows => [...rows, ...Array(count).fill(0).map(createEmptyFpbxRow)]);
  }
  function handleFpbxDeleteRow(idx: number) {
    setFpbxRows(rows => rows.length === 1 ? rows : rows.filter((_, i) => i !== idx));
  }

  // State and handlers for VPBX import/export form (PBX CSV import/export)
  const [vpbxRows, setVpbxRows] = useState<VpbxFormType[]>(Array(10).fill(0).map(createEmptyVpbxRow));
  const vpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  // VPBX dynamic fields (columns)
  const [vpbxFields, setVpbxFields] = useState([...VPBX_FIELDS]);
  function handleVpbxDeleteField(field: string) {
    setVpbxFields(fields => fields.filter(f => f !== field));
    setVpbxRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[field];
      return newRow;
    }));
  }

  function handleVpbxChange(rowIdx: number, e: React.ChangeEvent<HTMLInputElement>) {
    setVpbxRows(rows => {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [e.target.name]: e.target.value };
      return updated;
    });
  }

  function handleVpbxExport() {
    const csvHeader = VPBX_FIELDS.join(',') + '\n';
    const csvRows = vpbxRows.map(row => VPBX_FIELDS.map(f => `"${(row[f] || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    const csv = csvHeader + csvRows;
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
        const rows = (results.data as VpbxFormType[]).filter(row => row && Object.values(row).some(Boolean));
        setVpbxRows(rows.length ? rows : [createEmptyVpbxRow()]);
      },
    });
  }

  function handleVpbxAddRow(count = 1) {
    setVpbxRows(rows => [...rows, ...Array(count).fill(0).map(createEmptyVpbxRow)]);
  }
  function handleVpbxDeleteRow(idx: number) {
    setVpbxRows(rows => rows.length === 1 ? rows : rows.filter((_, i) => i !== idx));
  }

  // New state for time offset and admin password
  const [timeOffset, setTimeOffset] = useState('-5');
  const [adminPassword, setAdminPassword] = useState('admin:08520852');

  // New state for external number speed dial
  const [externalSpeed, setExternalSpeed] = useState({
    brand: 'Yealink',
    lineNum: '',
    label: '',
    number: '',
    efkIndex: '',
  });
  const [externalSpeedOutput, setExternalSpeedOutput] = useState('');

  // Generate external number speed dial config
  function generateExternalSpeed() {
    if (externalSpeed.brand === 'Yealink') {
      setExternalSpeedOutput(
        `linekey.${externalSpeed.lineNum}.line=1\n` +
        `linekey.${externalSpeed.lineNum}.label=${externalSpeed.label}\n` +
        `linekey.${externalSpeed.lineNum}.type=13\n` +
        `linekey.${externalSpeed.lineNum}.value=${externalSpeed.number}\n`
      );
    } else {
      setExternalSpeedOutput(
        'feature.enhancedFeatureKeys.enabled=1\n' +
        'feature.EFKLineKey.enabled=1\n' +
        `efk.efklist.${externalSpeed.efkIndex}.mname=${externalSpeed.label}\n` +
        `efk.efklist.${externalSpeed.efkIndex}.status=1\n` +
        `efk.efklist.${externalSpeed.efkIndex}.action.string=${externalSpeed.number}$Tinvite$\n` +
        `linekey.${externalSpeed.lineNum}.category=EFK\n` +
        `linekey.${externalSpeed.lineNum}.index=${externalSpeed.efkIndex}\n`
      );
    }
  }

  // --- Yealink/Polycom advanced options state (move to top, single source of truth) ---
  const [yealinkLabelLength, setYealinkLabelLength] = useState(false);
  const [yealinkDisableMissedCall, setYealinkDisableMissedCall] = useState(false);
  const [yealinkCallStealing, setYealinkCallStealing] = useState(false);

  // --- Polycom MWI generator state (single instance) ---
  const [polycomMWI, setPolycomMWI] = useState({ ext: '', pbxIp: '', output: '' });
  function generatePolycomMWI() {
    setPolycomMWI(mwi => ({
      ...mwi,
      output:
        `msg.mwi.1.callback=*98${mwi.ext}\n` +
        `msg.mwi.1.callbackmode=contact\n` +
        `msg.mwi.1.subscribe=${mwi.ext}@${mwi.pbxIp}\n`
    }));
  }

  // --- Yealink/Polycom BLF/Speed/Transfer/Hotkey generator state (single instance) ---
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
  const [linekeyGen, setLinekeyGen] = useState({
    brand: 'Yealink',
    lineNum: '',
    label: '',
    regLine: '1',
    type: 16,
    value: '',
    efkIndex: '',
    output: ''
  });
  function generateLinekey() {
    if (linekeyGen.brand === 'Yealink') {
      setLinekeyGen(lk => ({
        ...lk,
        output:
          `linekey.${lk.lineNum}.label=${lk.label}\n` +
          `linekey.${lk.lineNum}.line=${lk.regLine}\n` +
          `linekey.${lk.lineNum}.type=${lk.type}\n` +
          `linekey.${lk.lineNum}.value=${lk.value}\n`
      }));
    } else {
      setLinekeyGen(lk => ({
        ...lk,
        output:
          `attendant.resourcelist.${lk.efkIndex}.address=${lk.value}\n` +
          `attendant.resourcelist.${lk.efkIndex}.label=${lk.label}\n` +
          `attendant.resourcelist.${lk.efkIndex}.type=normal\n` +
          `linekey.${lk.lineNum}.category=BLF\n` +
          `linekey.${lk.lineNum}.index=${lk.efkIndex}\n`
      }));
    }
  }

  // Reference sub-navigation state (move to top for scope)
  const REFERENCE_SUBTABS = [
    { key: 'phones', label: "Phones" },
    { key: 'mikrotik', label: "Mikrotik" },
    { key: 'switches', label: "Switches" },
    { key: 'pbx', label: "PBX's" },
  ];
  const [referenceSubtab, setReferenceSubtab] = useState('phones');

  // --- OTT Mikrotik Template Editor State ---
  const [ottFields, setOttFields] = useState({
    ip: '',
    customerName: '',
    customerAddress: '',
    city: '',
    xip: '',
    handle: '',
  });
  function getOttTemplate(fields: typeof ottFields) {
    return ottMikrotikTemplate
      .replace('XXX.XXX.XXX.XXX', fields.ip || 'XXX.XXX.XXX.XXX')
      .replace('"CUSTOMER NAME"', fields.customerName || '"CUSTOMER NAME"')
      .replace('"CUSTOMER ADDRESS"', fields.customerAddress || '"CUSTOMER ADDRESS"')
      .replace('"CITY"', fields.city || '"CITY"')
      .replace('"XIP"', fields.xip || '"XIP"')
      .replace('"HANDLE-CUSTOMERADDRESS"', fields.handle || '"HANDLE-CUSTOMERADDRESS"');
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
          <h2>Reference</h2>
          {/* Sub-navigation menu */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {REFERENCE_SUBTABS.map(sub => (
              <button
                key={sub.key}
                className={referenceSubtab === sub.key ? 'active' : ''}
                onClick={() => setReferenceSubtab(sub.key)}
                style={{
                  border: 'none',
                  borderBottom: referenceSubtab === sub.key ? '3px solid #0078d4' : '2px solid #ccc',
                  background: referenceSubtab === sub.key ? '#f7fbff' : '#f4f4f4',
                  color: referenceSubtab === sub.key ? '#0078d4' : '#333',
                  fontWeight: referenceSubtab === sub.key ? 600 : 400,
                  padding: '8px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  minWidth: 100,
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>
          {/* Subtab content */}
          {referenceSubtab === 'phones' && (
            <div>
              {/* Phone reference content */}
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
          {referenceSubtab === 'mikrotik' && (
            <div>
              <h3>Mikrotik Reference</h3>
              <p>Include Mikrotik config and explanation here.</p>
            </div>
          )}
          {referenceSubtab === 'switches' && (
            <div>
              <h3>Switches Reference</h3>
              <p>Include Switches config and explanation here.</p>
            </div>
          )}
          {referenceSubtab === 'pbx' && (
            <div>
              <h3>PBX Reference</h3>
              <p>Include PBX import/export and config explanation here.</p>
            </div>
          )}
        </div>
      )}
      {/* Phone Configs Tab */}
      {activeTab === 'phone' && (
        <>
          <h2 style={{marginTop:0}}>Phone Config Generator</h2>
          <div style={{ background: '#f7fbff', border: '1px solid #cce1fa', borderRadius: 8, padding: 16, marginBottom: 24, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>What does each config generator do?</h3>
            <ul style={{ marginLeft: 20 }}>
              <li><b>Base Config Options:</b> Generates the main configuration for Polycom or Yealink phones, including park/BLF keys, static settings, and model-specific options.</li>
              <li><b>Polycom MWI (Message Waiting Indicator):</b> Generates config lines to enable voicemail message waiting light for a specific extension and PBX IP.</li>
              <li><b>Linekey/BLF/Speed/Transfer/Hotkey Generator:</b> Creates config for individual programmable keys (BLF, speed dial, transfer, macros) for Yealink or Polycom phones.</li>
              <li><b>External Number Speed Dial:</b> Generates config for a button that dials an external number directly from the phone.</li>
            </ul>
          </div>
          <div className="form-section" style={{marginBottom:24}}>
            <h3>Base Config Options</h3>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.phoneType}>Phone Type:</label>
              <select value={phoneType} onChange={e => setPhoneType(e.target.value as 'Polycom' | 'Yealink')} title={FIELD_TOOLTIPS.phoneType}>
                <option value="Polycom">Polycom</option>
                <option value="Yealink">Yealink</option>
              </select>
              <label style={{marginLeft:16}} title={FIELD_TOOLTIPS.model}>Model:</label>
              <select value={model} onChange={e => setModel(e.target.value)} title={FIELD_TOOLTIPS.model}>
                {MODEL_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.ip}>IP Address:</label>
              <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.100" title={FIELD_TOOLTIPS.ip} />
              <label style={{marginLeft:16}} title={FIELD_TOOLTIPS.startExt}>Start Extension:</label>
              <input type="number" value={startExt} onChange={e => setStartExt(e.target.value)} title={FIELD_TOOLTIPS.startExt} />
              <label style={{marginLeft:16}} title={FIELD_TOOLTIPS.endExt}>End Extension:</label>
              <input type="number" value={endExt} onChange={e => setEndExt(e.target.value)} title={FIELD_TOOLTIPS.endExt} />
              <label style={{marginLeft:16}} title={FIELD_TOOLTIPS.labelPrefix}>Label Prefix:</label>
              <input type="text" value={labelPrefix} onChange={e => setLabelPrefix(e.target.value)} title={FIELD_TOOLTIPS.labelPrefix} />
            </div>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.timeOffset}>Time Offset (e.g. -5):</label>
              <input type="number" value={timeOffset} onChange={e => setTimeOffset(e.target.value)} title={FIELD_TOOLTIPS.timeOffset} />
              <label style={{marginLeft:16}} title={FIELD_TOOLTIPS.adminPassword}>Admin Password:</label>
              <input type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} title={FIELD_TOOLTIPS.adminPassword} />
            </div>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.yealinkLabelLength}><input type="checkbox" checked={yealinkLabelLength} onChange={e => setYealinkLabelLength(e.target.checked)} /> Enable long DSS key labels</label>
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.yealinkDisableMissedCall}><input type="checkbox" checked={yealinkDisableMissedCall} onChange={e => setYealinkDisableMissedCall(e.target.checked)} /> Disable missed call notification</label>
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.yealinkCallStealing}><input type="checkbox" checked={yealinkCallStealing} onChange={e => setYealinkCallStealing(e.target.checked)} /> Enable BLF call stealing</label>
            </div>
            <button onClick={generateConfig} style={{marginTop:8}}>Generate Config</button>
            <div className="output">
              <textarea value={output} readOnly rows={10} style={{ width: '100%', marginTop: 16 }} />
            </div>
          </div>
          {/* Polycom MWI Section */}
          <hr />
          <div className="form-section" style={{marginBottom:24}}>
            <h3>Polycom MWI (Message Waiting Indicator)</h3>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.polycomMWIExt}>Extension:</label>
              <input type="text" value={polycomMWI.ext} onChange={e => setPolycomMWI(mwi => ({ ...mwi, ext: e.target.value }))} title={FIELD_TOOLTIPS.polycomMWIExt} />
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.polycomMWIPbxIp}>PBX IP:</label>
              <input type="text" value={polycomMWI.pbxIp} onChange={e => setPolycomMWI(mwi => ({ ...mwi, pbxIp: e.target.value }))} title={FIELD_TOOLTIPS.polycomMWIPbxIp} />
              <button type="button" onClick={generatePolycomMWI} style={{ marginLeft: 16 }}>Generate MWI</button>
            </div>
            <textarea value={polycomMWI.output} readOnly rows={3} style={{ width: '100%', marginTop: 8 }} />
          </div>
          {/* Linekey/BLF/Speed/Transfer/Hotkey Generator Section */}
          <hr />
          <div className="form-section" style={{marginBottom:24}}>
            <h3>Linekey/BLF/Speed/Transfer/Hotkey Generator</h3>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.linekeyBrand}>Brand:</label>
              <select value={linekeyGen.brand} onChange={e => setLinekeyGen(lk => ({ ...lk, brand: e.target.value }))} title={FIELD_TOOLTIPS.linekeyBrand}>
                <option value="Yealink">Yealink</option>
                <option value="Polycom">Polycom</option>
              </select>
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.linekeyNum}>Line Key Number:</label>
              <input type="text" value={linekeyGen.lineNum} onChange={e => setLinekeyGen(lk => ({ ...lk, lineNum: e.target.value }))} title={FIELD_TOOLTIPS.linekeyNum} />
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.linekeyLabel}>Label:</label>
              <input type="text" value={linekeyGen.label} onChange={e => setLinekeyGen(lk => ({ ...lk, label: e.target.value }))} title={FIELD_TOOLTIPS.linekeyLabel} />
            </div>
            <div className="form-group">
              {linekeyGen.brand === 'Yealink' && (
                <>
                  <label title={FIELD_TOOLTIPS.linekeyRegLine}>Registered Line:</label>
                  <input type="text" value={linekeyGen.regLine} onChange={e => setLinekeyGen(lk => ({ ...lk, regLine: e.target.value }))} title={FIELD_TOOLTIPS.linekeyRegLine} />
                  <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.linekeyType}>Type:</label>
                  <select value={linekeyGen.type} onChange={e => setLinekeyGen(lk => ({ ...lk, type: parseInt(e.target.value) }))} title={FIELD_TOOLTIPS.linekeyType}>
                    {YEALINK_LINEKEY_TYPES.map(t => (
                      <option key={t.code} value={t.code}>{t.code} - {t.label}</option>
                    ))}
                  </select>
                  <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.linekeyValue}>Value:</label>
                  <input type="text" value={linekeyGen.value} onChange={e => setLinekeyGen(lk => ({ ...lk, value: e.target.value }))} title={FIELD_TOOLTIPS.linekeyValue} />
                </>
              )}
              {linekeyGen.brand === 'Polycom' && (
                <>
                  <label>EFK/Resourcelist Index:</label>
                  <input type="text" value={linekeyGen.efkIndex} onChange={e => setLinekeyGen(lk => ({ ...lk, efkIndex: e.target.value }))} />
                  <label style={{ marginLeft: 16 }}>Value (address):</label>
                  <input type="text" value={linekeyGen.value} onChange={e => setLinekeyGen(lk => ({ ...lk, value: e.target.value }))} />
                </>
              )}
              <button type="button" onClick={generateLinekey} style={{ marginLeft: 16 }}>Generate</button>
            </div>
            <textarea value={linekeyGen.output} readOnly rows={5} style={{ width: '100%', marginTop: 8 }} />
          </div>
          {/* External Number Speed Dial Section */}
          <hr />
          <div className="form-section" style={{marginBottom:24}}>
            <h3>External Number Speed Dial</h3>
            <div className="form-group">
              <label title={FIELD_TOOLTIPS.externalBrand}>Brand:</label>
              <select value={externalSpeed.brand} onChange={e => setExternalSpeed(s => ({ ...s, brand: e.target.value }))} title={FIELD_TOOLTIPS.externalBrand}>
                <option value="Yealink">Yealink</option>
                <option value="Polycom">Polycom</option>
              </select>
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.externalLineNum}>Line Key Number:</label>
              <input type="text" value={externalSpeed.lineNum} onChange={e => setExternalSpeed(s => ({ ...s, lineNum: e.target.value }))} title={FIELD_TOOLTIPS.externalLineNum} />
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.externalLabel}>Label:</label>
              <input type="text" value={externalSpeed.label} onChange={e => setExternalSpeed(s => ({ ...s, label: e.target.value }))} title={FIELD_TOOLTIPS.externalLabel} />
              <label style={{ marginLeft: 16 }} title={FIELD_TOOLTIPS.externalNumber}>External Number:</label>
              <input type="text" value={externalSpeed.number} onChange={e => setExternalSpeed(s => ({ ...s, number: e.target.value }))} title={FIELD_TOOLTIPS.externalNumber} />
              {externalSpeed.brand === 'Polycom' && (
                <>
                  <label style={{ marginLeft: 16 }}>EFK Index:</label>
                  <input type="text" value={externalSpeed.efkIndex} onChange={e => setExternalSpeed(s => ({ ...s, efkIndex: e.target.value }))} />
                </>
              )}
              <button type="button" onClick={generateExternalSpeed} style={{ marginLeft: 16 }}>Generate External Speed Dial</button>
            </div>
            <textarea value={externalSpeedOutput} readOnly rows={5} style={{ width: '100%', marginTop: 8 }} />
          </div>
        </>
      )}
      {/* Full Config Tab */}
      {activeTab === 'fullconfig' && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>Full Phone Config Output</h2>
          <textarea value={output} readOnly rows={20} style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }} />
        </div>
      )}
      {/* Expansion Modules Tab */}
      {activeTab === 'expansion' && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>Expansion Module Code Generators</h2>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <h3>Yealink Expansion Module</h3>
              <img src="/expansion/yealinkexp40.jpeg" alt="Yealink EXP40" style={{ width: '100%', maxWidth: 260, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc' }} />
              <img src="/expansion/yealinkexp50.jpeg" alt="Yealink EXP50" style={{ width: '100%', maxWidth: 260, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc' }} />
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
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <h3>Polycom VVX Color Expansion Module</h3>
              <img src="/expansion/polycomVVX_Color_Exp_Module_2201.jpeg" alt="Polycom VVX Color Expansion Module" style={{ width: '100%', maxWidth: 260, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc' }} />
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
            </div>
          </div>
        </div>
      )}
      {/* FBPX Import Template Tab */}
      {activeTab === 'fbpx' && (
        <div>
          {/* FBPX import/export form UI as a table */}
          <h2>FBPX Import Template</h2>
          <form style={{ maxWidth: 900 }} onSubmit={e => e.preventDefault()}>
            <div style={{ marginBottom: 12 }}>
              <input type="file" accept=".csv" onChange={handleFpbxImport} />
              <button type="button" onClick={() => handleFpbxAddRow(1)} style={{ marginLeft: 8 }}>Add Row</button>
              <button type="button" onClick={() => handleFpbxAddRow(5)} style={{ marginLeft: 8 }}>Add 5 Rows</button>
              <button type="button" onClick={() => handleFpbxAddRow(10)} style={{ marginLeft: 8 }}>Add 10 Rows</button>
            </div>
            <table className="import-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {fpbxFields.map(f => (
                    <th key={f} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc', position: 'relative' }}>
                      {f}
                      <button
                        type="button"
                                               onClick={() => handleFpbxDeleteField(f)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                        title={`Delete column ${f}`}
                      >
                        ×
                      </button>
                    </th>
                  ))}
                  <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fpbxRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {fpbxFields.map(f => (
                      <td key={f} style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>
                        <input
                          id={f + '-' + rowIdx}
                          name={f}
                          type="text"
                          value={row[f] || ''}
                          onChange={e => handleFpbxChange(rowIdx, e)}
                          style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }}
                        />
                      </td>
                    ))}
                    <td>
                      <button type="button" onClick={() => handleFpbxDeleteRow(rowIdx)} style={{ color: 'red' }}>Delete</button>
                    </td>
                  </tr>
                ))}
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
              <button type="button" onClick={() => handleVpbxAddRow(1)} style={{ marginLeft: 8 }}>Add Row</button>
              <button type="button" onClick={() => handleVpbxAddRow(5)} style={{ marginLeft: 8 }}>Add 5 Rows</button>
              <button type="button" onClick={() => handleVpbxAddRow(10)} style={{ marginLeft: 8 }}>Add 10 Rows</button>
            </div>
            <table className="import-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f4f4' }}>
                  {vpbxFields.map(f => (
                    <th key={f} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc', position: 'relative' }}>
                      {f}
                      <button
                        type="button"
                        onClick={() => handleVpbxDeleteField(f)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                        title={`Delete column ${f}`}
                      >
                        ×
                      </button>
                    </th>
                  ))}
                  <th style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '2px solid #ccc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vpbxRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {vpbxFields.map(f => (
                      <td key={f} style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>
                        <input
                          id={f + '-' + rowIdx}
                          name={f}
                          type="text"
                          value={row[f] || ''}
                          onChange={e => handleVpbxChange(rowIdx, e)}
                          style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }}
                        />
                      </td>
                    ))}
                    <td>
                      <button type="button" onClick={() => handleVpbxDeleteRow(rowIdx)} style={{ color: 'red' }}>Delete</button>
                    </td>
                  </tr>
                ))}
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
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2>Mikrotik Templates</h2>
          {/* OTT Mikrotik Template Editor */}
          <div style={{ marginBottom: 32, padding: 16, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fafbfc' }}>
            <h3>OTT Mikrotik Template (Editable)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>IP Address:</label>
                <input type="text" value={ottFields.ip} onChange={e => setOttFields(f => ({ ...f, ip: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>Customer Name:</label>
                <input type="text" value={ottFields.customerName} onChange={e => setOttFields(f => ({ ...f, customerName: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>Customer Address:</label>
                <input type="text" value={ottFields.customerAddress} onChange={e => setOttFields(f => ({ ...f, customerAddress: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>City:</label>
                <input type="text" value={ottFields.city} onChange={e => setOttFields(f => ({ ...f, city: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>XIP:</label>
                <input type="text" value={ottFields.xip} onChange={e => setOttFields(f => ({ ...f, xip: e.target.value }))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label>Handle (Customer Address):</label>
                <input type="text" value={ottFields.handle} onChange={e => setOttFields(f => ({ ...f, handle: e.target.value }))} style={{ width: '100%' }} />
              </div>
            </div>
            <textarea
              readOnly
              rows={10}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }}
              value={getOttTemplate(ottFields)}
            />
          </div>
          {/* Other Mikrotik Templates (read-only) */}
          <div style={{ marginBottom: 32 }}>
            <h3>Mikrotik 5009 Bridge Template</h3>
            <textarea

              readOnly
              rows={10}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              value={mikrotik5009Bridge}
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3>Mikrotik 5009 Passthrough Template</h3>
            <textarea
              readOnly
              rows={10}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              value={mikrotik5009Passthrough}
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3>OnNet Mikrotik Config Template</h3>
            <textarea
              readOnly
              rows={10}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              value={onNetMikrotikConfigTemplate}
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3>Mikrotik StandAlone ATA Template</h3>
            <textarea
              readOnly
              rows={10}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              value={mikrotikStandAloneATATemplate}
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <h3>Mikrotik DHCP Options</h3>
            <textarea
              readOnly
              rows={8}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
              value={mikrotikDhcpOptions}
            />
          </div>
        </div>
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
      {/* Hosted Order Tracker Tab */}
      {activeTab === 'ordertracker' && (
        <HostedOrderTrackerTab />
      )}
    </div>
  );
}

// Export main App component
export default App
