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

// Middleware setup
app.use(cors());                // Enable CORS for frontend communication
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
        role: user.role
      }
    });
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
    
    // Create new user object
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,  // Generate next available ID
      username,
      email,
      password: hashedPassword,
      role: 'user',  // Default role for new users
      createdAt: new Date().toISOString()
    };

    // Add user to array and save to file
    users.push(newUser);
    await saveUsers(users);

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and safe user data (excluding password)
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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
      createdAt: user.createdAt
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
