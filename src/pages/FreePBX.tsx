import React from 'react';

const FreePBX: React.FC = () => (
  <div style={{ maxWidth: 900, margin: '24px auto', padding: 24 }}>
    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>FreePBX Feature Reference</h1>
    <ul style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
      <li><b>Inbound Routes</b><br />
        Inbound Routes tell FreePBX how to handle calls coming in from the outside (e.g., from SIP trunks). Routing is typically based on:
        <ul>
          <li><b>DID (Direct Inward Dialing):</b> The number dialed.</li>
          <li><b>Caller ID:</b> Who is calling.</li>
        </ul>
        These routes can send calls to IVRs, extensions, queues, etc.
      </li>
      <li><b>Firewall</b><br />
        The integrated FreePBX Firewall protects the PBX from unauthorized access. It uses zones:
        <ul>
          <li><b>Trusted:</b> Internal devices (phones, admin IPs).</li>
          <li><b>Internet:</b> Remote SIP endpoints.</li>
          <li><b>Blocked:</b> Explicitly denied IPs.</li>
        </ul>
        It controls traffic for SIP, SSH, Web GUI, etc., and includes intrusion detection (Fail2Ban).
      </li>
      <li><b>Extensions</b><br />
        Each user/phone gets an extension—this is their internal number.
        <ul>
          <li>SIP or PJSIP protocol</li>
          <li>Each extension can have voicemail, call forwarding, Find Me/Follow Me, etc.</li>
          <li>Extensions register to the PBX and are used in routing.</li>
        </ul>
      </li>
      <li><b>Ring Groups</b><br />
        Ring groups allow you to ring multiple extensions simultaneously or in sequence. Use for:
        <ul>
          <li>Departments (e.g., Sales group rings 101, 102, 103).</li>
          <li>Configurable ring strategy (all at once, in order, etc.)</li>
        </ul>
      </li>
      <li><b>Queues</b><br />
        Queues are like enhanced ring groups, ideal for call centers.
        <ul>
          <li>Callers wait in line.</li>
          <li>Calls are distributed to agents based on rules (round robin, least recent, etc.).</li>
          <li>Can use hold music, position announcements, etc.</li>
        </ul>
      </li>
      <li><b>Time Conditions</b><br />
        Time-based routing logic.
        <ul>
          <li>Combine a Time Group (schedule) with an If/Else route:</li>
          <ul>
            <li>If open hours → go to IVR</li>
            <li>Else → go to voicemail or announcement</li>
          </ul>
        </ul>
      </li>
      <li><b>Announcements</b><br />
        Play a recorded message before proceeding to a destination.
        <ul>
          <li>Used for disclaimers, instructions, or temporary closures.</li>
          <li>Optionally allow the call to continue afterward.</li>
        </ul>
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
);

export default FreePBX;
