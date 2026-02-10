# Micro-Frontend Integration Guide

This document describes how to integrate **Refunds Manager** as a micro-frontend into a host application, including manifest configuration and routing setup.

## Table of Contents

1. [Manifest File Structure](#manifest-file-structure)
2. [Routing Modes](#routing-modes)
3. [Internal Routing](#internal-routing)
4. [External Navigation Control](#external-navigation-control)
5. [Integration Examples](#integration-examples)

---

## Manifest File Structure

The `manifest.json` file is located at `dist/public/manifest.json` and provides metadata about the micro-frontend that host applications can consume.

### Full Schema

```json
{
  "name": "refundsManager",
  "version": "1.0.0",
  "routing": {
    "type": "hash",
    "basePath": "#"
  },
  "navigation": [
    {
      "name": "Dashboard",
      "path": "/",
      "icon": "LayoutDashboard"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique identifier for the micro-frontend (camelCase) |
| `version` | `string` | Semantic version of the micro-frontend |
| `routing.type` | `"hash" \| "browser"` | Router type used by the app |
| `routing.basePath` | `string` | URL prefix for routes (`#` for hash, `/app-name` for browser) |
| `navigation` | `NavItem[]` | Array of navigation items exposed to the host |

### Navigation Item Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display label for the navigation item |
| `path` | `string` | Route path within the micro-frontend |
| `icon` | `string` | Lucide icon name (for consistent iconography) |

### Creating/Updating the Manifest

The manifest file is **manually maintained** and should be updated when:

1. Routes are added or removed from `src/App.tsx`
2. Navigation labels change
3. Version is bumped

**Current routes defined in `src/App.tsx`:**

```typescript
const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Uploads', path: '/uploads', icon: Upload },
  { label: 'Core Pulls', path: '/pulls', icon: RefreshCw },
  { label: 'Audit Log', path: '/audit', icon: History },
  { label: 'Docs', path: '/docs', icon: FileText },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];
```

---

## Routing Modes

The application supports two routing modes:

### 1. Standalone Mode (BrowserRouter)

Used when the app runs independently at its own domain/port.

- **Router**: `BrowserRouter` from react-router-dom
- **URLs**: Clean paths like `/uploads`, `/pulls/123`
- **Config Source**: Fetches from `/api/config` endpoint
- **Entry Point**: `src/main.tsx` → `bootstrap()` function

```typescript
// Standalone initialization (src/main.tsx)
<BrowserRouter>
  <App hostContext={{ isEmbedded: false }} />
</BrowserRouter>
```

### 2. Embedded Mode (HashRouter)

Used when the app is mounted inside a host application.

- **Router**: `HashRouter` from react-router-dom
- **URLs**: Hash-based paths like `#/uploads`, `#/pulls/123`
- **Config Source**: `window.refundsManagerConfig` injected by host
- **Entry Point**: Host calls exported `mount()` function

```typescript
// Host application would use HashRouter
<HashRouter>
  <App hostContext={{ isEmbedded: true, user: 'john@example.com' }} />
</HashRouter>
```

---

## Internal Routing

### Route Definitions

Routes are defined in `src/App.tsx`:

```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/uploads" element={<Uploads />} />
  <Route path="/pulls" element={<Pulls />} />
  <Route path="/pulls/:id" element={<PullDetail />} />
  <Route path="/audit" element={<Audit />} />
  <Route path="/docs" element={<Docs />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

### Internal Navigation

Use react-router's `<Link>` component or `useNavigate` hook:

```typescript
import { Link, useNavigate } from 'react-router-dom';

// Declarative navigation
<Link to="/uploads">Go to Uploads</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate('/pulls/123');
```

### Active Route Detection

```typescript
const location = useLocation();

const isActive = (path: string): boolean => {
  if (path === '/') return location.pathname === '/';
  return location.pathname.startsWith(path);
};
```

---

## External Navigation Control

Host applications can control the micro-frontend's navigation using the `refundsNavigate` custom event.

### Event Structure

```typescript
interface RefundsNavigateEvent extends CustomEvent {
  detail: {
    path?: string;  // Target route path
  };
}
```

### Dispatching from Host Application

```typescript
// Navigate to the Uploads page
window.dispatchEvent(
  new CustomEvent('refundsNavigate', {
    detail: { path: '/uploads' }
  })
);

// Navigate to a specific pull detail
window.dispatchEvent(
  new CustomEvent('refundsNavigate', {
    detail: { path: '/pulls/123' }
  })
);

// Navigate to dashboard
window.dispatchEvent(
  new CustomEvent('refundsNavigate', {
    detail: { path: '/' }
  })
);
```

### Event Listener (Inside Micro-Frontend)

The micro-frontend listens for navigation events in `src/App.tsx`:

```typescript
useEffect(() => {
  const handleNavigate = (event: Event): void => {
    const customEvent = event as RefundsNavigateEvent;
    const path = customEvent.detail?.path;
    if (path) {
      console.log('[App] Navigation event received:', path);
      navigate(path);
    }
  };

  window.addEventListener('refundsNavigate', handleNavigate);
  return () => window.removeEventListener('refundsNavigate', handleNavigate);
}, [navigate]);
```

### Building Navigation from Manifest

Host applications can fetch the manifest and build navigation UI:

```typescript
// Host application code
async function loadMicroFrontendNav() {
  const response = await fetch('/micro-frontends/refunds-manager/manifest.json');
  const manifest = await response.json();

  return manifest.navigation.map(item => ({
    label: item.name,
    onClick: () => {
      window.dispatchEvent(
        new CustomEvent('refundsNavigate', {
          detail: { path: item.path }
        })
      );
    }
  }));
}
```

---

## Integration Examples

### Example 1: Basic Host Integration

```typescript
// host-app/src/MicroFrontendLoader.tsx
import { useEffect, useRef } from 'react';

interface MicroFrontendLoaderProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function RefundsManagerLoader({ containerRef }: MicroFrontendLoaderProps) {
  useEffect(() => {
    // Inject config before mounting
    window.refundsManagerConfig = {
      apiBaseUrl: 'https://api.example.com',
      appName: 'Refunds Manager',
      environment: 'production',
      fallbackJwtToken: 'your-jwt-token'
    };

    // Load and mount the micro-frontend
    import('/micro-frontends/refunds-manager/main.js').then(module => {
      module.mount(containerRef.current, {
        isEmbedded: true,
        user: 'current-user@example.com',
        hostOrigin: window.location.origin
      });
    });

    return () => {
      // Cleanup on unmount
      import('/micro-frontends/refunds-manager/main.js').then(module => {
        module.unmount();
      });
    };
  }, []);

  return <div ref={containerRef} id="refunds-manager-root" />;
}
```

### Example 2: Navigation Sidebar with Manifest

```typescript
// host-app/src/Sidebar.tsx
import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export function Sidebar() {
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    fetch('/micro-frontends/refunds-manager/manifest.json')
      .then(res => res.json())
      .then(manifest => setNavItems(manifest.navigation));
  }, []);

  const handleNavClick = (path: string) => {
    window.dispatchEvent(
      new CustomEvent('refundsNavigate', { detail: { path } })
    );
  };

  return (
    <nav>
      {navItems.map(item => {
        const Icon = LucideIcons[item.icon as keyof typeof LucideIcons];
        return (
          <button key={item.path} onClick={() => handleNavClick(item.path)}>
            {Icon && <Icon size={16} />}
            {item.name}
          </button>
        );
      })}
    </nav>
  );
}
```

### Example 3: Deep Linking Support

```typescript
// host-app/src/DeepLinkHandler.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function DeepLinkHandler() {
  const location = useLocation();

  useEffect(() => {
    // Parse host URL and forward to micro-frontend
    // Example: /app/refunds-manager/pulls/123 → /pulls/123
    const match = location.pathname.match(/^\/app\/refunds-manager(.*)$/);
    if (match) {
      const microFrontendPath = match[1] || '/';
      window.dispatchEvent(
        new CustomEvent('refundsNavigate', {
          detail: { path: microFrontendPath }
        })
      );
    }
  }, [location.pathname]);

  return null;
}
```

---

## Host Context

When mounting the app in embedded mode, the host provides context via the `hostContext` prop:

```typescript
interface HostContext {
  isEmbedded: boolean;      // Always true when embedded
  user?: string | null;     // Current user identifier
  hostOrigin?: string;      // Origin of the host application
}
```

Access host context inside components:

```typescript
import { useEmbedded } from '@/lib/embedded-context';

function MyComponent() {
  const { isEmbedded, user, hostOrigin } = useEmbedded();

  if (isEmbedded) {
    // Adjust behavior for embedded mode
  }
}
```

---

## Available Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Overview with statistics |
| `/uploads` | `Uploads` | File upload interface |
| `/pulls` | `Pulls` | List of core pulls |
| `/pulls/:id` | `PullDetail` | Individual pull details |
| `/audit` | `Audit` | Audit log viewer |
| `/docs` | `Docs` | Documentation |
| `/settings` | `Settings` | Application settings |

---

## Troubleshooting

### Navigation Events Not Working

1. Ensure the micro-frontend is mounted before dispatching events
2. Check browser console for `[App] Navigation event received:` logs
3. Verify the path format (should start with `/`)

### Hash vs Browser Router Mismatch

- If using HashRouter, URLs should be `#/path`, not `/path`
- The `routing.type` in manifest indicates which mode is active
- Host should check `manifest.routing.type` before building URLs

### Config Not Loading

- In standalone mode: Check `/api/config` endpoint is accessible
- In embedded mode: Ensure `window.refundsManagerConfig` is set before mounting
