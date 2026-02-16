# Prompt: Adding a Standalone Header & Sidebar to a Micro-Frontend

This prompt explains the architecture and step-by-step approach for adding a header and sidebar that only appear when the app runs in **standalone mode** (local development), while keeping the **federation mode** (embedded in a host app) clean — no sidebar, no header, just the page content.

---

## The Problem

When building a micro-frontend with Module Federation, the app has two runtime modes:

1. **Federation mode** — The host app provides its own sidebar, header, and navigation. The remote module should render only its page content.
2. **Standalone mode** — The app runs on its own (during development). It needs its own sidebar, header, and navigation to be usable.

The sidebar and header must exist in standalone mode but must **never** leak into the federation bundle.

---

## Architecture: Three-Layer Entry Point Split

The solution uses three separate entry files that form a clear chain of responsibility:

```
main.tsx → bootstrap.tsx → AppContent.tsx
                              ↑
                           App.tsx (federation entry)
```

### Layer 1: `AppContent.tsx` — Pure Routes (shared by both modes)

This is the core of the application. It contains only the Redux store, router, routes, and global providers (toaster, tooltips). **No sidebar. No header. No layout shell.**

Both standalone and federation modes render this component.

```tsx
// client/src/AppContent.tsx
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReleasesListPage from "@/features/releases/ReleasesListPage";
import ReleaseDetailPage from "@/features/releases/ReleaseDetailPage";
import TemplatesPage from "@/features/templates/TemplatesPage";
// ... other page imports

function Routes() {
  return (
    <Switch>
      <Route path="/" component={ReleasesListPage} />
      <Route path="/releases/:id" component={ReleaseDetailPage} />
      <Route path="/templates" component={TemplatesPage} />
      {/* ... other routes */}
    </Switch>
  );
}

interface AppContentProps {
  hashRouting?: boolean;  // federation uses hash routing, standalone uses path routing
}

export function AppContent({ hashRouting = false }: AppContentProps) {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <Router hook={hashRouting ? useHashLocation : undefined}>
          <Routes />
        </Router>
        <Toaster />
      </TooltipProvider>
    </Provider>
  );
}
```

**Key rules:**
- No layout components (sidebar, header) — those belong in the standalone bootstrap only
- Accepts `hashRouting` prop so federation can use `#/path` routing without conflicting with the host
- Redux store is initialized here so it is shared in both modes

---

### Layer 2: `App.tsx` — Federation Entry (no shell)

This is the Module Federation exposed module. It provides `mount()` and `unmount()` lifecycle methods that the host app calls. It wraps `AppContent` with auth and API providers but adds **no visual shell**.

```tsx
// client/src/App.tsx
import { createRoot, Root } from "react-dom/client";
import type { RemoteApp, RemoteAppProps } from "./types/contracts";
import { ApiProvider } from "./providers/ApiProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { AppContent } from "./AppContent";
import "./index.css";

let root: Root | null = null;

const App: RemoteApp = {
  mount: (container: HTMLElement, props: RemoteAppProps) => {
    const auth = props?.auth || {
      userId: "",
      user: null,
      permissions: [],
      isAuthenticated: false,
    };
    const navigate = props?.navigate || ((path: string) => console.warn("Navigate not provided:", path));
    const apiBaseUrl = props?.apiBaseUrl || "/api";

    root = createRoot(container);
    root.render(
      <ApiProvider baseUrl={apiBaseUrl} token={auth.token} permissions={auth.permissions}>
        <AuthProvider auth={auth} navigate={navigate}>
          <AppContent hashRouting />  {/* hash routing for federation */}
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

**Key rules:**
- Exposed via `vite.federation.config.ts` as `"./App"`
- Uses `hashRouting` so the remote's routes don't conflict with the host's URL routing
- Receives auth context, navigation function, and API base URL from the host via props
- No sidebar, no header — the host provides those

---

### Layer 3: `bootstrap.tsx` — Standalone Entry (with shell)

This is the **only** file that adds the sidebar and header. It wraps `AppContent` in a full layout shell with sidebar navigation, a header bar (with sidebar toggle and theme toggle), and mock auth for local development.

```tsx
// client/src/bootstrap.tsx
import { createRoot } from "react-dom/client";
import { ApiProvider } from "./providers/ApiProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { AppContent } from "./AppContent";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import "./index.css";

// Mock auth for standalone dev mode — empty permissions = allow everything
const mockAuth = {
  userId: "1",
  user: {
    id: 1,
    email: "dev@local.com",
    firstName: "Dev",
    lastName: "User",
    isActive: true,
    roleId: 1,
  },
  token: "dev-token",
  isAuthenticated: true,
  permissions: [],  // empty = hasPermission() returns true for everything
};

const mockProps = {
  auth: mockAuth,
  navigate: (path: string) => console.log("Navigate to:", path),
  apiBaseUrl: "/api",
};

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function StandaloneApp() {
  return (
    <ApiProvider baseUrl={mockProps.apiBaseUrl} token={mockProps.auth.token} permissions={mockProps.auth.permissions}>
      <AuthProvider auth={mockProps.auth} navigate={mockProps.navigate}>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
              <header className="flex items-center justify-between gap-4 p-2 border-b sticky top-0 z-50 bg-background">
                <SidebarTrigger />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <AppContent />  {/* path routing for standalone */}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </AuthProvider>
    </ApiProvider>
  );
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<StandaloneApp />);
```

**Key rules:**
- This file is **never** included in the federation build
- Wraps `AppContent` (no `hashRouting` prop = uses path-based routing)
- Provides mock auth with empty `permissions` array — the auth provider treats empty permissions as "allow everything"
- Sidebar is collapsible via `SidebarTrigger` and uses shadcn/ui `Sidebar` components

---

### Layer 0: `main.tsx` — Dynamic Import Bridge

The actual Vite entry point. It uses a dynamic `import()` so Module Federation can properly handle shared dependencies before the app initializes.

```tsx
// client/src/main.tsx
import("./bootstrap");
```

This single line is critical for Module Federation — it ensures `react` and `react-dom` are resolved from the shared scope before the app renders.

---

## Sidebar Component

The sidebar uses shadcn/ui sidebar primitives with wouter `Link` for navigation:

```tsx
// client/src/components/app-sidebar.tsx
import { useLocation, Link } from "wouter";
import { Rocket, ListChecks, Package } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Releases", path: "/", icon: Rocket },
  { title: "Checklist Templates", path: "/templates", icon: ListChecks },
];

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location === "/" || location.startsWith("/releases");
    return location.startsWith(path);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Release Manager</h2>
            <p className="text-xs text-muted-foreground">DevOps</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={isActive(item.path)}>
                    <Link href={item.path}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
```

---

## Vite Configs: Two Separate Configs

### `vite.config.ts` — Development / Standalone Build

Standard Vite config. Entry is `client/index.html` which loads `main.tsx` → `bootstrap.tsx` (with sidebar/header).

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

### `vite.federation.config.ts` — Federation Build

Separate config that exposes `App.tsx` (not `bootstrap.tsx`). This build produces `remoteEntry.js` for host consumption. The sidebar and header code from `bootstrap.tsx` is **never bundled**.

```ts
// vite.federation.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "eco_release_manager_remote",
      filename: "remoteEntry.js",
      exposes: {
        "./App": path.resolve(import.meta.dirname, "client/src/App.tsx"),
      },
      shared: ["react", "react-dom"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
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

Build command: `npx vite build --config vite.federation.config.ts`

---

## Auth & Permission Provider Pattern

The auth provider makes permissions work correctly in both modes:

```tsx
// client/src/providers/AuthProvider.tsx
export function AuthProvider({ children, auth, navigate }: AuthProviderProps) {
  const permissions = auth?.permissions || [];
  const hasExplicitPermissions = Array.isArray(auth?.permissions) && auth.permissions.length > 0;

  const value: AuthContextValue = {
    user: auth?.user || null,
    userId: auth?.userId || auth?.user?.id?.toString() || "",
    permissions,
    isAuthenticated: auth?.isAuthenticated || false,
    navigate: navigate || ((path: string) => console.warn("Navigate not provided:", path)),
    // Empty permissions = allow everything (standalone). Non-empty = strict enforcement (federation).
    hasPermission: (permission: string) => hasExplicitPermissions ? permissions.includes(permission) : true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**Permission logic:**
- Standalone mode has `permissions: []` (empty) → `hasPermission()` always returns `true` → all buttons visible
- Federation mode receives specific permissions from the host → `hasPermission()` strictly checks the list → only authorized buttons visible

---

## API Provider Pattern

The API provider configures RTK Query's base URL and auth headers at module level, so all API calls automatically include the right origin and credentials:

```tsx
// client/src/providers/ApiProvider.tsx
export function ApiProvider({ children, baseUrl, token, permissions = [] }: ApiProviderProps) {
  useEffect(() => {
    setApiConfig({ baseUrl, token, permissions });
  }, [baseUrl, token, permissions]);

  return <ApiContext.Provider value={{ baseUrl }}>{children}</ApiContext.Provider>;
}
```

- Standalone: `baseUrl` is `/api` (same origin)
- Federation: `baseUrl` is the full URL to the backend (e.g., `https://release-api.example.com/api`)
- Token and permissions are forwarded as `Authorization` and `X-Permissions` headers

---

## Integration Contract

The host app communicates with the remote via a typed contract:

```tsx
// client/src/types/contracts.ts
export interface RemoteAppProps {
  auth: AuthContext | null;    // user info, permissions, token
  navigate: (path: string) => void;  // host navigation function
  apiBaseUrl: string;          // backend URL for API calls
}

export interface RemoteApp {
  mount: (container: HTMLElement, props: RemoteAppProps) => void;
  unmount: (container: HTMLElement) => void;
}
```

---

## Summary: What Goes Where

| Concern | File | Standalone | Federation |
|---------|------|-----------|------------|
| Sidebar | `bootstrap.tsx` | Yes | No |
| Header (toggle + theme) | `bootstrap.tsx` | Yes | No |
| Routes & Redux store | `AppContent.tsx` | Yes | Yes |
| Auth/API providers | Both entries | Yes | Yes |
| Hash routing | `App.tsx` | No | Yes |
| Path routing | `bootstrap.tsx` | Yes | No |
| Mock auth | `bootstrap.tsx` | Yes | No |
| Host-provided auth | `App.tsx` | No | Yes |
| `remoteEntry.js` output | `vite.federation.config.ts` | No | Yes |

The golden rule: **`AppContent` is the shared core. `bootstrap.tsx` adds the standalone shell. `App.tsx` adds the federation lifecycle. They never mix.**
