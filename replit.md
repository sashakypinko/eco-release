# Release Management System

## Overview
A full-stack Release Management System that connects to an external MySQL database to manage software releases, release histories, checklist templates, and automated checklist generation. Supports micro-frontend integration via Module Federation for embedding into host applications.

## Architecture
- **Backend**: NestJS with Drizzle ORM (MySQL dialect) connecting to external MySQL database
- **Frontend**: React with Vite, Redux Toolkit (RTK Query), wouter routing, shadcn/ui components, feature-based architecture
- **Database**: External MySQL (credentials via env secrets: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT)
- **Build**: NestJS compiles to CommonJS (server/dist/), shared schema loaded via runtime require() to avoid Drizzle ESM/CJS type conflicts
- **Module Federation**: `@originjs/vite-plugin-federation` exposes RemoteApp via `vite.federation.config.ts`

## Micro-Frontend Architecture

### Module Federation
- `client/src/App.tsx` - RemoteApp module with `mount(container, props)` and `unmount(container)` lifecycle methods
- `client/src/AppContent.tsx` - Routes and Redux store only (no sidebar/header) — used by both federation and standalone modes
- `client/src/bootstrap.tsx` - Standalone dev mode: wraps AppContent with sidebar, header, theme toggle, and mock auth
- `client/src/main.tsx` - Dynamic import of bootstrap for Module Federation compatibility
- `vite.federation.config.ts` - Separate Vite config for federation build (exposes `./App`)

### Integration Contracts (`client/src/types/contracts.ts`)
- `AuthContext` - Auth state from host (userId, user, permissions, token)
- `RemoteAppProps` - Props passed during mount (auth, navigate, apiBaseUrl)
- `RemoteApp` - Lifecycle interface: mount/unmount
- `UserDTO` / `Permission` - User and permission data structures

### Providers (`client/src/providers/`)
- `AuthProvider.tsx` - Receives auth context from host, provides `useAuth()` hook with `hasPermission()` utility
- `ApiProvider.tsx` - Configures RTK Query base URL and auth headers via `setApiConfig()`

### Configurable Base Query (`client/src/app/baseQuery.ts`)
- `setApiConfig({ baseUrl, token, permissions })` - Sets API base URL and auth headers at module level
- RTK Query `baseQuery` dynamically prepends `apiConfig.baseUrl` to all API paths
- Adds `Authorization` (Bearer token) and `X-Permissions` headers when configured

### External Navigation
- AppContent listens for `releaseManagerNavigate` custom events
- Host dispatches: `window.dispatchEvent(new CustomEvent('releaseManagerNavigate', { detail: { path: '/releases' } }))`

### Manifest (`client/public/manifest.json`)
- Describes micro-frontend name, version, routing type, and navigation items
- Used by host to build sidebar navigation from remote module metadata

### Federation Build
- Build command: `npx vite build --config vite.federation.config.ts`
- Output: `dist/public/assets/remoteEntry.js`
- Remote scope name: `eco_release_manager_remote`
- Shared dependencies: react, react-dom

## Frontend Architecture (Feature-Based with Redux Toolkit)

### App Layer (`client/src/app/`)
- `store.ts` - Redux store configuration with RTK Query middleware
- `hooks.ts` - Typed useAppDispatch and useAppSelector hooks
- `baseQuery.ts` - Configurable RTK Query fetchBaseQuery with dynamic base URL and auth headers

### Shared Layer (`client/src/shared/`)
- `types.ts` - Domain types (Release, ReleaseHistory, ChecklistItem, ChecklistTemplate, Product, User, WorkOrder, form value types)
- `constants.ts` - Status/environment options, badge variant mappings
- `utils.ts` - Date formatting utilities (formatDate, formatDateTime, toDateInputValue, toDateTimeInputValue)
- `StatusBadge.tsx` - Reusable StatusBadge and EnvironmentBadge components

### Features Layer (`client/src/features/`)

#### Releases Feature (`features/releases/`)
- `api.ts` - RTK Query API: getReleases, getReleaseById, createRelease, updateRelease, deleteRelease, createHistory, updateHistory, updateChecklistItemState
- `slice.ts` - Redux slice for filter/pagination state (search, statusFilter, productFilter, page)
- `ReleasesListPage.tsx` - Releases list with filters, pagination, table
- `ReleaseDetailPage.tsx` - Release detail with checklist toggling, history cards
- `ReleaseFormPage.tsx` - Create/edit release form
- `HistoryFormPage.tsx` - Create/edit release history form

#### Templates Feature (`features/templates/`)
- `api.ts` - RTK Query API: getTemplates, createTemplate, updateTemplate, deleteTemplate
- `slice.ts` - Redux slice for template editing state (editingTemplateId, editItems, createDialog)
- `TemplatesPage.tsx` - Checklist templates management with inline editing

#### Reference Data Feature (`features/reference-data/`)
- `api.ts` - RTK Query API: getProducts, getUsers, getWorkOrders

## Key Files (Backend)
- `shared/schema.ts` - Drizzle MySQL table definitions and Zod schemas
- `server/src/main.ts` - NestJS bootstrap with Vite dev server integration
- `server/src/app.module.ts` - Root NestJS module importing all feature modules + PermissionGuard
- `server/src/database/database.module.ts` - Global database module (Drizzle + MySQL2)
- `server/src/database/database.factory.ts` - MySQL connection pool and Drizzle instance factory
- `server/src/guards/permission.guard.ts` - NestJS guard validating X-Permissions header
- `server/src/permissions/permissions.controller.ts` - Permission registry endpoint
- `server/src/permissions/permissions.module.ts` - Permissions module
- `server/src/releases/releases.controller.ts` - Releases REST controller (with @RequirePermission)
- `server/src/releases/releases.service.ts` - Releases business logic and data access
- `server/src/release-histories/release-histories.controller.ts` - Release histories controller (with @RequirePermission)
- `server/src/release-histories/release-histories.service.ts` - Release histories business logic
- `server/src/checklist/checklist.controller.ts` - Checklist templates and items controller (with @RequirePermission)
- `server/src/checklist/checklist.service.ts` - Checklist business logic
- `server/src/reference-data/reference-data.controller.ts` - Products, users, work orders controller
- `server/src/spa-fallback.filter.ts` - NestJS exception filter for SPA routing
- `server/index.ts` - Entry point that builds and runs NestJS

## Key Files (Frontend)
- `client/src/App.tsx` - RemoteApp module (mount/unmount) for Module Federation
- `client/src/AppContent.tsx` - Routes and Redux store (no sidebar/header — those are in bootstrap.tsx for standalone mode only)
- `client/src/bootstrap.tsx` - Standalone dev bootstrap with mock auth
- `client/src/main.tsx` - Dynamic import entry for Module Federation
- `client/src/app/store.ts` - Redux store with RTK Query APIs and feature slices
- `client/src/components/app-sidebar.tsx` - Navigation sidebar (Releases, Templates)
- `client/src/components/theme-toggle.tsx` - Dark/light mode toggle

## NestJS Module Structure
- `AppModule` - Root module, imports all feature modules, registers PermissionGuard globally
- `DatabaseModule` (Global) - Provides DATABASE token via Drizzle ORM + MySQL2 pool
- `ReleasesModule` - Releases CRUD with auto-history creation
- `ReleaseHistoriesModule` - Release history CRUD with auto-checklist generation
- `ChecklistModule` - Checklist templates and item state management
- `ReferenceDataModule` - Products, users, work orders reference data
- `PermissionsModule` - Permission registry endpoint

## API Endpoints
- `GET/POST /api/releases` - List/create releases (supports filters: product_id, user_id, status, search, page, page_size)
- `GET /api/releases/board` - All releases for Kanban board (no pagination, sorted by sort_order)
- `PUT /api/releases/reorder` - Batch reorder releases (body: {items: [{id, sort_order, status?}], userId?})
- `GET/PUT/DELETE /api/releases/:id` - CRUD single release
- `GET /api/releases/:id/histories` - List release histories
- `POST/PUT/DELETE /api/release-histories[/:id]` - CRUD release histories
- `PUT /api/releases/update-checklist-item-state` - Toggle checklist item (body: {id, done})
- `GET/POST/PUT/DELETE /api/checklist-templates[/:id]` - CRUD templates
- `GET /api/products`, `GET /api/users`, `GET /api/work-orders` - Reference data
- `GET /api/permissions/registry` - Permission registry (supports ?scope filter)

## Permission System
- **Guard**: `PermissionGuard` reads `X-Permissions` header (comma-separated permission keys)
- **Decorator**: `@RequirePermission('domain:action')` on controller methods
- **Behavior**: If no X-Permissions header present, requests pass through (standalone mode). If header present, guard validates required permission is included
- **Permission format**: `domain:action` (e.g., `release:view`, `template:create`, `history:edit`)
- **Registry**: GET /api/permissions/registry returns all permissions with key, label, description, domain, scope

## Database Tables
releases, release_histories, release_checklist_items, release_checklist_templates, release_checklist_template_items, product_environments, products, users, work_orders

## Business Logic
- Creating a release auto-creates a history entry with "Created" status
- Creating a release history auto-generates checklist items from the template linked via product_environments table
- Checklist items can be individually toggled done/undone

## Technical Notes
- NestJS tsconfig uses `module: "commonjs"` with `incremental: false` and `noEmit: false`
- shared/schema.ts is excluded from NestJS compilation to avoid Drizzle ESM/CJS type conflicts
- Schema loaded at runtime via `require('../../../shared/schema')` in service files
- Vite dev server integrated via `SpaFallbackFilter` NestJS exception filter for SPA routing
- `server/nest-cli.json` configures NestJS CLI with `deleteOutDir: true`
- RTK Query uses fetchBaseQuery (not axios) to keep dependencies minimal
- RTK Query automatic tag-based cache invalidation replaces manual queryClient.invalidateQueries
- vite.federation.config.ts is a SEPARATE config from vite.config.ts (dev config is never modified)
- Module Federation build outputs remoteEntry.js for host consumption

## Recent Changes
- 2026-02-16: Added Kanban board view for releases with drag-and-drop (@dnd-kit), optimistic UI, batch reorder API, status columns
- 2026-02-16: Added sort_order column to releases table with auto-migration on startup
- 2026-02-16: Added view mode toggle (Table/Board) to ReleasesListPage with separate board API endpoint
- 2026-02-16: Converted Create/Edit Release and History forms to modal dialogs (ReleaseFormModal, HistoryFormModal)
- 2026-02-16: Added colored icons to all Details section fields (GitCommitVertical, Package, Briefcase, Contact, Calendar, etc.)
- 2026-02-16: Added inline status change dropdown in Quick Info section; Quick Info is now sticky
- 2026-02-16: Smoke Test results now shown in History card main row without expanding
- 2026-02-16: Removed form page routes from AppContent (forms are now modal-based)
- 2026-02-10: Added micro-frontend / Module Federation support (RemoteApp mount/unmount, AuthProvider, ApiProvider, configurable baseQuery, vite.federation.config.ts, manifest.json, bootstrap.tsx)
- 2026-02-10: Added NestJS PermissionGuard with @RequirePermission decorators and permission registry endpoint
- 2026-02-10: Added external navigation support via releaseManagerNavigate custom events
- 2026-02-10: Migrated frontend to Redux Toolkit (RTK Query) with feature-based architecture
- 2026-02-10: Removed TanStack React Query, old Express server files (db.ts, routes.ts, static.ts, storage.ts, vite.ts), and old page files
- 2026-02-10: Migrated backend from Express.js to NestJS with modular architecture
- 2026-02-10: Initial implementation - full CRUD for releases, histories, templates, checklist items with MySQL connectivity
