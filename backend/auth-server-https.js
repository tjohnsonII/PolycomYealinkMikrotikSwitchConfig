/**
 * HTTPS Authentication Server for Polycom/Yealink Configuration App
 * 
 * This Express.js server provides JWT-based authentication with HTTPS/SSL support
 */

// Import required dependencies
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import https from 'https';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Express application
const app = express();

// SSL certificate paths
const SSL_PATHS = {
  key: path.resolve(__dirname, '../ssl/private-key.pem'),
  cert: path.resolve(__dirname, '../ssl/certificate.pem')
};

// Configuration
const PORT = process.env.AUTH_SERVER_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('⚠️  WARNING: JWT_SECRET not set in environment variables!');
  return 'fallback-insecure-secret-change-immediately';
})();

// Default admin credentials
const DEFAULT_ADMIN = {
  username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
  email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com',
  password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
};

// Path to store users
const USERS_FILE = path.join(__dirname, 'users.json');

// Email configuration
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// CORS configuration for HTTPS
app.use(cors({
  origin: [
    'https://timsablab.com:3000',
    'https://timsablab.ddn.net:3000', 
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Check SSL certificates
function checkSSLCerts() {
  try {
    if (!existsSync(SSL_PATHS.key) || !existsSync(SSL_PATHS.cert)) {
      console.error('🔒 SSL certificates not found for auth server!');
      console.error('Please ensure certificates exist at:');
      console.error('  Key:', SSL_PATHS.key);
      console.error('  Cert:', SSL_PATHS.cert);
      process.exit(1);
    }
    console.log('🔒 Auth server SSL certificates found');
    return true;
  } catch (error) {
    console.error('🔒 Error checking SSL certificates:', error);
    process.exit(1);
  }
}

// User management functions
async function initializeUsersFile() {
  try {
    // Check if users file exists
    if (!existsSync(USERS_FILE)) {
      console.log('📁 Creating initial users file...');
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
      const defaultUsers = [{
        id: 1,
        username: DEFAULT_ADMIN.username,
        email: DEFAULT_ADMIN.email,
        password: hashedPassword,
        role: 'admin',
        approved: true,
        createdAt: new Date().toISOString(),
        lastLogin: null
      }];
      
      await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
      console.log(`✅ Default admin user created: ${DEFAULT_ADMIN.username}`);
      console.log(`⚠️  Please change the default password after first login!`);
    }
  } catch (error) {
    console.error('❌ Error initializing users file:', error);
    process.exit(1);
  }
}

async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

async function saveUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users file:', error);
    return false;
  }
}

// Email functions
async function createTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.log('📧 Email not configured - registration notifications disabled');
    return null;
  }
  
  try {
    const transporter = nodemailer.createTransporter(EMAIL_CONFIG);
    await transporter.verify();
    console.log('📧 Email service connected successfully');
    return transporter;
  } catch (error) {
    console.error('📧 Email service connection failed:', error.message);
    return null;
  }
}

async function sendAdminNotification(user) {
  const transporter = await createTransporter();
  if (!transporter) return false;
  
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: process.env.ADMIN_EMAIL || DEFAULT_ADMIN.email,
      subject: 'New User Registration - Approval Required',
      html: `
        <h2>New User Registration</h2>
        <p>A new user has registered and requires approval:</p>
        <ul>
          <li><strong>Username:</strong> ${user.username}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Registration Date:</strong> ${new Date(user.createdAt).toLocaleString()}</li>
        </ul>
        <p>Please log in to the admin dashboard to approve or deny this user.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('📧 Admin notification sent successfully');
    return true;
  } catch (error) {
    console.error('📧 Failed to send admin notification:', error);
    return false;
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Admin authorization middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'auth-server',
    ssl: true,
    timestamp: new Date().toISOString() 
  });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const users = await getUsers();
    
    // Check if user already exists
    if (users.find(u => u.username === username || u.email === email)) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      approved: false, // Requires admin approval
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    users.push(newUser);
    
    if (await saveUsers(users)) {
      // Send admin notification
      await sendAdminNotification(newUser);
      
      res.status(201).json({ 
        message: 'User registered successfully. Please wait for admin approval.',
        requiresApproval: true
      });
    } else {
      res.status(500).json({ error: 'Failed to save user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const users = await getUsers();
    const user = users.find(u => u.username === username || u.email === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.approved) {
      return res.status(401).json({ 
        error: 'Account pending approval. Please contact an administrator.',
        pendingApproval: true
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await saveUsers(users);
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Approve/deny user
app.put('/api/admin/users/:id/approval', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex].approved = approved;
    users[userIndex].approvedAt = new Date().toISOString();
    users[userIndex].approvedBy = req.user.username;
    
    if (await saveUsers(users)) {
      res.json({ 
        message: `User ${approved ? 'approved' : 'denied'} successfully`,
        user: { ...users[userIndex], password: undefined }
      });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  } catch (error) {
    console.error('User approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting the last admin
    const user = users[userIndex];
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }
    
    users.splice(userIndex, 1);
    
    if (await saveUsers(users)) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get pending users count
app.get('/api/admin/pending-count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    const pendingCount = users.filter(u => !u.approved).length;
    res.json({ pendingCount });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Token validation endpoint
app.post('/api/validate-token', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Create HTTPS server
function createHTTPSServer() {
  checkSSLCerts();
  
  const options = {
    key: readFileSync(SSL_PATHS.key),
    cert: readFileSync(SSL_PATHS.cert)
  };
  
  return https.createServer(options, app);
}

// Initialize and start server
async function startServer() {
  try {
    await initializeUsersFile();
    
    const server = createHTTPSServer();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🔒 HTTPS Authentication server running on port', PORT);
      console.log('🔒 SSL/TLS enabled');
      console.log('🔒 Endpoint: https://timsablab.com:' + PORT);
      console.log('📁 Users file:', USERS_FILE);
      console.log('👤 Default admin:', DEFAULT_ADMIN.username);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔒 SIGTERM received, shutting down auth server gracefully');
      server.close(() => {
        console.log('🔒 Auth server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🔒 SIGINT received, shutting down auth server gracefully');
      server.close(() => {
        console.log('🔒 Auth server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start auth server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
