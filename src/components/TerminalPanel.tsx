import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalPanel: React.FC = () => {
  const xtermRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ host: '', username: '', password: '' });

  // Connect and initialize terminal
  const connectSSH = () => {
    setConnecting(true);
    setError(null);
    if (!xtermRef.current) return;
    const term = new Terminal({
      fontSize: 15,
      cursorBlink: true,
      theme: { background: '#1e1e1e' },
      cols: 80,
      rows: 24,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(xtermRef.current);
    fitAddon.fit();
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const ws = new WebSocket('ws://localhost:3001/ssh');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      term.writeln('Connected to SSH backend.');
      ws.send(JSON.stringify(credentials));
    };
    ws.onmessage = (event) => {
      term.write(event.data);
    };
    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
      term.writeln('\r\n[Connection closed]');
    };
    ws.onerror = () => {
      setError('WebSocket error');
      setConnected(false);
      setConnecting(false);
      term.writeln('\r\n[WebSocket error]');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    window.addEventListener('resize', () => fitAddon.fit());
    return () => {
      ws.close();
      term.dispose();
      window.removeEventListener('resize', () => fitAddon.fit());
    };
  };

  // Only mount terminal after connect
  useEffect(() => {
    return () => {
      if (termRef.current) termRef.current.dispose();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div>
      {!connected && (
        <form
          onSubmit={e => {
            e.preventDefault();
            connectSSH();
          }}
          style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            placeholder="Host/IP"
            value={credentials.host}
            onChange={e => setCredentials({ ...credentials, host: e.target.value })}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
          />
          <input
            type="text"
            placeholder="Username"
            value={credentials.username}
            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 100 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            required
            style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 100 }}
          />
          <button type="submit" disabled={connecting} style={{ padding: '6px 18px', borderRadius: 4, background: '#0078d4', color: '#fff', border: 'none', fontWeight: 600 }}>
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
          {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
        </form>
      )}
      <div style={{ background: '#1e1e1e', borderRadius: 8, overflow: 'hidden', width: '100%', height: 480 }}>
        <div ref={xtermRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default TerminalPanel;
