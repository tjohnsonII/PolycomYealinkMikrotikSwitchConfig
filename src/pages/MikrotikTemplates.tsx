import React from 'react';


import { useState } from 'react';
import { mikrotik5009Bridge } from '../templates/mikrotik5009BridgeTemplate';
import { mikrotik5009Passthrough } from '../templates/mikrotik5009PassthroughTemplate';
import { onNetMikrotikConfigTemplate } from '../templates/onNetMikrotikConfigTemplate';
import { ottMikrotikTemplate } from '../templates/ottMikrotikTemplate';
import { mikrotikStandAloneATATemplate } from '../templates/mikrotikStandAloneATATemplate';
import { mikrotikDhcpOptions } from '../templates/mikrotikDhcpOptionsTemplate';

const MikrotikTemplates: React.FC = () => {
  // Example: editable OTT fields (stub)

  const [ottFields, setOttFields] = useState({
    customerName: '',
    customerAddress: '',
    city: '',
    xip: '',
    handle: '',
    ipBlock: '',
    ipAddress: '',
  });

  const getOttTemplate = (fields: typeof ottFields) => {
    let tpl = ottMikrotikTemplate;
    tpl = tpl.replace(/# Customer: ".*"/, `# Customer: "${fields.customerName || 'CUSTOMER NAME'}"`);
    tpl = tpl.replace(/# Address: ".*"/, `# Address: "${fields.customerAddress || 'CUSTOMER ADDRESS'}"`);
    tpl = tpl.replace(/# City: ".*"/, `# City: "${fields.city || 'CITY MI ZIP'}"`);
    tpl = tpl.replace(/# XIP: ".*"/, `# XIP: "${fields.xip || 'XIP'}"`);
    tpl = tpl.replace(/# Handle: ".*"/, `# Handle: "${fields.handle || 'HANDLE-CUSTOMERADDRESS'}"`);
    tpl = tpl.replace(/add address=XXX.XXX.XXX.XXX\/24 interface=ether2/, `add address=${fields.ipAddress || 'XXX.XXX.XXX.XXX/29'} interface=ether2`);
    return tpl;
  };

  return (
    <div>
      <h2>Mikrotik Templates</h2>
      <div>
        <h3>5009 Bridge</h3>
        <textarea value={mikrotik5009Bridge} readOnly rows={18} style={{ width: '100%', fontSize: 15, minHeight: 320 }} />
        <h3>5009 Passthrough</h3>
        <textarea value={mikrotik5009Passthrough} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>OnNet Config</h3>
        <textarea value={onNetMikrotikConfigTemplate} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>OTT Template (Editable)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <input placeholder="Customer Name" value={ottFields.customerName} onChange={e => setOttFields(f => ({ ...f, customerName: e.target.value }))} style={{ minWidth: 180 }} />
          <input placeholder="Customer Address" value={ottFields.customerAddress} onChange={e => setOttFields(f => ({ ...f, customerAddress: e.target.value }))} style={{ minWidth: 180 }} />
          <input placeholder="City MI ZIP" value={ottFields.city} onChange={e => setOttFields(f => ({ ...f, city: e.target.value }))} style={{ minWidth: 140 }} />
          <input placeholder="XIP" value={ottFields.xip} onChange={e => setOttFields(f => ({ ...f, xip: e.target.value }))} style={{ minWidth: 80 }} />
          <input placeholder="Handle" value={ottFields.handle} onChange={e => setOttFields(f => ({ ...f, handle: e.target.value }))} style={{ minWidth: 180 }} />
          <input placeholder="IP Address (w/ /29)" value={ottFields.ipAddress} onChange={e => setOttFields(f => ({ ...f, ipAddress: e.target.value }))} style={{ minWidth: 160 }} />
        </div>
        <textarea value={getOttTemplate(ottFields)} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>Standalone ATA</h3>
        <textarea value={mikrotikStandAloneATATemplate} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>DHCP Options</h3>
        <textarea value={mikrotikDhcpOptions} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
      </div>
    </div>
  );
};

export default MikrotikTemplates;
