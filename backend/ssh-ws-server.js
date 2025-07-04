// Simple Node.js backend for SSH WebSocket bridge
// Run: node backend/ssh-ws-server.js

const WebSocket = require('ws');
const { Server } = require('ws');
const { Client } = require('ssh2');

const wss = new Server({ port: 3001, path: '/ssh' });

wss.on('connection', function connection(ws) {
  let sshClient = new Client();
  let shellStream = null;

  ws.send('Welcome to the PBX SSH Terminal!\r\n');

  ws.on('message', function incoming(message) {
    // On first message, expect JSON with SSH credentials
    if (!sshClient._ready) {
      try {
        const { host, username, password } = JSON.parse(message);
        sshClient.on('ready', () => {
          sshClient.shell((err, stream) => {
            if (err) {
              ws.send(`Shell error: ${err.message}\r\n`);
              ws.close();
              return;
            }
            shellStream = stream;
            stream.on('data', (data) => ws.send(data.toString()));
            stream.on('close', () => ws.close());
          });
        }).on('error', err => {
          ws.send(`SSH error: ${err.message}\r\n`);
          ws.close();
        }).connect({ host, username, password });
        sshClient._ready = true;
      } catch (e) {
        ws.send('Invalid credentials format.\r\n');
        ws.close();
      }
      return;
    }
    // Forward terminal input to SSH
    if (shellStream) shellStream.write(message);
  });

  ws.on('close', () => {
    if (sshClient) sshClient.end();
  });
});

console.log('SSH WebSocket server running on ws://localhost:3001/ssh');
