#!/usr/bin/env node

/**
 * User Management Utility for Management Console
 * 
 * This script allows you to add, remove, and manage users for the
 * Phone Configuration Generator management console.
 * 
 * Usage:
 *   node user-manager.js add <username> <password> [role]
 *   node user-manager.js remove <username>
 *   node user-manager.js list
 *   node user-manager.js reset-password <username> <new-password>
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'users.json');

// Load users from file
const loadUsers = () => {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
};

// Save users to file
const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
};

// Get next user ID
const getNextId = (users) => {
    return users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
};

// Commands
const commands = {
    add: (username, password, role = 'user') => {
        const users = loadUsers();
        
        // Check if user already exists
        if (users.find(u => u.username === username)) {
            console.error(`❌ User '${username}' already exists`);
            return false;
        }
        
        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        // Create new user
        const newUser = {
            id: getNextId(users),
            username,
            email: `${username}@company.com`,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        if (saveUsers(users)) {
            console.log(`✅ User '${username}' added successfully`);
            console.log(`   Role: ${role}`);
            console.log(`   ID: ${newUser.id}`);
            return true;
        } else {
            console.error(`❌ Failed to add user '${username}'`);
            return false;
        }
    },
    
    remove: (username) => {
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.username === username);
        
        if (userIndex === -1) {
            console.error(`❌ User '${username}' not found`);
            return false;
        }
        
        users.splice(userIndex, 1);
        
        if (saveUsers(users)) {
            console.log(`✅ User '${username}' removed successfully`);
            return true;
        } else {
            console.error(`❌ Failed to remove user '${username}'`);
            return false;
        }
    },
    
    list: () => {
        const users = loadUsers();
        
        if (users.length === 0) {
            console.log('No users found');
            return;
        }
        
        console.log('📋 Management Console Users:');
        console.log('');
        
        users.forEach(user => {
            console.log(`👤 ${user.username}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`);
            console.log('');
        });
    },
    
    'reset-password': (username, newPassword) => {
        const users = loadUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            console.error(`❌ User '${username}' not found`);
            return false;
        }
        
        // Hash new password
        user.password = bcrypt.hashSync(newPassword, 10);
        
        if (saveUsers(users)) {
            console.log(`✅ Password reset for user '${username}'`);
            return true;
        } else {
            console.error(`❌ Failed to reset password for user '${username}'`);
            return false;
        }
    }
};

// Main execution
const main = () => {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📱 Phone Configuration Generator - User Management');
        console.log('');
        console.log('Usage:');
        console.log('  node user-manager.js add <username> <password> [role]');
        console.log('  node user-manager.js remove <username>');
        console.log('  node user-manager.js list');
        console.log('  node user-manager.js reset-password <username> <new-password>');
        console.log('');
        console.log('Examples:');
        console.log('  node user-manager.js add john secret123 admin');
        console.log('  node user-manager.js add jane password456');
        console.log('  node user-manager.js list');
        console.log('  node user-manager.js reset-password john newpassword');
        console.log('  node user-manager.js remove jane');
        return;
    }
    
    const command = args[0];
    
    if (!commands[command]) {
        console.error(`❌ Unknown command: ${command}`);
        console.log('Valid commands: add, remove, list, reset-password');
        return;
    }
    
    const success = commands[command](...args.slice(1));
    process.exit(success ? 0 : 1);
};

main();
