import React from 'react';

const MikrotikReference: React.FC = () => (
  <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
    <h1>Mikrotik OTT Configuration Reference</h1>
    <p style={{ fontSize: '16px', marginBottom: '20px', color: '#666' }}>
      Complete OTT (Over-The-Top) Mikrotik template with detailed explanations for each configuration section.
    </p>

    {/* Interface Configuration */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🔌 Interface Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Ethernet Interface Setup</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/interface ethernet
set [ find default-name=ether1 ] disabled=yes
set [ find default-name=ether3 ] disabled=yes
set [ find default-name=ether4 ] disabled=yes
set [ find default-name=ether5 ] disabled=yes
set [ find default-name=ether6 ] comment=OOB
set [ find default-name=ether7 ] disabled=yes
set [ find default-name=ether8 ] disabled=yes
set [ find default-name=ether9 ] comment="Uplink to 123Net Switch"
set [ find default-name=ether10 ] comment="Uplink to Customer Router"`}
        </pre>
        <ul>
          <li><strong>ether1, 3-5, 7-8:</strong> Disabled - unused interfaces to reduce attack surface</li>
          <li><strong>ether6:</strong> OOB (Out-of-Band) management interface</li>
          <li><strong>ether9:</strong> Uplink to 123Net Switch - provider connection</li>
          <li><strong>ether10:</strong> Uplink to Customer Router - customer connection</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>VLAN Configuration</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/interface vlan
add interface=ether9 name=vlan102 vlan-id=102
add interface=ether9 name=vlan202 vlan-id=202`}
        </pre>
        <ul>
          <li><strong>vlan102:</strong> Management VLAN on provider uplink</li>
          <li><strong>vlan202:</strong> Phone VLAN on provider uplink for VoIP traffic</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>Switch Port Configuration</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/interface ethernet switch port
set 0 default-vlan-id=0
set 1 default-vlan-id=0
...
set 11 default-vlan-id=0`}
        </pre>
        <ul>
          <li><strong>default-vlan-id=0:</strong> Sets all switch ports to untagged/native VLAN</li>
        </ul>
      </div>
    </section>

    {/* DHCP Configuration */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🌐 DHCP Server Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>DHCP Options</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip dhcp-server option
add code=2 name="GMT Offset -5" value=0xFFFFB9B0
add code=42 name=NTP value="'216.239.35.12'"
add code=160 name=prov_160 value="'http://provisioner.123.net'"
add code=66 name=prov_66 value="'http://provisioner.123.net'"
add code=202 name=Phone_vlan value="'VLAN-A=202'"`}
        </pre>
        <ul>
          <li><strong>Code 2:</strong> Time offset for Eastern Time (-5 hours from GMT)</li>
          <li><strong>Code 42:</strong> NTP server for time synchronization</li>
          <li><strong>Code 160:</strong> Provisioning server URL for phone configuration</li>
          <li><strong>Code 66:</strong> TFTP server option for phone provisioning</li>
          <li><strong>Code 202:</strong> VLAN assignment for phones</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>DHCP Pool and Server</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip dhcp-server option sets
add name=Phones_Options options="GMT Offset -5,NTP,prov_66,prov_160,Phone_vlan"

/ip pool
add name=Phones_IP_Pool ranges=172.16.1.30-172.16.1.250

/ip dhcp-server
add address-pool=Phones_IP_Pool authoritative=after-2sec-delay dhcp-option-set=\\
    Phones_Options disabled=no interface=vlan202 name="Phones DHCP"
add address-pool="Customer Internet" disabled=no interface=vlan101 name=\\
    "Customer Internet"`}
        </pre>
        <ul>
          <li><strong>Phones_Options:</strong> Bundles all phone-specific DHCP options</li>
          <li><strong>Phones_IP_Pool:</strong> IP range 172.16.1.30-250 for phone devices</li>
          <li><strong>Phones DHCP:</strong> DHCP server for VLAN 202 (phone network)</li>
          <li><strong>Customer Internet:</strong> DHCP server for customer internet access</li>
        </ul>
      </div>
    </section>

    {/* IP Addressing */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🏠 IP Address Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip address
add address=192.168.88.1/24 interface=ether6 network=192.168.88.0
add address=192.168.10.1/24 interface=vlan102 network=192.168.10.0
add address=172.16.1.1/24 interface=vlan202 network=172.16.1.0
add address=XXX.XXX.XXX.XXX/29 interface=ether10 network=XXX.XXX.XXX.XXX`}
        </pre>
        <ul>
          <li><strong>192.168.88.1/24:</strong> OOB management interface (ether6)</li>
          <li><strong>192.168.10.1/24:</strong> Management VLAN gateway (vlan102)</li>
          <li><strong>172.16.1.1/24:</strong> Phone VLAN gateway (vlan202)</li>
          <li><strong>🔗 XXX.XXX.XXX.XXX/29 (DUAL-IP LINE):</strong> Customer WAN IP configuration - When using the OTT generator, entering a single IP like <code>192.168.1.10/29</code> automatically updates BOTH the interface address (<code>192.168.1.10/29</code>) AND the network address (<code>192.168.1.8</code>)</li>
        </ul>
        
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '4px', 
          padding: '10px', 
          marginTop: '15px' 
        }}>
          <strong>💡 Understanding the Dual-IP Line:</strong>
          <p style={{ margin: '5px 0' }}>
            The customer WAN IP line is special because it serves two purposes:
          </p>
          <ol style={{ margin: '5px 0 5px 20px' }}>
            <li><strong>Interface Address:</strong> The actual IP assigned to ether10 (e.g., 192.168.1.10/29)</li>
            <li><strong>Network Address:</strong> The network portion for routing (e.g., 192.168.1.8 from a /29 subnet)</li>
          </ol>
          <p style={{ margin: '5px 0', fontSize: '13px', fontStyle: 'italic' }}>
            When you enter an IP in the OTT generator, it calculates both values automatically to ensure proper RouterOS configuration.
          </p>
        </div>
      </div>
    </section>

    {/* Firewall Configuration */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🛡️ Firewall Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Address Lists</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip firewall address-list
add address=216.234.96.0/23 list=MGMT
add address=66.103.225.120/29 list=MGMT
add address=192.168.88.0/24 list=MGMT
add address=XXX.XXX.XXX.XXX/29 list=MGMT <--Customer Off-Net IP
add address=216.234.123.2 list=BT
add address=192.168.10.0/24 list=MGMT
add address=172.16.1.0/24 list=PHONEVLAN
add address=205.251.183.0/24 list=PBX
add address=69.39.69.0/24 comment="SERVER SPACE" list=PBX
add address=216.109.194.0/24 comment="SERVER SPACE" list=PBX
add address=184.105.182.16 comment=NTP list=PBX
add address=216.239.35.12 comment=NTP list=PBX`}
        </pre>
        <ul>
          <li><strong>MGMT:</strong> Management networks allowed full access</li>
          <li><strong>BT:</strong> BackTrack/support access</li>
          <li><strong>PHONEVLAN:</strong> Phone network addresses</li>
          <li><strong>PBX:</strong> PBX servers and related services (NTP, provisioning)</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Filter Rules</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip firewall filter
add action=accept chain=forward comment="ALLOW PASSTHROUGH"
add action=accept chain=input protocol=icmp
add action=accept chain=input src-address-list=MGMT
add action=accept chain=input src-address-list=BT
add action=accept chain=input comment=ALLOW_PBX src-address-list=PBX
add action=accept chain=input comment=ALLOW_PHONES src-address-list=PHONEVLAN
add action=accept chain=input comment="ALLOW ESTABLISHED" connection-state=established
add action=accept chain=input comment="ALLOW RELATED" connection-state=related
add action=drop chain=input comment=DROP_EVERYTHING_ELSE`}
        </pre>
        <ul>
          <li><strong>ALLOW PASSTHROUGH:</strong> Permits traffic forwarding through router</li>
          <li><strong>ICMP:</strong> Allows ping and network diagnostics</li>
          <li><strong>MGMT/BT/PBX/PHONES:</strong> Allow access from trusted networks</li>
          <li><strong>ESTABLISHED/RELATED:</strong> Allow return traffic for existing connections</li>
          <li><strong>DROP_EVERYTHING_ELSE:</strong> Default deny rule for security</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>NAT Configuration</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip firewall nat
add action=masquerade chain=srcnat src-address=172.16.1.0/24`}
        </pre>
        <ul>
          <li><strong>Masquerade:</strong> NAT for phone VLAN to access internet</li>
        </ul>
      </div>
    </section>

    {/* Routing */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🛣️ Routing Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip route
add distance=1 gateway=XXX.XXX.XXX.XXX`}
        </pre>
        <ul>
          <li><strong>Gateway:</strong> Default route to customer's router (generally provided by customer)</li>
          <li><strong>Distance=1:</strong> Administrative distance for route priority</li>
        </ul>
      </div>
    </section>

    {/* Services */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        🔧 Service Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>Disabled Services (Security)</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip firewall service-port
set ftp disabled=yes
set tftp disabled=yes
set irc disabled=yes
set h323 disabled=yes
set sip disabled=yes
set pptp disabled=yes
set udplite disabled=yes
set dccp disabled=yes
set sctp disabled=yes`}
        </pre>
        <ul>
          <li><strong>Disabled Services:</strong> Closes unnecessary service ports for security</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>Enabled Services (Restricted Access)</h3>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/ip service
set telnet address=66.103.225.120/29,216.234.96.0/23,192.168.88.0/24
set ftp disabled=yes
set www disabled=yes
set ssh address=66.103.225.120/29,216.234.96.0/23,192.168.88.0/24
set api disabled=yes
set winbox address=66.103.225.120/29,216.234.96.0/23,192.168.88.0/24
set api-ssl disabled=yes`}
        </pre>
        <ul>
          <li><strong>SSH/Telnet/Winbox:</strong> Restricted to management networks only</li>
          <li><strong>Web/API:</strong> Disabled for security</li>
        </ul>
      </div>
    </section>

    {/* System Configuration */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        ⚙️ System Configuration
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`/snmp
set enabled=yes location=\\
    "CUSTOMER NAME, CUSTOMER ADDRESS, CITY MI ZIP" \\
    trap-version=2

/system clock
set time-zone-name=America/Detroit

/system identity
set name=HANDLE-CUSTOMERADDRESS

/system ntp client
set enabled=yes primary-ntp=216.239.35.12 secondary-ntp=216.234.97.3`}
        </pre>
        <ul>
          <li><strong>SNMP:</strong> Monitoring with customer location information</li>
          <li><strong>Timezone:</strong> Eastern Time (America/Detroit)</li>
          <li><strong>Identity:</strong> Router name using customer handle</li>
          <li><strong>NTP:</strong> Time synchronization with primary and backup servers</li>
        </ul>
      </div>
    </section>

    {/* Documentation Comments */}
    <section style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#0066cc', borderBottom: '2px solid #0066cc', paddingBottom: '5px' }}>
        📝 Documentation Comments
      </h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <pre style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '3px' }}>
{`# Customer: "CUSTOMER NAME"
# Address: "CUSTOMER ADDRESS"
# City: "CITY MI ZIP"
# XIP: "XIP"
# Handle: "HANDLE-CUSTOMERADDRESS"`}
        </pre>
        <ul>
          <li><strong># Customer:</strong> Full customer name for identification</li>
          <li><strong># Address:</strong> Customer's street address</li>
          <li><strong># City:</strong> Customer's city, state (MI), and ZIP code</li>
          <li><strong># XIP:</strong> Customer's XIP identifier <em>(documentation only - not functional in router configuration)</em></li>
          <li><strong># Handle:</strong> Customer handle typically in HANDLE-CUSTOMERADDRESS format</li>
        </ul>
        
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '10px', 
          marginTop: '15px' 
        }}>
          <strong>📋 Important Note:</strong> These comment lines are for documentation purposes and help identify the customer configuration. The XIP field is particularly important to note as it serves only as a reference identifier and does not affect the router's functional configuration.
        </div>
      </div>
    </section>

    {/* Summary */}
    <section style={{ backgroundColor: '#e7f3ff', padding: '20px', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
      <h2 style={{ color: '#0066cc', marginTop: '0' }}>📋 Configuration Summary</h2>
      <p><strong>This OTT Mikrotik configuration provides:</strong></p>
      <ul>
        <li>🔒 <strong>Security:</strong> Firewall rules, disabled services, restricted management access</li>
        <li>📞 <strong>VoIP Support:</strong> Dedicated phone VLAN with proper DHCP options</li>
        <li>🌐 <strong>Network Segmentation:</strong> Separate VLANs for management, phones, and customer traffic</li>
        <li>⏰ <strong>Time Sync:</strong> NTP configuration for accurate timestamps</li>
        <li>📊 <strong>Monitoring:</strong> SNMP enabled for network monitoring</li>
        <li>🛣️ <strong>Routing:</strong> Proper gateway configuration for customer connectivity</li>
        <li>📝 <strong>Documentation:</strong> Customer information comments for easy identification</li>
      </ul>
    </section>
  </div>
);

export default MikrotikReference;
