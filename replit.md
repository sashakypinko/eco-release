# Release Management System

## Overview
A full-stack Release Management System that connects to an external MySQL database to manage software releases, release histories, checklist templates, and automated checklist generation.

## Architecture
- **Backend**: Express.js with Drizzle ORM (MySQL dialect) connecting to external MySQL database
- **Frontend**: React with Vite, TanStack React Query, wouter routing, shadcn/ui components
- **Database**: External MySQL (credentials via env secrets: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT)

## Key Files
- `shared/schema.ts` - Drizzle MySQL table definitions and Zod schemas
- `server/db.ts` - MySQL connection pool setup
- `server/storage.ts` - Data access layer with all CRUD operations
- `server/routes.ts` - Express API routes
- `client/src/App.tsx` - Main app with sidebar layout and routing
- `client/src/pages/releases-list.tsx` - Releases list with filters/pagination
- `client/src/pages/release-detail.tsx` - Release detail with checklist toggling
- `client/src/pages/release-form.tsx` - Create/edit release form
- `client/src/pages/history-form.tsx` - Create/edit release history form
- `client/src/pages/templates-list.tsx` - Checklist templates management

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

## Recent Changes
- 2026-02-10: Initial implementation - full CRUD for releases, histories, templates, checklist items with MySQL connectivity
