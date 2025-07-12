// Test SAML URL extraction
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSamlUrl() {
  try {
    console.log('🔍 Testing SAML URL extraction...');
    
    const configPath = path.join(__dirname, 'backend', 'work.ovpn');
    const configContent = await fs.readFile(configPath, 'utf8');
    
    console.log('📄 VPN Config found');
    
    // Extract remote server for SAML URL construction
    const remoteMatch = configContent.match(/remote\s+([^\s]+)\s+(\d+)/i);
    if (remoteMatch) {
      const server = remoteMatch[1];
      const port = remoteMatch[2];
      
      console.log('🌐 Server found:', server);
      console.log('🔌 Port found:', port);
      
      // For work VPN, use terminal.123.net for SAML authentication
      if (server.includes('timsablab.ddns.net') || server.includes('ddns.net')) {
        console.log('✅ SAML URL: https://terminal.123.net/auth');
        return 'https://terminal.123.net/auth';
      } else {
        console.log('✅ SAML URL: https://' + server + '/auth');
        return 'https://' + server + '/auth';
      }
    } else {
      console.log('❌ No remote server found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Test the function
testSamlUrl().then(url => {
  console.log('🎯 Final SAML URL:', url);
}).catch(console.error);
