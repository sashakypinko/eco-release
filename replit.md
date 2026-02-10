# Release Management System

## Overview
A full-stack Release Management System that connects to an external MySQL database to manage software releases, release histories, checklist templates, and automated checklist generation.

## Architecture
- **Backend**: NestJS with Drizzle ORM (MySQL dialect) connecting to external MySQL database
- **Frontend**: React with Vite, Redux Toolkit (RTK Query), wouter routing, shadcn/ui components, feature-based architecture
- **Database**: External MySQL (credentials via env secrets: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT)
- **Build**: NestJS compiles to CommonJS (server/dist/), shared schema loaded via runtime require() to avoid Drizzle ESM/CJS type conflicts

## Frontend Architecture (Feature-Based with Redux Toolkit)

### App Layer (`client/src/app/`)
- `store.ts` - Redux store configuration with RTK Query middleware
- `hooks.ts` - Typed useAppDispatch and useAppSelector hooks
- `baseQuery.ts` - RTK Query fetchBaseQuery configured for /api base URL

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
- `server/src/app.module.ts` - Root NestJS module importing all feature modules
- `server/src/database/database.module.ts` - Global database module (Drizzle + MySQL2)
- `server/src/database/database.factory.ts` - MySQL connection pool and Drizzle instance factory
- `server/src/releases/releases.controller.ts` - Releases REST controller
- `server/src/releases/releases.service.ts` - Releases business logic and data access
- `server/src/release-histories/release-histories.controller.ts` - Release histories controller
- `server/src/release-histories/release-histories.service.ts` - Release histories business logic
- `server/src/checklist/checklist.controller.ts` - Checklist templates and items controller
- `server/src/checklist/checklist.service.ts` - Checklist business logic
- `server/src/reference-data/reference-data.controller.ts` - Products, users, work orders controller
- `server/src/spa-fallback.filter.ts` - NestJS exception filter for SPA routing
- `server/index.ts` - Entry point that builds and runs NestJS

## Key Files (Frontend)
- `client/src/App.tsx` - Main app with Redux Provider, sidebar layout, wouter routing
- `client/src/app/store.ts` - Redux store with RTK Query APIs and feature slices
- `client/src/components/app-sidebar.tsx` - Navigation sidebar (Releases, Templates)
- `client/src/components/theme-toggle.tsx` - Dark/light mode toggle

## NestJS Module Structure
- `AppModule` - Root module, imports all feature modules
- `DatabaseModule` (Global) - Provides DATABASE token via Drizzle ORM + MySQL2 pool
- `ReleasesModule` - Releases CRUD with auto-history creation
- `ReleaseHistoriesModule` - Release history CRUD with auto-checklist generation
- `ChecklistModule` - Checklist templates and item state management
- `ReferenceDataModule` - Products, users, work orders reference data

## API Endpoints
- `GET/POST /api/releases` - List/create releases (supports filters: product_id, user_id, status, search, page, page_size)
- `GET/PUT/DELETE /api/releases/:id` - CRUD single release
- `GET /api/releases/:id/histories` - List release histories
- `POST/PUT/DELETE /api/release-histories[/:id]` - CRUD release histories
- `PUT /api/releases/update-checklist-item-state` - Toggle checklist item (body: {id, done})
- `GET/POST/PUT/DELETE /api/checklist-templates[/:id]` - CRUD templates
- `GET /api/products`, `GET /api/users`, `GET /api/work-orders` - Reference data

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

## Recent Changes
- 2026-02-10: Migrated frontend to Redux Toolkit (RTK Query) with feature-based architecture
- 2026-02-10: Removed TanStack React Query, old Express server files (db.ts, routes.ts, static.ts, storage.ts, vite.ts), and old page files
- 2026-02-10: Migrated backend from Express.js to NestJS with modular architecture
- 2026-02-10: Initial implementation - full CRUD for releases, histories, templates, checklist items with MySQL connectivity
