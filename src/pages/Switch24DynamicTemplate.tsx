import React, { useState } from 'react';

const defaultSwitch24Config = `no service pad
service timestamps debug datetime msec localtime
service timestamps log datetime msec localtime
service password-encryption
service sequence-numbers
service unsupported-transceiver
!
hostname {HOSTNAME}
!
boot-start-marker
boot-end-marker
!
enable secret 5 $1$r2iH$Cl01cXUmT5F5PbTFtyP1B/
!
username i123 privilege 15 secret 4 2MW3ZnKCi2YSSWyH3Fm0JIpfbAt7lW6VHefDLnvY0pU
no aaa new-model
clock timezone EST -5 0
clock summer-time EDT recurring
system mtu routing 1500
ip routing
!
vtp mode transparent
!
mls qos
!
spanning-tree mode pvst
spanning-tree extend system-id
spanning-tree portfast bpduguard default
!
no ip igmp snooping
!
no errdisable detect cause gbic-invalid
errdisable recovery cause all
errdisable recovery interval 60       
!
vlan internal allocation policy ascending
!
vlan 101
 name CUST_101
!
vlan 102
 name MGMT_102
!
vlan 202
 name PHONE_202
!
lldp run
!
interface FastEthernet0
 no ip address
 no ip route-cache
 shutdown
!         
interface range GigabitEthernet1/0/1-21
 description PHONE OR LAN
 switchport access vlan 101
 switchport mode access
 switchport nonegotiate
 switchport voice vlan 202
 mls qos trust dscp
 storm-control broadcast level 0.50
 storm-control multicast level 0.50
 storm-control action shutdown
 spanning-tree bpdufilter disable
 spanning-tree bpduguard enable
 spanning-tree guard root
 spanning-tree portfast
 no shutdown
!
interface GigabitEthernet1/0/22
 description CUSTOMER SWITCH
 switchport access vlan 101
 switchport mode access
 switchport nonegotiate
 mls qos trust dscp
 storm-control broadcast level 0.50
 storm-control multicast level 0.50
 storm-control action shutdown
 spanning-tree bpdufilter disable
 spanning-tree bpduguard enable
 spanning-tree guard root
 spanning-tree portfast trunk
 no shutdown
!
interface GigabitEthernet1/0/23
 description 123 DOWNLINK TO 123 SWITCHES
 switchport trunk encapsulation dot1q
 switchport trunk allowed vlan 101,102,202
 switchport mode trunk
 switchport nonegotiate
 mls qos trust dscp
 storm-control broadcast level 0.50
 storm-control multicast level 0.50
 storm-control action trap
 spanning-tree bpdufilter disable
 spanning-tree bpduguard enable
 spanning-tree guard root
 spanning-tree portfast trunk
 no shutdown
!
interface GigabitEthernet1/0/24
 description 123 UPLINK TO 123 SWITCH OR TIK
 switchport trunk encapsulation dot1q
 switchport trunk allowed vlan 101,102,202
 switchport mode trunk
 switchport nonegotiate
 mls qos trust dscp
 storm-control broadcast level 0.50
 storm-control multicast level 0.50
 storm-control action trap
 spanning-tree bpdufilter enable
 spanning-tree bpduguard disable
 spanning-tree portfast trunk
 no shutdown
!
interface GigabitEthernet1/1/1
 shutdown
!
interface GigabitEthernet1/1/2
 shutdown
!
interface GigabitEthernet1/1/3
 shutdown
!
interface GigabitEthernet1/1/4
 shutdown
!
interface TenGigabitEthernet1/1/1
 shutdown
!
interface TenGigabitEthernet1/1/2
 shutdown
!
interface Vlan1
 description DEAD
 no ip address
 no ip redirects
 no ip proxy-arp
 shutdown
!
interface Vlan101
 description CUST_101
 no ip address
 no ip redirects
 no ip proxy-arp
 no shutdown
!
interface Vlan102
 description MGMT_102
 ip address 192.168.10.11 255.255.255.0
 no ip redirects
 no ip proxy-arp
 no shutdown
!
interface Vlan202
 description PHONE_202
 ip address 172.16.1.2 255.255.255.0
 no shutdown
!
no ip http server
no ip http secure-server
!
ip route 0.0.0.0 0.0.0.0 192.168.10.1
!
access-list 1 permit 192.168.10.0 0.0.0.255
access-list 1 permit 66.103.225.120 0.0.0.7
access-list 1 permit 216.234.96.0 0.0.1.255
access-list 1 deny   any
access-list 5 permit 216.239.35.0 0.0.0.1
access-list 5 permit 216.239.35.4 0.0.0.1
access-list 5 permit 216.239.35.8 0.0.0.1
access-list 5 permit 216.239.35.12 0.0.0.1
access-list 5 deny   any
!
banner motd ^CCCCCCCCCC
123.NET
888-440-0123
SUPPORT@123.NET
ASSET TAG {ASSET_TAG}
^C
!
line con 0
 access-class 1 in vrf-also
 login local
line vty 0 4
 access-class 1 in vrf-also
 login local
line vty 5 15
 access-class 1 in vrf-also
 login local
!
ntp access-group peer 5
ntp server 216.239.35.12
end
`;

const Switch24DynamicTemplate: React.FC = () => {
  const [hostname, setHostname] = useState('HANDLE-STREETADDRESS-SWITCHNUMBER');
  const [assetTag, setAssetTag] = useState('XXXXX');

  const filled = defaultSwitch24Config
    .replace(/\{HOSTNAME\}/g, hostname)
    .replace(/\{ASSET_TAG\}/g, assetTag);

  return (
    <div>
      <h2>24 Port Switch Config</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div><label>Hostname<br /><input type="text" value={hostname} onChange={e => setHostname(e.target.value)} /></label></div>
        <div><label>Asset Tag<br /><input type="text" value={assetTag} onChange={e => setAssetTag(e.target.value)} /></label></div>
      </div>
      <textarea
        readOnly
        rows={38}
        style={{ width: '90vw', maxWidth: 1100, minHeight: 600, fontFamily: 'monospace', fontSize: 16, padding: 12, border: '1.5px solid #bbb', borderRadius: 6, resize: 'vertical', display: 'block' }}
        value={filled}
      />
    </div>
  );
};

export default Switch24DynamicTemplate;
