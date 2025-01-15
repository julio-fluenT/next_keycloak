# Next-Keycloak-Auth Usage Guide

This guide provides a complete walkthrough for integrating the `next-keycloak-auth` package into your Next.js application.

## Table of Contents

1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Keycloak Setup](#keycloak-setup)
5. [Implementation Steps](#implementation-steps)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

## Installation

```bash
# Using pnpm (recommended)
pnpm add next-keycloak-auth

# Using npm
npm install next-keycloak-auth

# Using yarn
yarn add next-keycloak-auth
```

## Initial Setup

### 1. Create KeycloakProvider Component

Create `src/components/KeycloakProvider.tsx`:

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { KeycloakNext } from "next-keycloak-auth";

interface AuthContextType {
  keycloak: KeycloakNext;
  isAuthenticated: boolean;
  isLoading: boolean;
  roles: string[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const keycloak = new KeycloakNext({
  clientId: process.env.NEXT_PUBLIC_KC_FRONTEND_CLIENT_ID || "",
  clientSecret: process.env.KC_FRONTEND_CLIENT_SECRET || "",
  issuer: process.env.NEXT_PUBLIC_AUTH_ISSUER || "",
  redirectUri: process.env.NEXT_PUBLIC_NEXTAUTH_URL
    ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/callback`
    : "http://localhost:3000/callback",
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function KeycloakProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await keycloak.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userRoles = await keycloak.getUserRoles();
          setRoles(userRoles);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    await keycloak.signIn();
  };

  const logout = async () => {
    await keycloak.logout(
      process.env.NEXT_PUBLIC_END_SESSION_URL ||
        "http://localhost:8080/realms/your-realm/protocol/openid-connect/logout"
    );
  };

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        isAuthenticated,
        isLoading,
        roles,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a KeycloakProvider");
  }
  return context;
}
```

### 2. Create Protected Route Component

Create `src/components/ProtectedRoute.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./KeycloakProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, roles, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }

    if (isAuthenticated && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) =>
        roles.includes(role)
      );
      if (!hasRequiredRole) {
        router.push("/unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, roles, requiredRoles, router, login]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 3. Create Callback Page

Create `src/app/callback/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/KeycloakProvider";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { keycloak } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        if (code) {
          await keycloak.handleCallback(code);
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Callback error:", error);
        router.push("/");
      }
    };

    handleCallback();
  }, [keycloak, router, searchParams]);

  return <div>Processing login...</div>;
}
```

### 4. Create Unauthorized Page

Create `src/app/unauthorized/page.tsx`:

```tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Access Denied</h1>
      <p className="mt-4">You do not have permission to access this page.</p>
    </div>
  );
}
```

### 5. Update Root Layout

Update `src/app/layout.tsx`:

```tsx
import { KeycloakProvider } from "@/components/KeycloakProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <KeycloakProvider>{children}</KeycloakProvider>
      </body>
    </html>
  );
}
```

## Environment Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_KC_FRONTEND_CLIENT_ID=your-client-id
KC_FRONTEND_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_AUTH_ISSUER=http://localhost:8080/realms/your-realm
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_END_SESSION_URL=http://localhost:8080/realms/your-realm/protocol/openid-connect/logout
```

## Keycloak Setup

1. Create a new realm in Keycloak
2. Create a new client:
   - Client ID: `your-client-id`
   - Access Type: confidential
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`
3. Get the client secret from the Credentials tab
4. Create roles and assign them to users

## Implementation Steps

### 1. Protected Pages

Create a protected dashboard page (`src/app/dashboard/page.tsx`):

```tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/KeycloakProvider";

export default function DashboardPage() {
  const { roles, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Your roles: {roles.join(", ")}</p>
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    </ProtectedRoute>
  );
}
```

### 2. Role-Based Access

Example of a protected admin page (`src/app/admin/page.tsx`):

```tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        {/* Admin-only content */}
      </div>
    </ProtectedRoute>
  );
}
```

## Advanced Usage

### Custom Token Storage

The package uses localStorage by default, but you can provide a custom encryption key:

```typescript
const keycloak = new KeycloakNext({
  // ... other config
  encryptionKey: "your-custom-encryption-key",
});
```

### Token Refresh

Token refresh is handled automatically, but you can manually refresh:

```typescript
const refreshed = await keycloak.refreshToken();
if (refreshed) {
  // Token refreshed successfully
}
```

### Access Token Validation

```typescript
const isValid = await keycloak.isAuthenticated();
if (isValid) {
  const token = await keycloak.getAccessToken();
  // Use token for API requests
}
```

## Troubleshooting

### CORS Issues

If you encounter CORS issues, ensure your Keycloak client has the correct Web Origins configured. You may also need to add CORS headers in your Next.js config:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Common Issues

1. **Token Not Found**: Ensure you're calling `handleCallback` in your callback page
2. **Invalid Redirect URI**: Check if the redirect URI in your config matches Keycloak
3. **Role Check Failed**: Verify the roles exist in Keycloak and are assigned to users
4. **Token Refresh Failed**: Check if your client secret is correct

## Best Practices

1. Always use environment variables for sensitive information
2. Implement proper error handling in your callback page
3. Use the `ProtectedRoute` component for all protected pages
4. Keep the KeycloakProvider at the root level of your application
5. Use TypeScript for better type safety and developer experience

## Security Considerations

1. Never expose your client secret in client-side code
2. Always use HTTPS in production
3. Implement proper session management
4. Regularly rotate your client secret
5. Use the minimum required roles and permissions

For more information and updates, visit the [GitHub repository](hhttps://github.com/julio-fluenT/next_keycloak) and for test project (https://github.com/julio-fluenT/test_next).
