import React, { useState } from 'react';

const REFERENCE_SUBTABS = [
  { key: 'phones', label: 'Phones' },
  { key: 'mikrotik', label: 'Mikrotik' },
  { key: 'switches', label: 'Switches' },
  { key: 'pbx', label: "PBX's" },
];

const PBX_SUBTABS = ['FreePBX', 'UCaaS', 'FusionPBX', 'Intermedia'];

function PBXReferenceSubnav() {
  const [pbxSubtab, setPbxSubtab] = useState('FreePBX');
  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>PBX Platform Reference</h2>
      {/* PBX sub-navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {PBX_SUBTABS.map((pbx) => (
          <button
            key={pbx}
            className={pbxSubtab === pbx ? 'active' : ''}
            onClick={() => setPbxSubtab(pbx)}
            style={{
              border: 'none',
              borderBottom: pbxSubtab === pbx ? '3px solid #0078d4' : '2px solid #ccc',
              background: pbxSubtab === pbx ? '#f7fbff' : '#f4f4f4',
              color: pbxSubtab === pbx ? '#0078d4' : '#333',
              fontWeight: pbxSubtab === pbx ? 600 : 400,
              padding: '8px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              minWidth: 100,
            }}
          >
            {pbx}
          </button>
        ))}
      </div>
      {/* PBX subtab content */}
      {pbxSubtab === 'FreePBX' && (
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 600 }}>FreePBX</h3>
          <ul style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
            <li><b>Inbound Routes</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>What Are Inbound Routes?</b><br />
                  Inbound Routes control how FreePBX handles incoming calls from external sources — usually via SIP trunks. These routes match on one or more conditions (like the dialed number or caller ID), and then send the call to a destination like:
                </p>
                <ul>
                  <li>An extension</li>
                  <li>A ring group</li>
                  <li>An IVR</li>
                  <li>A queue</li>
                  <li>A time condition</li>
                  <li>Voicemail</li>
                  <li>A custom destination</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Match Criteria</b></p>
                <ol style={{ margin: '0 0 8px 0' }}>
                  <li><b>DID Number</b><br />
                    The DID is the phone number dialed by the outside caller.<br />
                    When a call hits your trunk, FreePBX looks at this field to determine the route.<br />
                    You can:
                    <ul>
                      <li>Leave it blank to match all DIDs</li>
                      <li>Enter a full 10- or 11-digit number (e.g., 2485551234)</li>
                      <li>Use partial matches or wildcards (like _248555XXXX)</li>
                    </ul>
                  </li>
                  <li><b>Caller ID Number</b><br />
                    Matches based on the incoming caller's number.<br />
                    Used for special cases like VIP routing or blocking known spam callers.<br />
                    Can be exact match or patterns (e.g., 248555% for area code filtering)
                  </li>
                </ol>
                <p style={{ margin: '0 0 8px 0' }}><b>Key Configuration Options</b></p>
                <ul>
                  <li><b>Description:</b> Internal label (e.g., Main Line, Sales DID, After Hours Route)</li>
                  <li><b>Set Destination:</b> Choose where to send the call: Extension, ring group, IVR, announcement, etc.</li>
                  <li><b>Alert Info:</b> Sends custom alert to phones (e.g., different ring tone). Yealink/Polycom can use this for distinctive ring tones.</li>
                  <li><b>CID Lookup Source:</b> Automatically performs a reverse lookup (e.g., caller name) from a CNAM provider</li>
                  <li><b>Recording Options:</b> Record the call from this point forward. Override global settings.</li>
                  <li><b>Privacy Manager:</b> Forces anonymous callers to enter their number. Useful for blocking spam or anonymous calls.</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Time-Based Routing (Using Time Conditions)</b><br />
                  Inbound Routes can pass calls to Time Conditions, allowing you to:
                </p>
                <ul>
                  <li>Route differently during business hours vs. after hours</li>
                  <li>Set holiday-specific routes</li>
                  <li>Combine with Call Flow Control for manual overrides</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}>Example:<br />
                  Inbound Route (DID: 2485551234) → Time Condition → If open → IVR, If closed → Voicemail
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Real-World Examples</b></p>
                <ul>
                  <li><b>Standard Routing:</b> DID 2485551234 → Rings extension 1001</li>
                  <li><b>IVR Menu:</b> DID 2485552000 → Goes to main IVR menu for call routing</li>
                  <li><b>After-Hours Message:</b> All calls → Play announcement: "Our office is currently closed"</li>
                  <li><b>Dispatch Failover:</b> Known caller ID 5865551100 → Ring mobile backup number via Misc Destination</li>
                  <li><b>VIP Routing:</b> Caller ID 2485555555 → Direct to management's ring group</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Advanced Use Cases</b></p>
                <ul>
                  <li>Combine multiple inbound routes with overlapping DIDs for layered routing logic.</li>
                  <li>Set specific Caller ID entries for numbers that bypass menus and go directly to agents.</li>
                  <li>Create "Catch-All" route with blank DID/CID to handle unrecognized calls as a fallback.</li>
                  <li>Use Inbound Routes → Time Condition → Call Flow Control for dynamic routing via BLF.</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Tips for Managing Inbound Routes</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Tip</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use descriptive names</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>e.g., Main Line - Day, Main Line - After Hours</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Keep DID formatting consistent</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Match what's sent by your SIP provider (10 vs. 11 digits)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Route to Time Conditions</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Gives you flexible control and easy overrides</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Don’t forget the fallback</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>A "catch-all" route prevents dropped calls if no DID match occurs</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Document routing logic</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Especially useful if using IVRs, queues, or layered flows</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li><b>Firewall</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>Overview: What Does the FreePBX Firewall Do?</b><br />
                  The FreePBX Firewall:
                  <ul>
                    <li>Filters traffic by source IP address and port</li>
                    <li>Organizes access via zones (internal, external, trusted, etc.)</li>
                    <li>Automatically blocks threats and scanning attempts (via Fail2Ban)</li>
                    <li>Allows or denies access to services like:
                      <ul>
                        <li>Web GUI (HTTP/HTTPS)</li>
                        <li>SSH</li>
                        <li>SIP/PJSIP</li>
                        <li>UCP, Zulu, REST API, etc.</li>
                      </ul>
                    </li>
                  </ul>
                  It works hand-in-hand with <b>iptables</b> (on Linux) and can be customized to protect a local system, cloud PBX, or hybrid deployment.
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Firewall Zones (Core Concept)</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Zone</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Description</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Trusted</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Full access, no restrictions</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>LAN, VPN peers, known public IPs</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Local</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Only for services running on the system (loopback)</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>127.0.0.1</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Internal</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Allows PBX services (phones, UCP, etc.)</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Office subnets</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>External</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Blocked by default, can whitelist services</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Internet, unknown IPs</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Other</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Catch-all zone for unclassified traffic</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Used for alerts/monitoring</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Blacklist</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Permanently banned IPs</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Malicious traffic, SIP scanners</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>Services Controlled by Firewall</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Service</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Web Interface (Admin, UCP)</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>HTTP/HTTPS access to FreePBX GUI</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>SIP/PJSIP</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Call signaling ports (usually UDP 5060, 5160)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>RTP Media</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Voice traffic (UDP ports 10000–20000 by default)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>SSH</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Secure shell for remote access</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>REST API / AMI</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Used by advanced applications or external integrations</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Responsive Firewall</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Dynamically adjusts rules based on traffic</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>Responsive Firewall</b><br />
                  This feature allows remote phones or clients to connect dynamically:
                  <ul>
                    <li>Accepts new connections temporarily</li>
                    <li>Uses SIP registration attempts to whitelist the IP</li>
                    <li>If registration is successful, the IP is added to the Internal zone for a limited time</li>
                    <li>Supports PJSIP, IAX, and SIP transport</li>
                  </ul>
                  <b>Use Case:</b> Remote Yealink or Bria softphone connects from home IP, gets added automatically.
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Intrusion Detection (Fail2Ban)</b><br />
                  <ul>
                    <li>Monitors logs for brute-force attempts (SIP, SSH, web logins)</li>
                    <li>Automatically bans IPs after too many failed attempts</li>
                    <li>Ban time and retry limits are configurable</li>
                    <li>Logs can be viewed in <code>/var/log/fail2ban.log</code></li>
                  </ul>
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Configuration Tabs</b></p>
                <ol style={{ margin: '0 0 8px 0' }}>
                  <li><b>Status</b><br />
                    Current firewall mode: Enabled/Disabled/Testing<br />
                    Summary of running services and zones
                  </li>
                  <li><b>Interfaces</b><br />
                    Classify each network interface (e.g., eth0) as:
                    <ul>
                      <li>Trusted / Internal / External</li>
                      <li>Typically: WAN = External, LAN = Internal</li>
                    </ul>
                  </li>
                  <li><b>Networks</b><br />
                    Whitelist or blacklist specific IPs or ranges<br />
                    Add remote offices, admin IPs, or mobile networks here
                  </li>
                  <li><b>Services</b><br />
                    Toggle allowed services (per zone)<br />
                    Select which zones can access SIP, HTTP, SSH, etc.
                  </li>
                  <li><b>Advanced</b><br />
                    Adjust default ports<br />
                    Modify fail2ban ban times<br />
                    Manage logs and performance settings
                  </li>
                </ol>
                <p style={{ margin: '0 0 8px 0' }}><b>Best Practices</b></p>
                <ul>
                  <li>✅ Whitelist your management IPs (under "Networks")</li>
                  <li>✅ Set your LAN interfaces to Trusted or Internal</li>
                  <li>✅ Disable unnecessary services (e.g., Web UI over WAN)</li>
                  <li>✅ Use Responsive Firewall for remote phones</li>
                  <li>✅ Monitor intrusion logs and adjust thresholds as needed</li>
                  <li>✅ Use secure SIP passwords and avoid predictable extensions</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Common Troubleshooting Tips</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Symptom</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Possible Cause</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Remote phones can't register</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>IP not whitelisted or responsive firewall not working</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use Responsive mode or manually allow IP</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>GUI unreachable from remote</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Web access not allowed for External zone</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Temporarily move IP to Trusted zone</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Calls fail or drop</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>RTP ports not allowed through firewall/NAT</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Allow UDP 10000–20000 and ensure correct NAT setup</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Fail2Ban too aggressive</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>False positives from SIP scanners</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Adjust ban time or retry limit in Advanced settings</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li><b>Extensions</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>What is an Extension?</b><br />
                  An extension in FreePBX represents a user endpoint on the phone system — usually a physical phone, a softphone, or a device that registers via SIP or PJSIP.<br />
                  You assign a unique number (like 101, 202, etc.) to each extension. That number becomes the internal "phone number" for that device or user.
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Protocol Types (PJSIP)</b><br />
                  When creating an extension, you choose a technology driver:
                  <ul>
                    <li><b>PJSIP (recommended for new deployments):</b>
                      <ul>
                        <li>Modern protocol stack</li>
                        <li>Supports multiple registrations (e.g., multiple devices per user)</li>
                      </ul>
                    </li>
                  </ul>
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Common Extension Settings</b></p>
                <ul>
                  <li><b>User Extension:</b> The internal number (e.g., 1001). Unique across the system.</li>
                  <li><b>Display Name:</b> Human-friendly label (e.g., John Smith). Appears on devices and in FreePBX GUI.</li>
                  <li><b>Secret / Password:</b> SIP/PJSIP registration password. Should be long and secure (randomized).</li>
                  <li><b>Voicemail Settings:</b> Enable/disable, email delivery (with or without attachment), greeting preferences, VMX Locater (press-to-redirect options while caller is in voicemail).</li>
                  <li><b>CID Options:</b> Outbound CID controls what caller ID is presented when this extension calls out. Can override trunk-level CID with format: “John Smith” &lt;2485551234&gt;.</li>
                  <li><b>Device Options:</b> NAT (enable for devices behind NAT/firewalls), DTMF Mode (typically RFC2833 or Auto), Transport (UDP / TCP / TLS for SIP signaling).</li>
                  <li><b>Advanced Settings:</b> Call recording (always, never, on-demand), language code (for system prompts), codec preferences (e.g., G722, ulaw, alaw, G729), Qualify/Keepalive (ensures phone is reachable).</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Features Tied to Extensions</b></p>
                <ul>
                  <li><b>Find Me/Follow Me:</b> Enable follow-me behavior for calls to this extension. Ring internal and external numbers sequentially or simultaneously.</li>
                  <li><b>Call Recording:</b> On-demand or always-record per extension. Saved in /var/spool/asterisk/monitor.</li>
                  <li><b>Call Forwarding:</b> Forward all/busy/unavailable to another extension, external number, or voicemail.</li>
                  <li><b>Call Waiting / Call Screening / Call Announce:</b> Fine-grained controls over how additional calls are handled. Can require caller to say their name before connecting.</li>
                  <li><b>Voicemail to Email:</b> Email notifications of new voicemails. Attachments and delete-after-send options.</li>
                  <li><b>User Control Panel (UCP):</b> If enabled, users can:
                    <ul>
                      <li>Listen to voicemail</li>
                      <li>Review call history</li>
                      <li>Manage recordings</li>
                      <li>Adjust Find Me/Follow Me</li>
                      <li>Send/receive faxes (if enabled)</li>
                      <li>Chat (with commercial modules)</li>
                    </ul>
                    Users log into UCP via the FreePBX web interface using their extension number and user password.
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>Registration: How Phones Connect</b><br />
                  A phone or softphone must be configured with:
                  <ul>
                    <li><b>Username:</b> The extension number (e.g., 1001)</li>
                    <li><b>Password:</b> The SIP/PJSIP secret</li>
                    <li><b>Server:</b> IP or FQDN of the FreePBX system</li>
                    <li><b>Port:</b> Typically 5060 (UDP for SIP, or 5061 for TLS/PJSIP)</li>
                  </ul>
                  Once registered, the device can:
                  <ul>
                    <li>Receive calls directly</li>
                    <li>Make internal and outbound calls</li>
                    <li>Use BLFs and other features</li>
                  </ul>
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Extension States</b><br />
                  Extensions can be in different states:
                  <ul>
                    <li><b>Idle:</b> Available for calls</li>
                    <li><b>In Use:</b> On a call</li>
                    <li><b>Ringing:</b> Incoming call</li>
                    <li><b>Unavailable:</b> Unregistered or not reachable</li>
                  </ul>
                  These states are used by BLF lights and call center logic
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>Use Cases</b><br />
                  <ul>
                    <li>Personal devices (e.g., desk phones)</li>
                    <li>Softphones (e.g., Zoiper, Bria, Linphone)</li>
                    <li>Remote users (via VPN or NAT-aware SIP)</li>
                    <li>Call groups (used with ring groups/queues)</li>
                  </ul>
                </p>
              </div>
            </li>
            <li><b>Ring Groups</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>📁 What Is a Ring Group?</b><br />
                  A Ring Group is a way to ring multiple extensions simultaneously or in sequence when a call is received. It’s typically used to reach a department, team, or group of phones (e.g., Sales, Support, Reception).<br />
                  Think of it as a mini broadcast system for inbound or internal calls.
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>🛠️ Common Use Cases</b></p>
                <ul>
                  <li>Ring all front desk phones at once</li>
                  <li>Call a group of remote support reps in order</li>
                  <li>Overflow logic: ring extension 100 for 10 seconds, then ring 101 and 102</li>
                  <li>Combine with Inbound Routes, IVRs, or Queues</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔧 Core Configuration Options</b></p>
                <ul>
                  <li><b>Ring-Group Number</b><br />
                    The internal number to dial this group (e.g., 600).<br />
                    Can also be a destination for Inbound Routes or IVRs.
                  </li>
                  <li><b>Group Description</b><br />
                    Label to identify purpose (e.g., Sales Team, Tech Support)
                  </li>
                  <li><b>Extension List</b><br />
                    Add one or more extensions or external numbers (e.g., 100, 101, 2485551234#).<br />
                    Use <b>#</b> at the end of external numbers.<br />
                    <span style={{ display: 'block', margin: '8px 0 0 8px', fontFamily: 'monospace', whiteSpace: 'pre' }}>100
101
102
2485557890#</span>
                  </li>
                  <li><b>Ring Strategy</b><br />
                    Controls how the phones ring:
                    <ul>
                      <li><b>ringall:</b> Ring all at once</li>
                      <li><b>hunt:</b> Ring one at a time in order</li>
                      <li><b>memoryhunt:</b> Ring one, then add the next, etc.</li>
                      <li><b>firstavailable:</b> Rings the first free extension</li>
                      <li><b>random:</b> Randomized order</li>
                    </ul>
                  </li>
                  <li><b>Ring Time</b><br />
                    How long to ring this group (in seconds) before trying the next destination
                  </li>
                  <li><b>Destination if No Answer</b><br />
                    Where to send the call if no one answers (e.g., voicemail, another ring group, queue)
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔔 Additional Features</b></p>
                <ul>
                  <li><b>CID Name Prefix</b><br />
                    Adds a prefix to the caller ID on phones in the group.<br />
                    Example: <b>Sales:</b> makes incoming CID show as Sales:2485551212
                  </li>
                  <li><b>Ignore CF Settings</b><br />
                    Ignore individual extensions' call forwarding (recommended for group integrity)
                  </li>
                  <li><b>Disable Call Forwarding</b><br />
                    Prevent users from forwarding group calls to external destinations
                  </li>
                  <li><b>Enable Call Confirmation</b><br />
                    Required when calling external numbers (e.g., cell phones).<br />
                    Prompts remote user to "Press 1 to accept the call"
                  </li>
                  <li><b>Remote Announce / Too-Late Announce</b><br />
                    Audio prompts played to external users when they answer
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔁 Real-World Examples</b></p>
                <ul>
                  <li><b>🧑‍💼 Sales Group</b><br />
                    Extensions: 100, 101, 102<br />
                    Ring Strategy: ringall<br />
                    CID Prefix: Sales:<br />
                    Timeout Destination: Queue 600 (to queue calls if no answer)
                  </li>
                  <li><b>🧍‍♂️ On-Call Tech</b><br />
                    Extensions: 200<br />
                    External: 5865552222#<br />
                    Strategy: hunt<br />
                    Call Confirm: Enabled (ensures cell phones press 1 to answer)
                  </li>
                  <li><b>🕗 Office Hours Route</b><br />
                    Time Condition → if open → Ring Group Reception<br />
                    Time Condition → if closed → Voicemail or Announcement
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🧼 Best Practices</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Tip</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use CID Prefixes</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Helps staff know what type of call it is</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use Call Confirm on external numbers</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Prevents calls from hitting personal voicemail</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Limit Ring Time</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Avoids long ringing and faster failover</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Document each group’s role</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Keeps your call flow organized</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Avoid loops</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Don’t send a failed call back into the same group</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>🔗 Ring Groups vs. Queues</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Feature</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Ring Group</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Queue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Call distribution</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Simultaneous/sequential</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Rules-based (round robin, etc.)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Music on hold</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>No</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Caller position</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>No</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Agent login/logout</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>No</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Ideal for</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Small teams, simple routing</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Call centers, advanced control</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li><b>Queues</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>🎯 What is a Queue?</b><br />
                  A Queue is a structured call-holding system in FreePBX. When callers enter a queue:
                  <ul>
                    <li>They wait on hold until an available agent can answer.</li>
                    <li>Calls are distributed based on defined strategies (e.g., round robin, least recent).</li>
                    <li>Agents can log in/out of queues manually or dynamically.</li>
                    <li>You can provide music on hold, caller position, and estimated wait time.</li>
                  </ul>
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>🛠️ Where to Configure Queues</b></p>
                <ul>
                  <li>Admin GUI: <b>Applications → Queues</b></li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🧩 Core Queue Settings</b></p>
                <ul>
                  <li><b>Queue Number</b><br />
                    Internal extension number for the queue (e.g., 600)
                  </li>
                  <li><b>Queue Name</b><br />
                    Label that appears in reports and agent displays (e.g., Support Line, Billing Queue)
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🧑‍💼 Agent Configuration</b></p>
                <ul>
                  <li><b>Static Agents</b><br />
                    Predefined list of extensions (always part of the queue):<br />
                    <span style={{ display: 'block', margin: '8px 0 0 8px', fontFamily: 'monospace', whiteSpace: 'pre' }}>100
101
102</span>
                  </li>
                  <li><b>Dynamic Agents</b><br />
                    Agents log in/out with feature codes (e.g., *45).<br />
                    Good for hot-desking or rotating teams.<br />
                    Can also use hotdesk provisioning or Sangoma Phones' presence states.
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🎛️ Key Call Handling Options</b></p>
                <ul>
                  <li><b>📞 Call Distribution Strategy</b><br />
                    Controls how calls are assigned:
                    <table style={{ borderCollapse: 'collapse', margin: '8px 0' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Strategy</th>
                          <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>ringall</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Ring all agents simultaneously</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>rrmemory</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Round-robin with memory (next agent after last one)</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>leastrecent</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Agent who hasn’t taken a call in the longest time</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>fewestcalls</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Agent who has taken the fewest calls</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>random</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Random agent</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>rrordered</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Strict round-robin in order listed</td>
                        </tr>
                      </tbody>
                    </table>
                  </li>
                  <li><b>🕓 Max Wait Time</b><br />
                    How long a caller will wait in the queue before timing out.<br />
                    If reached, the call is sent to a failover destination (voicemail, another queue, etc.)
                  </li>
                  <li><b>🔀 Failover Destination</b><br />
                    Where to send the call if no agents answer (voicemail, another queue, ring group)
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🎧 Caller Experience</b></p>
                <ul>
                  <li><b>🎵 Music on Hold</b><br />
                    Keeps caller engaged while waiting.<br />
                    Can use custom playlists or default MOH.
                  </li>
                  <li><b>🗣️ Announce Position / Hold Time</b><br />
                    Tells the caller their position in line or estimated wait time.<br />
                    Optional and configurable.
                  </li>
                  <li><b>📢 Periodic Announcements</b><br />
                    Audio files played every X seconds to reassure or inform callers
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>💬 Agent Experience</b></p>
                <ul>
                  <li><b>🔔 Agent Timeout</b><br />
                    How long to ring an agent before trying the next
                  </li>
                  <li><b>↩️ Agent Wrap-Up Time</b><br />
                    Pause before agent gets another call (useful for after-call work)
                  </li>
                  <li><b>🚫 Skip Busy Agents</b><br />
                    If enabled, agents already on a call won’t be tried
                  </li>
                  <li><b>📲 Call Confirm</b><br />
                    For external agents (e.g., cell phones), prompts “Press 1 to accept this call”
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🧪 Example Call Flow</b></p>
                <ul>
                  <li>Inbound Route for DID 2485551000</li>
                  <li>Routes to Time Condition (open vs closed)</li>
                  <li>If open → Queue 600 (Support)</li>
                  <li>If no agent answers in 45 sec → Voicemail</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>📈 Queue Reporting & Monitoring</b></p>
                <ul>
                  <li><b>Built-in Tools:</b></li>
                  <li>Reports → Asterisk Info / Queues: See live agent status and queue load</li>
                  <li>UCP / FOP2 / Queues Pro (Commercial): Advanced dashboards</li>
                  <li>CDR/CEL Logs: Show queue entry and exit times</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔐 Advanced Features (Commercial Modules)</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Feature</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Requires Commercial Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Agent pause codes</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes (Queue Pro)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Wallboard/dashboard</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes (Queue Wallboard)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>SLA stats and alerts</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes (Queue Pro)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Advanced failover logic</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Real-time supervisor tools</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>✅ Best Practices</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Tip</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use rrmemory or leastrecent for fair call distribution</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Prevents burnout or idle agents</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Add periodic announcements</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Keeps callers engaged and less likely to hang up</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Enable agent wrap-up</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Prevents agents from being overwhelmed</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Set a failover destination</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Avoids infinite hold times</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Monitor live stats</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Quickly respond to spikes in call volume</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>📚 Example Config: Support Queue</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Setting</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Queue Number</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>600</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Queue Name</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Support</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Static Agents</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>101, 102, 103</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Ring Strategy</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>leastrecent</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Max Wait Time</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>300 sec</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Failover</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Voicemail box 600</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Music on Hold</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>&quot;TechHoldMix&quot;</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Announce Position</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Yes</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Periodic Announcement</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Every 45 seconds</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Agent Timeout</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>25 sec</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Wrap-Up</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>10 sec</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li><b>Time Conditions</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>⏰ What is a Time Condition?</b><br />
                  A Time Condition is a logic object that checks the current time against a defined schedule (called a Time Group), and routes the call accordingly.<br />
                  It functions like an IF/ELSE statement:<br />
                  <span style={{ display: 'block', margin: '8px 0 0 16px', fontFamily: 'monospace', whiteSpace: 'pre' }}>IF current time matches time group → send call to Destination A
ELSE → send call to Destination B</span>
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>🧩 Key Components</b></p>
                <ol style={{ margin: '0 0 8px 0' }}>
                  <li><b>Time Group</b><br />
                    A reusable schedule definition that includes:
                    <ul>
                      <li>Days of the week</li>
                      <li>Time ranges (e.g., 9:00 AM–5:00 PM)</li>
                      <li>Specific dates or months (e.g., holidays)</li>
                      <li>Combinations of the above</li>
                    </ul>
                    You can create multiple time groups in:<br />
                    <b>Admin → Time Groups</b>
                  </li>
                  <li><b>Time Condition</b><br />
                    A logic block that uses a Time Group to make routing decisions.<br />
                    Configure in: <b>Admin → Time Conditions</b><br />
                    <b>Main Fields:</b>
                    <table style={{ borderCollapse: 'collapse', margin: '8px 0' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Field</th>
                          <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Time Condition Name</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Label (e.g., "Open Hours Routing")</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Time Group</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>The schedule to evaluate (e.g., “Office Hours”)</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Destination if time matches</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Where the call goes during matching hours</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Destination if time does not match</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Where the call goes outside of those hours</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Optional Call Flow Toggle Feature Code</td>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Lets you override the logic manually</td>
                        </tr>
                      </tbody>
                    </table>
                  </li>
                </ol>
                <p style={{ margin: '0 0 8px 0' }}><b>📞 Common Use Case Examples</b></p>
                <ul>
                  <li><b>🏢 Business Hours Routing</b><br />
                    <table style={{ borderCollapse: 'collapse', margin: '8px 0' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Time Group: “Business Hours”</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Mon–Fri | 9:00 AM – 5:00 PM</td>
                        </tr>
                      </tbody>
                    </table>
                    Time Condition: “Main Line Logic”<br />
                    If in business hours → go to IVR<br />
                    If outside hours → go to after-hours voicemail or announcement
                  </li>
                  <li><b>🎄 Holiday Routing</b><br />
                    Create a “Holiday Dates” time group:<br />
                    Add dates: Dec 25, Jan 1, etc.<br />
                    Time Condition: "Holiday Check"<br />
                    If date matches → route to "We're closed" announcement<br />
                    Else → go to normal hours logic<br />
                    <span style={{ display: 'block', margin: '8px 0 0 8px', fontFamily: 'monospace', whiteSpace: 'pre' }}>Inbound Route → Time Condition (Holiday Check)
  → If YES → Holiday Announcement
  → If NO → Time Condition (Office Hours)
       → If YES → Ring Group
       → If NO → After Hours Voicemail</span>
                  </li>
                  <li><b>⌨️ Manual Override</b><br />
                    Time Conditions optionally support a feature code (like *271):<br />
                    Allows users to toggle the logic manually (e.g., early closure)<br />
                    Can be tied to a BLF button on phones (shows red/green status)
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔁 Real-World Examples</b></p>
                <ul>
                  <li><b>Example 1: Office Line with Voicemail Failover</b><br />
                    Time Group: Mon–Fri, 9–5<br />
                    Time Condition:<br />
                    <span style={{ display: 'block', margin: '8px 0 0 16px', fontFamily: 'monospace', whiteSpace: 'pre' }}>Match: Ring Group 600
No Match: Voicemail 600</span>
                  </li>
                  <li><b>Example 2: Lunch Break Routing</b><br />
                    Time Group: Mon–Fri, 12:00–1:00 PM<br />
                    Time Condition:<br />
                    <span style={{ display: 'block', margin: '8px 0 0 16px', fontFamily: 'monospace', whiteSpace: 'pre' }}>Match: Play "We’re at lunch" announcement
No Match: Normal IVR</span>
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>✅ Best Practices</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Tip</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Name time groups descriptively</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Easier to manage multiple schedules</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use layered logic</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Stack holiday, open/close, and lunch conditions</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use override feature codes</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Staff can toggle logic without admin access</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use separate conditions for holidays</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Avoids disrupting normal hours logic</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Add BLF buttons for toggles</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Visually monitor and control routing state</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>🛠 Time Condition vs. Time Group (Quick Summary)</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Feature</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Time Group</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Time Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Stores schedule data</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>✅</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>❌</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Makes routing decisions</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>❌</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>✅</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Can be reused across multiple flows</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>✅</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>❌</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Uses IF/ELSE logic</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>❌</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
            <li><b>Announcements</b><br />
              <div style={{ margin: '12px 0 0 0', padding: '0 0 0 8px', borderLeft: '3px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 8px 0' }}><b>📣 What is an Announcement?</b><br />
                  An Announcement is a module in FreePBX that:<br />
                  <ul>
                    <li>Plays a pre-recorded message (audio file)</li>
                    <li>Then routes the call to another destination</li>
                  </ul>
                  There’s no user interaction during the announcement — it’s just informational playback before the call proceeds.
                </p>
                <p style={{ margin: '0 0 8px 0' }}><b>🧩 Where to Configure</b></p>
                <ul>
                  <li>FreePBX GUI: <b>Applications → Announcements</b></li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔧 Key Settings</b></p>
                <table style={{ borderCollapse: 'collapse', margin: '8px 0' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Field</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Announcement Name</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Internal label (e.g., “Office Closed Notice”)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Recording</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>The audio file to play (choose from system recordings or upload)</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Allow Skip</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>If enabled, the caller can press # to skip the message</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Repeat Message</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Replays the message before moving on</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Return to IVR</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>If the call came from an IVR, you can return the caller back to it</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Destination after Playback</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Where to send the call next (e.g., extension, IVR, voicemail)</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>🎙 Recording the Audio</b></p>
                <ul>
                  <li>Upload .wav or .mp3 files in <b>Admin → System Recordings</b></li>
                  <li>Record from an extension using <b>*77</b></li>
                  <li>Use Text-to-Speech (via third-party services) to generate audio</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>📞 Common Use Cases</b></p>
                <ul>
                  <li><b>🕗 After-Hours Message</b><br />
                    “Thank you for calling. Our office is currently closed. Please leave a message after the tone.”<br />
                    <b>Destination:</b> Voicemail
                  </li>
                  <li><b>📦 Shipping or Info Update</b><br />
                    “Due to inclement weather, shipping may be delayed.”<br />
                    <b>Destination:</b> Ring Group or Queue
                  </li>
                  <li><b>🚫 Call Blocking / Spam Handling</b><br />
                    “This number does not accept unsolicited calls.” → hang up<br />
                    <b>Destination:</b> Terminate Call → Hang Up
                  </li>
                  <li><b>🔁 Loop Back to IVR</b><br />
                    “Please listen carefully to our new menu options.”<br />
                    <b>Destination:</b> Return to IVR
                  </li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🔁 Integrated Call Flows</b></p>
                <span style={{ display: 'block', margin: '8px 0 0 8px', fontFamily: 'monospace', whiteSpace: 'pre' }}>Inbound Route (DID: 2485551234)
  ↓
Time Condition (if outside business hours)
  ↓
Announcement: “We are closed.”
  ↓
Voicemail box</span>
                <p style={{ margin: '0 0 8px 0' }}><b>🛠 Tips for Using Announcements</b></p>
                <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Tip</th>
                      <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#f7fbff' }}>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Keep messages short</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Avoid frustrating callers</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Enable skip (#) for long messages</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Allows faster navigation</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use professional recordings</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Enhances credibility</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Test playback volume</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Avoid distortion or silence</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Use announcements before IVRs</td>
                      <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>Sets context for menu options</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ margin: '0 0 8px 0' }}><b>✅ Best Practices</b></p>
                <ul>
                  <li>Use consistent naming: Name your recordings and announcements clearly (e.g., after_hours_greeting.wav, HolidayNotice2025)</li>
                  <li>Segment announcements: Break long messages into reusable pieces (e.g., generic closure message + department-specific routing)</li>
                  <li>Use return to IVR carefully: Prevent loops by confirming the call originated from an IVR</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><b>🧠 Related Modules</b></p>
                <ul>
                  <li><b>System Recordings:</b> Where audio files are created or uploaded</li>
                  <li><b>IVRs:</b> Announcements are often used before or inside menus</li>
                  <li><b>Time Conditions:</b> Direct callers to announcements based on time or date</li>
                </ul>
              </div>
            </li>
            <li><b>IVR (Interactive Voice Response)</b><br />
              Menu system for callers.
              <ul>
                <li>“Press 1 for Sales, 2 for Support”</li>
                <li>DTMF input routes to extensions, queues, announcements, etc.</li>
                <li>Can be nested and time-based.</li>
              </ul>
            </li>
            <li><b>Find Me/Follow Me vs Miscellaneous Destinations</b><br />
              <ul>
                <li><b>Find Me/Follow Me:</b> Per-extension forwarding to ring external numbers (e.g., cell phone) in order or simultaneously.</li>
                <li><b>Miscellaneous Destinations:</b> Allows routing to external numbers or special dial strings (e.g., analog door phones).</li>
              </ul>
            </li>
            <li><b>Trunks</b><br />
              Trunks connect your PBX to the outside world.
              <ul>
                <li>SIP/IAX2/PRI</li>
                <li>Outbound and Inbound calls flow through trunks</li>
                <li>Must be configured with your provider’s details</li>
              </ul>
            </li>
            <li><b>Dial Plans & Outbound Routes</b><br />
              <ul>
                <li><b>Dial Plan:</b> Rules that match user dialed numbers (e.g., 9|1NXXNXXXXXX to strip 9 and dial 11-digit US).</li>
                <li><b>Outbound Routes:</b> Routes based on dialed pattern → send to correct trunk.</li>
                <li>Can apply caller ID masking, failover trunks, and PIN codes.</li>
              </ul>
            </li>
            <li><b>Paging & Intercom</b><br />
              <ul>
                <li><b>Paging:</b> One-way audio broadcast to multiple phones.</li>
                <li><b>Intercom:</b> Two-way communication using auto-answer.</li>
                <li>Useful for overhead announcements or internal alerts.</li>
              </ul>
            </li>
            <li><b>User Management</b><br />
              <ul>
                <li>Create User Portal (ARI/UCP) logins for voicemail, call logs, recordings.</li>
                <li>Permissions determine what features users can access (e.g., fax, call control).</li>
              </ul>
            </li>
            <li><b>Administrators</b><br />
              <ul>
                <li>Web GUI admins for FreePBX</li>
                <li>Create multiple admin accounts with role-based access control</li>
                <li>"Admin", "Superadmin", or custom groups</li>
              </ul>
            </li>
            <li><b>Asterisk CLI</b><br />
              Command-line interface to the Asterisk core (not FreePBX GUI).
              <ul>
                <li>Use <code>asterisk -rvvv</code> to connect</li>
                <li>Commands: <code>sip show peers</code>, <code>core show calls</code>, <code>dialplan show</code>, <code>reload</code></li>
              </ul>
            </li>
            <li><b>System Admin</b><br />
              Commercial module (or installed on FreePBX Distro):
              <ul>
                <li>Configure network settings, hostname, timezone, updates, etc.</li>
                <li>Includes firewall, intrusion detection, backup</li>
              </ul>
            </li>
            <li><b>CDR (Call Detail Records)</b><br />
              <ul>
                <li>Logs of all calls: date, duration, source/destination, disposition</li>
                <li>Viewable from GUI</li>
                <li>Useful for call reporting and troubleshooting</li>
              </ul>
            </li>
            <li><b>CEL (Call Event Logging)</b><br />
              <ul>
                <li>More granular than CDR</li>
                <li>Logs every event in a call (ring, answer, transfer, hangup)</li>
                <li>Must be enabled and used with caution due to size</li>
              </ul>
            </li>
            <li><b>Asterisk Info</b><br />
              GUI access to real-time Asterisk stats:
              <ul>
                <li>SIP peers</li>
                <li>Registrations</li>
                <li>Channels</li>
                <li>System status</li>
              </ul>
            </li>
            <li><b>Voicemail Admin</b><br />
              <ul>
                <li>Set voicemail options globally or per-extension</li>
                <li>Control greeting behavior, PINs, email delivery</li>
                <li>Manage mailboxes centrally</li>
              </ul>
            </li>
            <li><b>Call Flow Control</b><br />
              <ul>
                <li>Manual override toggles (like a switchboard button)</li>
                <li>Used to change routing paths manually (e.g., switch between day/night mode)</li>
                <li>Can be tied to BLF buttons on phones</li>
              </ul>
            </li>
            <li><b>Parking</b><br />
              <ul>
                <li>Park a call (e.g., on “701”), then retrieve from another phone</li>
                <li>Parking lots can have timeouts and return destinations</li>
                <li>Advanced features in commercial module</li>
              </ul>
            </li>
            <li><b>Certificate Management</b><br />
              <ul>
                <li>Install SSL certificates for secure Web GUI and provisioning</li>
                <li>Supports Let's Encrypt auto-renewal</li>
                <li>Required for secure UCP and HTTPS provisioning</li>
              </ul>
            </li>
          </ul>
        </div>
      )}
      {pbxSubtab === 'UCaaS' && (
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 600 }}>UCaaS</h3>
          <p style={{ fontSize: 16 }}>Unified Communications as a Service. Refers to cloud-hosted PBX solutions (e.g., NetSapiens, Broadsoft, etc.). The app supports import/export of user, extension, and device data for common UCaaS platforms.</p>
          <ul style={{ fontSize: 16, marginBottom: 24 }}>
            <li>Use the VPBX Import/Export tab for UCaaS user/device data.</li>
          </ul>
        </div>
      )}
      {pbxSubtab === 'FusionPBX' && (
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 600 }}>FusionPBX</h3>
          <p style={{ fontSize: 16 }}>FusionPBX or similar multi-tenant PBX platforms. Import/export tools support Fusion CSV and table formats for users, devices, and BLFs.</p>
          <ul style={{ fontSize: 16, marginBottom: 24 }}>
            <li>Use the Stretto Import/Export tab for FusionPBX and similar platforms.</li>
          </ul>
        </div>
      )}
      {pbxSubtab === 'Intermedia' && (
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 600 }}>Intermedia</h3>
          <p style={{ fontSize: 16 }}><b>Coming soon:</b> Intermedia PBX platform support will be announced and added in a future update.</p>
        </div>
      )}
    </div>
  );
}

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
      {/* Subtab content */}
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
        {referenceSubtab === 'pbx' && <PBXReferenceSubnav />}
      </div>
    </div>
  );
};

export default Reference;