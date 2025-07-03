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
  const [ottFields] = useState({});
  const getOttTemplate = (_fields: any) => ottMikrotikTemplate; // stub

  return (
    <div>
      <h2>Mikrotik Templates</h2>
      <div>
        <h3>5009 Bridge</h3>
        <textarea value={mikrotik5009Bridge} readOnly rows={10} style={{ width: '100%' }} />
        <h3>5009 Passthrough</h3>
        <textarea value={mikrotik5009Passthrough} readOnly rows={10} style={{ width: '100%' }} />
        <h3>OnNet Config</h3>
        <textarea value={onNetMikrotikConfigTemplate} readOnly rows={10} style={{ width: '100%' }} />
        <h3>OTT Template (Editable)</h3>
        <textarea value={getOttTemplate(ottFields)} readOnly rows={10} style={{ width: '100%' }} />
        <h3>Standalone ATA</h3>
        <textarea value={mikrotikStandAloneATATemplate} readOnly rows={10} style={{ width: '100%' }} />
        <h3>DHCP Options</h3>
        <textarea value={mikrotikDhcpOptions} readOnly rows={10} style={{ width: '100%' }} />
      </div>
    </div>
  );
};

export default MikrotikTemplates;
