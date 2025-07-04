import React from 'react';


const PBXReference: React.FC = () => (
  <div>
    <section>
      <h2>Inbound Routes</h2>
      <h3>What Are Inbound Routes?</h3>
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
      <h4>Match Criteria</h4>
      <ul>
        <li><strong>DID Number:</strong> The DID is the phone number dialed by the outside caller. When a call hits your trunk, FreePBX looks at this field to determine the route.
          <ul>
            <li>Leave it blank to match all DIDs</li>
            <li>Enter a full 10- or 11-digit number (e.g., 2485551234)</li>
            <li>Use partial matches or wildcards (like _248555XXXX)</li>
          </ul>
        </li>
        <li><strong>Caller ID Number:</strong> Matches based on the incoming caller's number. Used for special cases like VIP routing or blocking known spam callers. Can be exact match or patterns (e.g., 248555% for area code filtering)</li>
      </ul>
      <h4>Key Configuration Options</h4>
      <ul>
        <li><strong>Description:</strong> Internal label (e.g., Main Line, Sales DID, After Hours Route)</li>
        <li><strong>Set Destination:</strong> Choose where to send the call: Extension, ring group, IVR, announcement, etc.</li>
        <li><strong>Alert Info:</strong> Sends custom alert to phones (e.g., different ring tone). Yealink/Polycom can use this for distinctive ring tones.</li>
        <li><strong>CID Lookup Source:</strong> Automatically performs a reverse lookup (e.g., caller name) from a CNAM provider</li>
        <li><strong>Recording Options:</strong> Record the call from this point forward. Override global settings.</li>
        <li><strong>Privacy Manager:</strong> Forces anonymous callers to enter their number. Useful for blocking spam or anonymous calls.</li>
      </ul>
      <h4>Time-Based Routing (Using Time Conditions)</h4>
      <ul>
        <li>Route differently during business hours vs. after hours</li>
        <li>Set holiday-specific routes</li>
        <li>Combine with Call Flow Control for manual overrides</li>
      </ul>
      <h4>Example:</h4>
      <p>Inbound Route (DID: 2485551234) → Time Condition → If open → IVR, If closed → Voicemail</p>
      <h4>Real-World Examples</h4>
      <ul>
        <li><strong>Standard Routing:</strong> DID 2485551234 → Rings extension 1001</li>
        <li><strong>IVR Menu:</strong> DID 2485552000 → Goes to main IVR menu for call routing</li>
        <li><strong>After-Hours Message:</strong> All calls → Play announcement: "Our office is currently closed"</li>
        <li><strong>Dispatch Failover:</strong> Known caller ID 5865551100 → Ring mobile backup number via Misc Destination</li>
        <li><strong>VIP Routing:</strong> Caller ID 2485555555 → Direct to management's ring group</li>
      </ul>
      <h4>Advanced Use Cases</h4>
      <ul>
        <li>Combine multiple inbound routes with overlapping DIDs for layered routing logic.</li>
        <li>Set specific Caller ID entries for numbers that bypass menus and go directly to agents.</li>
        <li>Create "Catch-All" route with blank DID/CID to handle unrecognized calls as a fallback.</li>
        <li>Use Inbound Routes → Time Condition → Call Flow Control for dynamic routing via BLF.</li>
      </ul>
      <h4>Tips for Managing Inbound Routes</h4>
      <table>
        <thead>
          <tr><th>Tip</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Use descriptive names</td><td>e.g., Main Line - Day, Main Line - After Hours</td></tr>
          <tr><td>Keep DID formatting consistent</td><td>Match what's sent by your SIP provider (10 vs. 11 digits)</td></tr>
          <tr><td>Route to Time Conditions</td><td>Gives you flexible control and easy overrides</td></tr>
          <tr><td>Don’t forget the fallback</td><td>A "catch-all" route prevents dropped calls if no DID match occurs</td></tr>
          <tr><td>Document routing logic</td><td>Especially useful if using IVRs, queues, or layered flows</td></tr>
        </tbody>
      </table>
    </section>
    <section>
      <h2>Ring Groups</h2>
      <h3>What Is a Ring Group?</h3>
      <p>A Ring Group is a way to ring multiple extensions simultaneously or in sequence when a call is received. It’s typically used to reach a department, team, or group of phones (e.g., Sales, Support, Reception). Think of it as a mini broadcast system for inbound or internal calls.</p>
      <h4>Common Use Cases</h4>
      <ul>
        <li>Ring all front desk phones at once</li>
        <li>Call a group of remote support reps in order</li>
        <li>Overflow logic: ring extension 100 for 10 seconds, then ring 101 and 102</li>
        <li>Combine with Inbound Routes, IVRs, or Queues</li>
      </ul>
      <h4>Core Configuration Options</h4>
      <ul>
        <li><strong>Ring-Group Number:</strong> The internal number to dial this group (e.g., 600). Can also be a destination for Inbound Routes or IVRs.</li>
        <li><strong>Group Description:</strong> Label to identify purpose (e.g., Sales Team, Tech Support)</li>
        <li><strong>Extension List:</strong> Add one or more extensions or external numbers (e.g., 100, 101, 2485551234#). Use # at the end of external numbers.</li>
        <li><strong>Ring Strategy:</strong> Controls how the phones ring:
          <ul>
            <li>ringall: Ring all at once</li>
            <li>hunt: Ring one at a time in order</li>
            <li>memoryhunt: Ring one, then add the next, etc.</li>
            <li>firstavailable: Rings the first free extension</li>
            <li>random: Randomized order</li>
          </ul>
        </li>
        <li><strong>Ring Time:</strong> How long to ring this group (in seconds) before trying the next destination</li>
        <li><strong>Destination if No Answer:</strong> Where to send the call if no one answers (e.g., voicemail, another ring group, queue)</li>
      </ul>
      <h4>Additional Features</h4>
      <ul>
        <li><strong>CID Name Prefix:</strong> Adds a prefix to the caller ID on phones in the group. Example: Sales: makes incoming CID show as Sales:2485551212</li>
        <li><strong>Ignore CF Settings:</strong> Ignore individual extensions' call forwarding (recommended for group integrity)</li>
        <li><strong>Disable Call Forwarding:</strong> Prevent users from forwarding group calls to external destinations</li>
        <li><strong>Enable Call Confirmation:</strong> Required when calling external numbers (e.g., cell phones). Prompts remote user to "Press 1 to accept the call"</li>
        <li><strong>Remote Announce / Too-Late Announce:</strong> Audio prompts played to external users when they answer</li>
      </ul>
      <h4>Real-World Examples</h4>
      <ul>
        <li><strong>Sales Group:</strong> Extensions: 100, 101, 102. Ring Strategy: ringall. CID Prefix: Sales:. Timeout Destination: Queue 600 (to queue calls if no answer)</li>
        <li><strong>On-Call Tech:</strong> Extensions: 200. External: 5865552222#. Strategy: hunt. Call Confirm: Enabled (ensures cell phones press 1 to answer)</li>
        <li><strong>Office Hours Route:</strong> Time Condition → if open → Ring Group Reception. Time Condition → if closed → Voicemail or Announcement</li>
      </ul>
      <h4>Best Practices</h4>
      <table>
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
      <h4>Ring Groups vs. Queues</h4>
      <table>
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
    </section>
    <section>
      <h3>IVR</h3>
      <p>Explanation for IVR goes here.</p>
    </section>

    {/* --- Detailed FreePBX Reference Topics --- */}
    <section>
      <h3>Find Me/Follow Me vs Miscellaneous Destinations</h3>
      <ul>
        <li><strong>Find Me/Follow Me:</strong> Per-extension forwarding to ring external numbers (e.g., cell phone) in order or simultaneously.</li>
        <li><strong>Miscellaneous Destinations:</strong> Allows routing to external numbers or special dial strings (e.g., analog door phones).</li>
      </ul>
    </section>
    <section>
      <h3>Trunks</h3>
      <p>Trunks connect your PBX to the outside world.</p>
      <ul>
        <li>SIP/IAX2/PRI</li>
        <li>Outbound and Inbound calls flow through trunks</li>
        <li>Must be configured with your provider’s details</li>
      </ul>
    </section>
    <section>
      <h3>Dial Plans &amp; Outbound Routes</h3>
      <ul>
        <li><strong>Dial Plan:</strong> Rules that match user dialed numbers (e.g., 9|1NXXNXXXXXX to strip 9 and dial 11-digit US).</li>
        <li><strong>Outbound Routes:</strong> Routes based on dialed pattern → send to correct trunk.</li>
        <li>Can apply caller ID masking, failover trunks, and PIN codes.</li>
      </ul>
    </section>
    <section>
      <h3>Paging &amp; Intercom</h3>
      <ul>
        <li><strong>Paging:</strong> One-way audio broadcast to multiple phones.</li>
        <li><strong>Intercom:</strong> Two-way communication using auto-answer.</li>
        <li>Useful for overhead announcements or internal alerts.</li>
      </ul>
    </section>
    <section>
      <h3>User Management</h3>
      <ul>
        <li>Create User Portal (ARI/UCP) logins for voicemail, call logs, recordings.</li>
        <li>Permissions determine what features users can access (e.g., fax, call control).</li>
      </ul>
    </section>
    <section>
      <h3>Administrators</h3>
      <ul>
        <li>Web GUI admins for FreePBX</li>
        <li>Create multiple admin accounts with role-based access control</li>
        <li>"Admin", "Superadmin", or custom groups</li>
      </ul>
    </section>
    <section>
      <h3>Asterisk CLI</h3>
      <p>Command-line interface to the Asterisk core (not FreePBX GUI).</p>
      <ul>
        <li>Use <code>asterisk -rvvv</code> to connect</li>
        <li>Commands: <code>sip show peers</code>, <code>core show calls</code>, <code>dialplan show</code>, <code>reload</code></li>
      </ul>
    </section>
    <section>
      <h3>System Admin</h3>
      <p>Commercial module (or installed on FreePBX Distro):</p>
      <ul>
        <li>Configure network settings, hostname, timezone, updates, etc.</li>
        <li>Includes firewall, intrusion detection, backup</li>
      </ul>
    </section>
    <section>
      <h3>CDR (Call Detail Records)</h3>
      <ul>
        <li>Logs of all calls: date, duration, source/destination, disposition</li>
        <li>Viewable from GUI</li>
        <li>Useful for call reporting and troubleshooting</li>
      </ul>
    </section>
    <section>
      <h3>CEL (Call Event Logging)</h3>
      <ul>
        <li>More granular than CDR</li>
        <li>Logs every event in a call (ring, answer, transfer, hangup)</li>
        <li>Must be enabled and used with caution due to size</li>
      </ul>
    </section>
    <section>
      <h3>Asterisk Info</h3>
      <p>GUI access to real-time Asterisk stats:</p>
      <ul>
        <li>SIP peers</li>
        <li>Registrations</li>
        <li>Channels</li>
        <li>System status</li>
      </ul>
    </section>
    <section>
      <h3>Voicemail Admin</h3>
      <ul>
        <li>Set voicemail options globally or per-extension</li>
        <li>Control greeting behavior, PINs, email delivery</li>
        <li>Manage mailboxes centrally</li>
      </ul>
    </section>
    <section>
      <h3>Call Flow Control</h3>
      <ul>
        <li>Manual override toggles (like a switchboard button)</li>
        <li>Used to change routing paths manually (e.g., switch between day/night mode)</li>
        <li>Can be tied to BLF buttons on phones</li>
      </ul>
    </section>
    <section>
      <h3>Parking</h3>
      <ul>
        <li>Park a call (e.g., on “701”), then retrieve from another phone</li>
        <li>Parking lots can have timeouts and return destinations</li>
        <li>Advanced features in commercial module</li>
      </ul>
    </section>
    <section>
      <h3>Certificate Management</h3>
      <ul>
        <li>Install SSL certificates for secure Web GUI and provisioning</li>
        <li>Supports Let's Encrypt auto-renewal</li>
        <li>Required for secure UCP and HTTPS provisioning</li>
      </ul>
    </section>
    <section>
      <h2>Firewall</h2>
      <h3>Overview: What Does the FreePBX Firewall Do?</h3>
      <p>The FreePBX Firewall:</p>
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
      <p>It works hand-in-hand with iptables (on Linux) and can be customized to protect a local system, cloud PBX, or hybrid deployment.</p>
      <h4>Firewall Zones (Core Concept)</h4>
      <table>
        <thead>
          <tr><th>Zone</th><th>Description</th><th>Use Case</th></tr>
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
      <h4>Services Controlled by Firewall</h4>
      <table>
        <thead>
          <tr><th>Service</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Web Interface (Admin, UCP)</td><td>HTTP/HTTPS access to FreePBX GUI</td></tr>
          <tr><td>SIP/PJSIP</td><td>Call signaling ports (usually UDP 5060, 5160)</td></tr>
          <tr><td>RTP Media</td><td>Voice traffic (UDP ports 10000–20000 by default)</td></tr>
          <tr><td>SSH</td><td>Secure shell for remote access</td></tr>
          <tr><td>REST API / AMI</td><td>Used by advanced applications or external integrations</td></tr>
          <tr><td>Responsive Firewall</td><td>Dynamically adjusts rules based on traffic</td></tr>
        </tbody>
      </table>
      <h4>Responsive Firewall</h4>
      <p>This feature allows remote phones or clients to connect dynamically:</p>
      <ul>
        <li>Accepts new connections temporarily</li>
        <li>Uses SIP registration attempts to whitelist the IP</li>
        <li>If registration is successful, the IP is added to the Internal zone for a limited time</li>
        <li>Supports PJSIP, IAX, and SIP transport</li>
      </ul>
      <p><strong>Use Case:</strong> Remote Yealink or Bria softphone connects from home IP, gets added automatically.</p>
      <h4>Intrusion Detection (Fail2Ban)</h4>
      <ul>
        <li>Monitors logs for brute-force attempts (SIP, SSH, web logins)</li>
        <li>Automatically bans IPs after too many failed attempts</li>
        <li>Ban time and retry limits are configurable</li>
        <li>Logs can be viewed in <code>/var/log/fail2ban.log</code></li>
      </ul>
      <h4>Configuration Tabs</h4>
      <ul>
        <li><strong>Status:</strong> Current firewall mode: Enabled/Disabled/Testing. Summary of running services and zones</li>
        <li><strong>Interfaces:</strong> Classify each network interface (e.g., eth0) as Trusted / Internal / External. Typically: WAN = External, LAN = Internal</li>
        <li><strong>Networks:</strong> Whitelist or blacklist specific IPs or ranges. Add remote offices, admin IPs, or mobile networks here</li>
        <li><strong>Services:</strong> Toggle allowed services (per zone). Select which zones can access SIP, HTTP, SSH, etc.</li>
        <li><strong>Advanced:</strong> Adjust default ports. Modify fail2ban ban times. Manage logs and performance settings</li>
      </ul>
      <h4>Best Practices</h4>
      <ul>
        <li>✅ Whitelist your management IPs (under "Networks")</li>
        <li>✅ Set your LAN interfaces to Trusted or Internal</li>
        <li>✅ Disable unnecessary services (e.g., Web UI over WAN)</li>
        <li>✅ Use Responsive Firewall for remote phones</li>
        <li>✅ Monitor intrusion logs and adjust thresholds as needed</li>
        <li>✅ Use secure SIP passwords and avoid predictable extensions</li>
      </ul>
      <h4>Common Troubleshooting Tips</h4>
      <table>
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
    </section>
    <section>
      <h2>Extensions</h2>
      <h3>What is an Extension?</h3>
      <p>An extension in FreePBX represents a user endpoint on the phone system — usually a physical phone, a softphone, or a device that registers via SIP or PJSIP. You assign a unique number (like 101, 202, etc.) to each extension. That number becomes the internal "phone number" for that device or user.</p>
      <h4>Protocol Types (PJSIP)</h4>
      <ul>
        <li>PJSIP (recommended for new deployments): Modern protocol stack. Supports multiple registrations (e.g., multiple devices per user)</li>
      </ul>
      <h4>Common Extension Settings</h4>
      <ul>
        <li><strong>User Extension:</strong> The internal number (e.g., 1001). Unique across the system.</li>
        <li><strong>Display Name:</strong> Human-friendly label (e.g., John Smith). Appears on devices and in FreePBX GUI.</li>
        <li><strong>Secret / Password:</strong> SIP/PJSIP registration password. Should be long and secure (randomized).</li>
        <li><strong>Voicemail Settings:</strong> Enable/disable, email delivery (with or without attachment), greeting preferences, VMX Locater (press-to-redirect options while caller is in voicemail).</li>
        <li><strong>CID Options:</strong> Outbound CID controls what caller ID is presented when this extension calls out. Can override trunk-level CID with format: “John Smith” &lt;2485551234&gt;.</li>
        <li><strong>Device Options:</strong> NAT (enable for devices behind NAT/firewalls), DTMF Mode (typically RFC2833 or Auto), Transport (UDP / TCP / TLS for SIP signaling).</li>
        <li><strong>Advanced Settings:</strong> Call recording (always, never, on-demand), language code (for system prompts), codec preferences (e.g., G722, ulaw, alaw, G729), Qualify/Keepalive (ensures phone is reachable).</li>
      </ul>
      <h4>Features Tied to Extensions</h4>
      <ul>
        <li>Find Me/Follow Me: Enable follow-me behavior for calls to this extension. Ring internal and external numbers sequentially or simultaneously.</li>
        <li>Call Recording: On-demand or always-record per extension. Saved in /var/spool/asterisk/monitor.</li>
        <li>Call Forwarding: Forward all/busy/unavailable to another extension, external number, or voicemail.</li>
        <li>Call Waiting / Call Screening / Call Announce: Fine-grained controls over how additional calls are handled. Can require caller to say their name before connecting.</li>
        <li>Voicemail to Email: Email notifications of new voicemails. Attachments and delete-after-send options.</li>
        <li>User Control Panel (UCP): If enabled, users can:
          <ul>
            <li>Listen to voicemail</li>
            <li>Review call history</li>
            <li>Manage recordings</li>
            <li>Adjust Find Me/Follow Me</li>
            <li>Send/receive faxes (if enabled)</li>
            <li>Chat (with commercial modules)</li>
          </ul>
        </li>
      </ul>
      <h4>Registration: How Phones Connect</h4>
      <ul>
        <li>Username: The extension number (e.g., 1001)</li>
        <li>Password: The SIP/PJSIP secret</li>
        <li>Server: IP or FQDN of the FreePBX system</li>
        <li>Port: Typically 5060 (UDP for SIP, or 5061 for TLS/PJSIP)</li>
        <li>Once registered, the device can:
          <ul>
            <li>Receive calls directly</li>
            <li>Make internal and outbound calls</li>
            <li>Use BLFs and other features</li>
          </ul>
        </li>
      </ul>
      <h4>Extension States</h4>
      <ul>
        <li>Idle: Available for calls</li>
        <li>In Use: On a call</li>
        <li>Ringing: Incoming call</li>
        <li>Unavailable: Unregistered or not reachable</li>
        <li>These states are used by BLF lights and call center logic</li>
      </ul>
      <h4>Use Cases</h4>
      <ul>
        <li>Personal devices (e.g., desk phones)</li>
        <li>Softphones (e.g., Zoiper, Bria, Linphone)</li>
        <li>Remote users (via VPN or NAT-aware SIP)</li>
        <li>Call groups (used with ring groups/queues)</li>
      </ul>
    </section>
    <section>
      <h2>Queues</h2>
      <h3>What is a Queue?</h3>
      <p>A Queue is a structured call-holding system in FreePBX. When callers enter a queue: They wait on hold until an available agent can answer. Calls are distributed based on defined strategies (e.g., round robin, least recent). Agents can log in/out of queues manually or dynamically. You can provide music on hold, caller position, and estimated wait time.</p>
      <h4>Where to Configure Queues</h4>
      <p>Admin GUI: Applications → Queues</p>
      <h4>Core Queue Settings</h4>
      <ul>
        <li><strong>Queue Number:</strong> Internal extension number for the queue (e.g., 600)</li>
        <li><strong>Queue Name:</strong> Label that appears in reports and agent displays (e.g., Support Line, Billing Queue)</li>
      </ul>
      <h4>Agent Configuration</h4>
      <ul>
        <li><strong>Static Agents:</strong> Predefined list of extensions (always part of the queue): 100 101 102</li>
        <li><strong>Dynamic Agents:</strong> Agents log in/out with feature codes (e.g., *45). Good for hot-desking or rotating teams. Can also use hotdesk provisioning or Sangoma Phones' presence states.</li>
      </ul>
      <h4>Key Call Handling Options</h4>
      <ul>
        <li><strong>Call Distribution Strategy:</strong> Controls how calls are assigned:
          <ul>
            <li>ringall: Ring all agents simultaneously</li>
            <li>rrmemory: Round-robin with memory (next agent after last one)</li>
            <li>leastrecent: Agent who hasn’t taken a call in the longest time</li>
            <li>fewestcalls: Agent who has taken the fewest calls</li>
            <li>random: Random agent</li>
            <li>rrordered: Strict round-robin in order listed</li>
          </ul>
        </li>
        <li><strong>Max Wait Time:</strong> How long a caller will wait in the queue before timing out. If reached, the call is sent to a failover destination (voicemail, another queue, etc.)</li>
        <li><strong>Failover Destination:</strong> Where to send the call if no agents answer (voicemail, another queue, ring group)</li>
      </ul>
      <h4>Caller Experience</h4>
      <ul>
        <li><strong>Music on Hold:</strong> Keeps caller engaged while waiting. Can use custom playlists or default MOH.</li>
        <li><strong>Announce Position / Hold Time:</strong> Tells the caller their position in line or estimated wait time. Optional and configurable.</li>
        <li><strong>Periodic Announcements:</strong> Audio files played every X seconds to reassure or inform callers</li>
      </ul>
      <h4>Agent Experience</h4>
      <ul>
        <li><strong>Agent Timeout:</strong> How long to ring an agent before trying the next</li>
        <li><strong>Agent Wrap-Up Time:</strong> Pause before agent gets another call (useful for after-call work)</li>
        <li><strong>Skip Busy Agents:</strong> If enabled, agents already on a call won’t be tried</li>
        <li><strong>Call Confirm:</strong> For external agents (e.g., cell phones), prompts “Press 1 to accept this call”</li>
      </ul>
      <h4>Example Call Flow</h4>
      <ul>
        <li>Inbound Route for DID 2485551000 → Routes to Time Condition (open vs closed) → If open → Queue 600 (Support) → If no agent answers in 45 sec → Voicemail</li>
      </ul>
      <h4>Queue Reporting & Monitoring</h4>
      <ul>
        <li><strong>Built-in Tools:</strong> Reports → Asterisk Info / Queues: See live agent status and queue load</li>
        <li>UCP / FOP2 / Queues Pro (Commercial): Advanced dashboards</li>
        <li>CDR/CEL Logs: Show queue entry and exit times</li>
      </ul>
      <h4>Advanced Features (Commercial Modules)</h4>
      <table>
        <thead>
          <tr><th>Feature</th><th>Requires Commercial Module</th></tr>
        </thead>
        <tbody>
          <tr><td>Agent pause codes</td><td>Yes (Queue Pro)</td></tr>
          <tr><td>Wallboard/dashboard</td><td>Yes (Queue Wallboard)</td></tr>
          <tr><td>SLA stats and alerts</td><td>Yes (Queue Pro)</td></tr>
          <tr><td>Advanced failover logic</td><td>Yes</td></tr>
          <tr><td>Real-time supervisor tools</td><td>Yes</td></tr>
        </tbody>
      </table>
      <h4>Best Practices</h4>
      <table>
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
      <h4>Example Config: Support Queue</h4>
      <table>
        <thead>
          <tr><th>Setting</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Queue Number</td><td>600</td></tr>
          <tr><td>Queue Name</td><td>Support</td></tr>
          <tr><td>Static Agents</td><td>101, 102, 103</td></tr>
          <tr><td>Ring Strategy</td><td>leastrecent</td></tr>
          <tr><td>Max Wait Time</td><td>300 sec</td></tr>
          <tr><td>Failover</td><td>Voicemail box 600</td></tr>
          <tr><td>Music on Hold</td><td>"TechHoldMix"</td></tr>
          <tr><td>Announce Position</td><td>Yes</td></tr>
          <tr><td>Periodic Announcement</td><td>Every 45 seconds</td></tr>
          <tr><td>Agent Timeout</td><td>25 sec</td></tr>
          <tr><td>Wrap-Up</td><td>10 sec</td></tr>
        </tbody>
      </table>
    </section>
  </div>
);

export default PBXReference;
