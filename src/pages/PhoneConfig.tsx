
import React, { useState } from 'react';
import { useConfigContext } from '../components/ConfigContext';
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
  // Advanced feature toggles
  const [enableMWI, setEnableMWI] = useState(false);
  const [enableSpeedDial, setEnableSpeedDial] = useState(false);
  const [enableIntercom, setEnableIntercom] = useState(false);
  const [enableTransferVM, setEnableTransferVM] = useState(false);
  const [enablePark, setEnablePark] = useState(false);
  const { setGeneratedConfig } = useConfigContext();

  // Config generation logic for Polycom and Yealink
  const generateConfig = () => {
    let config = '';
    const extStart = parseInt(startExt, 10);
    const extEnd = parseInt(endExt, 10);
    const extList = [];
    for (let ext = extStart; ext <= extEnd; ext++) {
      extList.push(ext);
    }

    if (phoneType === 'Polycom') {
      config += `device.sntp.serverName=216.239.35.12\n`;
      config += `tcpIpApp.sntp.address=216.239.35.12\n`;
      config += `tcpIpApp.sntp.address.overrideDHCP=1\n`;
      config += `tcpIpApp.sntp.gmtOffset=${parseInt(timeOffset, 10) * 3600}\n`;
      config += `tcpIpApp.sntp.gmtOffset.overrideDHCP=1\n`;
      config += `static.security.user_password=${adminPassword}\n`;
      extList.forEach((ext, i) => {
        config += `attendant.resourcelist.${i + 1}.address=${ext}@${ip}\n`;
        config += `attendant.resourcelist.${i + 1}.label=${labelPrefix}${ext}\n`;
        config += `attendant.resourcelist.${i + 1}.type=automata\n`;
      });
      config += `feature.doNotDisturb.enable=0\n`;
      if (enableMWI) {
        config += `msg.mwi.1.callback=*98${startExt}\nmsg.mwi.1.callbackmode=contact\nmsg.mwi.1.subscribe=${startExt}@${ip}\n`;
      }
      if (enableSpeedDial) {
        config += `feature.enhancedFeatureKeys.enabled=1\nfeature.EFKLineKey.enabled=1\nefk.efklist.1.mname=Call Ext Test\nefk.efklist.1.status=1\nefk.efklist.1.action.string=EXTERNAL_NUM$Tinvite$\nlinekey.1.category=EFK\nlinekey.1.index=1\n`;
      }
      if (enableIntercom) {
        config += `feature.enhancedFeatureKeys.enabled=1\nfeature.EFKLineKey.enabled=1\nefk.efklist.2.mname=Intercom\nefk.efklist.2.status=1\nefk.efklist.2.action.string=*80$P2N4$$Tinvite$\nefk.efklist.2.label=Intercom\nefk.efkprompt.2.label=Extension\nefk.efkprompt.2.status=1\nefk.efkprompt.2.type=numeric\nlinekey.2.category=EFK\nlinekey.2.index=2\n`;
      }
      if (enableTransferVM) {
        config += `feature.enhancedFeatureKeys.enabled=1\nfeature.EFKLineKey.enabled=1\nefk.efklist.3.mname=Transfer-2-VM\nefk.efklist.3.status=1\nefk.efklist.3.action.string=*EXT-NUM@${ip}$Tinvite$\nlinekey.3.category=EFK\nlinekey.3.index=3\n`;
      }
      if (enablePark) {
        config += `attendant.resourcelist.7.address=71@${ip}\nattendant.resourcelist.7.calladdress=*8571@${ip}\nattendant.resourcelist.7.label=Park 1\nattendant.resourcelist.7.type=automata\n`;
      }
    } else if (phoneType === 'Yealink') {
      config += `local_time.ntp_server1=216.239.35.12\n`;
      config += `local_time.time_zone=${timeOffset}\n`;
      config += `static.security.user_password=${adminPassword}\n`;
      if (yealinkLabelLength) {
        config += `features.config_dsskey_length=1\n`;
      }
      if (yealinkDisableMissedCall) {
        config += `phone_setting.missed_call_power_led_flash.enable=0\n`;
        config += `features.missed_call_popup.enable=0\n`;
      }
      if (yealinkCallStealing) {
        config += `features.pickup.direct_pickup_code=**\n`;
        config += `features.pickup.direct_pickup_enable=1\n`;
      }
      extList.forEach((ext, i) => {
        config += `linekey.${i + 1}.label=${labelPrefix}${ext}\n`;
        config += `linekey.${i + 1}.line=1\n`;
        config += `linekey.${i + 1}.type=16\n`;
        config += `linekey.${i + 1}.value=${ext}\n`;
      });
      if (enableMWI) {
        config += `account.1.subscribe_mwi_to_vm=1\n`;
      }
      if (enableSpeedDial) {
        config += `linekey.10.label=SpeedDial\nlinekey.10.line=1\nlinekey.10.type=13\nlinekey.10.value=YYY-YYY-YYYY\n`;
      }
      if (enableIntercom) {
        config += `features.enhanced_dss_keys.enable=1\nfeature.enhancedFeatureKeys.enabled=1\nlinekey.8.label=Intercom\nlinekey.8.line=0\nlinekey.8.type=73\nlinekey.8.value=*80$PExtension&TIntercom&C3&N$$Tinvite$\n`;
      }
      if (enableTransferVM) {
        config += `linekey.11.extension=EXT-NUM\nlinekey.11.label=Transfer-2-VM\nlinekey.11.line=1\nlinekey.11.type=3\nlinekey.11.value=*EXT-NUM@${ip}\n`;
      }
      if (enablePark) {
        config += `linekey.6.extension=71\nlinekey.6.label=Park 1\nlinekey.6.line=1\nlinekey.6.type=10\nlinekey.6.value=71@${ip}\n`;
      }
    }
    setOutput(config);
    setGeneratedConfig({ model, phoneType, config });
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
          <label><input type="checkbox" checked={enableMWI} onChange={e => setEnableMWI(e.target.checked)} /> Voicemail Indicator (MWI)</label>
          <label style={{ marginLeft: 16 }}><input type="checkbox" checked={enableSpeedDial} onChange={e => setEnableSpeedDial(e.target.checked)} /> Speed Dial</label>
          <label style={{ marginLeft: 16 }}><input type="checkbox" checked={enableIntercom} onChange={e => setEnableIntercom(e.target.checked)} /> Intercom</label>
          <label style={{ marginLeft: 16 }}><input type="checkbox" checked={enableTransferVM} onChange={e => setEnableTransferVM(e.target.checked)} /> Transfer to Voicemail</label>
          <label style={{ marginLeft: 16 }}><input type="checkbox" checked={enablePark} onChange={e => setEnablePark(e.target.checked)} /> Park</label>
        </div>
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
    </>
  );
};

export default PhoneConfig;
