# Admin Users Summary

## Successfully Created Admin Users

The following admin users have been created in the system:

| Username | Email | Password | Role | Status |
|----------|-------|----------|------|--------|
| admin | admin@company.com | SecureAdmin123! | admin | ✅ Original admin |
| tjohnson | tjohnson@123.net | Joshua3412@ | admin | ✅ Created |
| chyatt | chyatt@123.net | sdxczv@Y2023 | admin | ✅ Created |
| dgoldman | dgoldman@123.net | sdxczv@Y2023 | admin | ✅ Created |
| amenko | amenko@123.net | sdxczv@Y2023 | admin | ✅ Created |
| npomaville | npomaville@123.net | sdxczv@Y2023 | admin | ✅ Created |

## How to Create More Admin Users

### Method 1: Using the Script (Recommended)
```bash
./create-admin-users.sh
```

### Method 2: Automatic Creation on Startup
1. Add `CREATE_ADMIN_USERS=true` to your `.env` file
2. Run `./start-unified-app.sh`

### Method 3: Manual API Calls
```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3002/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"SecureAdmin123!"}' | jq -r '.token')

# Create user
curl -X POST http://localhost:3002/api/admin/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"username":"newuser","email":"user@example.com","password":"password123","role":"admin"}'
```

### Method 4: Using the Web UI
1. Log in as admin at http://localhost:3000
2. Go to Admin → User Management
3. Click "Create New User"
4. Fill in the form and set role to "admin"

## Enhanced Startup Script Features

The `start-unified-app.sh` script now includes:

- **Port Management**: Automatically kills any processes using required ports
- **Dependency Checks**: Verifies Node.js, npm, and other requirements
- **Service Health Checks**: Ensures all services start properly
- **Automatic Admin User Creation**: Optionally creates admin users on startup
- **Enhanced Error Handling**: Better error messages and recovery
- **Process Monitoring**: Tracks all started processes for cleanup

## Security Notes

⚠️ **Important**: The passwords listed above are for development/testing only. In production:

1. Use strong, unique passwords for each admin user
2. Enable 2FA if implemented
3. Regularly rotate passwords
4. Monitor admin access logs
5. Use environment variables for sensitive data

## Files Modified

- `start-unified-app.sh` - Enhanced startup script
- `create-admin-users.sh` - Dedicated user creation script
- `.env.example` - Added CREATE_ADMIN_USERS option
- `backend/users.json` - Contains all user data (automatically managed)

## Usage Examples

```bash
# Start all services (recommended)
./start-unified-app.sh

# Create admin users only
./create-admin-users.sh

# Enable automatic user creation
echo "CREATE_ADMIN_USERS=true" >> .env
./start-unified-app.sh
```
