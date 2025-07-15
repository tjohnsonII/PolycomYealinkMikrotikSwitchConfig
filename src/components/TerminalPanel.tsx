import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { getWsUrl } from '../utils/api-config';
import 'xterm/css/xterm.css';
import '../styles/inline-styles-fix.css';

const TerminalPanel: React.FC = () => {
  const xtermRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ host: '', username: '', password: '' });

  const connectSSH = () => {
    setConnecting(true);
    setError(null);
    if (!xtermRef.current) return;
    
    // Clean up any existing terminal
    if (termRef.current) {
      termRef.current.dispose();
    }
    
    const term = new Terminal({
      fontSize: 14,
      cursorBlink: true,
      theme: { 
        background: '#1e1e1e', 
        foreground: '#ffffff',
        cursor: '#ffffff'
      },
      cols: 80,
      rows: 24,
      scrollback: 1000,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(xtermRef.current);
    
    // Fit terminal to container
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
    
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const ws = new WebSocket(getWsUrl('ssh'));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      term.writeln('🔗 Connected to SSH backend');
      term.writeln('📡 Sending credentials...');
      ws.send(JSON.stringify(credentials));
    };
    
    ws.onmessage = (event) => {
      if (term) {
        term.write(event.data);
      }
    };
    
    ws.onclose = (event) => {
      setConnected(false);
      setConnecting(false);
      if (term) {
        if (event.code === 1000) {
          term.writeln('\r\n✅ Connection closed normally');
        } else {
          term.writeln('\r\n❌ Connection lost (code: ' + event.code + ')');
          term.writeln('💡 Click "Reconnect" to establish a new connection');
        }
      }
    };
    
    ws.onerror = () => {
      setError('Connection failed - check VPN and server status');
      setConnected(false);
      setConnecting(false);
      if (term) {
        term.writeln('\r\n❌ Connection error');
        term.writeln('💡 Ensure VPN is connected and FreePBX server is accessible');
      }
    };

    // Handle terminal input
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddon && term) {
        setTimeout(() => fitAddon.fit(), 10);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (term) {
        term.dispose();
      }
    };
  };

  // Disconnect function
  const disconnectSSH = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setConnected(false);
    setConnecting(false);
    setError(null);
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
          className="terminal-panel-form"
        >
          <input
            type="text"
            placeholder="Host/IP (e.g., 69.39.69.102)"
            value={credentials.host}
            onChange={e => setCredentials({ ...credentials, host: e.target.value })}
            required
            className="terminal-panel-input"
          />
          <input
            type="text"
            placeholder="Username (e.g., root)"
            value={credentials.username}
            onChange={e => setCredentials({ ...credentials, username: e.target.value })}
            required
            className="terminal-panel-input username"
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            required
            className="terminal-panel-input password"
          />
          <button 
            type="submit" 
            disabled={connecting} 
            className="terminal-panel-connect-button"
          >
            {connecting ? '🔄 Connecting...' : '🔌 Connect SSH'}
          </button>
        </form>
      )}
      
      {connected && (
        <div className="terminal-panel-connection-status">
          <span className="terminal-panel-connected-text">
            ✅ Connected to {credentials.host}
          </span>
          <button
            onClick={disconnectSSH}
            className="terminal-panel-disconnect-button"
          >
            🔌 Disconnect
          </button>
        </div>
      )}
      
      {error && (
        <div className="terminal-panel-error">
          ❌ {error}
        </div>
      )}
      
      <div className="terminal-panel-container">
        <div ref={xtermRef} className="terminal-panel-xterm" />
      </div>
    </div>
  );
};

export default TerminalPanel;
