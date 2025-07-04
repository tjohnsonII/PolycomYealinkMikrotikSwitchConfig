import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalPanel: React.FC = () => {
  const xtermRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
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

    // Connect to backend WebSocket
    const ws = new WebSocket('ws://localhost:3001/ssh');
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('Connected to SSH backend.');
    };
    ws.onmessage = (event) => {
      term.write(event.data);
    };
    ws.onclose = () => {
      term.writeln('\r\n[Connection closed]');
    };
    ws.onerror = () => {
      term.writeln('\r\n[WebSocket error]');
    };

    term.onData((data) => {
      ws.send(data);
    });

    window.addEventListener('resize', () => fitAddon.fit());
    return () => {
      ws.close();
      term.dispose();
      window.removeEventListener('resize', () => fitAddon.fit());
    };
  }, []);

  return (
    <div style={{ background: '#1e1e1e', borderRadius: 8, overflow: 'hidden', width: '100%', height: 480 }}>
      <div ref={xtermRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default TerminalPanel;
