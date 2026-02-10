# Release Management System

## Overview
A full-stack Release Management System that connects to an external MySQL database to manage software releases, release histories, checklist templates, and automated checklist generation.

## Architecture
- **Backend**: NestJS with Drizzle ORM (MySQL dialect) connecting to external MySQL database
- **Frontend**: React with Vite, TanStack React Query, wouter routing, shadcn/ui components
- **Database**: External MySQL (credentials via env secrets: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT)
- **Build**: NestJS compiles to CommonJS (server/dist/), shared schema loaded via runtime require() to avoid Drizzle ESM/CJS type conflicts

## Key Files
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
- `client/src/App.tsx` - Main app with sidebar layout and routing
- `client/src/pages/releases-list.tsx` - Releases list with filters/pagination
- `client/src/pages/release-detail.tsx` - Release detail with checklist toggling
- `client/src/pages/release-form.tsx` - Create/edit release form
- `client/src/pages/history-form.tsx` - Create/edit release history form
- `client/src/pages/templates-list.tsx` - Checklist templates management

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

## Recent Changes
- 2026-02-10: Migrated backend from Express.js to NestJS with modular architecture
- 2026-02-10: Initial implementation - full CRUD for releases, histories, templates, checklist items with MySQL connectivity
