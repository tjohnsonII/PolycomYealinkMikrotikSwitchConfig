import React, { useState } from 'react';

const defaultTemplate = `/interface ethernet 
set [ find default-name=ether1 ] disabled=yes 
set [ find default-name=ether3 ] disabled=yes 
set [ find default-name=ether4 ] disabled=yes 
set [ find default-name=ether5 ] disabled=yes 
set [ find default-name=ether6 ] comment=OOB 
set [ find default-name=ether7 ] disabled=yes 
set [ find default-name=ether8 ] disabled=yes 
set [ find default-name=ether9 ] comment="Uplink to 123Net Switch" 
set [ find default-name=ether10 ] comment="Uplink to Customer Router" 
/interface vlan 
add interface=ether9 name=vlan102 vlan-id=102 
add interface=ether9 name=vlan202 vlan-id=202 
/interface ethernet switch port 
set 0 default-vlan-id=0 
set 1 default-vlan-id=0 
set 2 default-vlan-id=0 
set 3 default-vlan-id=0 
set 4 default-vlan-id=0 
set 5 default-vlan-id=0 
set 6 default-vlan-id=0 
set 7 default-vlan-id=0 
set 8 default-vlan-id=0 
set 9 default-vlan-id=0 
set 10 default-vlan-id=0 
set 11 default-vlan-id=0 
/interface wireless security-profiles 
set [ find default=yes ] supplicant-identity=MikroTik 
/ip dhcp-server option 
add code=2 name="GMT Offset -5" value=0xFFFFB9B0 
add code=42 name=NTP value="'216.239.35.12'" 
add code=160 name=prov_160 value="'http://provisioner.123.net'" 
add code=66 name=prov_66 value="'http://provisioner.123.net'" 
add code=202 name=Phone_vlan value="'VLAN-A=202'" 
/ip dhcp-server option sets 
add name=Phones_Options options="GMT Offset -5,NTP,prov_66,prov_160,Phone_vlan" 
/ip pool 
add name=Phones_IP_Pool ranges=172.16.1.30-172.16.1.250 
/ip dhcp-server 
add address-pool=Phones_IP_Pool authoritative=after-2sec-delay dhcp-option-set=\ 
    Phones_Options disabled=no interface=vlan202 name="Phones DHCP" 
add address-pool="Customer Internet" disabled=no interface=vlan101 name=\ 
    "Customer Internet" 
/snmp community 
set [ find default=yes ] addresses=66.103.225.120/29,216.234.96.0/23 
/user group 
set full policy="local,telnet,ssh,ftp,reboot,read,write,policy,test,winbox,passw\ 
    ord,web,sniff,sensitive,api,romon,dude,tikapp" 
/ip neighbor discovery-settings 
set discover-interface-list=!dynamic 
/ip address 
add address=192.168.88.1/24 interface=ether6 network=192.168.88.0 
add address=192.168.10.1/24 interface=vlan102 network=192.168.10.0 
add address=172.16.1.1/24 interface=vlan202 network=172.16.1.0 
add address={WAN_IP}/29 interface=ether10 network={NETWORK_IP} 
/ip dhcp-server network 
add address=172.16.1.0/24 dhcp-option-set=Phones_Options dns-server=\ 
    8.8.8.8,216.234.97.2,216.234.97.3 gateway=172.16.1.1 netmask=24 \ 
    ntp-server=184.105.182.16 
/ip firewall address-list 
add address=216.234.96.0/23 list=MGMT 
add address=66.103.225.120/29 list=MGMT 
add address=192.168.88.0/24 list=MGMT 
add address={OFFNET_IP}/29 list=MGMT <--Customer Off-Net IP 
add address=216.234.123.2 list=BT 
add address=192.168.10.0/24 list=MGMT 
add address=172.16.1.0/24 list=PHONEVLAN 
add address=205.251.183.0/24 list=PBX 
add address=205.251.183.0/24 comment="SERVER SPACE" list=PBX 
add address=69.39.69.0/24 comment="SERVER SPACE" list=PBX 
add address=216.109.194.0/24 comment="SERVER SPACE" list=PBX 
add address=216.109.194.50 list=PBX 
add address=184.105.182.16 comment=NTP list=PBX 
add address=216.239.35.12 comment=NTP list=PBX 
/ip firewall filter 
add action=accept chain=forward comment="ALLOW PASSTHROUGH" 
add action=accept chain=input protocol=icmp 
add action=accept chain=input src-address-list=MGMT 
add action=accept chain=input src-address-list=BT 
add action=accept chain=input comment=ALLOW_PBX src-address-list=PBX 
add action=accept chain=input comment=ALLOW_PHONES src-address-list=PHONEVLAN 
add action=accept chain=input comment="ALLOW ESTABLISHED" connection-state=established 
add action=accept chain=input comment="ALLOW RELATED" connection-state=related 
add action=drop chain=input comment=DROP_EVERYTHING_ELSE 
/ip firewall connection tracking 
Set udp-timeout=1m30s 
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
set sctp disabled=yes 
/ip route 
add distance=1 gateway={WAN_IP} (generally provided by customer) 
/ip service 
set telnet address=66.103.225.120/29,216.234.96.0/23,192.168.88.0/24 
set ftp disabled=yes 
set www disabled=yes 
set ssh address=66.103.225.120/29,216.234.96.0/23,192.168.88.0/24 
set api disabled=yes 
set winbox address=66.103.225.120/29,216.234.96.0/23,192.168.88.0/24 
set api-ssl disabled=yes 
/snmp 
set enabled=yes location="{LOCATION}" \ 
    trap-version=2 
/system clock 
set time-zone-name=America/Detroit 
/system identity 
set name={IDENTITY} 
/system ntp client 
set enabled=yes primary-ntp=216.239.35.12 secondary-ntp=216.234.97.3 
`;

const MikrotikDynamicTemplate: React.FC = () => {
  const [wanIp, setWanIp] = useState('');
  const [networkIp, setNetworkIp] = useState('');
  const [offnetIp, setOffnetIp] = useState('');
  const [location, setLocation] = useState('');
  const [identity, setIdentity] = useState('');

  const filled = defaultTemplate
    .replace(/{WAN_IP}/g, wanIp)
    .replace(/{NETWORK_IP}/g, networkIp)
    .replace(/{OFFNET_IP}/g, offnetIp)
    .replace(/{LOCATION}/g, location)
    .replace(/{IDENTITY}/g, identity);

  return (
    <div>
      <h2>Mikrotik Template</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div><label>WAN IP<br /><input type="text" value={wanIp} onChange={e => setWanIp(e.target.value)} placeholder="e.g. 203.0.113.1" /></label></div>
        <div><label>Network IP<br /><input type="text" value={networkIp} onChange={e => setNetworkIp(e.target.value)} placeholder="e.g. 203.0.113.0" /></label></div>
        <div><label>Off-Net IP<br /><input type="text" value={offnetIp} onChange={e => setOffnetIp(e.target.value)} placeholder="e.g. 203.0.113.2" /></label></div>
        <div style={{ minWidth: 200 }}><label>Location<br /><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Customer Name, Address, City MI ZIP" style={{ width: '100%' }} /></label></div>
        <div><label>Identity<br /><input type="text" value={identity} onChange={e => setIdentity(e.target.value)} placeholder="HANDLE-CUSTOMERADDRESS" /></label></div>
      </div>
      <textarea
        readOnly
        rows={28}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
        value={filled}
      />
    </div>
  );
};

export default MikrotikDynamicTemplate;
