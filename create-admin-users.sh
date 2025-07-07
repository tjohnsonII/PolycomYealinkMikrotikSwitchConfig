#!/bin/bash

# Script to create admin users in the authentication system
# Usage: ./create-admin-users.sh

set -e

echo "🔐 Creating Admin Users..."
echo ""

# Function to create a user
create_user() {
    local username=$1
    local email=$2
    local password=$3
    local role=$4
    
    echo "Creating user: $username ($email) with role: $role"
    
    local response=$(curl -s -X POST http://localhost:3002/api/admin/users \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}")
    
    if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
        echo "✅ Successfully created $username"
    else
        echo "❌ Failed to create $username: $response"
    fi
    echo ""
}

# Get admin token
echo "Getting admin authentication token..."
TOKEN=$(curl -s -X POST http://localhost:3002/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"SecureAdmin123!"}' | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token. Please check that:"
    echo "   • Auth server is running on port 3002"
    echo "   • Default admin credentials are correct"
    exit 1
fi

echo "✅ Got admin token"
echo ""

# Create all the requested admin users
create_user "tjohnson" "tjohnson@123.net" "Joshua3412@" "admin"
create_user "admin" "admin@123.net" "sdxczv@Y2023" "admin"
create_user "chyatt" "chyatt@123.net" "sdxczv@Y2023" "admin"
create_user "dgoldman" "dgoldman@123.net" "sdxczv@Y2023" "admin"
create_user "amenko" "amenko@123.net" "sdxczv@Y2023" "admin"
create_user "npomaville" "npomaville@123.net" "sdxczv@Y2023" "admin"

echo "🎉 Admin user creation complete!"
echo ""
echo "📋 Summary of created users:"
echo "   • tjohnson@123.net (password: Joshua3412@)"
echo "   • admin@123.net (password: sdxczv@Y2023)"
echo "   • chyatt@123.net (password: sdxczv@Y2023)"
echo "   • dgoldman@123.net (password: sdxczv@Y2023)"
echo "   • amenko@123.net (password: sdxczv@Y2023)"
echo "   • npomaville@123.net (password: sdxczv@Y2023)"
echo ""
echo "⚠️  Note: There are now TWO 'admin' users with different passwords:"
echo "   • admin (admin@company.com) - password: SecureAdmin123!"
echo "   • admin (admin@123.net) - password: sdxczv@Y2023"
echo ""
echo "💡 You can now log in with any of these credentials."
