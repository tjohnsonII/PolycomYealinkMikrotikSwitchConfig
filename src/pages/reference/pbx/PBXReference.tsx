import React from 'react';

const PBXReference: React.FC = () => (
  <div style={{ width: '100%', textAlign: 'left' }}>
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
      {/* Add more FreePBX topics here as needed */}
    </ul>
  </div>
);

export default PBXReference;
