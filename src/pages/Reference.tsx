import React, { useState } from 'react';

const REFERENCE_SUBTABS = [
  { key: 'phones', label: 'Phones' },
  { key: 'mikrotik', label: 'Mikrotik' },
  { key: 'switches', label: 'Switches' },
  { key: 'pbx', label: "PBX's" },
];

const Reference: React.FC = () => {
  const [referenceSubtab, setReferenceSubtab] = useState('phones');

  return (
    <div style={{ margin: '24px 0', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ alignSelf: 'flex-start', textAlign: 'left', width: '100%' }}>Reference</h2>
      {/* Sub-navigation menu */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignSelf: 'center' }}>
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
      {/* Subtab content (to be filled in next step) */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {referenceSubtab === 'phones' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2 style={{ textAlign: 'left', fontSize: 28, fontWeight: 700 }}>Phone Config & Expansion Module Reference</h2>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 24 }}>Phone Config Generator</h3>
            <ul style={{ fontSize: 16, marginBottom: 16 }}>
              <li><b>Phone Model:</b> Selects the target phone (Polycom or Yealink). Determines config format and available features.</li>
              <li><b>Extension / User:</b> The phone’s extension or username. Used in SIP registration and display.</li>
              <li><b>Password:</b> SIP password for registration.</li>
              <li><b>Display Name:</b> Shown on the phone’s screen.</li>
              <li><b>SIP Server / PBX IP:</b> The IP or domain of the PBX/SIP server.</li>
              <li><b>Start Park Line / End Park Line:</b> Defines the range of “park” BLF keys to generate (e.g., 701–705). Used to auto-generate BLF keys for parking.</li>
              <li><b>Advanced Features (checkboxes):</b>
                <ul>
                  <li><b>Enable DND:</b> Adds Do Not Disturb config.</li>
                  <li><b>Enable Call Forward:</b> Adds call forwarding config.</li>
                  <li><b>Enable VLAN:</b> Adds VLAN/network config.</li>
                  <li><b>Enable 802.1X:</b> Adds 802.1X authentication config.</li>
                  <li><b>Enable LLDP:</b> Adds LLDP-MED config for network auto-provisioning.</li>
                </ul>
              </li>
            </ul>
            <p style={{ fontSize: 16, marginBottom: 24 }}><b>How the Generator Works:</b><br />
              Takes all field values and builds a config file matching the selected phone’s syntax.<br />
              For Polycom, uses <code>reg.1.address</code>, <code>reg.1.auth.password</code>, etc.<br />
              For Yealink, uses <code>account.1.*</code> fields.<br />
              <b>Park lines:</b> For each number in the range, generates a BLF key (e.g., <code>key.3.type=16</code>, <code>key.3.value=701@PBX_IP</code>).<br />
              <b>Advanced features:</b> Only included if checked.
            </p>

            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Expansion Module Generator</h3>
            <h4 style={{ fontSize: 19, fontWeight: 500, marginTop: 20 }}>Yealink Expansion Module</h4>
            <ul style={{ fontSize: 16, marginBottom: 16 }}>
              <li><b>Template Type:</b> BLF (Busy Lamp Field) or Speed Dial. Changes the key type code (BLF=16, Speed Dial=13).</li>
              <li><b>Slot (1–20):</b> Each row represents a button on the sidecar.
                <ul>
                  <li><b>Label:</b> Text shown on the button.</li>
                  <li><b>Value/Ext:</b> Extension or number to dial/monitor.</li>
                  <li><b>PBX IP:</b> Used for BLF keys (e.g., <code>value=1001@192.168.1.10</code>).</li>
                </ul>
              </li>
            </ul>
            <p style={{ fontSize: 16, marginBottom: 24 }}><b>How the Generator Works:</b><br />
              For each slot, if a label is present, generates:<br />
              <code>expansion_module.1.key.&#123;N&#125;.label=&#123;Label&#125;</code><br />
              <code>expansion_module.1.key.&#123;N&#125;.type=&#123;Type&#125;</code> (16 for BLF, 13 for Speed Dial)<br />
              <code>expansion_module.1.key.&#123;N&#125;.value=&#123;Value&#125;</code> (BLF: <code>&#123;Ext&#125;@&#123;PBX IP&#125;</code>, Speed Dial: <code>&#123;Ext&#125;</code>)<br />
              <code>expansion_module.1.key.&#123;N&#125;.line=1</code><br />
              Output is grouped and can be sorted by label.
            </p>

            <h4 style={{ fontSize: 19, fontWeight: 500, marginTop: 20 }}>Polycom Expansion Module</h4>
            <ul style={{ fontSize: 16, marginBottom: 16 }}>
              <li><b>Slot (1–28):</b> Each row is a button.
                <ul>
                  <li><b>Label:</b> Text shown on the button.</li>
                  <li><b>Address/Ext:</b> Extension or number to dial/monitor.</li>
                  <li><b>Type:</b> “automata” (BLF) or “normal” (Speed Dial).</li>
                </ul>
              </li>
            </ul>
            <p style={{ fontSize: 16, marginBottom: 24 }}><b>How the Generator Works:</b><br />
              For each slot, generates:<br />
              <code>attendant.resourcelist.&#123;N&#125;.address=&#123;Address&#125;</code><br />
              <code>attendant.resourcelist.&#123;N&#125;.label=&#123;Label&#125;</code><br />
              <code>attendant.resourcelist.&#123;N&#125;.type=&#123;Type&#125;</code><br />
              Output is grouped and can be sorted by label.
            </p>

            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>General Features</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>Live Preview Grid:</b> Shows a 2-column visual of the expansion module, updating as you edit.</li>
              <li><b>Config Output:</b> Large, readable textarea with generated config.</li>
              <li><b>Sort Output:</b> Sorts config by label for easier management.</li>
              <li><b>Upload & Sort File:</b> Import a config file, auto-sorts, and displays it.</li>
              <li><b>Download:</b> Exports the generated config as a <code>.txt</code> file.</li>
              <li><b>Clear Config:</b> Resets all fields and output.</li>
            </ul>

            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Generator Logic Summary</h3>
            <p style={{ fontSize: 16, marginBottom: 24 }}>
              All config generators use the current field values to build a text config matching the phone’s requirements.<br />
              Expansion module state is saved to localStorage and restored on reload.<br />
              Output is always up-to-date with the latest edits.<br />
              All fields are editable, and changes are reflected immediately in the config and preview.
            </p>
          </div>
        )}
        {referenceSubtab === 'mikrotik' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Mikrotik Config Generator Reference</h2>
            <p style={{ fontSize: 16, marginBottom: 16 }}>
              The Mikrotik config generator creates ready-to-paste configuration scripts for Mikrotik routers and switches, based on selected templates and editable fields. These scripts automate network setup for VoIP, VLANs, bridges, DHCP, and more.
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 24 }}>Common Mikrotik Config Lines</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><code>/interface bridge add name=bridge1</code><br />Creates a new bridge interface called <b>bridge1</b>. Bridges are used to combine multiple interfaces into a single Layer 2 domain.</li>
              <li><code>/interface bridge port add bridge=bridge1 interface=ether2</code><br />Adds physical port <b>ether2</b> to the bridge <b>bridge1</b>. Repeat for each port you want in the bridge.</li>
              <li><code>/ip address add address=192.168.88.1/24 interface=bridge1</code><br />Assigns the IP address <b>192.168.88.1</b> with subnet mask <b>/24</b> to the bridge interface. This is the router’s LAN IP.</li>
              <li><code>/ip pool add name=dhcp_pool ranges=192.168.88.10-192.168.88.100</code><br />Creates a pool of IP addresses for DHCP clients.</li>
              <li><code>/ip dhcp-server add address-pool=dhcp_pool interface=bridge1 lease-time=1d name=dhcp1</code><br />Sets up a DHCP server on the bridge, using the defined pool.</li>
              <li><code>/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=8.8.8.8,8.8.4.4</code><br />Specifies the DHCP network, gateway, and DNS servers for clients.</li>
              <li><code>/interface vlan add interface=bridge1 name=vlan10 vlan-id=10</code><br />Creates a VLAN interface with ID 10 on the bridge.</li>
              <li><code>/interface ethernet switch vlan add ports=ether2,ether3 switch=switch1 vlan-id=10</code><br />Assigns VLAN 10 to ports ether2 and ether3 on the hardware switch.</li>
              <li><code>/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade</code><br />Enables NAT (masquerading) for outbound traffic on the WAN interface (ether1).</li>
              <li><code>/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1</code><br />Adds a default route for all outbound traffic via the specified gateway.</li>
              <li><code>/tool user-manager customer add login=admin password=yourpassword</code><br />Adds a user for Mikrotik’s User Manager (if used).</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Why Each Line Matters</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>Bridge and VLAN lines:</b> Set up the network topology, segment traffic, and allow for VoIP device isolation or prioritization.</li>
              <li><b>IP address and DHCP lines:</b> Ensure devices get correct IPs and can communicate on the network.</li>
              <li><b>Firewall/NAT lines:</b> Allow devices to access the internet and protect the internal network.</li>
              <li><b>Route lines:</b> Direct traffic to the correct gateway.</li>
              <li><b>User Manager lines:</b> (Optional) For advanced user/account management.</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Template-Specific Notes</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>Bridge Template:</b> Focuses on creating a bridge, adding ports, and setting up DHCP for a flat LAN.</li>
              <li><b>Passthrough Template:</b> Used for routing or bridging with minimal NAT/firewall, often for SIP trunking or transparent device connections.</li>
              <li><b>DHCP Options Template:</b> Adds custom DHCP options (like Option 66 for provisioning VoIP phones).</li>
              <li><b>StandAlone ATA Template:</b> Minimal config for a single analog adapter or device.</li>
              <li><b>OTT/OnNet Templates:</b> Pre-configured for Over-The-Top or OnNet VoIP deployments, with specific VLANs, firewall, and routing rules.</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Editing & Output</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li>All fields in the generator are editable. Changing a value (like IP, VLAN ID, pool range) updates the output script.</li>
              <li>The output is a ready-to-paste Mikrotik CLI script. Paste into Winbox, WebFig, or SSH terminal.</li>
            </ul>
          </div>
        )}
        {referenceSubtab === 'switches' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Cisco Switch Config Generator Reference</h2>
            <p style={{ fontSize: 16, marginBottom: 16 }}>
              The Cisco switch config generator produces configuration snippets for Cisco managed switches, automating VLAN, trunk, access port, and QoS setup for VoIP and data networks.
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 24 }}>Common Cisco Switch Config Lines</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><code>interface range GigabitEthernet1/0/1-24</code><br />Selects a range of switch ports (here, ports 1 to 24).</li>
              <li><code>switchport mode access</code><br />Sets the port(s) to access mode (for end devices, not trunk links).</li>
              <li><code>switchport access vlan 10</code><br />Assigns the port(s) to VLAN 10.</li>
              <li><code>switchport voice vlan 20</code><br />Assigns the port(s) to voice VLAN 20 (for IP phones).</li>
              <li><code>mls qos trust dscp</code><br />Trusts DSCP values for QoS (prioritizes VoIP traffic).</li>
              <li><code>spanning-tree portfast</code><br />Enables PortFast for quick port activation (for end devices).</li>
              <li><code>spanning-tree bpduguard enable</code><br />Protects against accidental loops by disabling the port if a BPDU is received.</li>
              <li><code>interface GigabitEthernet1/0/48</code><br />Selects a specific port (e.g., uplink port 48).</li>
              <li><code>switchport mode trunk</code><br />Sets the port to trunk mode (for uplinks between switches).</li>
              <li><code>switchport trunk allowed vlan 10,20,99</code><br />Allows only VLANs 10, 20, and 99 on the trunk port.</li>
              <li><code>vlan 10</code><br />Creates VLAN 10 in the switch VLAN database.</li>
              <li><code>name Voice</code><br />Names the VLAN (if supported in context).</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Why Each Line Matters</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>Access/trunk mode lines:</b> Define whether a port is for end devices (access) or for inter-switch links (trunk).</li>
              <li><b>VLAN lines:</b> Assign ports to the correct VLANs for data and voice separation.</li>
              <li><b>Voice VLAN lines:</b> Enable phones to tag their traffic for QoS and proper network segmentation.</li>
              <li><b>QoS lines:</b> Ensure voice traffic is prioritized for call quality.</li>
              <li><b>Spanning-tree lines:</b> Prevent network loops and speed up port activation for endpoints.</li>
              <li><b>Trunk allowed VLANs:</b> Restrict trunk ports to only the necessary VLANs for security and efficiency.</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Template-Specific Notes</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>24/48/8 Port Templates:</b> Pre-configured for common switch sizes, with port ranges and VLANs set for typical VoIP/data deployments.</li>
              <li><b>Custom VLANs:</b> You can edit VLAN IDs and names to match your network design.</li>
              <li><b>Uplink/Trunk Ports:</b> Uplink ports are set to trunk mode and allow all required VLANs.</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Editing & Output</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li>All fields in the generator are editable. Changing a value (like VLAN ID, port range) updates the output script.</li>
              <li>The output is a ready-to-paste Cisco IOS CLI script. Paste into the switch console or use a configuration tool.</li>
            </ul>
          </div>
        )}
        {referenceSubtab === 'pbx' && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>PBX Platform Reference</h2>
            <p style={{ fontSize: 16, marginBottom: 16 }}>
              This app currently supports three PBX platforms for configuration and import/export:
            </p>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>FreePBX:</b> Open-source PBX platform, widely used for on-premises and hosted VoIP deployments. Import/export tools support FreePBX CSV formats for extensions, BLFs, and device provisioning.</li>
              <li><b>UCaaS:</b> Unified Communications as a Service. Refers to cloud-hosted PBX solutions (e.g., NetSapiens, Broadsoft, etc.). The app supports import/export of user, extension, and device data for common UCaaS platforms.</li>
              <li><b>Fusion:</b> FusionPBX or similar multi-tenant PBX platforms. Import/export tools support Fusion CSV and table formats for users, devices, and BLFs.</li>
            </ul>
            <p style={{ fontSize: 16, marginBottom: 16 }}>
              <b>Coming soon:</b> <b>Intermedia</b> PBX platform support will be announced and added in a future update.
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>PBX Import/Export Features</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li>Import users, extensions, and BLF keys from platform-specific CSV files.</li>
              <li>Export generated configs or tables for bulk provisioning.</li>
              <li>Excel-like table UI for editing, adding, and deleting rows/columns.</li>
              <li>CSV import/export for easy migration between platforms.</li>
            </ul>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginTop: 32 }}>Platform Notes</h3>
            <ul style={{ fontSize: 16, marginBottom: 24 }}>
              <li><b>FreePBX:</b> Use the FBPX Import/Export tab for FreePBX-specific CSVs and config output.</li>
              <li><b>UCaaS:</b> Use the VPBX Import/Export tab for UCaaS user/device data.</li>
              <li><b>Fusion:</b> Use the Stretto Import/Export tab for FusionPBX and similar platforms.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reference;
