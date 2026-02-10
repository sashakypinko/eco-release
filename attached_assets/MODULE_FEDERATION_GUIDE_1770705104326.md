# Module Federation Implementation Guide

This guide explains how to implement Module Federation in a Vite + React application so it can be dynamically loaded into an Eco Host platform as a remote micro-frontend.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Step 1: Install Dependencies](#step-1-install-dependencies)
4. [Step 2: Define the Integration Contract](#step-2-define-the-integration-contract)
5. [Step 3: Create the AuthProvider](#step-3-create-the-authprovider)
6. [Step 4: Create the ApiProvider](#step-4-create-the-apiprovider)
7. [Step 5: Create the RemoteApp Module](#step-5-create-the-remoteapp-module)
8. [Step 6: Create the Module Federation Build Config](#step-6-create-the-module-federation-build-config)
9. [Step 7: Set Up the Entry Points](#step-7-set-up-the-entry-points)
10. [Step 8: Create the Standalone Bootstrap](#step-8-create-the-standalone-bootstrap)
11. [Step 9: Backend Authorization Middleware](#step-9-backend-authorization-middleware)
12. [Step 10: Permission Registry Endpoint](#step-10-permission-registry-endpoint)
13. [Step 11: Build and Serve](#step-11-build-and-serve)
14. [Host Registration](#host-registration)
15. [Multiple Exposed Modules](#multiple-exposed-modules)

---

## Overview

Module Federation allows your application to expose React components that a host application can load at runtime. The pattern used here:

- The remote app exports a **`RemoteApp`** object with `mount(container, props)` and `unmount(container)` methods.
- The host calls `mount` to render the remote app into a DOM element, passing auth context, navigation, and API base URL.
- The host calls `unmount` to cleanly tear down the remote app.
- A **standalone bootstrap** file lets you develop and test the remote app independently with mock data.

---

## Project Structure

```
your-app/
├── client/
│   └── src/
│       ├── main.tsx                    # Module Federation entry (dynamic import)
│       ├── bootstrap.tsx               # Standalone dev mode with mock auth
│       ├── App.tsx                     # RemoteApp implementation (mount/unmount)
│       ├── AppContent.tsx              # Your actual UI wrapped in providers
│       ├── index.css                   # Styles
│       ├── types/
│       │   └── contracts.ts            # TypeScript interfaces for host integration
│       ├── providers/
│       │   ├── AuthProvider.tsx         # Auth context from host
│       │   └── ApiProvider.tsx          # Axios client with configurable baseUrl
│       └── features/
│           └── your-feature/
│               └── YourPage.tsx        # Feature page components
├── server/
│   ├── routes.ts                       # API routes with permission middleware
│   └── ...
├── vite.config.ts                      # Standard Vite dev config
├── vite.federation.config.ts           # Module Federation production build
└── shared/
    └── schema.ts                       # Shared data types
```

---

## Step 1: Install Dependencies

```bash
npm install @originjs/vite-plugin-federation axios
```

The plugin `@originjs/vite-plugin-federation` enables Module Federation in Vite.

---

## Step 2: Define the Integration Contract

Create `client/src/types/contracts.ts` with the TypeScript interfaces that define the communication between host and remote:

```typescript
// client/src/types/contracts.ts

export interface UserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: number;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  domain: string;
}

export interface AuthContext {
  userId: string;
  user: UserDTO | null;
  permissions: string[];
  isAuthenticated: boolean;
  token?: string;
}

export interface RemoteAppProps {
  auth: AuthContext | null;
  navigate: (path: string) => void;
  apiBaseUrl: string;
}

export interface RemoteApp {
  mount: (container: HTMLElement, props: RemoteAppProps) => void;
  unmount: (container: HTMLElement) => void;
}
```

**Key interfaces:**

| Interface | Purpose |
|---|---|
| `AuthContext` | Auth state passed from the host (user info, permissions, token) |
| `RemoteAppProps` | All props the host passes when mounting the remote module |
| `RemoteApp` | The lifecycle contract: `mount` and `unmount` |

---

## Step 3: Create the AuthProvider

The `AuthProvider` receives auth context from the host via props (it does **not** manage its own auth state) and makes it available to all child components:

```typescript
// client/src/providers/AuthProvider.tsx

import { createContext, useContext, ReactNode } from "react";
import type { AuthContext as AuthContextType, UserDTO } from "../types/contracts";

interface AuthContextValue {
  user: UserDTO | null;
  userId: string;
  permissions: string[];
  isAuthenticated: boolean;
  navigate: (path: string) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  auth?: AuthContextType | null;
  navigate?: (path: string) => void;
}

export function AuthProvider({ children, auth, navigate }: AuthProviderProps) {
  const permissions = auth?.permissions || [];

  const value: AuthContextValue = {
    user: auth?.user || null,
    userId: auth?.userId || auth?.user?.id?.toString() || "",
    permissions,
    isAuthenticated: auth?.isAuthenticated || false,
    navigate: navigate || ((path: string) => console.warn("Navigate not provided:", path)),
    hasPermission: (permission: string) => permissions.includes(permission),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

**Usage in components:**

```typescript
const { user, hasPermission, navigate } = useAuth();

if (hasPermission('client:edit')) {
  // show edit button
}
```

---

## Step 4: Create the ApiProvider

The `ApiProvider` creates an Axios instance configured with the host-provided `apiBaseUrl`, auth token, and permissions header:

```typescript
// client/src/providers/ApiProvider.tsx

import { createContext, useContext, ReactNode, useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';

interface ApiContextValue {
  api: AxiosInstance;
  baseUrl: string;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
  baseUrl: string;
  token?: string;
  permissions?: string[];
}

export function ApiProvider({ children, baseUrl, token, permissions = [] }: ApiProviderProps) {
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(permissions.length > 0 ? { 'X-Permissions': permissions.join(',') } : {}),
      },
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('[Remote API] Unauthorized - token may be expired');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [baseUrl, token, permissions]);

  return (
    <ApiContext.Provider value={{ api, baseUrl }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
```

**How permissions flow:**

```
Host passes permissions array
  → ApiProvider puts them in X-Permissions header
  → Every API request includes the header
  → Backend middleware reads and validates the header
```

---

## Step 5: Create the RemoteApp Module

This is the file that Module Federation exposes. It implements the `RemoteApp` interface with `mount` and `unmount`:

```typescript
// client/src/App.tsx

import { createRoot, Root } from 'react-dom/client';
import type { RemoteApp, RemoteAppProps } from './types/contracts';
import { ApiProvider } from './providers/ApiProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AppContent } from './AppContent';  // Your actual UI
import './index.css';

let root: Root | null = null;

const App: RemoteApp = {
  mount: (container: HTMLElement, props: RemoteAppProps) => {
    const auth = props?.auth || {
      userId: '',
      user: null,
      permissions: [],
      isAuthenticated: false
    };
    const navigate = props?.navigate || ((path: string) => console.warn('Navigate not provided:', path));
    const apiBaseUrl = props?.apiBaseUrl || '';

    if (!apiBaseUrl) {
      console.warn('[Remote] No apiBaseUrl provided - API calls will use relative paths');
    }

    root = createRoot(container);
    root.render(
      <ApiProvider baseUrl={apiBaseUrl} token={auth.token} permissions={auth.permissions}>
        <AuthProvider auth={auth} navigate={navigate}>
          <AppContent />
        </AuthProvider>
      </ApiProvider>
    );
  },

  unmount: (_container: HTMLElement) => {
    if (root) {
      root.unmount();
      root = null;
    }
  },
};

export default App;
```

**Important:** The `mount` function wraps your UI in `ApiProvider` and `AuthProvider` so the entire component tree has access to auth and API context from the host.

---

## Step 6: Create the Module Federation Build Config

Create `vite.federation.config.ts` at the project root. This is a **separate** Vite config used only to build the `remoteEntry.js` bundle:

```typescript
// vite.federation.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "eco_clients_remote",          // Unique scope name for this remote
      filename: "remoteEntry.js",           // Output filename
      exposes: {
        // Each key is a module name the host can import
        "./App": path.resolve(import.meta.dirname, "client/src/App.tsx"),
      },
      shared: ["react", "react-dom"],       // Shared dependencies (not duplicated)
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

**Key settings:**

| Setting | Purpose |
|---|---|
| `name` | Unique identifier for this remote in the federation scope |
| `filename` | The entry file the host loads (`remoteEntry.js`) |
| `exposes` | Map of module names to source files the host can import |
| `shared` | Libraries shared between host and remote to avoid duplication |

---

## Step 7: Set Up the Entry Points

### main.tsx (Module Federation entry)

This uses a dynamic import so Module Federation can properly initialize shared dependencies before your app code runs:

```typescript
// client/src/main.tsx

import('./bootstrap');
```

This is the **only** content needed. The dynamic import is required for Module Federation to work correctly.

---

## Step 8: Create the Standalone Bootstrap

The bootstrap file lets you run and test the remote app independently, without the host:

```typescript
// client/src/bootstrap.tsx

import App from './App';
import './index.css';

const mockAuth = {
  userId: '1',
  user: {
    id: 1,
    email: 'dev@ecohost.com',
    firstName: 'Dev',
    lastName: 'User',
    isActive: true,
    roleId: 1
  },
  token: 'dev-token',
  isAuthenticated: true,
  permissions: [
    'client:view', 'client:create', 'client:edit', 'client:delete',
  ],
};

const mockProps = {
  auth: mockAuth,
  navigate: (path: string) => console.log('Navigate to:', path),
  apiBaseUrl: '/api',
};

const container = document.getElementById('root')!;

function init() {
  container.innerHTML = '';
  const appContainer = document.createElement('div');
  appContainer.id = 'app-container';
  container.appendChild(appContainer);

  App.mount(appContainer, mockProps);
}

init();
```

This provides mock auth with all permissions so you can develop the full UI without needing the host platform.

---

## Step 9: Backend Authorization Middleware

Create a middleware factory that validates permissions from the `X-Permissions` header:

```typescript
// In server/routes.ts

function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const permissionsHeader = req.headers['x-permissions'] as string | undefined;

    // Require authentication
    if (!authHeader) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse permissions from header (comma-separated)
    const userPermissions = permissionsHeader
      ? permissionsHeader.split(',').map(p => p.trim())
      : [];

    // Check if user has the required permission
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing required permission: ${permission}`
      });
    }

    next();
  };
}

// Usage on routes:
app.get("/api/clients", requirePermission("client:view"), async (_req, res) => {
  // Only runs if user has client:view permission
});

app.post("/api/clients", requirePermission("client:create"), async (req, res) => {
  // Only runs if user has client:create permission
});
```

**Authorization flow:**

```
1. Host passes permissions array via auth.permissions to remote module
2. ApiProvider sends permissions in X-Permissions header with each request
3. Backend middleware reads and validates the permission
4. Returns 403 if the required permission is missing
```

---

## Step 10: Permission Registry Endpoint

Expose an endpoint that returns all permissions this microservice requires. The host platform uses this to populate role management:

```typescript
const permissionRegistry = [
  {
    key: "client:view",
    label: "View Client",
    description: "Can view clients",
    domain: "Client",
    scope: "clientsModule",
  },
  {
    key: "client:create",
    label: "Create Client",
    description: "Can create new clients",
    domain: "Client",
    scope: "clientsModule",
  },
  // ... add all permissions
];

// No auth required - host needs this to configure roles
app.get("/api/permissions/registry", (_req, res) => {
  // Optionally filter by scope query parameter
  const scope = _req.query.scope as string | undefined;
  if (scope) {
    res.json(permissionRegistry.filter((p) => p.scope === scope));
  } else {
    res.json(permissionRegistry);
  }
});
```

**Permission naming convention:** `domain:action` (e.g., `client:view`, `product:create`)

---

## Step 11: Build and Serve

### Build the federation bundle

```bash
npx vite build --config vite.federation.config.ts
```

This outputs `remoteEntry.js` to `dist/public/assets/remoteEntry.js`.

### Serve it

Your Express server should serve the `dist/public` directory as static files. The `remoteEntry.js` will be available at:

```
https://your-deployed-url/assets/remoteEntry.js
```

### Rebuild after changes

Run the build command again whenever you change any exposed module (App.tsx, etc.) that needs to be available to the host.

---

## Host Registration

Register this remote module in the host application's Module Federation config:

```typescript
// In the host application's federation config
remotes: {
  eco_clients_remote: "https://your-deployed-url/assets/remoteEntry.js",
}
```

**Host usage example:**

```typescript
// Host loads and mounts the remote module
const remoteModule = await import("eco_clients_remote/App");

const container = document.getElementById('remote-container');

remoteModule.default.mount(container, {
  auth: {
    userId: currentUser.id,
    user: currentUser,
    permissions: currentUser.permissions,
    isAuthenticated: true,
    token: authToken,
  },
  navigate: (path) => router.push(path),
  apiBaseUrl: "https://your-remote-api.com/api",
});

// When removing:
remoteModule.default.unmount(container);
```

---

## Multiple Exposed Modules

You can expose multiple modules from the same remote app. For example, a Clients module and a Products module:

```typescript
// vite.federation.config.ts
federation({
  name: "eco_clients_remote",
  filename: "remoteEntry.js",
  exposes: {
    "./App": path.resolve(import.meta.dirname, "client/src/App.tsx"),
    "./Product": path.resolve(import.meta.dirname, "client/src/ProductApp.tsx"),
  },
  shared: ["react", "react-dom"],
})
```

Each exposed module follows the same `RemoteApp` pattern with its own `mount`/`unmount`. The host imports them separately:

```typescript
const clientsModule = await import("eco_clients_remote/App");
const productsModule = await import("eco_clients_remote/Product");
```

---

## Quick Reference

| Item | Value |
|---|---|
| Federation plugin | `@originjs/vite-plugin-federation` |
| Build command | `npx vite build --config vite.federation.config.ts` |
| Output file | `dist/public/assets/remoteEntry.js` |
| Remote entry URL | `https://your-url/assets/remoteEntry.js` |
| Permission header | `X-Permissions` (comma-separated) |
| Registry endpoint | `GET /api/permissions/registry` |
| Health endpoint | `GET /api/health` |
