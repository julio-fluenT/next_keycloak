# Next-Keycloak-Auth

A Next.js library for Keycloak authentication that provides an easy-to-use interface for implementing Keycloak authentication in your Next.js applications.

## Installation

Using pnpm (recommended):

```bash
pnpm add next-keycloak-auth
```

Using npm:

```bash
npm install next-keycloak-auth
```

Using yarn:

```bash
yarn add next-keycloak-auth
```

## Usage

```typescript
import { KeycloakNext } from "next-keycloak-auth";

// Initialize the client
const keycloak = new KeycloakNext({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  issuer: "https://your-keycloak-server/realms/your-realm",
  redirectUri: "http://localhost:3000/callback",
});

// Sign in
await keycloak.signIn();

// Handle callback (in your callback page)
const code = new URLSearchParams(window.location.search).get("code");
if (code) {
  const tokens = await keycloak.handleCallback(code);
  // Handle successful login
}

// Check if user is authenticated
const isAuthenticated = await keycloak.isAuthenticated();

// Get user roles
const roles = await keycloak.getUserRoles();

// Check if user has specific role
const hasAdminRole = await keycloak.hasRole("admin");

// Get tokens
const accessToken = await keycloak.getAccessToken();
const idToken = await keycloak.getIdToken();
const refreshToken = await keycloak.getRefreshToken();

// Refresh tokens
await keycloak.refreshToken();

// Logout
await keycloak.logout();
```

## Features

- Easy integration with Next.js applications
- Complete Keycloak authentication flow
- Token management (access, refresh, ID tokens)
- Role-based access control
- Token refresh handling
- Secure token storage with encryption
- TypeScript support

## Configuration

The `KeycloakNext` constructor accepts a configuration object with the following properties:

```typescript
interface KeycloakConfig {
  clientId: string; // Your Keycloak client ID
  clientSecret: string; // Your Keycloak client secret
  issuer: string; // Your Keycloak realm URL
  redirectUri: string; // Your application callback URL
  encryptionKey?: string; // Optional custom encryption key for token storage
}
```

## Development

1. Install dependencies:

```bash
pnpm install
```

2. Build the package:

```bash
pnpm build
```

3. Run tests:

```bash
pnpm test
```

4. Lint code:

```bash
pnpm lint
```

## Publishing

1. Build the package:

```bash
pnpm build
```

2. Login to npm:

```bash
pnpm npm login
```

3. Publish:

```bash
pnpm publish
```

## Security

This library implements several security best practices:

- Tokens are encrypted before being stored in localStorage
- PKCE flow support for enhanced security
- Automatic token refresh handling
- Secure logout process

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
