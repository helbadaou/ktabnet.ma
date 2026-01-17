# JWT Authentication Implementation

This document describes the JWT (JSON Web Token) authentication implementation in the ktabnet.ma project.

## Overview

The application has been updated to use JWT-based authentication while maintaining backwards compatibility with the existing session-based cookie authentication. This provides a more modern, stateless authentication approach suitable for API consumption and mobile clients.

## Backend Changes

### 1. JWT Utilities (`backend/utils/jwt.go`)

- **GenerateJWT**: Creates a new JWT token for a user with 30-day expiration
- **ValidateJWT**: Validates a JWT token and returns the user claims
- JWT secret is configurable via `JWT_SECRET` environment variable

### 2. JWT Middleware (`backend/utils/jwt_middleware.go`)

- **JWTMiddleware**: HTTP middleware that validates JWT tokens from Authorization header
- **GetUserIDFromContext**: Helper to extract user ID from request context

### 3. Updated Login Handler (`backend/handlers/auth_handler.go`)

The login handler now:
- Generates a JWT token upon successful authentication
- Returns both user data and JWT token in the response
- Still creates a session cookie for backwards compatibility (WebSocket, etc.)

Response format:
```json
{
  "user": {
    "ID": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Updated Session Service (`backend/services/session_service.go`)

The `GetUserIDFromSession` method now:
1. First attempts to validate JWT token from Authorization header
2. Falls back to session cookie validation if no JWT token is present
3. Supports both authentication methods simultaneously

## Frontend Changes

### 1. Updated AuthContext (`frontend/src/app/context/AuthContext.tsx`)

- Stores JWT token in localStorage
- Includes token in the auth context
- Checks for JWT token on page load
- Falls back to cookie-based authentication if no JWT token

### 2. Updated Login Flow (`frontend/src/app/pages/Login.tsx`)

- Extracts JWT token from login response
- Stores token via the login method
- Handles both old and new response formats

### 3. Authenticated Fetch Utility (`frontend/src/app/utils/api.ts`)

A new utility function `authenticatedFetch` that:
- Automatically adds Authorization header with JWT token
- Falls back to cookie-based authentication if no token
- Clears expired tokens on 401 responses
- Simplifies API calls throughout the application

Usage example:
```typescript
import { authenticatedFetch } from '../utils/api';

// Simple GET request
const response = await authenticatedFetch('/api/books');

// POST request
const response = await authenticatedFetch('/api/books', {
  method: 'POST',
  body: formData,
});
```

## Configuration

### Environment Variables

Set the following environment variable in production:

```bash
export JWT_SECRET="your-secret-key-at-least-32-characters-long"
```

⚠️ **Important**: The default secret key is for development only. Always use a strong, random secret in production.

## Authentication Flow

### Login Flow

1. User submits email and password
2. Backend validates credentials
3. Backend generates JWT token and session cookie
4. Frontend receives response with user data and JWT token
5. Frontend stores JWT token in localStorage
6. Frontend stores user data in context

### API Request Flow

1. Frontend makes API request
2. `authenticatedFetch` adds Authorization header with JWT token
3. Backend validates JWT token (or falls back to session cookie)
4. Backend processes request with authenticated user context

### Logout Flow

1. User initiates logout
2. Frontend clears JWT token from localStorage
3. Frontend calls logout API (clears session cookie)
4. Frontend clears user data from context

## Backwards Compatibility

The implementation maintains full backwards compatibility:

- Session cookies are still created on login
- All existing endpoints work with both JWT and session cookies
- WebSocket connections can continue using session cookies
- Gradual migration path for clients

## Security Considerations

1. **JWT Secret**: Use a strong, random secret key in production
2. **HTTPS**: Always use HTTPS in production to protect tokens in transit
3. **Token Expiration**: Tokens expire after 30 days
4. **XSS Protection**: Tokens in localStorage are vulnerable to XSS - ensure proper input sanitization
5. **Token Storage**: Consider using httpOnly cookies for JWT in high-security scenarios

## Testing

### Manual Testing

1. **Login**: Test that login returns JWT token
2. **API Calls**: Test that authenticated endpoints accept JWT tokens
3. **Token Expiration**: Test behavior when token expires
4. **Logout**: Test that logout clears token and session

### Example cURL Commands

```bash
# Login and get JWT token
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use JWT token for API request
curl http://localhost:8080/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Migration Guide

To update existing pages to use JWT authentication:

1. Import the `authenticatedFetch` utility:
   ```typescript
   import { authenticatedFetch } from '../utils/api';
   ```

2. Replace `fetch(apiUrl(...), { credentials: 'include' })` with:
   ```typescript
   authenticatedFetch('/api/endpoint')
   ```

3. The utility handles JWT tokens automatically while maintaining cookie-based auth fallback

## Future Improvements

- [ ] Add refresh token mechanism for longer sessions
- [ ] Implement token renewal before expiration
- [ ] Add role-based access control (RBAC) to JWT claims
- [ ] Implement JWT blacklist for revoked tokens
- [ ] Add rate limiting per user token
- [ ] Migrate WebSocket authentication to JWT
