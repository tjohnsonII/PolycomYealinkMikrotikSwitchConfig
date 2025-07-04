

import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>{title}</h2>
    {children}
  </section>
);

const PBXReference: React.FC = () => (
  <div style={{ width: '100%', textAlign: 'left', maxWidth: 900, margin: '0 auto' }}>
    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>FreePBX Reference</h1>

    {/* Inbound Routes */}
    <Section title="Inbound Routes">
      <p>Inbound Routes control how FreePBX handles incoming calls from external sources — usually via SIP trunks. These routes match on one or more conditions (like the dialed number or caller ID), and then send the call to a destination like:</p>
      <ul>
        <li>An extension</li>
        <li>A ring group</li>
        <li>An IVR</li>
        <li>A queue</li>
        <li>A time condition</li>
        <li>Voicemail</li>
        <li>A custom destination</li>
      </ul>
      <h3>Match Criteria</h3>
      <ul>
        <li><b>DID Number:</b> The DID is the phone number dialed by the outside caller. When a call hits your trunk, FreePBX looks at this field to determine the route. You can leave it blank to match all DIDs, enter a full 10- or 11-digit number, or use partial matches/wildcards (like _248555XXXX).</li>
        <li><b>Caller ID Number:</b> Matches based on the incoming caller's number. Used for special cases like VIP routing or blocking known spam callers. Can be exact match or patterns (e.g., 248555% for area code filtering).</li>
      </ul>
      <h3>Key Configuration Options</h3>
      <ul>
        <li><b>Description:</b> Internal label (e.g., Main Line, Sales DID, After Hours Route)</li>
        <li><b>Set Destination:</b> Choose where to send the call: Extension, ring group, IVR, announcement, etc.</li>
        <li><b>Alert Info:</b> Sends custom alert to phones (e.g., different ring tone). Yealink/Polycom can use this for distinctive ring tones.</li>
        <li><b>CID Lookup Source:</b> Automatically performs a reverse lookup (e.g., caller name) from a CNAM provider</li>
        <li><b>Recording Options:</b> Record the call from this point forward. Override global settings.</li>
        <li><b>Privacy Manager:</b> Forces anonymous callers to enter their number. Useful for blocking spam or anonymous calls.</li>
      </ul>
      <h3>Time-Based Routing (Using Time Conditions)</h3>
      <ul>
        <li>Route differently during business hours vs. after hours</li>
        <li>Set holiday-specific routes</li>
        <li>Combine with Call Flow Control for manual overrides</li>
      </ul>
      <h3>Example</h3>
      <p>Inbound Route (DID: 2485551234) → Time Condition → If open → IVR, If closed → Voicemail</p>
      <h3>Real-World Examples</h3>
      <ul>
        <li><b>Standard Routing:</b> DID 2485551234 → Rings extension 1001</li>
        <li><b>IVR Menu:</b> DID 2485552000 → Goes to main IVR menu for call routing</li>
        <li><b>After-Hours Message:</b> All calls → Play announcement: "Our office is currently closed"</li>
        <li><b>Dispatch Failover:</b> Known caller ID 5865551100 → Ring mobile backup number via Misc Destination</li>
        <li><b>VIP Routing:</b> Caller ID 2485555555 → Direct to management's ring group</li>
      </ul>
      <h3>Advanced Use Cases</h3>
      <ul>
        <li>Combine multiple inbound routes with overlapping DIDs for layered routing logic.</li>
        <li>Set specific Caller ID entries for numbers that bypass menus and go directly to agents.</li>
        <li>Create "Catch-All" route with blank DID/CID to handle unrecognized calls as a fallback.</li>
        <li>Use Inbound Routes → Time Condition → Call Flow Control for dynamic routing via BLF.</li>
      </ul>
      <h3>Tips for Managing Inbound Routes</h3>
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
    </Section>

    {/* Firewall */}
    <Section title="Firewall">
      <p>The FreePBX Firewall filters traffic by source IP address and port, organizes access via zones (internal, external, trusted, etc.), and automatically blocks threats and scanning attempts (via Fail2Ban). It allows or denies access to services like Web GUI, SSH, SIP/PJSIP, UCP, Zulu, REST API, etc. It works hand-in-hand with <b>iptables</b> (on Linux) and can be customized to protect a local system, cloud PBX, or hybrid deployment.</p>
      <h3>Firewall Zones (Core Concept)</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr>
            <th>Zone</th><th>Description</th><th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Trusted</td><td>Full access, no restrictions</td><td>LAN, VPN peers, known public IPs</td></tr>
          <tr><td>Local</td><td>Only for services running on the system (loopback)</td><td>127.0.0.1</td></tr>
          <tr><td>Internal</td><td>Allows PBX services (phones, UCP, etc.)</td><td>Office subnets</td></tr>
          <tr><td>External</td><td>Blocked by default, can whitelist services</td><td>Internet, unknown IPs</td></tr>
          <tr><td>Other</td><td>Catch-all zone for unclassified traffic</td><td>Used for alerts/monitoring</td></tr>
          <tr><td>Blacklist</td><td>Permanently banned IPs</td><td>Malicious traffic, SIP scanners</td></tr>
        </tbody>
      </table>
      <h3>Services Controlled by Firewall</h3>
      <ul>
        <li>Web Interface (Admin, UCP): HTTP/HTTPS access to FreePBX GUI</li>
        <li>SIP/PJSIP: Call signaling ports (usually UDP 5060, 5160)</li>
        <li>RTP Media: Voice traffic (UDP ports 10000–20000 by default)</li>
        <li>SSH: Secure shell for remote access</li>
        <li>REST API / AMI: Used by advanced applications or external integrations</li>
        <li>Responsive Firewall: Dynamically adjusts rules based on traffic</li>
      </ul>
      <h3>Responsive Firewall</h3>
      <p>This feature allows remote phones or clients to connect dynamically: Accepts new connections temporarily, uses SIP registration attempts to whitelist the IP, and if registration is successful, the IP is added to the Internal zone for a limited time. Supports PJSIP, IAX, and SIP transport. <b>Use Case:</b> Remote Yealink or Bria softphone connects from home IP, gets added automatically.</p>
      <h3>Intrusion Detection (Fail2Ban)</h3>
      <ul>
        <li>Monitors logs for brute-force attempts (SIP, SSH, web logins)</li>
        <li>Automatically bans IPs after too many failed attempts</li>
        <li>Ban time and retry limits are configurable</li>
        <li>Logs can be viewed in /var/log/fail2ban.log</li>
      </ul>
      <h3>Configuration Tabs</h3>
      <ul>
        <li><b>Status:</b> Current firewall mode: Enabled/Disabled/Testing. Summary of running services and zones.</li>
        <li><b>Interfaces:</b> Classify each network interface (e.g., eth0) as Trusted / Internal / External. Typically: WAN = External, LAN = Internal.</li>
        <li><b>Networks:</b> Whitelist or blacklist specific IPs or ranges. Add remote offices, admin IPs, or mobile networks here.</li>
        <li><b>Services:</b> Toggle allowed services (per zone). Select which zones can access SIP, HTTP, SSH, etc.</li>
        <li><b>Advanced:</b> Adjust default ports, modify fail2ban ban times, manage logs and performance settings.</li>
      </ul>
      <h3>Best Practices</h3>
      <ul>
        <li>Whitelist your management IPs (under "Networks")</li>
        <li>Set your LAN interfaces to Trusted or Internal</li>
        <li>Disable unnecessary services (e.g., Web UI over WAN)</li>
        <li>Use Responsive Firewall for remote phones</li>
        <li>Monitor intrusion logs and adjust thresholds as needed</li>
        <li>Use secure SIP passwords and avoid predictable extensions</li>
      </ul>
      <h3>Common Troubleshooting Tips</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Symptom</th><th>Possible Cause</th><th>Fix</th></tr>
        </thead>
        <tbody>
          <tr><td>Remote phones can't register</td><td>IP not whitelisted or responsive firewall not working</td><td>Use Responsive mode or manually allow IP</td></tr>
          <tr><td>GUI unreachable from remote</td><td>Web access not allowed for External zone</td><td>Temporarily move IP to Trusted zone</td></tr>
          <tr><td>Calls fail or drop</td><td>RTP ports not allowed through firewall/NAT</td><td>Allow UDP 10000–20000 and ensure correct NAT setup</td></tr>
          <tr><td>Fail2Ban too aggressive</td><td>False positives from SIP scanners</td><td>Adjust ban time or retry limit in Advanced settings</td></tr>
        </tbody>
      </table>
    </Section>

    {/* Extensions */}
    <Section title="Extensions">
      <p>An extension in FreePBX represents a user endpoint on the phone system — usually a physical phone, a softphone, or a device that registers via SIP or PJSIP. You assign a unique number (like 101, 202, etc.) to each extension. That number becomes the internal "phone number" for that device or user.</p>
      <h3>Protocol Types (PJSIP)</h3>
      <ul>
        <li>PJSIP (recommended for new deployments): Modern protocol stack, supports multiple registrations (e.g., multiple devices per user)</li>
      </ul>
      <h3>Common Extension Settings</h3>
      <ul>
        <li><b>User Extension:</b> The internal number (e.g., 1001). Unique across the system.</li>
        <li><b>Display Name:</b> Human-friendly label (e.g., John Smith). Appears on devices and in FreePBX GUI.</li>
        <li><b>Secret / Password:</b> SIP/PJSIP registration password. Should be long and secure (randomized).</li>
        <li><b>Voicemail Settings:</b> Enable/disable, email delivery (with or without attachment), greeting preferences, VMX Locater (press-to-redirect options while caller is in voicemail).</li>
        <li><b>CID Options:</b> Outbound CID controls what caller ID is presented when this extension calls out. Can override trunk-level CID with format: “John Smith” &lt;2485551234&gt;.</li>
        <li><b>Device Options:</b> NAT (enable for devices behind NAT/firewalls), DTMF Mode (typically RFC2833 or Auto), Transport (UDP / TCP / TLS for SIP signaling).</li>
        <li><b>Advanced Settings:</b> Call recording (always, never, on-demand), language code (for system prompts), codec preferences (e.g., G722, ulaw, alaw, G729), Qualify/Keepalive (ensures phone is reachable).</li>
      </ul>
      <h3>Features Tied to Extensions</h3>
      <ul>
        <li>Find Me/Follow Me: Enable follow-me behavior for calls to this extension. Ring internal and external numbers sequentially or simultaneously.</li>
        <li>Call Recording: On-demand or always-record per extension. Saved in /var/spool/asterisk/monitor.</li>
        <li>Call Forwarding: Forward all/busy/unavailable to another extension, external number, or voicemail.</li>
        <li>Call Waiting / Call Screening / Call Announce: Fine-grained controls over how additional calls are handled. Can require caller to say their name before connecting.</li>
        <li>Voicemail to Email: Email notifications of new voicemails. Attachments and delete-after-send options.</li>
        <li>User Control Panel (UCP): If enabled, users can listen to voicemail, review call history, manage recordings, adjust Find Me/Follow Me, send/receive faxes (if enabled), chat (with commercial modules). Users log into UCP via the FreePBX web interface using their extension number and user password.</li>
      </ul>
      <h3>Registration: How Phones Connect</h3>
      <ul>
        <li>Username: The extension number (e.g., 1001)</li>
        <li>Password: The SIP/PJSIP secret</li>
        <li>Server: IP or FQDN of the FreePBX system</li>
        <li>Port: Typically 5060 (UDP for SIP, or 5061 for TLS/PJSIP)</li>
      </ul>
      <p>Once registered, the device can receive calls directly, make internal and outbound calls, and use BLFs and other features.</p>
      <h3>Extension States</h3>
      <ul>
        <li>Idle: Available for calls</li>
        <li>In Use: On a call</li>
        <li>Ringing: Incoming call</li>
        <li>Unavailable: Unregistered or not reachable</li>
      </ul>
      <p>These states are used by BLF lights and call center logic.</p>
      <h3>Use Cases</h3>
      <ul>
        <li>Personal devices (e.g., desk phones)</li>
        <li>Softphones (e.g., Zoiper, Bria, Linphone)</li>
        <li>Remote users (via VPN or NAT-aware SIP)</li>
        <li>Call groups (used with ring groups/queues)</li>
      </ul>
    </Section>

    {/* Ring Groups */}
    <Section title="Ring Groups">
      <p>A Ring Group is a way to ring multiple extensions simultaneously or in sequence when a call is received. It’s typically used to reach a department, team, or group of phones (e.g., Sales, Support, Reception). Think of it as a mini broadcast system for inbound or internal calls.</p>
      <h3>Common Use Cases</h3>
      <ul>
        <li>Ring all front desk phones at once</li>
        <li>Call a group of remote support reps in order</li>
        <li>Overflow logic: ring extension 100 for 10 seconds, then ring 101 and 102</li>
        <li>Combine with Inbound Routes, IVRs, or Queues</li>
      </ul>
      <h3>Core Configuration Options</h3>
      <ul>
        <li><b>Ring-Group Number:</b> The internal number to dial this group (e.g., 600). Can also be a destination for Inbound Routes or IVRs.</li>
        <li><b>Group Description:</b> Label to identify purpose (e.g., Sales Team, Tech Support)</li>
        <li><b>Extension List:</b> Add one or more extensions or external numbers (e.g., 100, 101, 2485551234#). Use # at the end of external numbers.</li>
        <li><b>Ring Strategy:</b> Controls how the phones ring: ringall (all at once), hunt (one at a time in order), memoryhunt (one, then add the next, etc.), firstavailable (first free extension), random (randomized order)</li>
        <li><b>Ring Time:</b> How long to ring this group (in seconds) before trying the next destination</li>
        <li><b>Destination if No Answer:</b> Where to send the call if no one answers (e.g., voicemail, another ring group, queue)</li>
      </ul>
      <h3>Additional Features</h3>
      <ul>
        <li><b>CID Name Prefix:</b> Adds a prefix to the caller ID on phones in the group. Example: Sales: makes incoming CID show as Sales:2485551212</li>
        <li><b>Ignore CF Settings:</b> Ignore individual extensions' call forwarding (recommended for group integrity)</li>
        <li><b>Disable Call Forwarding:</b> Prevent users from forwarding group calls to external destinations</li>
        <li><b>Enable Call Confirmation:</b> Required when calling external numbers (e.g., cell phones). Prompts remote user to "Press 1 to accept the call"</li>
        <li><b>Remote Announce / Too-Late Announce:</b> Audio prompts played to external users when they answer</li>
      </ul>
      <h3>Best Practices</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use CID Prefixes</td><td>Helps staff know what type of call it is</td></tr>
          <tr><td>Use Call Confirm on external numbers</td><td>Prevents calls from hitting personal voicemail</td></tr>
          <tr><td>Limit Ring Time</td><td>Avoids long ringing and faster failover</td></tr>
          <tr><td>Document each group’s role</td><td>Keeps your call flow organized</td></tr>
          <tr><td>Avoid loops</td><td>Don’t send a failed call back into the same group</td></tr>
        </tbody>
      </table>
      <h3>Ring Groups vs. Queues</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Feature</th><th>Ring Group</th><th>Queue</th></tr>
        </thead>
        <tbody>
          <tr><td>Call distribution</td><td>Simultaneous/sequential</td><td>Rules-based (round robin, etc.)</td></tr>
          <tr><td>Music on hold</td><td>No</td><td>Yes</td></tr>
          <tr><td>Caller position</td><td>No</td><td>Yes</td></tr>
          <tr><td>Agent login/logout</td><td>No</td><td>Yes</td></tr>
          <tr><td>Ideal for</td><td>Small teams, simple routing</td><td>Call centers, advanced control</td></tr>
        </tbody>
      </table>
    </Section>

    {/* Queues */}
    <Section title="Queues">
      <p>A Queue is a structured call-holding system in FreePBX. When callers enter a queue, they wait on hold until an available agent can answer. Calls are distributed based on defined strategies (e.g., round robin, least recent). Agents can log in/out of queues manually or dynamically. You can provide music on hold, caller position, and estimated wait time.</p>
      <h3>Core Queue Settings</h3>
      <ul>
        <li><b>Queue Number:</b> Internal extension number for the queue (e.g., 600)</li>
        <li><b>Queue Name:</b> Label that appears in reports and agent displays (e.g., Support Line, Billing Queue)</li>
        <li><b>Static Agents:</b> Predefined list of extensions (always part of the queue)</li>
        <li><b>Dynamic Agents:</b> Agents log in/out with feature codes (e.g., *45)</li>
      </ul>
      <h3>Call Distribution Strategy</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Strategy</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>ringall</td><td>Ring all agents simultaneously</td></tr>
          <tr><td>rrmemory</td><td>Round-robin with memory (next agent after last one)</td></tr>
          <tr><td>leastrecent</td><td>Agent who hasn’t taken a call in the longest time</td></tr>
          <tr><td>fewestcalls</td><td>Agent who has taken the fewest calls</td></tr>
          <tr><td>random</td><td>Random agent</td></tr>
          <tr><td>rrordered</td><td>Strict round-robin in order listed</td></tr>
        </tbody>
      </table>
      <h3>Caller Experience</h3>
      <ul>
        <li>Music on Hold: Keeps caller engaged while waiting. Can use custom playlists or default MOH.</li>
        <li>Announce Position / Hold Time: Tells the caller their position in line or estimated wait time. Optional and configurable.</li>
        <li>Periodic Announcements: Audio files played every X seconds to reassure or inform callers</li>
      </ul>
      <h3>Agent Experience</h3>
      <ul>
        <li>Agent Timeout: How long to ring an agent before trying the next</li>
        <li>Agent Wrap-Up Time: Pause before agent gets another call (useful for after-call work)</li>
        <li>Skip Busy Agents: If enabled, agents already on a call won’t be tried</li>
        <li>Call Confirm: For external agents (e.g., cell phones), prompts “Press 1 to accept this call”</li>
      </ul>
      <h3>Best Practices</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use rrmemory or leastrecent for fair call distribution</td><td>Prevents burnout or idle agents</td></tr>
          <tr><td>Add periodic announcements</td><td>Keeps callers engaged and less likely to hang up</td></tr>
          <tr><td>Enable agent wrap-up</td><td>Prevents agents from being overwhelmed</td></tr>
          <tr><td>Set a failover destination</td><td>Avoids infinite hold times</td></tr>
          <tr><td>Monitor live stats</td><td>Quickly respond to spikes in call volume</td></tr>
        </tbody>
      </table>
    </Section>

    {/* Time Conditions */}
    <Section title="Time Conditions">
      <p>A Time Condition is a logic object that checks the current time against a defined schedule (called a Time Group), and routes the call accordingly. It functions like an IF/ELSE statement: IF current time matches time group → send call to Destination A ELSE → send call to Destination B.</p>
      <h3>Key Components</h3>
      <ul>
        <li><b>Time Group:</b> A reusable schedule definition that includes days of the week, time ranges, specific dates or months, or combinations. You can create multiple time groups in Admin → Time Groups.</li>
        <li><b>Time Condition:</b> A logic block that uses a Time Group to make routing decisions. Configure in: Admin → Time Conditions.</li>
      </ul>
      <h3>Main Fields</h3>
      <ul>
        <li><b>Time Condition Name:</b> Label (e.g., "Open Hours Routing")</li>
        <li><b>Time Group:</b> The schedule to evaluate (e.g., “Office Hours”)</li>
        <li><b>Destination if time matches:</b> Where the call goes during matching hours</li>
        <li><b>Destination if time does not match:</b> Where the call goes outside of those hours</li>
        <li><b>Optional Call Flow Toggle Feature Code:</b> Lets you override the logic manually</li>
      </ul>
      <h3>Common Use Case Examples</h3>
      <ul>
        <li>Business Hours Routing: Time Group: “Business Hours” (Mon–Fri | 9:00 AM – 5:00 PM). If in business hours → go to IVR. If outside hours → go to after-hours voicemail or announcement.</li>
        <li>Holiday Routing: Create a “Holiday Dates” time group. If date matches → route to "We're closed" announcement. Else → go to normal hours logic.</li>
        <li>Manual Override: Time Conditions optionally support a feature code (like *271): Allows users to toggle the logic manually (e.g., early closure). Can be tied to a BLF button on phones (shows red/green status).</li>
      </ul>
      <h3>Best Practices</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Name time groups descriptively</td><td>Easier to manage multiple schedules</td></tr>
          <tr><td>Use layered logic</td><td>Stack holiday, open/close, and lunch conditions</td></tr>
          <tr><td>Use override feature codes</td><td>Staff can toggle logic without admin access</td></tr>
          <tr><td>Use separate conditions for holidays</td><td>Avoids disrupting normal hours logic</td></tr>
          <tr><td>Add BLF buttons for toggles</td><td>Visually monitor and control routing state</td></tr>
        </tbody>
      </table>
    </Section>

    {/* Announcements */}
    <Section title="Announcements">
      <p>An Announcement is a module in FreePBX that plays a pre-recorded message (audio file) and then routes the call to another destination. There’s no user interaction during the announcement — it’s just informational playback before the call proceeds.</p>
      <h3>Key Settings</h3>
      <ul>
        <li><b>Announcement Name:</b> Internal label (e.g., “Office Closed Notice”)</li>
        <li><b>Recording:</b> The audio file to play (choose from system recordings or upload)</li>
        <li><b>Allow Skip:</b> If enabled, the caller can press # to skip the message</li>
        <li><b>Repeat Message:</b> Replays the message before moving on</li>
        <li><b>Return to IVR:</b> After an invalid or timeout destination, return to this IVR</li>
        <li><b>Destination after Playback:</b> Where to send the call next (e.g., extension, IVR, voicemail)</li>
      </ul>
      <h3>Common Use Cases</h3>
      <ul>
        <li>After-Hours Message: “Thank you for calling. Our office is currently closed. Please leave a message after the tone.” Destination: Voicemail</li>
        <li>Shipping or Info Update: “Due to inclement weather, shipping may be delayed.” Destination: Ring Group or Queue</li>
        <li>Call Blocking / Spam Handling: “This number does not accept unsolicited calls.” → hang up. Destination: Terminate Call → Hang Up</li>
        <li>Loop Back to IVR: “Please listen carefully to our new menu options.” Destination: Return to IVR</li>
      </ul>
      <h3>Tips for Using Announcements</h3>
      <ul>
        <li>Keep messages short: Avoid frustrating callers</li>
        <li>Enable skip (#) for long messages: Allows faster navigation</li>
        <li>Use professional recordings: Enhances credibility</li>
        <li>Test playback volume: Avoid distortion or silence</li>
        <li>Use announcements before IVRs: Sets context for menu options</li>
      </ul>
    </Section>

    {/* IVR (Interactive Voice Response) */}
    <Section title="IVR (Interactive Voice Response)">
      <p>An IVR (Interactive Voice Response) is an automated phone menu that allows callers to press keys (DTMF) to navigate to different departments, people, or services. It's commonly known as a "press 1 for Sales, press 2 for Support" system.</p>
      <h3>What IVRs Do in FreePBX</h3>
      <ul>
        <li>Play an audio message (e.g., "Welcome to XYZ Company…")</li>
        <li>Let the caller press digits (0–9, *, #) to trigger actions</li>
        <li>Route the call to: Extensions, Queues, Ring groups, Announcements, Voicemail, Other IVRs (nested menus)</li>
      </ul>
      <h3>Core IVR Configuration</h3>
      <ul>
        <li><b>IVR Name:</b> Internal name (e.g., "Main Menu")</li>
        <li><b>Announcement:</b> The greeting audio (recorded file or uploaded)</li>
        <li><b>Enable Direct Dial:</b> Allows callers to dial extensions at any time</li>
        <li><b>Timeout:</b> How long to wait for input (in seconds)</li>
        <li><b>Invalid Retries:</b> How many times to let the caller retry after a wrong input</li>
        <li><b>Invalid Retry Recording:</b> What to play if they press an invalid option</li>
        <li><b>Timeout Destination:</b> Where to send the call if the caller does nothing</li>
        <li><b>Return to IVR:</b> After an invalid or timeout destination, return to this IVR</li>
        <li><b>Allow Key Press Events Early:</b> Accepts input even while audio is playing</li>
      </ul>
      <h3>IVR Entries (Options)</h3>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Key Press</th><th>Destination</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Sales Queue (600)</td></tr>
          <tr><td>2</td><td>Support Queue (601)</td></tr>
          <tr><td>3</td><td>Billing Ring Group (603)</td></tr>
          <tr><td>0</td><td>Operator Extension (100)</td></tr>
          <tr><td>*</td><td>Voicemail Box</td></tr>
        </tbody>
      </table>
      <h3>Tips for IVR Design</h3>
      <ul>
        <li>Limit to 3–5 options per IVR</li>
        <li>Make sure prompts clearly match the options</li>
        <li>Reuse audio recordings when possible (e.g., "Our office hours are...")</li>
        <li>Use CID name prefixing when routing calls through IVR to help agents identify menu origin</li>
      </ul>
    </Section>

    <Section title="Find Me/Follow Me vs Miscellaneous Destinations">
      <h3>Find Me/Follow Me</h3>
      <p>Find Me/Follow Me is a powerful call routing feature in FreePBX that allows per-extension call forwarding logic, often involving multiple numbers, devices, and time-based ringing strategies. It's ideal for mobile workers, remote staff, and anyone who needs calls to follow them beyond just their desk phone.</p>
      <h4>What is Find Me/Follow Me?</h4>
      <p>Find Me/Follow Me lets you define how an extension handles incoming calls, including:</p>
      <ul>
        <li>Ringing multiple internal and external numbers</li>
        <li>Ringing them in sequence or simultaneously</li>
        <li>Adding timeouts, delays, or confirmation prompts</li>
        <li>Fallback to voicemail or other destinations</li>
      </ul>
      <p>Essentially, it lets FreePBX try to “find” the user across multiple devices or numbers.</p>
      <h4>Where It’s Configured</h4>
      <ul>
        <li>From the GUI: <b>Applications → Extensions → [Select Extension] → Find Me/Follow Me</b></li>
        <li>Or via UCP (User Control Panel) if the user has permissions.</li>
      </ul>
      <h4>Key Settings</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Setting</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Enabled</td><td>Toggle to activate Follow Me for this extension</td></tr>
          <tr><td>Initial Ring Time</td><td>How long to ring the user's primary extension before trying others</td></tr>
          <tr><td>Follow-Me List</td><td>List of extensions or external numbers to ring (e.g., 100, 2485551234#)</td></tr>
          <tr><td>Ring Strategy</td><td>ringall or hunt</td></tr>
          <tr><td>Ring Time</td><td>How long to ring the follow-me numbers before failing over</td></tr>
          <tr><td>Destination if no answer</td><td>Where to go after all attempts fail (voicemail, announcement, etc.)</td></tr>
        </tbody>
      </table>
      <h4>Ring Strategy Options</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Strategy</th><th>Behavior</th></tr>
        </thead>
        <tbody>
          <tr><td>ringallv2</td><td>Ring all numbers simultaneously</td></tr>
          <tr><td>hunt</td><td>Ring each number in order, one at a time</td></tr>
        </tbody>
      </table>
      <h4>External Numbers</h4>
      <ul>
        <li>To add a cellphone or outside line: Use the format <b>2485551234#</b> (the # tells FreePBX it's an external number)</li>
      </ul>
      <h4>Call Confirm (Optional but Important!)</h4>
      <ul>
        <li>When calling external numbers, Call Confirm can be enabled:</li>
        <ul>
          <li>Prompts recipient to "Press 1 to accept this call"</li>
          <li>Prevents personal voicemail from catching the call</li>
          <li>Useful for mobile devices, call centers, or home phones</li>
        </ul>
      </ul>
      <h4>Call Flow Timing</h4>
      <p>A typical sequence might look like:</p>
      <ol>
        <li>Inbound Call to Extension 101</li>
        <li>Initial Ring: 10 seconds (extension 101 rings)</li>
        <li>Follow Me List: Ring 102 and 2485551111# for 20 seconds (with Call Confirm on external number)</li>
        <li>If no answer → Voicemail 101</li>
      </ol>
      <h4>Use Cases</h4>
      <ul>
        <li><b>Remote Staff / Hybrid Workers:</b> Ring desk phone for 10s → then ring mobile and home office</li>
        <li><b>Executives:</b> Ring assistant and executive lines at the same time</li>
        <li><b>Shared Devices:</b> Ring user's extension, alternate desk, and a mobile number</li>
        <li><b>Time-Based Routing (via Time Conditions):</b> Turn Find Me/Follow Me on or off based on time of day</li>
      </ul>
      <h4>Pitfalls to Avoid</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Pitfall</th><th>Solution</th></tr>
        </thead>
        <tbody>
          <tr><td>External call hits mobile voicemail</td><td>Enable Call Confirm</td></tr>
          <tr><td>Long delays between hops</td><td>Set appropriate ring times</td></tr>
          <tr><td>Call loops (e.g., calls forwarded back into PBX)</td><td>Use distinct external numbers and monitor destinations</td></tr>
          <tr><td>Overlapping with ring groups/queues</td><td>Use one method consistently to avoid confusion</td></tr>
        </tbody>
      </table>
      <h4>Permissions</h4>
      <ul>
        <li>Users can control their own settings from UCP</li>
        <li>Admins can configure globally via the Extensions module</li>
        <li>Feature codes like *21, *52, and *72 can interact with forwarding behavior (if enabled)</li>
      </ul>
      <h4>Related Concepts</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Feature</th><th>Relation</th></tr>
        </thead>
        <tbody>
          <tr><td>Ring Groups</td><td>Group routing, no time logic or confirmation</td></tr>
          <tr><td>Queues</td><td>Intelligent agent-based routing, for teams</td></tr>
          <tr><td>Time Conditions</td><td>Can toggle Follow Me paths based on schedule</td></tr>
          <tr><td>Misc Destinations</td><td>For sending to external numbers outside of Find Me/Follow Me logic</td></tr>
        </tbody>
      </table>
      <h4>Sample Configuration</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Initial Ring Time</td><td>8 seconds</td></tr>
          <tr><td>Follow-Me List</td><td>101, 2485551111#</td></tr>
          <tr><td>Ring Strategy</td><td>ringallv2</td></tr>
          <tr><td>Ring Time</td><td>20 seconds</td></tr>
          <tr><td>Call Confirm</td><td>Enabled on external</td></tr>
          <tr><td>No Answer Destination</td><td>Voicemail 101</td></tr>
        </tbody>
      </table>
      <h3>Miscellaneous Destinations</h3>
      <p>Allows routing to external numbers or special dial strings (e.g., analog door phones).</p>
    </Section>

    <Section title="Trunks">
      <h3>What is a Trunk?</h3>
      <p>In FreePBX, a trunk is a connection to an external VoIP service provider (or legacy PSTN carrier) that lets your system send and receive calls outside your PBX. Think of it like a virtual phone line that connects your internal extensions to the public telephone network.</p>
      <h4>Types of Trunks</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>SIP</td><td>Most common trunk type today. Uses the SIP protocol (UDP/TCP/TLS over IP)</td></tr>
          <tr><td>PJSIP</td><td>Modern SIP driver in Asterisk with better performance and flexibility</td></tr>
          <tr><td>IAX2</td><td>Asterisk-specific protocol (rare, used for PBX-to-PBX links)</td></tr>
          <tr><td>DAHDi (PRI/Analog)</td><td>Hardware trunks (T1, E1, FXO cards) for traditional telephony</td></tr>
        </tbody>
      </table>
      <h4>How Trunks Work with Inbound/Outbound Routing</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Direction</th><th>Uses</th></tr>
        </thead>
        <tbody>
          <tr><td>Inbound</td><td>Calls arrive from the trunk, and are matched to Inbound Routes</td></tr>
          <tr><td>Outbound</td><td>Calls placed by users/extensions are routed to a trunk, based on Outbound Routes and dial patterns</td></tr>
        </tbody>
      </table>
      <h4>Where to Configure</h4>
      <ul>
        <li>GUI Path: <b>Connectivity → Trunks</b></li>
      </ul>
      <h4>Key Configuration Settings</h4>
      <h5>General Settings</h5>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Trunk Name</td><td>Internal label (e.g., SIPStation, Twilio, Flowroute)</td></tr>
          <tr><td>Outbound CallerID</td><td>Sets caller ID for this trunk (can be overridden by outbound routes or extensions)</td></tr>
          <tr><td>CID Options</td><td>How to handle conflicting caller ID settings</td></tr>
          <tr><td>Maximum Channels</td><td>Limit concurrent calls through this trunk (optional)</td></tr>
        </tbody>
      </table>
      <h5>PJSIP Settings</h5>
      <ul>
        <li>Username / Password</li>
        <li>SIP Server (Domain/IP)</li>
        <li>Registration: Yes/No</li>
        <li>Authentication: Outbound or inbound</li>
        <li>Transport: UDP, TCP, TLS</li>
        <li>SIP Server Port: Usually 5060 or 5061</li>
      </ul>
      <h5>SIP Settings (legacy, chan_sip)</h5>
      <ul>
        <li>Used on port 5160 by default</li>
        <li>Similar fields, but placed in Outgoing Settings / Incoming Settings (peer/user details)</li>
        <li>Requires context=from-trunk, type=peer, host=providerIP format</li>
      </ul>
      <h5>Advanced Options</h5>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Use</th></tr>
        </thead>
        <tbody>
          <tr><td>Qualify</td><td>Enable SIP keepalives (checks trunk status)</td></tr>
          <tr><td>DTMF Mode</td><td>Often set to RFC2833</td></tr>
          <tr><td>Encryption (SRTP)</td><td>Secure media if supported</td></tr>
          <tr><td>Insecure settings</td><td>Used for trunking with some providers (e.g., insecure=port,invite)</td></tr>
        </tbody>
      </table>
      <h4>Inbound Calls</h4>
      <p>Trunks don’t determine where calls go — they simply deliver calls to FreePBX. Inbound Routes then match the DID (number called) and Caller ID, and send the call to an IVR, extension, queue, etc.</p>
      <h4>Outbound Calls</h4>
      <p>Outbound Routes choose which trunk to use, based on dialed number (via pattern match), priority of route, PIN codes or time conditions. You can have a primary trunk (e.g., SIPStation) and a secondary failover trunk (e.g., backup Twilio trunk).</p>
      <h4>Example: Twilio SIP Trunk (PJSIP)</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Trunk Name</td><td>Twilio_PJSIP</td></tr>
          <tr><td>Username</td><td>your_account</td></tr>
          <tr><td>Secret</td><td>your_password</td></tr>
          <tr><td>SIP Server</td><td>example.sip.twilio.com</td></tr>
          <tr><td>Registration</td><td>Yes</td></tr>
          <tr><td>Caller ID</td><td>+12485551234</td></tr>
          <tr><td>Transport</td><td>UDP (or TLS)</td></tr>
          <tr><td>Port</td><td>5060</td></tr>
        </tbody>
      </table>
      <h4>Troubleshooting Trunks</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Issue</th><th>Solution</th></tr>
        </thead>
        <tbody>
          <tr><td>Can't make or receive calls</td><td>Check registration status (CLI: pjsip show registrations)</td></tr>
          <tr><td>One-way audio</td><td>Check NAT and RTP port forwarding (UDP 10000–20000)</td></tr>
          <tr><td>Calls drop after 30 seconds</td><td>Often SIP NAT or ACK issues — check firewall, SIP ALG</td></tr>
          <tr><td>“All Circuits Busy”</td><td>May be wrong dial pattern, trunk not reachable, or call limit reached</td></tr>
          <tr><td>Calls failing for a specific DID</td><td>Check Inbound Routes and DID formatting (10 vs. 11 digits)</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use PJSIP over chan_sip</td><td>It's more modern, flexible, and maintained</td></tr>
          <tr><td>Match exact DID format</td><td>Ensure your inbound routes match what your carrier sends</td></tr>
          <tr><td>Set proper Outbound Caller ID</td><td>Required for CNAM and compliance</td></tr>
          <tr><td>Configure failover routes</td><td>In case your main trunk goes down</td></tr>
          <tr><td>Document your trunk settings</td><td>For easy replacement or debugging</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Dial Plans & Outbound Routes">
      <h3>What Is a Dial Plan?</h3>
      <p>In FreePBX, a dial plan is defined by the Outbound Routes module. It specifies:</p>
      <ul>
        <li>What numbers users can dial</li>
        <li>What trunk(s) to send those calls through</li>
        <li>How to manipulate the number before sending it out</li>
      </ul>
      <p>It's essentially the logic that tells FreePBX: “When a user dials X, send it through Trunk Y, and maybe strip or prepend digits.”</p>
      <h3>What Is an Outbound Route?</h3>
      <ul>
        <li>Matches user-dialed numbers using patterns</li>
        <li>Sends the call to one or more trunks</li>
        <li>Optionally alters the number (strip, prepend)</li>
        <li>Can restrict access based on extension, caller ID, or time</li>
      </ul>
      <h4>Where to Configure</h4>
      <ul>
        <li>FreePBX GUI: <b>Connectivity → Outbound Routes</b></li>
      </ul>
      <h4>Key Configuration Settings</h4>
      <ol>
        <li><b>Route Name:</b> Internal label for the route (e.g., Local, Long Distance, Emergency)</li>
        <li><b>Route CID (optional):</b> Overrides caller ID when using this route. Format: "Company Name" &lt;2485551234&gt;. Can be overridden by extension-level CID settings.</li>
        <li><b>Trunk Sequence for Matched Routes:</b> Priority-ordered list of trunks to use. FreePBX tries Trunk 1 → if it fails, tries Trunk 2, etc.</li>
        <li><b>Dial Patterns:</b> Define which dialed numbers will trigger this route.</li>
      </ol>
      <h5>Dial Pattern Fields</h5>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Prefix</td><td>What digits must appear before the pattern (and will be removed)</td></tr>
          <tr><td>Match Pattern</td><td>The actual number pattern</td></tr>
          <tr><td>CallerID Match (optional)</td><td>Restrict route to specific extensions or CID</td></tr>
        </tbody>
      </table>
      <h5>Pattern Syntax</h5>
      <ul>
        <li><b>N</b> = 2–9</li>
        <li><b>X</b> = 0–9</li>
        <li><b>Z</b> = 1–9</li>
        <li><b>.</b> = One or more digits (wildcard)</li>
        <li><b>!</b> = Zero or more digits (dangerous, rarely used)</li>
      </ul>
      <h5>Examples</h5>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Pattern</th><th>Matches</th><th>Strips</th></tr>
        </thead>
        <tbody>
          <tr><td>9|1NXXNXXXXXX</td><td>9+1+10-digit number</td><td>9</td></tr>
          <tr><td>NXXNXXXXXX</td><td>10-digit US numbers</td><td>None</td></tr>
          <tr><td>911</td><td>Emergency calls</td><td>None</td></tr>
          <tr><td>011.</td><td>International calls</td><td>None</td></tr>
        </tbody>
      </table>
      <h5>Time Groups (Optional)</h5>
      <p>Limit when this route is active. Example: Route only available during business hours.</p>
      <h5>PIN Sets (Optional)</h5>
      <p>Require a PIN to use this route. Great for long-distance or international calls.</p>
      <h4>Example Outbound Route Table</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Route Name</th><th>Pattern</th><th>Trunk Used</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Local</td><td>NXXNXXXXXX</td><td>SIPStation</td><td>10-digit local</td></tr>
          <tr><td>Long Distance</td><td>1NXXNXXXXXX</td><td>SIPStation</td><td>11-digit</td></tr>
          <tr><td>Emergency</td><td>911</td><td>SIPStation</td><td>Route for 911 only</td></tr>
          <tr><td>International</td><td>011.</td><td>Twilio_Int</td><td>011 + international dialing</td></tr>
          <tr><td>Failover</td><td>.</td><td>Backup_Trunk</td><td>Catch-all fallback route</td></tr>
        </tbody>
      </table>
      <h4>Outbound Route Priority</h4>
      <p>Outbound routes are evaluated top-down. FreePBX stops at the first match, so order matters.</p>
      <p><b>Best Practice:</b> Put specific routes (like 911 or emergency numbers) above catch-all routes.</p>
      <h4>Advanced Dial Plan Use Case: Dialing Out With a 9 Prefix</h4>
      <p>Users dial: 9 + 1 + 2485551234</p>
      <p>Outbound Route: Pattern: 9|1NXXNXXXXXX. Strip 9, dial 1NXXNXXXXXX out the trunk. This mimics traditional phone systems where dialing 9 means "get an outside line."</p>
      <h4>Dial Plan Debugging</h4>
      <ul>
        <li>Asterisk CLI: <code>asterisk -rvvv</code></li>
        <li>Commands:
          <ul>
            <li><code>dialplan show outbound-allroutes</code></li>
            <li><code>pjsip show history</code> or <code>sip set debug on</code></li>
          </ul>
        </li>
        <li>CDR logs: Check what was dialed and where it went</li>
      </ul>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Put 911 and 988 at the top</td><td>Avoid routing delays or failures</td></tr>
          <tr><td>Match the dial format your users use</td><td>Strip or prepend digits accordingly</td></tr>
          <tr><td>Use fallback trunks</td><td>Ensure continuity if a provider fails</td></tr>
          <tr><td>Document your dial patterns</td><td>For compliance and debugging</td></tr>
          <tr><td>Test new routes with a test extension</td><td>Prevent disruptions during rollout</td></tr>
        </tbody>
      </table>
      <h4>Summary: Dial Plan vs. Outbound Route</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Feature</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Dial Plan</td><td>The logic for interpreting dialed numbers</td></tr>
          <tr><td>Outbound Route</td><td>A FreePBX object that contains dial plan patterns and routes calls to trunks</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Paging & Intercom">
      <h3>What is Paging?</h3>
      <p>Paging is a one-way broadcast of audio to one or more endpoints (phones):</p>
      <ul>
        <li>The speaker hears a tone and a message, but cannot respond</li>
        <li>Used for announcements, emergency messages, or group notifications</li>
        <li>No ringing — the call is auto-answered by recipient phones</li>
      </ul>
      <h3>What is Intercom?</h3>
      <p>Intercom is a two-way audio communication:</p>
      <ul>
        <li>Auto-answers on the target phone (usually on speakerphone)</li>
        <li>Both parties can speak and hear immediately</li>
        <li>Great for quick internal communication</li>
      </ul>
      <h4>Where It’s Configured</h4>
      <ul>
        <li>FreePBX GUI: <b>Applications → Paging and Intercom</b></li>
      </ul>
      <h4>Key Configuration Options</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Option</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Paging Group Number</td><td>The extension number used to initiate the page (e.g., 700)</td></tr>
          <tr><td>Display Name</td><td>Descriptive name (e.g., "All Phones", "Front Desk", "Warehouse Page")</td></tr>
          <tr><td>Group Type</td><td>Page (1-way), Intercom (2-way), Spying/Whisper/Barge (advanced monitoring modes)</td></tr>
          <tr><td>Device List</td><td>Select which extensions/devices should receive the page/intercom call (desk phones, softphones, multicast devices)</td></tr>
          <tr><td>Duplex Mode</td><td>If enabled, allows two-way audio (turns page into intercom); disable for one-way only</td></tr>
          <tr><td>Force if Busy</td><td>Forces page even if recipient is on a call (disruptive, use for emergencies)</td></tr>
          <tr><td>Volume</td><td>Adjust page volume for receiving devices</td></tr>
        </tbody>
      </table>
      <h4>Multicast Paging (Advanced)</h4>
      <p>Multicast allows one audio stream to be sent to many phones at once, ideal for large deployments (saves bandwidth). Supported by most modern phones (e.g., Yealink, Polycom, Grandstream).</p>
      <ul>
        <li>Phones are configured to listen to a multicast IP/port</li>
        <li>FreePBX sends the page to that IP instead of dialing devices individually</li>
      </ul>
      <h4>Feature Code Intercom (Direct Dial)</h4>
      <p>You can use feature codes to initiate intercom calls directly between phones:</p>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Action</th><th>Default Code</th></tr>
        </thead>
        <tbody>
          <tr><td>Intercom to extension 101</td><td>*80101</td></tr>
        </tbody>
      </table>
      <ul>
        <li>Calling *80101 from your phone will auto-answer on 101 and start a 2-way call.</li>
        <li>Must be enabled per extension under Advanced → Intercom Allow/Deny</li>
      </ul>
      <h4>Real-World Use Cases</h4>
      <ul>
        <li><b>Schools:</b> Page all classrooms at once (fire drill, lockdown)</li>
        <li><b>Office:</b> Intercom to front desk or manager; page all phones to announce a visitor</li>
        <li><b>Warehouse:</b> Overhead paging through SIP speakers; staff announcements</li>
        <li><b>Emergency:</b> Create an “Emergency Page” group that overrides DND and busy states</li>
      </ul>
      <h4>Security & Etiquette</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Setting</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Intercom Whitelist</td><td>Prevents unauthorized extensions from initiating intercom</td></tr>
          <tr><td>DND Respect</td><td>Stops pages from interrupting private calls (unless overridden)</td></tr>
          <tr><td>Override Busy</td><td>Only enable for emergency groups</td></tr>
          <tr><td>Use Volume Control</td><td>Avoid blaring audio to sensitive areas</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Separate paging groups by department</td><td>Prevents disruption and accidental broadcasts</td></tr>
          <tr><td>Use multicast for large deployments</td><td>Saves bandwidth and reduces paging lag</td></tr>
          <tr><td>Document who has access to initiate pages</td><td>Prevent misuse</td></tr>
          <tr><td>Test with various phone models</td><td>Not all phones handle paging equally</td></tr>
          <tr><td>Use distinctive ring tones for intercom vs. calls</td><td>Helps users recognize the type of call</td></tr>
        </tbody>
      </table>
      <h4>Compatibility</h4>
      <ul>
        <li>Works best with phones that support auto-answer via SIP headers</li>
        <li>Common brands like Yealink, Polycom, Grandstream, and Sangoma support this out of the box</li>
        <li>Some phones need provisioning templates to define paging behavior</li>
      </ul>
    </Section>

    <Section title="User Management">
      <h3>What is User Management in FreePBX?</h3>
      <p>The User Management module lets you:</p>
      <ul>
        <li>Link extensions to user accounts</li>
        <li>Manage access to modules (like voicemail, call history, recordings)</li>
        <li>Set UCP (User Control Panel) permissions</li>
        <li>Assign users to groups with common roles</li>
        <li>Define login credentials for UCP and REST-based services (e.g., Zulu, Sangoma Connect)</li>
      </ul>
      <h4>Where to Configure</h4>
      <ul>
        <li>FreePBX GUI: <b>Admin → User Management</b></li>
      </ul>
      <h4>Key Components</h4>
      <ul>
        <li><b>Users:</b> Each user is an account associated with one or more extensions, a username/password for login, and permissions for UCP modules.</li>
        <li><b>Groups:</b> Define shared access profiles. Assign permissions at the group level (e.g., “All Users”, “Supervisors”, “Fax Users”, “Sales Team”).</li>
        <li><b>UCP Access:</b> UCP = User Control Panel (<a href="https://yourpbxip/ucp" target="_blank" rel="noopener noreferrer">https://yourpbxip/ucp</a>)</li>
      </ul>
      <h4>What Can Users Do in UCP?</h4>
      <ul>
        <li>Listen to voicemail</li>
        <li>Manage Find Me/Follow Me</li>
        <li>View call logs and recordings</li>
        <li>Chat (if enabled)</li>
        <li>Control presence</li>
        <li>View device status</li>
        <li>Send/receive faxes (if module installed)</li>
      </ul>
      <h4>User Credentials</h4>
      <ul>
        <li>Username: Can be extension number or custom name</li>
        <li>Password: For UCP and REST apps (e.g., Zulu, Sangoma Talk)</li>
        <li>PIN: Optional, used in some IVR or voicemail scenarios</li>
      </ul>
      <h4>Linking Users to Extensions</h4>
      <ul>
        <li>A user may be associated with a primary extension, additional extensions (e.g., hotdesking users), and optional devices (softphones, desk phones)</li>
        <li>Map users to extensions in <b>User Management → Users → Extension Assignment</b></li>
      </ul>
      <h4>Permissions & Module Access</h4>
      <ul>
        <li>Each user or group can be given access to UCP modules like:</li>
        <ul>
          <li>Voicemail</li>
          <li>Call History (CDR)</li>
          <li>Call Recording</li>
          <li>Presence control</li>
          <li>Conference rooms</li>
          <li>Queues</li>
          <li>Contacts</li>
          <li>Phone apps (REST APIs)</li>
        </ul>
        <li>Admins can enable or restrict these per user or group.</li>
      </ul>
      <h4>Groups & Inheritance</h4>
      <ul>
        <li>Using groups helps scale your permissions:</li>
        <ul>
          <li>Create a group like Sales Team</li>
          <li>Grant voicemail + call log access</li>
          <li>Assign 10 users to that group</li>
          <li>Any future permission changes apply to the whole group</li>
        </ul>
      </ul>
      <h4>REST Integration (Sangoma Apps)</h4>
      <ul>
        <li>User Management ties into:</li>
        <ul>
          <li>Sangoma Connect (mobile softphone)</li>
          <li>Zulu (desktop softphone/chat)</li>
          <li>UCP chat</li>
          <li>Presence syncing</li>
        </ul>
        <li>Permissions for these are set per user or group.</li>
      </ul>
      <h4>Related Modules</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Module</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Voicemail Admin</td><td>Manage voicemail settings globally</td></tr>
          <tr><td>UCP</td><td>End-user portal to manage their extension and features</td></tr>
          <tr><td>Phone Apps / REST API</td><td>Allows hotdesking, presence, queue control on phones</td></tr>
          <tr><td>Feature Codes</td><td>Can restrict some features to users/groups</td></tr>
        </tbody>
      </table>
      <h4>Real-World Example</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Role</th><th>Access Needs</th><th>Group</th></tr>
        </thead>
        <tbody>
          <tr><td>Agent</td><td>Voicemail, CDR, call recordings</td><td>Agents</td></tr>
          <tr><td>Supervisor</td><td>Voicemail, CDR, call recordings, queue stats</td><td>Supervisors</td></tr>
          <tr><td>Admin</td><td>All access (Admin + UCP)</td><td>Admins</td></tr>
        </tbody>
      </table>
      <ul>
        <li>Assign Jane to Agents, link to extension 101</li>
        <li>Assign Bob to Supervisors, link to extension 200</li>
      </ul>
      <h4>Common Mistakes</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Mistake</th><th>Consequence</th></tr>
        </thead>
        <tbody>
          <tr><td>Not assigning user to extension</td><td>User has no voicemail or CDR access</td></tr>
          <tr><td>Giving too many UCP permissions</td><td>Users can view other people's data</td></tr>
          <tr><td>Not setting passwords</td><td>Users can’t log in</td></tr>
          <tr><td>Not syncing group changes</td><td>Permissions don’t apply to new users</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use groups to manage permissions</td><td>Easier scaling and consistency</td></tr>
          <tr><td>Document user credentials securely</td><td>For support and recovery</td></tr>
          <tr><td>Disable unused users</td><td>Avoid security issues</td></tr>
          <tr><td>Use strong passwords</td><td>Prevent UCP/web access abuse</td></tr>
          <tr><td>Test UCP access before rollout</td><td>Ensure proper visibility for users</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Administrators">
      <h3>What Is the Administrators Module?</h3>
      <p>The Administrators module in FreePBX lets you:</p>
      <ul>
        <li>Create and manage admin user accounts for the FreePBX GUI</li>
        <li>Assign role-based access control (RBAC) permissions</li>
        <li>Define which modules each admin can view or modify</li>
        <li>Secure the PBX from unauthorized changes</li>
      </ul>
      <h4>Where to Configure</h4>
      <ul>
        <li>GUI path: <b>Admin → Administrators</b></li>
      </ul>
      <h4>Types of Admin Users</h4>
      <ul>
        <li><b>Superuser (All Access):</b> Can access and modify everything. Created during initial FreePBX setup. Cannot be restricted.</li>
        <li><b>Restricted Admin:</b> Can be given access to specific modules only. Useful for helpdesk techs, voicemail-only admins, SIP trunk providers, support staff.</li>
      </ul>
      <h4>Administrator Fields</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Username</td><td>Used to log in to FreePBX admin portal</td></tr>
          <tr><td>Password</td><td>Secure login credential</td></tr>
          <tr><td>Administrator Type</td><td>Choose User Manager (for centralized management) or Legacy</td></tr>
          <tr><td>Modules Access</td><td>Select which GUI modules this admin can access (e.g., only Voicemail Admin and Extensions)</td></tr>
        </tbody>
      </table>
      <h4>Permissions Granularity</h4>
      <p>You can give or restrict access to any module in FreePBX, including:</p>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Module</th><th>Typical Access Case</th></tr>
        </thead>
        <tbody>
          <tr><td>Extensions</td><td>Allowed for provisioning techs</td></tr>
          <tr><td>Voicemail Admin</td><td>For voicemail-only helpdesk</td></tr>
          <tr><td>Queues</td><td>For call center supervisor</td></tr>
          <tr><td>System Admin</td><td>Typically not shared (critical settings)</td></tr>
          <tr><td>Firewall</td><td>Security team only</td></tr>
          <tr><td>CDR Reports</td><td>For billing or supervisors</td></tr>
        </tbody>
      </table>
      <p>Each module can be set to: Allow, Deny, or (sometimes) View Only.</p>
      <h4>Example Use Cases</h4>
      <ul>
        <li><b>Level 1 Helpdesk Admin:</b> Access to: Extensions, Voicemail Admin, UCP Logs. No access to: Trunks, System Admin, Firewall.</li>
        <li><b>Call Center Supervisor:</b> Access to: Queues, CDR Reports, User Management. No access to: System modules or trunk settings.</li>
        <li><b>SIP Carrier Support:</b> Access to: Trunks and Inbound/Outbound Routes. Denied access to users, voicemail, recordings.</li>
      </ul>
      <h4>Security Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Practice</th><th>Reason</th></tr>
        </thead>
        <tbody>
          <tr><td>Never share the admin superuser login</td><td>Prevents audit trails and increases breach risk</td></tr>
          <tr><td>Assign unique usernames per person</td><td>Enables role control and logging</td></tr>
          <tr><td>Use strong passwords</td><td>Protect the web GUI</td></tr>
          <tr><td>Audit admin access regularly</td><td>Remove unused or former employee accounts</td></tr>
          <tr><td>Use least privilege</td><td>Grant access only to needed modules</td></tr>
        </tbody>
      </table>
      <h4>User Manager Integration</h4>
      <ul>
        <li>If you enable User Manager-based administrators, you can manage admin accounts centrally, similar to regular users. This allows:</li>
        <ul>
          <li>Unified password control</li>
          <li>Future LDAP/Active Directory integration</li>
          <li>Cleaner separation between GUI and backend services</li>
        </ul>
      </ul>
      <h4>Related Tools</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tool</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>User Management</td><td>Manages UCP logins for end-users</td></tr>
          <tr><td>Firewall → Services</td><td>Ensure web GUI is not open to the whole internet</td></tr>
          <tr><td>Fail2Ban</td><td>Blocks brute-force login attempts</td></tr>
          <tr><td>System Admin</td><td>Lets you enable HTTPS-only GUI access</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Create named admin accounts per person</td><td>Avoid shared logins</td></tr>
          <tr><td>Assign roles per job function</td><td>Enforces least-privilege principle</td></tr>
          <tr><td>Deny access to System Admin and Trunks unless necessary</td><td>Protects core settings</td></tr>
          <tr><td>Use 2FA via a reverse proxy or VPN</td><td>GUI doesn’t support native 2FA</td></tr>
          <tr><td>Keep a secure offline record of superuser credentials</td><td>For recovery scenarios</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Asterisk CLI">
      <h3>What is the Asterisk CLI?</h3>
      <p>The Asterisk CLI is the live shell interface to the Asterisk core. It allows you to:</p>
      <ul>
        <li>See real-time SIP or PJSIP traffic</li>
        <li>Monitor active calls and channels</li>
        <li>Reload specific modules</li>
        <li>Trace dialplans</li>
        <li>Debug issues not visible in the FreePBX GUI</li>
      </ul>
      <h4>How to Access It</h4>
      <ol>
        <li>SSH into your FreePBX server</li>
        <li>Run: <code>asterisk -rvvv</code></li>
        <ul>
          <li><b>-r:</b> Remote into running Asterisk instance</li>
          <li><b>-vvv:</b> Verbosity level (more v’s = more output)</li>
        </ul>
        <li>You’ll enter the Asterisk CLI prompt: <code>*CLI&gt;</code></li>
        <li>To exit, type: <code>exit</code></li>
      </ol>
      <h4>Commonly Used CLI Commands</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Command</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>core show channels</td><td>View active calls (live channels)</td></tr>
          <tr><td>core show help</td><td>List all available CLI commands</td></tr>
          <tr><td>sip show peers</td><td>List SIP peers (chan_sip)</td></tr>
          <tr><td>pjsip show endpoints</td><td>List PJSIP devices and status</td></tr>
          <tr><td>pjsip show registrations</td><td>See trunk registration status</td></tr>
          <tr><td>core reload</td><td>Reload core modules (NOT the whole system)</td></tr>
          <tr><td>dialplan show</td><td>View the current dialplan</td></tr>
          <tr><td>module reload</td><td>Reload individual Asterisk modules</td></tr>
          <tr><td>sip set debug on</td><td>Enable SIP packet tracing (chan_sip)</td></tr>
          <tr><td>pjsip set logger on</td><td>Enable SIP packet tracing (PJSIP)</td></tr>
          <tr><td>queue show</td><td>See queue members, callers, status</td></tr>
          <tr><td>voicemail show users</td><td>List voicemail boxes per context</td></tr>
          <tr><td>pri show spans</td><td>Check PRI/T1 interface (if DAHDI installed)</td></tr>
        </tbody>
      </table>
      <h4>Real-Time Call Tracing Example</h4>
      <ol>
        <li>Log in: <code>asterisk -rvvv</code></li>
        <li>Enable SIP logging: <code>pjsip set logger on</code></li>
        <li>Place a test call and watch the SIP packets flow</li>
        <li>To stop logging: <code>pjsip set logger off</code></li>
        <li>For chan_sip: <code>sip set debug on</code> / <code>sip set debug off</code></li>
      </ol>
      <h4>CLI vs. FreePBX GUI</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Function</th><th>CLI</th><th>FreePBX GUI</th></tr>
        </thead>
        <tbody>
          <tr><td>Real-time call monitoring</td><td>✅</td><td>❌</td></tr>
          <tr><td>SIP packet debugging</td><td>✅</td><td>❌</td></tr>
          <tr><td>Module reloads</td><td>✅</td><td>✅ (limited)</td></tr>
          <tr><td>Dialplan tracing</td><td>✅</td><td>❌</td></tr>
          <tr><td>CDR access</td><td>❌</td><td>✅</td></tr>
          <tr><td>Extension setup</td><td>❌</td><td>✅</td></tr>
        </tbody>
      </table>
      <h4>Use Cases</h4>
      <ul>
        <li><b>Diagnose a SIP registration issue:</b> <code>pjsip show registrations</code></li>
        <li><b>See active calls:</b> <code>core show channels</code></li>
        <li><b>Reload dialplan after config change:</b> <code>dialplan reload</code></li>
        <li><b>Troubleshoot an extension not ringing:</b> <code>pjsip show endpoint 101</code></li>
      </ul>
      <h4>Tips & Safety</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Avoid <code>core restart now</code> during business hours</td><td>It forcefully drops all calls</td></tr>
          <tr><td>Use <code>reload</code> instead of restarting Asterisk</td><td>Less disruptive to active calls</td></tr>
          <tr><td>Use verbosity wisely</td><td><code>-vvv</code> is usually enough; <code>-vvvvvv</code> can be overwhelming</td></tr>
          <tr><td>Don’t make dialplan changes directly in CLI</td><td>Changes are overwritten by FreePBX GUI reloads</td></tr>
          <tr><td>Watch for chan_sip vs pjsip confusion</td><td>Only one driver is active per extension or trunk</td></tr>
        </tbody>
      </table>
      <h4>Example Diagnostic Flow</h4>
      <ol>
        <li>Log in: <code>asterisk -rvvv</code></li>
        <li>Enable SIP logging: <code>pjsip set logger on</code></li>
        <li>Watch for messages: INVITE, 100 Trying, 180 Ringing, 200 OK, ACK</li>
        <li>Check active call: <code>core show channels</code></li>
        <li>Hang up → turn off logging: <code>pjsip set logger off</code></li>
      </ol>
    </Section>

    <Section title="System Admin">
      <h3>What Is the System Admin Module?</h3>
      <p>The System Admin module is a critical administrative interface that gives you access to server-level configuration options outside the scope of standard PBX call handling — things like networking, updates, backups, and SSL certificates.</p>
      <p><b>Note:</b> The System Admin module is only available when you're running the official FreePBX Distro (not when FreePBX is installed on a custom OS like Debian or Ubuntu). Some features also require a commercial license.</p>
      <h4>What Can You Manage?</h4>
      <ul>
        <li>Network interfaces and hostnames</li>
        <li>Time zone and DNS</li>
        <li>Certificate management (HTTPS)</li>
        <li>System updates and upgrades</li>
        <li>Backups and restores</li>
        <li>Email server settings</li>
        <li>Power/reboot/shutdown</li>
      </ul>
      <h4>Where to Find It</h4>
      <ul>
        <li>FreePBX GUI: <b>Admin → System Admin</b></li>
      </ul>
      <h4>Tabs and Features Breakdown</h4>
      <ol>
        <li><b>Network Settings:</b> Manage IP address (static or DHCP), subnet, gateway, DNS servers, hostname and domain. Ideal for static environments or fixing network issues.</li>
        <li><b>Time Zone:</b> Set the system time zone. Important for accurate call logs, voicemail timestamps, CDRs, etc.</li>
        <li><b>Updates:</b> Manage PBX updates (FreePBX modules and Asterisk) and OS updates (via yum). UI for checking/applying security patches, Asterisk updates, and Distro upgrades.</li>
        <li><b>Email Setup:</b> Configure outbound mail server settings for voicemail-to-email, alerts, cron jobs. Supports SMTP, authentication, TLS/SSL, smart host.</li>
        <li><b>Power Options:</b> Reboot or power down the server gracefully from the GUI.</li>
        <li><b>HTTPS Setup (Port Management):</b> Change admin web port, redirect HTTP to HTTPS, harden access.</li>
        <li><b>Storage & Disk Usage:</b> View available disk space and usage per partition.</li>
        <li><b>Support and Activation:</b> Register PBX with Sangoma, check license keys, access support tools.</li>
        <li><b>Backup and Restore (Legacy):</b> GUI-based creation/scheduling of system-level backups (replaced by Backup module in newer versions).</li>
      </ol>
      <h4>Licensing Tiers</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Feature</th><th>Free</th><th>Paid</th></tr>
        </thead>
        <tbody>
          <tr><td>Basic Network Config</td><td>✅</td><td>✅</td></tr>
          <tr><td>Certificate Management</td><td>✅</td><td>✅</td></tr>
          <tr><td>HTTPS/Port Setup</td><td>✅</td><td>✅</td></tr>
          <tr><td>Mail Configuration</td><td>✅</td><td>✅</td></tr>
          <tr><td>System Updates (auto)</td><td>❌</td><td>✅ (with maintenance)</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Practice</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use a static IP for production PBX</td><td>Avoid registration and DNS issues</td></tr>
          <tr><td>Regularly update modules and OS</td><td>Patch security issues and bugs</td></tr>
          <tr><td>Secure with HTTPS and strong passwords</td><td>Prevent GUI compromise</td></tr>
          <tr><td>Configure SMTP email</td><td>Ensure voicemail-to-email and alerting works</td></tr>
          <tr><td>Use GUI reboot for planned downtime</td><td>Avoid filesystem corruption</td></tr>
        </tbody>
      </table>
      <h4>Common Pitfalls</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Mistake</th><th>Result</th></tr>
        </thead>
        <tbody>
          <tr><td>Setting DHCP on a production box</td><td>IP address changes can break SIP registration</td></tr>
          <tr><td>Ignoring time zone config</td><td>Incorrect voicemail timestamps and CDR data</td></tr>
          <tr><td>Failing to configure email</td><td>Missed voicemail or system alerts</td></tr>
          <tr><td>Using default ports on internet-facing PBX</td><td>Increased attack surface</td></tr>
        </tbody>
      </table>
      <h4>Related Modules</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Module</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Firewall</td><td>Controls network access and whitelisting</td></tr>
          <tr><td>Certificate Management</td><td>Works with System Admin to secure HTTPS access</td></tr>
          <tr><td>User Management</td><td>Not involved in server config — separate from admin rights</td></tr>
          <tr><td>Asterisk CLI</td><td>For engine-level control (vs. server-level here)</td></tr>
        </tbody>
      </table>
      <h4>Example Use Case Flow</h4>
      <ol>
        <li>Go to Network Settings → set static IP and gateway</li>
        <li>Go to Time Zone → select your region (e.g., America/New_York)</li>
        <li>Go to Email Setup → configure SMTP relay</li>
        <li>Enable HTTPS redirection for secure GUI access</li>
        <li>Register the system for updates and support</li>
        <li>Reboot from GUI → all settings are now live</li>
      </ol>
    </Section>

    <Section title="CDR (Call Detail Records)">
      <h3>What is the CDR Application?</h3>
      <p>CDR stands for Call Detail Records — a database of every call that passes through Asterisk. It includes:</p>
      <ul>
        <li>Time of call</li>
        <li>Duration</li>
        <li>Source and destination numbers</li>
        <li>Call disposition (answered, failed, etc.)</li>
        <li>Channel used</li>
        <li>Trunk or extension involved</li>
      </ul>
      <p>You can access it via: <b>Reports → CDR Reports</b></p>
      <h4>What’s Included in a CDR Record?</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Date/Time</td><td>When the call occurred</td></tr>
          <tr><td>CallerID</td><td>Who made the call (name + number)</td></tr>
          <tr><td>Source (SRC)</td><td>Extension or number that originated the call</td></tr>
          <tr><td>Destination (DST)</td><td>Extension or external number dialed</td></tr>
          <tr><td>Destination Channel</td><td>Where the call was sent (SIP/Trunk/Local)</td></tr>
          <tr><td>Disposition</td><td>Call result: ANSWERED, NO ANSWER, BUSY, FAILED</td></tr>
          <tr><td>Duration</td><td>Total call duration in seconds</td></tr>
          <tr><td>Billsec</td><td>Time the call was actually answered (excluding ringing)</td></tr>
          <tr><td>Recording</td><td>Link to the call recording (if enabled)</td></tr>
        </tbody>
      </table>
      <h4>Features of the CDR Module</h4>
      <ul>
        <li><b>Filter/Search:</b> By date/time range, source/destination, disposition, duration, trunk/extension, or user</li>
        <li><b>Play/Download Recordings:</b> If call recording is enabled, play or download files (wav/mp3) for QA or dispute resolution</li>
        <li><b>Export to CSV:</b> Export filtered or full data for offline analysis, billing, or compliance</li>
      </ul>
      <h4>Configuration and Dependencies</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Component</th><th>Role</th></tr>
        </thead>
        <tbody>
          <tr><td>Asterisk</td><td>Generates the raw CDRs during call events</td></tr>
          <tr><td>MySQL/MariaDB</td><td>Stores the records for GUI access</td></tr>
          <tr><td>cdr_mysql module</td><td>Asterisk module that writes records to SQL</td></tr>
          <tr><td>FreePBX GUI</td><td>Visual interface to search, play, and report on CDRs</td></tr>
        </tbody>
      </table>
      <h4>Example Use Cases</h4>
      <ul>
        <li><b>Troubleshooting a Call:</b> Search by source/destination, check disposition, view timestamps, trace call flow</li>
        <li><b>Billing Report:</b> Export all outbound calls over 30 seconds, filter by date/trunk, export to CSV</li>
        <li><b>Call Volume Report:</b> See how many calls came into a queue/extension, measure peak hours, monitor missed vs. answered</li>
      </ul>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Enable recording only where needed</td><td>Saves disk space</td></tr>
          <tr><td>Purge old CDRs regularly if disk usage is high</td><td>Prevents database bloat</td></tr>
          <tr><td>Use descriptive CallerIDs on outbound calls</td><td>Helps identify records easily</td></tr>
          <tr><td>Cross-reference CDR with CEL if deeper analysis needed</td><td>CEL logs mid-call events</td></tr>
          <tr><td>Give users UCP access to their own CDRs only</td><td>Prevents privacy breaches</td></tr>
        </tbody>
      </table>
      <h4>Common Pitfalls</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Pitfall</th><th>Consequence</th></tr>
        </thead>
        <tbody>
          <tr><td>No CDRs showing</td><td>Likely a broken database connection or missing cdr_mysql.so</td></tr>
          <tr><td>Recording links not working</td><td>Recording path mismatch or deleted audio files</td></tr>
          <tr><td>Time zone mismatch</td><td>Set the system and PHP time zones properly in System Admin</td></tr>
        </tbody>
      </table>
      <h4>Related Modules</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Module</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>Call Recording</td><td>Generates audio files linked to CDRs</td></tr>
          <tr><td>CEL Reports</td><td>Logs detailed call events (bridging, transfer, etc.)</td></tr>
          <tr><td>Queue Reports</td><td>Call center stats (commercial module)</td></tr>
          <tr><td>User Management</td><td>Ties users to CDR visibility in UCP</td></tr>
        </tbody>
      </table>
      <h4>CLI & Database Access</h4>
      <ul>
        <li>From CLI:</li>
        <ul>
          <li><code>asterisk -rx "core show channels"</code></li>
          <li><code>asterisk -rx "cdr show status"</code></li>
        </ul>
        <li>To query the database directly:</li>
        <ul>
          <li><code>USE asteriskcdrdb;</code></li>
          <li><code>SELECT * FROM cdr ORDER BY calldate DESC LIMIT 10;</code></li>
        </ul>
      </ul>
    </Section>

    <Section title="CEL (Call Event Logging)">
      <h3>What is CEL?</h3>
      <p>CEL (Call Event Logging) tracks every step of a call’s lifecycle in Asterisk. It logs events like:</p>
      <ul>
        <li>Call start</li>
        <li>Ringing</li>
        <li>Answered</li>
        <li>Transferred</li>
        <li>Parked</li>
        <li>Hung up</li>
      </ul>
      <p>This allows you to see how a call flowed, pinpoint where it failed or routed, and track complex events like blind transfers, attended transfers, parking, and bridges.</p>
      <h4>Where to Access CEL in FreePBX</h4>
      <ul>
        <li>GUI path: <b>Reports → Asterisk Logfiles → CEL Reports</b></li>
        <li>Note: The CEL module must be enabled in both Asterisk and the FreePBX GUI. It’s often not enabled by default on some custom installs.</li>
      </ul>
      <h4>What’s in a CEL Record?</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>EventTime</td><td>Timestamp of the specific event</td></tr>
          <tr><td>EventType</td><td>Type of event (e.g., CHAN_START, ANSWER, BRIDGE_ENTER)</td></tr>
          <tr><td>UserField</td><td>Usually blank unless set manually</td></tr>
          <tr><td>CallerIDNum / Name</td><td>Caller ID info at that event moment</td></tr>
          <tr><td>UniqueID</td><td>Asterisk's unique call identifier (links CDR & CEL together)</td></tr>
          <tr><td>LinkedID</td><td>ID shared across related calls (e.g., in transfers)</td></tr>
          <tr><td>CID Name/Number</td><td>Caller ID at that point</td></tr>
          <tr><td>AppName</td><td>Application executed (e.g., Dial, Playback)</td></tr>
          <tr><td>Context / Extension</td><td>Where in the dialplan the event occurred</td></tr>
          <tr><td>Channel / Peer</td><td>Which SIP/PJSIP/local channel was involved</td></tr>
        </tbody>
      </table>
      <h4>Common CEL Event Types</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>EventType</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>CHAN_START</td><td>Channel created (call began)</td></tr>
          <tr><td>ANSWER</td><td>Call was answered</td></tr>
          <tr><td>BRIDGE_ENTER</td><td>Call entered a bridge (two-way media started)</td></tr>
          <tr><td>BRIDGE_EXIT</td><td>Call left the bridge</td></tr>
          <tr><td>TRANSFER</td><td>Call was transferred</td></tr>
          <tr><td>PARK_START</td><td>Call was parked</td></tr>
          <tr><td>HANGUP</td><td>Channel was hung up</td></tr>
        </tbody>
      </table>
      <h4>CEL vs. CDR: Key Differences</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Feature</th><th>CDR</th><th>CEL</th></tr>
        </thead>
        <tbody>
          <tr><td>One row per call</td><td>✅</td><td>❌</td></tr>
          <tr><td>Tracks transfers and events</td><td>❌</td><td>✅</td></tr>
          <tr><td>Stores ring time, answer time, bridge time separately</td><td>❌</td><td>✅</td></tr>
          <tr><td>Best for reporting</td><td>✅</td><td>🚫 (too granular)</td></tr>
          <tr><td>Best for diagnostics and tracing</td><td>🚫</td><td>✅</td></tr>
        </tbody>
      </table>
      <h4>Use Case Examples</h4>
      <ul>
        <li><b>Troubleshooting a Transfer Issue:</b> CDR only shows call start → end; CEL shows ANSWER, TRANSFER, BRIDGE_ENTER, HANGUP, and timing.</li>
        <li><b>Auditing Call Flow for Compliance:</b> CEL reveals the entire timeline, second-by-second, including answer, transfer, hold, park, etc.</li>
      </ul>
      <h4>Database and Backend</h4>
      <p>CEL records are stored in the <code>asteriskcdrdb.cel</code> table.</p>
      <pre style={{ background: '#f7f7f7', padding: 8, borderRadius: 4 }}>
SELECT EventTime, EventType, CallerIDNum, Extension, Application 
FROM cel 
WHERE LinkedID = '1688650400.1234';
      </pre>
      <p>You can join this with CDR data via <code>uniqueid</code> or <code>linkedid</code>.</p>
      <h4>Enabling CEL (if not already enabled)</h4>
      <ol>
        <li>In FreePBX: Go to Module Admin, ensure CEL is installed and enabled</li>
        <li>In <code>cel.conf</code> and <code>cel_mysql.conf</code>: set <b>enabled=yes</b> and configure MySQL credentials</li>
        <li>Restart Asterisk: <code>fwconsole restart</code></li>
      </ol>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use CDR for reports, CEL for troubleshooting</td><td>CDR is high-level; CEL is event-level</td></tr>
          <tr><td>Link CDR and CEL with linkedid</td><td>Tracks multi-leg calls and transfers</td></tr>
          <tr><td>Filter by EventType to narrow analysis</td><td>Focus only on BRIDGE, ANSWER, HANGUP, etc.</td></tr>
          <tr><td>Retain only as needed</td><td>CEL grows fast — archive or purge for disk space</td></tr>
        </tbody>
      </table>
      <h4>Related Modules and Tools</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Module</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>CDR Reports</td><td>Summary-level call history</td></tr>
          <tr><td>Asterisk Logfiles</td><td>View Asterisk debug logs</td></tr>
          <tr><td>Asterisk CLI</td><td>Real-time CLI monitoring of calls</td></tr>
          <tr><td>Queue Reports</td><td>For tracking queue-specific call flows (commercial)</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Asterisk Info">
      <h3>What is the Asterisk Info Module?</h3>
      <p>The Asterisk Info module in FreePBX provides a real-time dashboard of the Asterisk system's internals. It’s a GUI wrapper for many core Asterisk CLI commands, giving you insight into how the PBX is functioning without needing to drop to the terminal.</p>
      <h4>Where to Find It</h4>
      <ul>
        <li>FreePBX GUI: <b>Reports → Asterisk Info</b></li>
      </ul>
      <h4>What Does Asterisk Info Show?</h4>
      <ol>
        <li><b>System Information:</b> Asterisk version, uptime, active calls/channels, load average. <br /><i>CLI: core show uptime, core show calls</i></li>
        <li><b>SIP / PJSIP Peers:</b> Lists endpoints, registration status, IPs, ports, latency. <br /><i>CLI: pjsip show endpoints, sip show peers</i></li>
        <li><b>IAX2 Peers:</b> IAX2 endpoints, status, connection details. <br /><i>CLI: iax2 show peers</i></li>
        <li><b>Registries:</b> Outbound trunk registrations. <br /><i>CLI: pjsip show registrations, sip show registry</i></li>
        <li><b>Channels:</b> Real-time list of active channels (calls in progress), source/destination, codec, duration. <br /><i>CLI: core show channels</i></li>
        <li><b>Codecs:</b> Available codecs, formats, priority order. <br /><i>CLI: core show codecs</i></li>
        <li><b>Dialplan:</b> Current dialplan contexts, call routing. <br /><i>CLI: dialplan show</i></li>
        <li><b>Modules:</b> Loaded Asterisk modules, status, dependencies. <br /><i>CLI: module show</i></li>
        <li><b>Applications:</b> Dialplan applications available. <br /><i>CLI: core show applications</i></li>
        <li><b>Functions:</b> Asterisk functions for dialplan logic. <br /><i>CLI: core show functions</i></li>
      </ol>
      <h4>Registries Table Example</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Field</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Username</td><td>SIP or PJSIP username</td></tr>
          <tr><td>Domain</td><td>Provider host</td></tr>
          <tr><td>Refresh Time</td><td>Time before re-registration</td></tr>
          <tr><td>State</td><td>Registered, Request Sent, Rejected, etc.</td></tr>
        </tbody>
      </table>
      <h4>Use Cases and Examples</h4>
      <ul>
        <li><b>Verify Phone Registration:</b> Go to PJSIP/SIP Peers → Check if extension 101 is listed and reachable.</li>
        <li><b>Check Trunk Registration:</b> Registries tab → Look for Registered status on your SIP trunk.</li>
        <li><b>Monitor Live Calls:</b> Channels tab → See real-time calls, duration, and codec.</li>
        <li><b>Debug Codec Issues:</b> Codecs tab → Ensure both phones/trunks support G711, G722, etc.</li>
      </ul>
      <h4>Limitations</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Limitation</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Read-only</td><td>Cannot execute changes — just view status</td></tr>
          <tr><td>Less detailed than CLI for real-time issues</td><td>CLI has live SIP trace and event logs</td></tr>
          <tr><td>May not refresh instantly</td><td>Manual page refresh needed for updates</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use for quick health checks</td><td>Especially useful for NOC or helpdesk tiers</td></tr>
          <tr><td>Monitor channels before updates</td><td>Avoid reboots or reloads during active calls</td></tr>
          <tr><td>Cross-check with CLI when deeper debugging is needed</td><td>GUI gives overview; CLI provides event-level trace</td></tr>
          <tr><td>Combine with CDR/CEL for historical call analysis</td><td>Asterisk Info is real-time only</td></tr>
        </tbody>
      </table>
      <h4>Related Tools</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tool</th><th>Role</th></tr>
        </thead>
        <tbody>
          <tr><td>Asterisk CLI</td><td>Full command-line access and diagnostics</td></tr>
          <tr><td>CDR Reports</td><td>Historical call summary</td></tr>
          <tr><td>CEL Reports</td><td>Event-by-event call tracking</td></tr>
          <tr><td>System Admin</td><td>Server-level status (CPU, disk, etc.)</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Voicemail Admin">
      <h3>What is the Voicemail Admin Module?</h3>
      <p>The Voicemail Admin module manages the Asterisk voicemail system (powered by voicemail.conf). It allows you to:</p>
      <ul>
        <li>Define global voicemail behaviors</li>
        <li>Create and manage voicemail templates</li>
        <li>Set default storage options, email notifications, greetings, and PIN policies</li>
        <li>Access low-level settings not exposed in the Extensions module</li>
      </ul>
      <h4>Where to Find It</h4>
      <ul>
        <li>FreePBX GUI: <b>Settings → Voicemail Admin</b></li>
        <li><b>Note:</b> This module is not always enabled by default and may need to be installed via Module Admin.</li>
      </ul>
      <h4>Key Features and Sections</h4>
      <ol>
        <li><b>General Settings (voicemail.conf Options):</b> Configure system-wide behavior for all voicemail boxes.</li>
      </ol>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Option</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>format</td><td>File format for saved voicemails (wav, gsm, wav49, etc.)</td></tr>
          <tr><td>serveremail</td><td>The "From" email address for voicemail-to-email messages</td></tr>
          <tr><td>maxmsg</td><td>Max number of voicemails per mailbox</td></tr>
          <tr><td>maxsecs</td><td>Max length (in seconds) of each voicemail</td></tr>
          <tr><td>minsecs</td><td>Minimum required length (to avoid empty messages)</td></tr>
          <tr><td>emailbody</td><td>Default email template for voicemail messages</td></tr>
          <tr><td>emailsubject</td><td>Email subject template for voicemail-to-email</td></tr>
          <tr><td>delete</td><td>Whether to delete the message after sending via email (yes or no)</td></tr>
          <tr><td>saycid, envelope</td><td>Whether to play caller ID or timestamp in the voicemail playback</td></tr>
          <tr><td>attach</td><td>Attach the voicemail audio to the email</td></tr>
        </tbody>
      </table>
      <ol start={2}>
        <li><b>Voicemail Templates:</b> Define common settings and apply them to multiple extensions. Useful for large systems, call centers, or multi-tenant setups. Templates can include PIN requirements, email behaviors, storage location, language, and greeting preferences.</li>
        <li><b>Voicemail Contexts:</b> Asterisk supports contexts for voicemail boxes (like dialplan contexts). Most systems use a single context (usually default), but you can define custom contexts to separate departments or tenants. Example:</li>
      </ol>
      <pre style={{ background: '#f7f7f7', padding: 8, borderRadius: 4 }}>
[default]
101 =&gt; 1234,John Smith,john@example.com
102 =&gt; 5678,Alice Jones,alice@example.com
      </pre>
      <p>In FreePBX, this is handled behind the scenes, but Voicemail Admin exposes it.</p>
      <h4>Advanced Configuration</h4>
      <ul>
        <li>Manually edit voicemail.conf from the GUI (advanced use only)</li>
        <li>Reload voicemail settings without restarting Asterisk</li>
        <li>Create multiple voicemail profiles for various extension groups</li>
      </ul>
      <h4>Voicemail-to-Email Integration</h4>
      <ul>
        <li>Manage system-wide email behavior for voicemails</li>
        <li>SMTP relay setup is done in System Admin → Email Setup</li>
        <li>serveremail, attach, delete are configured here or per extension</li>
        <li>Common example: "Send voicemails to the user's email with attachment, but don’t delete from the server."</li>
      </ul>
      <h4>Use Case Example</h4>
      <p><b>Company Policy:</b> All voicemail messages must:</p>
      <ul>
        <li>Be saved for 30 days</li>
        <li>Be no longer than 3 minutes</li>
        <li>Be emailed to the user with the file attached</li>
        <li>Require a minimum 4-digit PIN</li>
      </ul>
      <p>Using Voicemail Admin:</p>
      <ul>
        <li>Set maxsecs=180, minpassword=4, attach=yes, delete=no</li>
        <li>Define a global email body and subject</li>
        <li>Apply these via a template to all new extensions</li>
      </ul>
      <h4>Common Issues It Helps Prevent</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Issue</th><th>Solution via Voicemail Admin</th></tr>
        </thead>
        <tbody>
          <tr><td>Voicemails not sending</td><td>Check serveremail, attach, SMTP setup</td></tr>
          <tr><td>Users using weak PINs</td><td>Enforce min PIN length globally</td></tr>
          <tr><td>Empty messages</td><td>Use minsecs=2 to reject &lt;2 sec voicemails</td></tr>
          <tr><td>Mailboxes filling up</td><td>Set maxmsg limit and retention policy</td></tr>
          <tr><td>Inconsistent settings</td><td>Use templates to standardize mailbox behavior</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Tip</th><th>Why</th></tr>
        </thead>
        <tbody>
          <tr><td>Use templates for role-based setups</td><td>Saves time and ensures consistency</td></tr>
          <tr><td>Enable attach=yes + delete=no</td><td>Users get a copy via email but PBX retains backups</td></tr>
          <tr><td>Set a reasonable maxsecs</td><td>Prevent abuse or accidental long voicemails</td></tr>
          <tr><td>Require minpassword of 4+</td><td>Prevent easy brute force on mailboxes</td></tr>
          <tr><td>Enable envelope=yes</td><td>Helps users know when the message was left</td></tr>
        </tbody>
      </table>
      <h4>Related Modules</h4>
      <table style={{ borderCollapse: 'collapse', marginBottom: 8 }}>
        <thead>
          <tr><th>Module</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>User Management</td><td>Grants voicemail access to UCP</td></tr>
          <tr><td>Voicemail Blast Groups</td><td>Sends a message to multiple mailboxes (e.g., team voicemails)</td></tr>
          <tr><td>Call Flow Control / Time Conditions</td><td>Route to voicemail or announcements based on schedule</td></tr>
          <tr><td>Email Setup (System Admin)</td><td>Controls actual outbound email delivery</td></tr>
        </tbody>
      </table>
    </Section>

    <Section title="Call Flow Control">
      <ul>
        <li>Manual override toggles (like a switchboard button)</li>
        <li>Used to change routing paths manually (e.g., switch between day/night mode)</li>
        <li>Can be tied to BLF buttons on phones</li>
      </ul>
    </Section>

    <Section title="Parking">
      <ul>
        <li>Park a call (e.g., on “701”), then retrieve from another phone</li>
        <li>Parking lots can have timeouts and return destinations</li>
        <li>Advanced features in commercial module</li>
      </ul>
    </Section>

    <Section title="Certificate Management">
      <ul>
        <li>Install SSL certificates for secure Web GUI and provisioning</li>
        <li>Supports Let's Encrypt auto-renewal</li>
        <li>Required for secure UCP and HTTPS provisioning</li>
      </ul>
    </Section>

  </div>
);

export default PBXReference;
