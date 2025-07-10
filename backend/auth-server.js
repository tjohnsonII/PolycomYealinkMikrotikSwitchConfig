/**
 * Authentication Server for Polycom/Yealink Configuration App
 * 
 * This Express.js server provides JWT-based authentication with the following features:
 * - User registration and login
 * - Role-based access control (admin/user)
 * - Admin dashboard for user management
 * - Secure password hashing with bcrypt
 * - File-based user storage (easily replaceable with database)
 * - Environment-based configuration for security
 */

// Import required dependencies
import express from 'express';           // Web framework for Node.js
import bcrypt from 'bcryptjs';          // Password hashing library
import jwt from 'jsonwebtoken';         // JSON Web Token implementation
import cors from 'cors';                // Cross-Origin Resource Sharing middleware
import fs from 'fs/promises';           // File system operations (async/await)
import path from 'path';                // Path utilities
import { fileURLToPath } from 'url';    // URL utilities for ES modules
import dotenv from 'dotenv';            // Environment variable loader
import nodemailer from 'nodemailer';    // Email sending functionality

// ES modules compatibility: get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory's .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Express application
const app = express();

// Configuration from environment variables with fallbacks
const PORT = process.env.AUTH_SERVER_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('⚠️  WARNING: JWT_SECRET not set in environment variables!');
  console.error('   Using fallback secret - this is insecure for production!');
  console.error('   Please set JWT_SECRET in your .env file');
  return 'fallback-insecure-secret-change-immediately';
})();

// Default admin credentials from environment
const DEFAULT_ADMIN = {
  username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
  email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com',
  password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
};

// Path to store users (in production, replace with proper database)
const USERS_FILE = path.join(__dirname, 'users.json');

// Email configuration
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
};

// Admin notification email
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'tjohnson@123.net';

// Create email transporter
let emailTransporter = null;
try {
  emailTransporter = nodemailer.createTransport(EMAIL_CONFIG);
  console.log('📧 Email transporter configured');
} catch (error) {
  console.warn('⚠️  Email configuration failed:', error.message);
  console.warn('   User approval emails will not be sent');
}

// Middleware setup
app.use(cors({
  origin: [
    'https://timsablab.ddns.net:3000',
    'https://timsablab.ddns.net',
    'https://localhost:3000',
    'http://localhost:3000',
    'https://67.149.139.23:3000',
    'https://67.149.139.23'
  ],
  credentials: true
}));                            // Enable CORS for frontend communication
app.use(express.json());        // Parse JSON request bodies

/**
 * Initialize users file if it doesn't exist
 * Creates a default admin user on first run
 */
async function initUsersFile() {
  try {
    // Check if users.json file exists
    await fs.access(USERS_FILE);
  } catch {
    // File doesn't exist, create it with default admin user
    const defaultAdmin = {
      id: 1,
      username: DEFAULT_ADMIN.username,
      email: DEFAULT_ADMIN.email,
      password: await bcrypt.hash(DEFAULT_ADMIN.password, 10),  // Hash password with 10 salt rounds
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    await fs.writeFile(USERS_FILE, JSON.stringify([defaultAdmin], null, 2));
    console.log(`Created default admin user: ${DEFAULT_ADMIN.username}/${DEFAULT_ADMIN.password}`);
  }
}

/**
 * Helper function to read users from JSON file
 * @returns {Array} Array of user objects
 */
async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    // Return empty array if file doesn't exist or is corrupted
    return [];
  }
}

/**
 * Helper function to save users to JSON file
 * @param {Array} users - Array of user objects to save
 */
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * Middleware to verify JWT token
 * Extracts and validates the Bearer token from Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateToken(req, res, next) {
  // Extract token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token with JWT secret
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    // Add user info to request object for use in protected routes
    req.user = user;
    next();
  });
}

/**
 * Middleware to check if user has admin role
 * Must be used after authenticateToken middleware
 * @param {Object} req - Express request object (must have req.user from auth middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * POST /api/login
 * Authenticate user with username and password
 * 
 * Request body: { username: string, password: string }
 * Response: { token: string, user: { id, username, email, role } }
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await getUsers();
    
    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password using bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is approved (existing users without status are considered approved)
    if (user.status && user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        message: 'Your account is waiting for administrator approval. You will receive an email notification once approved.',
        status: 'pending'
      });
    }

    if (user.status && user.status === 'denied') {
      return res.status(403).json({ 
        error: 'Account access denied',
        message: 'Your account access has been denied. Please contact an administrator.',
        status: 'denied'
      });
    }

    // Generate JWT token with user info
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }  // Token expires in 24 hours
    );

    // Return token and safe user data (excluding password)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || 'approved'
      }
    });

    console.log(`✅ User logged in: ${username} (${user.role})`);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/register
 * Create a new user account
 * 
 * Request body: { username: string, email: string, password: string }
 * Response: { token: string, user: { id, username, email, role } }
 */
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const users = await getUsers();
    
    // Check if user already exists (by username or email)
    if (users.find(u => u.username === username || u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get client IP address for security logging
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Create new user object with pending approval status
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,  // Generate next available ID
      username,
      email,
      password: hashedPassword,
      role: 'user',  // Default role for new users
      status: 'pending',  // Require approval before login
      ipAddress,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null
    };

    // Add user to array and save to file
    users.push(newUser);
    await saveUsers(users);

    // Send approval request email to admin
    const emailSent = await sendApprovalRequestEmail(newUser);

    // Return registration success message (no immediate login)
    res.status(201).json({
      message: 'Registration successful! Your account is pending approval.',
      details: {
        username: newUser.username,
        email: newUser.email,
        status: 'pending',
        emailSent,
        nextSteps: 'You will receive an email notification once your account is approved.'
      }
    });

    console.log(`👤 New user registered: ${username} (${email}) - Status: pending approval`);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Send user approval request email to admin
 * @param {Object} user - User object with registration details
 */
async function sendApprovalRequestEmail(user) {
  if (!emailTransporter) {
    console.warn('⚠️  Email not configured, skipping approval email');
    return false;
  }

  try {
    const approvalUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/approve-user/${user.id}?token=${jwt.sign({userId: user.id, action: 'approve'}, JWT_SECRET, {expiresIn: '7d'})}`;
    const denyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/deny-user/${user.id}?token=${jwt.sign({userId: user.id, action: 'deny'}, JWT_SECRET, {expiresIn: '7d'})}`;

    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: ADMIN_EMAIL,
      subject: '🔐 New User Registration Approval Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔐 User Registration Request</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">123.net Phone Configuration System</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">New User Requesting Access</h2>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>👤 Username:</strong> ${user.username}</p>
              <p><strong>📧 Email:</strong> ${user.email}</p>
              <p><strong>🕒 Requested:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
              <p><strong>🌐 IP Address:</strong> ${user.ipAddress || 'Unknown'}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${approvalUrl}" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; display: inline-block; font-weight: bold;">
                ✅ APPROVE USER
              </a>
              <a href="${denyUrl}" 
                 style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; display: inline-block; font-weight: bold;">
                ❌ DENY REQUEST
              </a>
            </div>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Note:</strong> You can also approve/deny this user from the admin dashboard at 
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" style="color: #007bff;">Admin Panel</a>
              </p>
            </div>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Approval email sent to ${ADMIN_EMAIL} for user: ${user.username}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send approval email:', error.message);
    return false;
  }
}

// ============================================================================
// HEALTH CHECK ROUTE (No authentication required)
// ============================================================================

/**
 * GET /health
 * Simple health check endpoint for monitoring
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'auth-server',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ============================================================================
// AUTHENTICATED ROUTES (All routes below require valid JWT token)
// ============================================================================

/**
 * GET /api/me
 * Get current authenticated user's information
 * Requires: Authorization header with valid JWT token
 * 
 * Response: { id, username, email, role }
 */
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const users = await getUsers();
    // Find user by ID from JWT token
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return safe user data (excluding password)
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// ADMIN ROUTES (Require admin role)
// ============================================================================

/**
 * GET /api/admin/users
 * Get list of all users (admin only)
 * Requires: Authorization header with valid admin JWT token
 * 
 * Response: Array of { id, username, email, role, createdAt }
 */
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    // Return safe user data for all users (excluding passwords)
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status || 'approved', // Legacy users without status are considered approved
      createdAt: user.createdAt,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy,
      deniedAt: user.deniedAt,
      deniedBy: user.deniedBy,
      denialReason: user.denialReason,
      ipAddress: user.ipAddress
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Update a user's role (admin only)
 * Requires: Authorization header with valid admin JWT token
 * 
 * URL params: id - User ID to update
 * Request body: { role: 'admin' | 'user' }
 * Response: { id, username, email, role }
 */
app.patch('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const users = await getUsers();
    
    // Find user by ID
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role
    users[userIndex].role = role;
    await saveUsers(users);

    // Return updated user data (excluding password)
    res.json({
      id: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email,
      role: users[userIndex].role
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user account (admin only)
 * Requires: Authorization header with valid admin JWT token
 * 
 * URL params: id - User ID to delete
 * Response: { message: 'User deleted successfully' }
 */
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const users = await getUsers();
    
    // Filter out the user to delete
    const filteredUsers = users.filter(u => u.id !== parseInt(id));
    
    // Check if user was found and removed
    if (filteredUsers.length === users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save updated user list
    await saveUsers(filteredUsers);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user account (admin only)
 * Requires: Authorization header with valid admin JWT token
 * 
 * Request body: { username: string, email: string, password: string, role: 'admin' | 'user' }
 * Response: { id, username, email, role, createdAt }
 */
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
    }

    const users = await getUsers();
    
    // Check if username already exists
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate unique user ID
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: newId,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    // Add user to array and save
    users.push(newUser);
    await saveUsers(users);

    // Return safe user data (excluding password)
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// USER APPROVAL ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/pending-users
 * Get all users pending approval (admin only)
 */
app.get('/api/admin/pending-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    const pendingUsers = users
      .filter(user => user.status === 'pending')
      .map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        ipAddress: user.ipAddress
      }));

    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/admin/approve-user/:id
 * Approve a user (admin only or via email token)
 */
app.post('/api/admin/approve-user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { token, adminAction } = req.body;

    // Handle email token approval
    if (token && !adminAction) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId !== userId || decoded.action !== 'approve') {
          return res.status(400).json({ error: 'Invalid approval token' });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid or expired approval token' });
      }
    } else {
      // Handle admin dashboard approval - require authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const tokenValue = authHeader.substring(7);
      try {
        const decoded = jwt.verify(tokenValue, JWT_SECRET);
        const users = await getUsers();
        const adminUser = users.find(u => u.id === decoded.id);
        if (!adminUser || adminUser.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // Update user status
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    if (user.status !== 'pending') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Approve the user
    users[userIndex] = {
      ...user,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminAction ? 'admin_dashboard' : 'email_approval'
    };

    await saveUsers(users);

    // Send approval notification email to user
    if (emailTransporter) {
      try {
        const mailOptions = {
          from: EMAIL_CONFIG.auth.user,
          to: user.email,
          subject: '🎉 Account Approved - 123.net Phone Configuration System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🎉 Account Approved!</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">123.net Phone Configuration System</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Welcome, ${user.username}!</h2>
                
                <p>Your account has been approved and you can now log in to the system.</p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
                  <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" 
                     style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    🚀 LOGIN NOW
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  If you have any questions, please contact your administrator.
                </p>
              </div>
            </div>
          `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`📧 Approval notification sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send approval notification:', emailError.message);
      }
    }

    res.json({ 
      message: 'User approved successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'approved'
      }
    });

    console.log(`✅ User approved: ${user.username} (${user.email})`);
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/admin/deny-user/:id
 * Deny a user (admin only or via email token)
 */
app.post('/api/admin/deny-user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { token, adminAction, reason } = req.body;

    // Handle email token denial
    if (token && !adminAction) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId !== userId || decoded.action !== 'deny') {
          return res.status(400).json({ error: 'Invalid denial token' });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid or expired denial token' });
      }
    } else {
      // Handle admin dashboard denial - require authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const tokenValue = authHeader.substring(7);
      try {
        const decoded = jwt.verify(tokenValue, JWT_SECRET);
        const users = await getUsers();
        const adminUser = users.find(u => u.id === decoded.id);
        if (!adminUser || adminUser.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // Update user status
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];
    if (user.status !== 'pending') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Deny the user
    users[userIndex] = {
      ...user,
      status: 'denied',
      deniedAt: new Date().toISOString(),
      deniedBy: adminAction ? 'admin_dashboard' : 'email_denial',
      denialReason: reason || 'No reason provided'
    };

    await saveUsers(users);

    // Send denial notification email to user
    if (emailTransporter) {
      try {
        const mailOptions = {
          from: EMAIL_CONFIG.auth.user,
          to: user.email,
          subject: '❌ Account Access Denied - 123.net Phone Configuration System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">❌ Account Access Denied</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">123.net Phone Configuration System</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Access Request Denied</h2>
                
                <p>Unfortunately, your account access request has been denied.</p>
                
                ${reason ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>Reason:</strong> ${reason}
                </div>` : ''}
                
                <p style="color: #666; font-size: 14px;">
                  If you believe this is an error or have questions, please contact your administrator at 
                  <a href="mailto:${ADMIN_EMAIL}" style="color: #007bff;">${ADMIN_EMAIL}</a>.
                </p>
              </div>
            </div>
          `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`📧 Denial notification sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send denial notification:', emailError.message);
      }
    }

    res.json({ 
      message: 'User denied successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: 'denied'
      }
    });

    console.log(`❌ User denied: ${user.username} (${user.email}) - Reason: ${reason || 'No reason provided'}`);
  } catch (error) {
    console.error('Error denying user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

/**
 * Initialize the authentication server
 * 1. Create users file with default admin if it doesn't exist
 * 2. Start Express server on specified port and listen on all interfaces (0.0.0.0)
 */
initUsersFile().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth server running on http://0.0.0.0:${PORT}`);
    console.log(`Default admin credentials: ${DEFAULT_ADMIN.username}/${DEFAULT_ADMIN.password}`);
    console.log('API endpoints:');
    console.log('  POST /api/login - User login');
    console.log('  POST /api/register - User registration');
    console.log('  GET /api/me - Get current user');
    console.log('  GET /api/admin/users - Get all users (admin only)');
    console.log('  POST /api/admin/users - Create new user (admin only)');
    console.log('  PATCH /api/admin/users/:id/role - Update user role (admin only)');
    console.log('  DELETE /api/admin/users/:id - Delete user (admin only)');
  });
});
