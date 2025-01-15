This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Next-Keycloak

A Next.js library for Keycloak authentication that provides an easy-to-use interface for implementing Keycloak authentication in your Next.js applications.

## Installation

Using pnpm (recommended):
```bash
pnpm add @julio/next-keycloak
```

Using npm:
```bash
npm install @julio/next-keycloak
```

Using yarn:
```bash
yarn add @julio/next-keycloak
```

## Usage

```typescript
import { KeycloakNext } from '@julio/next-keycloak';

// Initialize the client
const keycloak = new KeycloakNext({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  issuer: 'https://your-keycloak-server/realms/your-realm',
  redirectUri: 'http://localhost:3000/callback'
});

// Sign in
await keycloak.signIn();

// Handle callback (in your callback page)
const code = new URLSearchParams(window.location.search).get('code');
if (code) {
  const tokens = await keycloak.handleCallback(code);
  // Handle successful login
}

// Check if user is authenticated
const isAuthenticated = await keycloak.isAuthenticated();

// Get user roles
const roles = await keycloak.getUserRoles();

// Check if user has specific role
const hasAdminRole = await keycloak.hasRole('admin');

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
  clientId: string;      // Your Keycloak client ID
  clientSecret: string;  // Your Keycloak client secret
  issuer: string;       // Your Keycloak realm URL
  redirectUri: string;  // Your application callback URL
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
