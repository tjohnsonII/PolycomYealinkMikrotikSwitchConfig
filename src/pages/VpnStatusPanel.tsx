import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/api-config';

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
    <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, margin: '16px 0' }}>
      <h3>VPN Connection Status</h3>
      {loading && <div>Loading VPN status...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {status && (
        <>
          <div>
            <strong>OpenVPN 3 Sessions:</strong>
            <pre style={{ background: '#111', color: '#0f0', padding: 8 }}>{status.openvpn3Sessions || 'None'}</pre>
          </div>
          <div>
            <strong>TUN Interfaces:</strong>
            <pre style={{ background: '#111', color: '#0ff', padding: 8 }}>{status.tunIfaces || 'None'}</pre>
          </div>
          <div>
            <strong>TUN IPs:</strong>
            <pre style={{ background: '#111', color: '#ff0', padding: 8 }}>{status.tunIps || 'None'}</pre>
          </div>
          <div>
            <strong>VPN Routes:</strong>
            <pre style={{ background: '#111', color: '#fff', padding: 8 }}>{status.vpnRoutes || 'None'}</pre>
          </div>
        </>
      )}
    </div>
  );
};

export default VpnStatusPanel;
