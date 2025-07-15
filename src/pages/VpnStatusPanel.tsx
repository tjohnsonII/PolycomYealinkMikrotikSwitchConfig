import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/api-config';
import '../styles/inline-styles-fix.css';

interface VpnStatus {
  openvpn3Sessions: string;
  tunIfaces: string;
  tunIps: string;
  vpnRoutes: string;
}

const VpnStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<VpnStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(getApiUrl('systemVpnStatus'))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch VPN status');
        return res.json();
      })
      .then(data => {
        setStatus(data);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="vpn-status-panel">
      <h3 className="vpn-status-title">VPN Connection Status</h3>
      {loading && <div className="vpn-status-loading">Loading VPN status...</div>}
      {error && <div className="vpn-status-error">Error: {error}</div>}
      {status && (
        <>
          <div className="vpn-status-section">
            <strong className="vpn-status-label">OpenVPN 3 Sessions:</strong>
            <pre className="vpn-status-pre vpn-status-pre-sessions">{status.openvpn3Sessions || 'None'}</pre>
          </div>
          <div className="vpn-status-section">
            <strong className="vpn-status-label">TUN Interfaces:</strong>
            <pre className="vpn-status-pre vpn-status-pre-interfaces">{status.tunIfaces || 'None'}</pre>
          </div>
          <div className="vpn-status-section">
            <strong className="vpn-status-label">TUN IPs:</strong>
            <pre className="vpn-status-pre vpn-status-pre-ips">{status.tunIps || 'None'}</pre>
          </div>
          <div className="vpn-status-section">
            <strong className="vpn-status-label">VPN Routes:</strong>
            <pre className="vpn-status-pre vpn-status-pre-routes">{status.vpnRoutes || 'None'}</pre>
          </div>
        </>
      )}
    </div>
  );
};

export default VpnStatusPanel;
