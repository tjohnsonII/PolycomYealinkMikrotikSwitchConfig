# Authentication System Documentation

## Overview
This application now includes a complete user authentication and admin management system. Users must log in to access the application, and admin users have additional privileges to manage other users.

## Features

### 🔐 Authentication
- **User Registration**: New users can create accounts with username, email, and password
- **User Login**: Existing users can log in with username and password
- **JWT Tokens**: Secure authentication using JSON Web Tokens
- **Session Management**: Automatic token validation and refresh

### 👥 User Management
- **User Roles**: Two role types - `admin` and `user`
- **Protected Routes**: Different access levels based on user roles
- **User Profile**: Display current user information in header menu

### 🛠️ Admin Dashboard
- **User Overview**: View all registered users
- **Role Management**: Promote/demote users between admin and user roles
- **User Deletion**: Remove user accounts (with confirmation)
- **Admin-Only Access**: Admin dashboard only accessible to admin users

## Getting Started

### 1. Start the Application
```bash
# Option 1: Start both servers automatically
npm run start-full

# Option 2: Start servers manually
# Terminal 1 - Authentication Server
npm run auth

# Terminal 2 - Main Application
npm run dev
```

### 2. Access the Application
- **Main Application**: http://localhost:3000
- **Authentication API**: http://localhost:3001

### 3. Default Admin Account
- **Username**: `admin`
- **Password**: `admin123`

## User Interface

### Login/Registration
- Clean, modern login form with toggle between login and registration
- Real-time error handling and validation
- Responsive design that works on all devices

### User Menu
- Located in the top-right corner when logged in
- Shows user avatar, username, and role badge for admins
- Dropdown menu with admin dashboard link (for admins) and logout

### Navigation
- Admin users see an additional "Admin" button in the main navigation
- Regular users only see standard application features

### Admin Dashboard
- Clean table view of all users
- Inline role editing with dropdown selectors
- One-click user deletion with confirmation dialogs
- Real-time updates when making changes

## Technical Details

### Backend (Node.js/Express)
- **Port**: 3001
- **Database**: File-based JSON storage (easily replaceable with proper database)
- **Security**: bcrypt password hashing, JWT token authentication
- **CORS**: Enabled for frontend communication

### Frontend (React/TypeScript)
- **Authentication Context**: Global auth state management
- **Protected Routes**: Component-based route protection
- **TypeScript**: Full type safety for user data and API responses
- **Modern UI**: Gradient backgrounds, smooth animations, responsive design

### API Endpoints

#### Public Endpoints
- `POST /api/login` - User login
- `POST /api/register` - User registration

#### Protected Endpoints
- `GET /api/me` - Get current user info

#### Admin Endpoints
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Plain text passwords are never stored

### JWT Tokens
- 24-hour expiration time
- Includes user ID, username, and role
- Automatically validated on protected routes

### Role-Based Access
- Admin-only routes and components
- Middleware verification for admin endpoints
- Frontend role checking for UI elements

## File Structure

```
backend/
├── auth-server.js          # Authentication server
└── users.json             # User data storage (auto-generated)

src/
├── components/
│   ├── AuthContext.tsx     # Authentication state management
│   ├── ProtectedRoute.tsx  # Route protection component
│   └── UserMenu.tsx        # User dropdown menu
└── pages/
    ├── Login.tsx           # Login/registration page
    ├── AdminPage.tsx       # Admin dashboard
    └── App.tsx            # Main app with auth integration
```

## Customization

### Styling
All components use inline styles with a consistent design system:
- **Primary Colors**: Purple gradient (#667eea to #764ba2)
- **Success**: Green (#28a745)
- **Danger**: Red (#dc3545)
- **Neutral**: Gray scale for backgrounds and text

### Adding New Roles
To add additional user roles:
1. Update the role type in `AuthContext.tsx`
2. Add role validation in `auth-server.js`
3. Update UI components to handle new roles

### Database Integration
To replace file storage with a database:
1. Replace the `getUsers()` and `saveUsers()` functions in `auth-server.js`
2. Add database connection and models
3. Update user creation and validation logic

## Troubleshooting

### Common Issues

**Auth server won't start**
- Check if port 3001 is available
- Verify all dependencies are installed: `npm install`

**Users can't log in**
- Check if auth server is running on port 3001
- Verify browser console for network errors
- Check CORS configuration if accessing from different domains

**Admin features not showing**
- Verify user has admin role in the user menu
- Check browser network tab for API request failures
- Ensure JWT token is valid and not expired

### Development Tips

**Testing User Roles**
1. Log in as admin (admin/admin123)
2. Go to Admin Dashboard
3. Create a test user or change existing user roles
4. Log out and test different role access levels

**API Testing**
Use curl or Postman to test API endpoints:
```bash
# Login and get token
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token for protected routes
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/me
```

## Next Steps

Potential enhancements for the authentication system:
- Email verification for new accounts
- Password reset functionality
- Two-factor authentication
- Session management (force logout, view active sessions)
- Audit logging for admin actions
- Bulk user operations
- User profile editing
- Password strength requirements
- Account lockout after failed attempts

This authentication system provides a solid foundation that can be extended based on your specific requirements.
