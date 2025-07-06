import React from 'react';
import { useState, useRef } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { mikrotik5009Bridge } from '../templates/mikrotik5009BridgeTemplate';
import { mikrotik5009Passthrough } from '../templates/mikrotik5009PassthroughTemplate';
import { onNetMikrotikConfigTemplate } from '../templates/onNetMikrotikConfigTemplate';
import { ottMikrotikTemplate } from '../templates/ottMikrotikTemplate';
import { mikrotikStandAloneATATemplate } from '../templates/mikrotikStandAloneATATemplate';
import { mikrotikDhcpOptions } from '../templates/mikrotikDhcpOptionsTemplate';

// Tooltip descriptions for each OTT field
const FIELD_TOOLTIPS: Record<string, string> = {
  customerName: "Updates the '# Customer:' comment line in the template with the customer's full name",
  customerAddress: "Updates the '# Address:' comment line in the template with the customer's street address",
  city: "Updates the '# City:' comment line - will be combined with MI and ZIP code",
  zipCode: "Updates the ZIP code portion of the '# City:' comment line (format: City MI ZIP)",
  xip: "Updates the '# XIP:' comment line with the customer's XIP identifier",
  handle: "Updates the '# Handle:' comment line with the customer's handle identifier (typically HANDLE-CUSTOMERADDRESS format)",
  ipAddress: "Updates the 'add address=' line in the template - first IP is the actual WAN/TIK IP, second IP is the network IP (replaces XXX.XXX.XXX.XXX/29 interface=ether10 network=XXX.XXX.XXX.XXX)",
  gateway: "Updates the 'add distance=1 gateway=' line in the IP route section (generally provided by customer)"
};

const MikrotikTemplates: React.FC = () => {
  // Ref for the hidden download link used for template download
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Editable OTT fields with Michigan as default state
  const [ottFields, setOttFields] = useState({
    customerName: '',
    customerAddress: '',
    city: '',
    state: 'MI', // Always Michigan as specified
    zipCode: '',
    xip: '',
    handle: '',
    ipBlock: '',
    ipAddress: '',
    gateway: '', // Gateway IP address - generally provided by customer
  });

  /**
   * Generates the OTT template with user-provided values
   * Replaces placeholder text in the template with actual customer data
   */
  const getOttTemplate = (fields: typeof ottFields) => {
    let tpl = ottMikrotikTemplate;
    tpl = tpl.replace(/# Customer: ".*"/, `# Customer: "${fields.customerName || 'CUSTOMER NAME'}"`);
    tpl = tpl.replace(/# Address: ".*"/, `# Address: "${fields.customerAddress || 'CUSTOMER ADDRESS'}"`);
    tpl = tpl.replace(/# City: ".*"/, `# City: "${fields.city || 'CITY'} ${fields.state} ${fields.zipCode || 'ZIP'}"`);
    tpl = tpl.replace(/# XIP: ".*"/, `# XIP: "${fields.xip || 'XIP'}"`);
    tpl = tpl.replace(/# Handle: ".*"/, `# Handle: "${fields.handle || 'HANDLE-CUSTOMERADDRESS'}"`);
    tpl = tpl.replace(/add address=XXX.XXX.XXX.XXX\/24 interface=ether2/, `add address=${fields.ipAddress || 'XXX.XXX.XXX.XXX/29'} interface=ether2`);
    tpl = tpl.replace(/gateway={{gateway}}/, `gateway=${fields.gateway || 'XXX.XXX.XXX.XXX'}`);
    return tpl;
  };

  /**
   * Downloads the configured OTT template as a .rsc file
   * Creates a RouterOS script file with customer-specific configuration
   */
  const handleDownloadTemplate = () => {
    const template = getOttTemplate(ottFields);
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    if (downloadRef.current) {
      const fileName = ottFields.customerName 
        ? `${ottFields.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_OTT_Config.rsc`
        : 'OTT_Mikrotik_Config.rsc';
      
      downloadRef.current.href = url;
      downloadRef.current.download = fileName;
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <div>
      <h2>Mikrotik Templates</h2>
      <div>
        <h3>OTT Template (Editable)</h3>
        
        {/* Field explanations */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '6px', 
          padding: '12px', 
          marginBottom: '12px',
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          <strong>📝 Field Guide:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li><strong>Customer Name:</strong> Updates the "# Customer:" comment line</li>
            <li><strong>Customer Address:</strong> Updates the "# Address:" comment line</li>
            <li><strong>City:</strong> Updates the "# City:" comment line (combined with MI + ZIP)</li>
            <li><strong>ZIP Code:</strong> Added to city line (format: "City MI ZIP")</li>
            <li><strong>XIP:</strong> Updates the "# XIP:" comment line with identifier</li>
            <li><strong>Handle:</strong> Updates the "# Handle:" comment line (format: HANDLE-CUSTOMERADDRESS)</li>
            <li><strong>IP Address:</strong> Updates the "add address=" line - first IP is the actual WAN/TIK IP, second IP is the network IP</li>
            <li><strong>Gateway IP:</strong> Updates the "add distance=1 gateway=" line (generally provided by customer)</li>
          </ul>
          <em>💡 Hover over any field for detailed tooltips!</em>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              Customer Name:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.customerName}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="Customer Name" 
              value={ottFields.customerName} 
              onChange={e => setOttFields(f => ({ ...f, customerName: e.target.value }))} 
              style={{ minWidth: 180, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              Customer Address:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.customerAddress}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="Customer Address" 
              value={ottFields.customerAddress} 
              onChange={e => setOttFields(f => ({ ...f, customerAddress: e.target.value }))} 
              style={{ minWidth: 180, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              City:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.city}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="City" 
              value={ottFields.city} 
              onChange={e => setOttFields(f => ({ ...f, city: e.target.value }))} 
              style={{ minWidth: 140, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              ZIP Code:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.zipCode}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="ZIP Code" 
              value={ottFields.zipCode} 
              onChange={e => setOttFields(f => ({ ...f, zipCode: e.target.value }))} 
              style={{ minWidth: 100, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              XIP:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.xip}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="XIP" 
              value={ottFields.xip} 
              onChange={e => setOttFields(f => ({ ...f, xip: e.target.value }))} 
              style={{ minWidth: 80, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              Handle:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.handle}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="Handle" 
              value={ottFields.handle} 
              onChange={e => setOttFields(f => ({ ...f, handle: e.target.value }))} 
              style={{ minWidth: 180, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              IP Address (w/ /29):
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.ipAddress}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="IP Address (w/ /29)" 
              value={ottFields.ipAddress} 
              onChange={e => setOttFields(f => ({ ...f, ipAddress: e.target.value }))} 
              style={{ minWidth: 160, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              Gateway IP:
              <span style={{ marginLeft: 4, cursor: 'pointer', color: '#0078d4' }} title={FIELD_TOOLTIPS.gateway}>
                <FaInfoCircle />
              </span>
            </label>
            <input 
              placeholder="Gateway IP Address" 
              value={ottFields.gateway} 
              onChange={e => setOttFields(f => ({ ...f, gateway: e.target.value }))} 
              style={{ minWidth: 140, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
        </div>
        
        {/* Download button and hidden download link */}
        <div style={{ marginBottom: 12 }}>
          <button 
            onClick={handleDownloadTemplate}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            title="Download the configured OTT template as a .rsc file ready for RouterOS"
          >
            📥 Download Template (.rsc)
          </button>
          <a ref={downloadRef} style={{ display: 'none' }}>Download</a>
        </div>
        
        <textarea value={getOttTemplate(ottFields)} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>5009 Bridge</h3>
        <textarea value={mikrotik5009Bridge} readOnly rows={18} style={{ width: '100%', fontSize: 15, minHeight: 320 }} />
        <h3>5009 Passthrough</h3>
        <textarea value={mikrotik5009Passthrough} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>OnNet Config</h3>
        <textarea value={onNetMikrotikConfigTemplate} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>Standalone ATA</h3>
        <textarea value={mikrotikStandAloneATATemplate} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
        <h3>DHCP Options</h3>
        <textarea value={mikrotikDhcpOptions} readOnly rows={14} style={{ width: '100%', fontSize: 15, minHeight: 220 }} />
      </div>
    </div>
  );
};

export default MikrotikTemplates;
