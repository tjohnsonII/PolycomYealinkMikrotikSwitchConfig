import express from 'express';
import { exec } from 'child_process';

const router = express.Router();

// Helper to run a shell command and return output as a promise
function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return resolve({ error: stderr || err.message });
      resolve({ output: stdout });
    });
  });
}

// GET /system/vpn-status
router.get('/vpn-status', async (req, res) => {
  // openvpn3 sessions
  const openvpn3Sessions = await runCmd('openvpn3 sessions-list 2>/dev/null');
  // tun interfaces
  const tunIfaces = await runCmd("ip -o link show | awk -F': ' '/tun[0-9]+/ {print $2}'");
  // IPs for tun interfaces
  const tunIps = await runCmd("ip -o -4 addr show | awk '/tun[0-9]+/ {print $2, $4}'");
  // VPN routes
  const vpnRoutes = await runCmd("ip route | grep tun");

  res.json({
    openvpn3Sessions: openvpn3Sessions.output || '',
    tunIfaces: tunIfaces.output || '',
    tunIps: tunIps.output || '',
    vpnRoutes: vpnRoutes.output || '',
  });
});

export default router;
