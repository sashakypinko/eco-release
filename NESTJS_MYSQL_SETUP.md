# Replacing the Default Replit Express Backend with NestJS + MySQL

This guide explains how to replace the default Node.js/Express backend in a Replit project with a NestJS backend connected to an external MySQL database. It covers the full process: project restructuring, NestJS installation, MySQL integration via Drizzle ORM, migration tooling, and deployment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure Overview](#2-project-structure-overview)
3. [Install NestJS Dependencies](#3-install-nestjs-dependencies)
4. [Create the Server Directory](#4-create-the-server-directory)
5. [Configure TypeScript for NestJS](#5-configure-typescript-for-nestjs)
6. [Configure NestJS CLI](#6-configure-nestjs-cli)
7. [Set Up the Entry Point](#7-set-up-the-entry-point)
8. [Bootstrap NestJS](#8-bootstrap-nestjs)
9. [Configure the Root Module](#9-configure-the-root-module)
10. [Set Up MySQL Database Connection](#10-set-up-mysql-database-connection)
11. [Define the Drizzle Schema](#11-define-the-drizzle-schema)
12. [Create the Database Module](#12-create-the-database-module)
13. [Set Up Migrations with TypeORM](#13-set-up-migrations-with-typeorm)
14. [Update Root package.json Scripts](#14-update-root-packagejson-scripts)
15. [Set Environment Variables](#15-set-environment-variables)
16. [Create Your First Module](#16-create-your-first-module)
17. [Run the Application](#17-run-the-application)
18. [Production Build](#18-production-build)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Prerequisites

- A Replit project with a Node.js + Vite frontend (the default template)
- An external MySQL database (e.g., PlanetScale, Railway, Aiven, or self-hosted)
- Your MySQL credentials: host, port, user, password, database name

---

## 2. Project Structure Overview

After conversion, your project will look like this:

```
├── client/                   # React + Vite frontend (unchanged)
│   ├── src/
│   └── index.html
├── server/                   # NestJS backend (new)
│   ├── package.json          # Server-specific dependencies
│   ├── nest-cli.json         # NestJS CLI config
│   ├── tsconfig.json         # Server TypeScript config
│   ├── index.ts              # Entry point (builds & runs NestJS + Vite)
│   └── src/
│       ├── main.ts           # NestJS bootstrap
│       ├── app.module.ts     # Root module
│       └── database/         # Database connection & config
├── shared/                   # Shared types between frontend & backend
│   └── schema.mysql.ts       # Drizzle MySQL schema
├── migrations/
│   └── mysql/                # TypeORM migration files
├── migrate.sh                # Migration CLI helper
├── package.json              # Root package.json
└── vite.config.ts            # Vite config (unchanged)
```

---

## 3. Install NestJS Dependencies

Install NestJS core packages and MySQL-related dependencies in the **root** `package.json`:

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config \
  @nestjs/jwt @nestjs/passport passport passport-jwt \
  class-validator class-transformer reflect-metadata rxjs \
  drizzle-orm mysql2 typeorm \
  bcryptjs cookie-parser
```

Install dev dependencies:

```bash
npm install -D @nestjs/cli @nestjs/schematics \
  @types/bcryptjs @types/cookie-parser @types/passport-jwt
```

Also create a **server-specific** `package.json` for the NestJS CLI:

```json
// server/package.json
{
  "name": "my-app-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.7",
    "@nestjs/core": "^10.3.7",
    "@nestjs/config": "^3.2.0",
    "@nestjs/platform-express": "^10.3.7",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "cookie-parser": "^1.4.7",
    "drizzle-orm": "^0.39.3",
    "mysql2": "^3.16.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "bcryptjs": "^3.0.3"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.10",
    "@types/express": "^4.17.21",
    "@types/passport-jwt": "^4.0.1",
    "typescript": "^5.4.5"
  }
}
```

---

## 4. Create the Server Directory

```bash
mkdir -p server/src/database
```

---

## 5. Configure TypeScript for NestJS

Create `server/tsconfig.json`. NestJS requires `emitDecoratorMetadata` and `experimentalDecorators`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "..",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["src/**/*", "../shared/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Key points:
- `rootDir` is set to `..` so TypeScript can reach the `shared/` directory
- `paths` alias lets you import `@shared/schema.mysql` from server code
- `emitDecoratorMetadata` and `experimentalDecorators` are mandatory for NestJS

---

## 6. Configure NestJS CLI

Create `server/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

---

## 7. Set Up the Entry Point

Create `server/index.ts` — this file orchestrates both the NestJS API server and the Vite dev server:

```typescript
import { execSync, spawn, ChildProcess } from 'child_process';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const rootDir = path.join(__dirname, '..');

// NestJS compiled output path
const mainPath = isDev
  ? path.join(__dirname, 'dist/server/src/main.js')
  : path.join(__dirname, 'server/server/src/main.js');

// Build NestJS in development mode
if (isDev) {
  console.log('Building NestJS server...');
  execSync('npx nest build', { cwd: __dirname, stdio: 'inherit' });
}

const processes: ChildProcess[] = [];

if (isDev) {
  // Start NestJS API server on port 3001
  console.log('Starting NestJS API server on port 3001...');
  const nestProcess = spawn('node', [mainPath], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' }
  });
  processes.push(nestProcess);

  nestProcess.on('error', (err) => {
    console.error('Failed to start NestJS server:', err);
    process.exit(1);
  });

  // Start Vite dev server on port 5000
  setTimeout(() => {
    console.log('Starting Vite dev server on port 5000...');
    const additionalHosts = [process.env.REPLIT_DEV_DOMAIN].filter(Boolean).join(',');
    const viteProcess = spawn('npx', [
      'vite', '--config', path.join(rootDir, 'vite.config.ts'),
      '--host', '0.0.0.0', '--port', '5000'
    ], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: additionalHosts
      }
    });
    processes.push(viteProcess);
  }, 1000);
} else {
  // Production: NestJS serves both API and static files on port 5000
  const nestProcess = spawn('node', [mainPath], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env }
  });
  processes.push(nestProcess);

  nestProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// Clean up child processes on exit
const cleanup = () => {
  processes.forEach(p => p.kill());
  process.exit(0);
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
```

---

## 8. Bootstrap NestJS

Create `server/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isDev = process.env.NODE_ENV === 'development';

  // All routes are prefixed with /api
  app.setGlobalPrefix('api');
  app.use(express.json());
  app.use(cookieParser());

  // Automatic DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Allow cross-origin requests from Vite dev server
  if (isDev) {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

  // In production, serve the built frontend
  if (!isDev) {
    const staticPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(staticPath));
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(staticPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`NestJS server running on port ${port} (${isDev ? 'development' : 'production'} mode)`);
}
bootstrap();
```

---

## 9. Configure the Root Module

Create `server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
// Import your feature modules here

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // Add feature modules: AuthModule, UsersModule, etc.
  ],
})
export class AppModule {}
```

---

## 10. Set Up MySQL Database Connection

### Database Config (`server/src/database/database.config.ts`)

```typescript
export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function getDatabaseConfig(): MySQLConfig {
  const host = process.env.MYSQL_HOST;
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    throw new Error(
      'MySQL configuration incomplete. Required env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE'
    );
  }

  return { host, port, user, password, database };
}
```

### Database Factory (`server/src/database/database.factory.ts`)

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql2 from 'mysql2/promise';
import * as schema from '@shared/schema.mysql';
import { getDatabaseConfig } from './database.config';

const mysql = (mysql2 as any).default || mysql2;

export type Database = ReturnType<typeof drizzle>;

let mysqlPool: any = null;
let dbInstance: Database | null = null;

export function createDatabase(): { db: Database; schema: typeof schema } {
  if (dbInstance) {
    return { db: dbInstance, schema };
  }

  const config = getDatabaseConfig();

  console.log('Initializing MySQL database connection...');
  mysqlPool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  dbInstance = drizzle(mysqlPool, { schema, mode: 'default' });
  return { db: dbInstance, schema };
}

export async function closeDatabase(): Promise<void> {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  dbInstance = null;
}
```

### Database Utilities (`server/src/database/db.util.ts`)

MySQL does not support `.returning()` like PostgreSQL. Use these helpers instead:

```typescript
import { eq } from 'drizzle-orm';

export async function insertReturning(db: any, table: any, values: any): Promise<any> {
  const result = await db.insert(table).values(values);
  const insertId = result[0]?.insertId;
  if (insertId) {
    const [row] = await db.select().from(table).where(eq(table.id, insertId));
    return row;
  }
  return null;
}

export async function updateReturning(db: any, table: any, set: any, whereClause: any): Promise<any> {
  await db.update(table).set(set).where(whereClause);
  const [row] = await db.select().from(table).where(whereClause);
  return row;
}

export async function deleteReturning(db: any, table: any, whereClause: any): Promise<any> {
  const [row] = await db.select().from(table).where(whereClause);
  await db.delete(table).where(whereClause);
  return row;
}
```

**Usage in services:**

```typescript
// Instead of:
const [user] = await db.insert(schema.users).values(data).returning();

// Use:
import { insertReturning } from '../database/db.util';
const user = await insertReturning(db, schema.users, data);
```

---

## 11. Define the Drizzle Schema

Create `shared/schema.mysql.ts` with your table definitions using Drizzle's MySQL column types:

```typescript
import { sql, relations } from "drizzle-orm";
import {
  mysqlTable, text, varchar, timestamp,
  boolean, bigint, serial
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Example: Users table
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: bigint("role_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
});

// Example: Roles table (with ms_ prefix for microservices tables)
export const roles = mysqlTable("ms_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

// Insert schemas (for validation)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;
```

### MySQL-Specific Notes

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| Auto-increment PK | `serial("id")` from `pg-core` | `serial("id")` from `mysql-core` |
| Variable text | `text("col")` | `text("col")` or `varchar("col", { length: N })` |
| Timestamps | `timestamp("col")` | `timestamp("col")` |
| Auto-update timestamp | Not built-in | `sql\`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\`` |
| Boolean | `boolean("col")` | `boolean("col")` (stored as TINYINT(1)) |
| Big integer FK | `integer("col")` | `bigint("col", { mode: "number", unsigned: true })` |
| `.returning()` | Supported | **Not supported** — use `db.util.ts` helpers |
| Array columns | `text().array()` | **Not supported** — use JSON or junction tables |

---

## 12. Create the Database Module

Create `server/src/database/database.module.ts`:

```typescript
import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { createDatabase, closeDatabase, Database } from './database.factory';

const { db, schema } = createDatabase();

export { Database };

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useValue: db,
    },
    {
      provide: 'SCHEMA',
      useValue: schema,
    },
  ],
  exports: ['DATABASE', 'SCHEMA'],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await closeDatabase();
  }
}
```

### Using the Database in Services

Inject the database in any service:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema.mysql';
import type { Database } from '../database/database.module';
import { insertReturning } from '../database/db.util';

@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async findAll() {
    return this.db.select().from(schema.users);
  }

  async findById(id: number) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user || null;
  }

  async create(data: schema.InsertUser) {
    return insertReturning(this.db, schema.users, data);
  }
}
```

---

## 13. Set Up Migrations with TypeORM

TypeORM is used **only** as a migration runner. All application queries go through Drizzle ORM.

### TypeORM DataSource (`server/src/database/typeorm.datasource.ts`)

```typescript
import { DataSource } from "typeorm";

const host = process.env.MYSQL_HOST;
const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
const username = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;
const migrationsPath = process.env.MIGRATIONS_DIR || "migrations";

if (!host || !username || !password || !database) {
  throw new Error(
    "MySQL config incomplete. Required: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE"
  );
}

const dataSource = new DataSource({
  type: "mysql",
  host,
  port,
  username,
  password,
  database,
  migrations: [`${migrationsPath}/mysql/*.ts`],
  migrationsTableName: "typeorm_migrations",
});

export default dataSource;
```

### Migration Script (`migrate.sh`)

```bash
#!/bin/bash

DATASOURCE="server/src/database/typeorm.datasource.ts"
MIGRATIONS_DIR="migrations/mysql"
TYPEORM="npx tsx node_modules/typeorm/cli.js"

case "$1" in
  create)
    if [ -z "$2" ]; then
      echo "Usage: ./migrate.sh create <MigrationName>"
      exit 1
    fi
    npx typeorm migration:create "$MIGRATIONS_DIR/$2"
    echo "Created empty migration in $MIGRATIONS_DIR/"
    ;;
  run)
    $TYPEORM migration:run -d "$DATASOURCE"
    ;;
  revert)
    $TYPEORM migration:revert -d "$DATASOURCE"
    ;;
  show)
    $TYPEORM migration:show -d "$DATASOURCE"
    ;;
  *)
    echo "Migration Tool"
    echo ""
    echo "Usage: ./migrate.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <Name>   Create a new empty migration file"
    echo "  run              Run all pending migrations"
    echo "  revert           Revert the last executed migration"
    echo "  show             Show all migrations and their status"
    echo ""
    echo "Examples:"
    echo "  ./migrate.sh create AddUsersTable"
    echo "  ./migrate.sh run"
    echo "  ./migrate.sh revert"
    ;;
esac
```

Make it executable:

```bash
chmod +x migrate.sh
```

### Example Migration

After running `./migrate.sh create CreateUsersTable`, edit the generated file:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role_id BIGINT UNSIGNED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
```

Then run:

```bash
./migrate.sh run
```

---

## 14. Update Root package.json Scripts

Replace the default Express scripts with NestJS-compatible ones:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsx script/build.ts",
    "start": "NODE_ENV=production node dist/index.cjs",
    "check": "tsc"
  }
}
```

The `dev` script uses `tsx` to run `server/index.ts`, which:
1. Builds NestJS via `npx nest build`
2. Starts the NestJS API on port 3001
3. Starts the Vite dev server on port 5000

---

## 15. Set Environment Variables

Add these secrets in the Replit Secrets tab:

| Key | Example Value | Description |
|-----|--------------|-------------|
| `DB_PROVIDER` | `mysql` | Database provider selection |
| `MYSQL_HOST` | `mysql.railway.app` | MySQL server hostname |
| `MYSQL_PORT` | `3306` | MySQL server port |
| `MYSQL_USER` | `root` | MySQL username |
| `MYSQL_PASSWORD` | `your-password` | MySQL password |
| `MYSQL_DATABASE` | `my_app_db` | Database name |
| `SESSION_SECRET` | `random-string-here` | Session/JWT secret key |

---

## 16. Create Your First Module

NestJS uses a modular architecture. Here is an example feature module:

### Controller (`server/src/users/users.controller.ts`)

```typescript
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import type { InsertUser } from '@shared/schema.mysql';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  create(@Body() data: InsertUser) {
    return this.usersService.create(data);
  }
}
```

### Module (`server/src/users/users.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Then add `UsersModule` to your `AppModule` imports.

---

## 17. Run the Application

```bash
npm run dev
```

This starts:
- **NestJS API** on `http://localhost:3001` (mapped to external port 3002 on Replit)
- **Vite frontend** on `http://localhost:5000` (mapped to external port 80 on Replit)

### Frontend API Calls

Configure API calls to target the NestJS server. In development on Replit, the API runs on a separate port:

```typescript
// client/src/lib/apiBase.ts
function getApiBase(): string {
  if (typeof window === 'undefined') return '';

  // On Replit, API is on port 3002 (external) which maps to port 3001 (internal)
  const hostname = window.location.hostname;
  if (hostname.includes('.replit.dev')) {
    return `https://${hostname.replace(':80', '')}:3002`;
  }

  // Local development
  return 'http://localhost:3001';
}

export const API_BASE = getApiBase();
```

---

## 18. Production Build

For production deployment, the NestJS server serves both the API and the built frontend:

1. Frontend is built by Vite into `dist/public/`
2. NestJS is compiled into `dist/server/`
3. A single `dist/index.cjs` entry point runs everything on port 5000

The production entry in `server/src/main.ts` already handles serving static files and routing non-API requests to `index.html` for client-side routing.

---

## 19. Troubleshooting

### Common Issues

**"MySQL configuration incomplete" error**
- Verify all four secrets are set: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- Set `DB_PROVIDER=mysql` in your environment

**`.returning()` is not a function**
- MySQL does not support `.returning()`. Replace all `.returning()` calls with the `insertReturning`, `updateReturning`, or `deleteReturning` helpers from `db.util.ts`

**Timestamp/Date formatting errors**
- Pass JavaScript `Date` objects directly. The `mysql2` driver handles conversion automatically
- Do not pass ISO 8601 strings — MySQL rejects them

**"Cannot find module '@shared/schema.mysql'"**
- Ensure `server/tsconfig.json` has the `paths` alias configured pointing to `"../shared/*"`
- Ensure `rootDir` is set to `".."`

**NestJS decorators not working**
- Ensure `emitDecoratorMetadata` and `experimentalDecorators` are `true` in `server/tsconfig.json`

**Migration "relation does not exist" errors**
- Run `./migrate.sh run` to execute pending migrations before starting the app
- Check `./migrate.sh show` to see migration status

**Connection pool exhausted**
- Increase `connectionLimit` in the pool config (default is 10)
- Ensure `closeDatabase()` is called on app shutdown (handled by `OnModuleDestroy`)

### Key Differences from Express

| Express (Default) | NestJS |
|-------------------|--------|
| `app.get('/route', handler)` | `@Get('route')` decorator on controller method |
| Middleware functions | `@Injectable()` services with dependency injection |
| Manual route registration | Automatic via `@Controller()` and module imports |
| `req.body` | `@Body()` parameter decorator with DTO validation |
| No built-in validation | `class-validator` + `ValidationPipe` |
| Manual project structure | Enforced modular architecture |
