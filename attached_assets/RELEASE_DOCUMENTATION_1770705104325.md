# Release System - Complete Documentation

> **Purpose:** This document describes the full Release functionality — including Releases, Release History, Release Checklist Templates, and Slack integration — so it can be reimplemented in another application using different technologies but connected to the same database.

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Entity Relationships Diagram](#2-entity-relationships-diagram)
3. [Models & Business Logic](#3-models--business-logic)
4. [Release Status Management](#4-release-status-management)
5. [Checklist Template System](#5-checklist-template-system)
6. [CRUD Operations](#6-crud-operations)
7. [API Endpoints](#7-api-endpoints)
8. [Slack Integration](#8-slack-integration)
9. [Filtering & Search](#9-filtering--search)
10. [Authorization & Security](#10-authorization--security)
11. [Seeded / Predefined Data](#11-seeded--predefined-data)
12. [Nova UI Details](#12-nova-ui-details)

---

## 1. Database Schema

### 1.1 `releases` (Main Table)

| Column                         | Type              | Nullable | Default  | Constraints                    |
|--------------------------------|-------------------|----------|----------|--------------------------------|
| `id`                           | bigint (PK)       | No       | auto     | Primary Key                    |
| `version`                      | varchar(255)      | No       | —        |                                |
| `description`                  | varchar(255)      | Yes      | NULL     |                                |
| `environment`                  | varchar(255)      | No       | `'prod'` | See Environment Options below  |
| `project_jira_issue`           | varchar(255)      | Yes      | NULL     | Displayed as clickable link    |
| `customer_contact`             | varchar(255)      | Yes      | NULL     |                                |
| `planned_release_date`         | date              | Yes      | NULL     |                                |
| `status`                       | varchar(255)      | Yes      | NULL     | See Status Options below       |
| `product_id`                   | bigint (unsigned) | Yes      | NULL     | FK → `products.id` (CASCADE)  |
| `work_order_id`                | bigint (unsigned) | Yes      | NULL     | FK → `work_orders.id`         |
| `user_id`                      | bigint (unsigned) | Yes      | NULL     | FK → `users.id`               |
| `slack_notification_timestamp` | varchar(255)      | Yes      | NULL     | Slack message `ts` for updates |
| `created_at`                   | timestamp         | Yes      | —        |                                |
| `updated_at`                   | timestamp         | Yes      | —        |                                |

**Environment Options:**
`local`, `dev`, `test`, `stage`, `prod`, `dev-train`, `stg-train`

**Status Options:**
`Created`, `Release In Progress`, `PO Review provided`, `Released to Dev`, `Approved to Release to Production`, `Released to Production`

### 1.2 `release_histories`

| Column                   | Type              | Nullable | Default | Constraints            |
|--------------------------|-------------------|----------|---------|------------------------|
| `id`                     | bigint (PK)       | No       | auto    | Primary Key            |
| `release_id`             | int (unsigned)    | No       | —       | FK → `releases.id`    |
| `approved_by_user_id`    | bigint (unsigned) | Yes      | NULL    | FK → `users.id`       |
| `date_of_approval`       | timestamptz       | Yes      | NULL    |                        |
| `comment`                | text              | Yes      | NULL    |                        |
| `release_manager_user_id`| bigint (unsigned) | No       | —       | FK → `users.id`       |
| `status`                 | varchar(255)      | No       | —       | Same options as Release|
| `environment`            | varchar(255)      | No       | —       | Same options as Release|
| `server`                 | varchar(255)      | Yes      | NULL    | Free-text server name  |
| `port`                   | int               | Yes      | NULL    |                        |
| `release_date`           | timestamptz       | Yes      | NULL    |                        |
| `release_notes`          | varchar(255)      | Yes      | NULL    | URL to notes           |
| `release_video`          | varchar(255)      | Yes      | NULL    | URL to video           |
| `smoke_test_date`        | datetime          | Yes      | NULL    |                        |
| `smoke_test_result`      | varchar(255)      | Yes      | NULL    | `'pass'` or `'fail'`  |
| `is_released`            | (boolean-like)    | Yes      | NULL    | Legacy field           |
| `created_at`             | timestamp         | Yes      | —       |                        |
| `updated_at`             | timestamp         | Yes      | —       |                        |

> **Note:** `server` is a free-text field, NOT a foreign key to the servers table.

### 1.3 `release_checklist_items`

| Column               | Type              | Nullable | Default | Constraints                                |
|----------------------|-------------------|----------|---------|--------------------------------------------|
| `id`                 | bigint (PK)       | No       | auto    | Primary Key                                |
| `release_history_id` | bigint (unsigned) | Yes      | NULL    | FK → `release_histories.id` (CASCADE)      |
| `release_id`         | bigint (unsigned) | Yes      | NULL    | FK → `releases.id` (CASCADE) — legacy      |
| `text`               | varchar(255)      | No       | —       | The checklist item label                   |
| `order`              | int               | No       | —       | Display order                              |
| `done`               | boolean           | No       | `false` | Whether the item has been completed        |
| `created_at`         | timestamp         | Yes      | —       |                                            |
| `updated_at`         | timestamp         | Yes      | —       |                                            |

> **Note:** `release_id` is a legacy column kept nullable. New items use `release_history_id` only. The system was migrated from release-level to history-level checklists.

### 1.4 `release_checklist_templates`

| Column       | Type              | Nullable | Constraints |
|--------------|-------------------|----------|-------------|
| `id`         | bigint (PK)       | No       | Primary Key |
| `name`       | varchar(255)      | No       |             |
| `created_at` | timestamp         | Yes      |             |
| `updated_at` | timestamp         | Yes      |             |

### 1.5 `release_checklist_template_items`

| Column                          | Type              | Nullable | Constraints                                        |
|---------------------------------|-------------------|----------|----------------------------------------------------|
| `id`                            | bigint (PK)       | No       | Primary Key                                        |
| `release_checklist_template_id` | bigint (unsigned) | No       | FK → `release_checklist_templates.id` (CASCADE)    |
| `text`                          | varchar(255)      | No       | The template item label                            |
| `order`                         | int               | No       | Display order                                      |
| `created_at`                    | timestamp         | Yes      |                                                    |
| `updated_at`                    | timestamp         | Yes      |                                                    |

### 1.6 `product_environments` (Related Table — Links Products to Checklist Templates)

| Column                          | Type              | Nullable | Constraints                                        |
|---------------------------------|-------------------|----------|----------------------------------------------------|
| `id`                            | bigint (PK)       | No       | Primary Key                                        |
| `product_id`                    | bigint (unsigned) | No       | FK → `products.id`                                 |
| `environment`                   | varchar(255)      | No       | Environment name                                   |
| `release_checklist_template_id` | bigint (unsigned) | Yes      | FK → `release_checklist_templates.id`              |
| `created_at`                    | timestamp         | Yes      |                                                    |
| `updated_at`                    | timestamp         | Yes      |                                                    |

> This table is the **bridge** between a product+environment combination and its checklist template. When a release history is created for a given product+environment, the system looks up this table to find which template to use.

---

## 2. Entity Relationships Diagram

```
releases
├── product_id ─────────────────► products
│                                    └── 1:N ──► product_environments
│                                                    └── release_checklist_template_id ──► release_checklist_templates
│                                                                                             └── 1:N ──► release_checklist_template_items
├── work_order_id ──────────────► work_orders
├── user_id ────────────────────► users (release creator)
│
└── 1:N ──► release_histories
                ├── release_id ──► releases (back-reference)
                ├── approved_by_user_id ──► users
                ├── release_manager_user_id ──► users
                │
                └── 1:N ──► release_checklist_items
                                └── release_history_id ──► release_histories
```

### Cascade Delete Behavior

- When a **release** is deleted: `release_checklist_items` with matching `release_id` are CASCADE deleted
- When a **release history** is deleted: `release_checklist_items` with matching `release_history_id` are CASCADE deleted
- When a **release_checklist_template** is deleted: `release_checklist_template_items` are CASCADE deleted

---

## 3. Models & Business Logic

### 3.1 Release

**Fillable Fields:**
```
version, description, environment, project_jira_issue, customer_contact,
planned_release_date, status, product_id, user_id, slack_notification_timestamp
```

**Casts:**
- `planned_release_date` → `datetime`

**Appended Attributes:**
- `checklist_items` — computed accessor that returns the checklist items from the **latest** (most recent) release history record

**Relationships:**
| Method        | Type       | Related Model     | Foreign Key       |
|---------------|------------|-------------------|-------------------|
| `history()`   | HasMany    | ReleaseHistory    | `release_id`      |
| `user()`      | BelongsTo  | User              | `user_id`         |
| `product()`   | BelongsTo  | Product           | `product_id`      |
| `workOrder()` | BelongsTo  | WorkOrder         | `work_order_id`   |

**Automatic Behaviors (Boot Events):**

1. **On Create:**
   - Creates a new `ReleaseHistory` record with:
     - `release_id` = new release ID
     - `release_manager_user_id` = release's `user_id`
     - `status` = `'Created'`
     - `environment` = release's `environment`
   - If status is `'Release In Progress'`, sends Slack notification (see Section 8)

2. **On Update:**
   - If `environment` changed: Creates a new `ReleaseHistory` record (same pattern as on create)
   - If `status` changed:
     - `'Release In Progress'` → sends Slack "in progress" notification
     - `'Released to Dev'` or `'Released to Production'` → sends Slack "completed" notification

### 3.2 ReleaseHistory

**Fillable Fields:**
```
release_id, approved_by_user_id, date_of_approval, comment,
release_manager_user_id, environment, server, port, is_released,
release_date, release_notes, release_video, smoke_test_date,
smoke_test_result, status
```

**Casts:**
- `date_of_approval` → `datetime`
- `release_date` → `datetime`
- `smoke_test_date` → `datetime`

**Relationships:**
| Method             | Type       | Related Model          | Foreign Key               |
|--------------------|------------|------------------------|---------------------------|
| `release()`        | BelongsTo  | Release                | `release_id`              |
| `approvedByUser()` | BelongsTo  | User                   | `approved_by_user_id`     |
| `releaseManager()` | BelongsTo  | User                   | `release_manager_user_id` |
| `checklistItems()` | HasMany    | ReleaseChecklistItem   | `release_history_id`      |

**Automatic Behaviors (Boot Events):**

**On Create — Automatic Checklist Generation:**
1. Look up `ProductEnvironment` where `product_id` matches the release's product AND `environment` matches the history's environment
2. If a matching `ProductEnvironment` exists AND it has a `releaseChecklistTemplate`:
   - For **each item** in the template:
     - Create a `ReleaseChecklistItem` with:
       - `release_history_id` = the new history's ID
       - `text` = template item's text
       - `order` = template item's order
       - `done` = false (default)

> **This is the core of the template system:** Checklist items are automatically stamped from the template whenever a new release history record is created.

### 3.3 ReleaseChecklistItem

**Fillable Fields:** `release_history_id`, `text`, `order`, `done`

**Relationships:**
| Method             | Type       | Related Model    | Foreign Key          |
|--------------------|------------|------------------|----------------------|
| `releaseHistory()` | BelongsTo  | ReleaseHistory   | `release_history_id` |

**Automatic Behaviors (Boot Events):**

**On Update:** Triggers a Slack message update for the associated release (updates the "in progress" notification with current checklist status).

### 3.4 ReleaseChecklistTemplate

**Fillable Fields:** `name`

**Eager Loading:** Always loads `items` relationship automatically.

**Relationships:**
| Method    | Type    | Related Model                  |
|-----------|---------|--------------------------------|
| `items()` | HasMany | ReleaseChecklistTemplateItem   |

### 3.5 ReleaseChecklistTemplateItem

**Fillable Fields:** `text`, `order`

**Relationships:**
| Method       | Type       | Related Model              | Foreign Key                      |
|--------------|------------|----------------------------|----------------------------------|
| `template()` | BelongsTo  | ReleaseChecklistTemplate   | `release_checklist_template_id`  |

### 3.6 ProductEnvironment (Bridge Table)

**Fillable Fields:** `product_id`, `environment`, `release_checklist_template_id`

**Relationships:**
| Method                       | Type       | Related Model              |
|------------------------------|------------|----------------------------|
| `product()`                  | BelongsTo  | Product                    |
| `releaseChecklistTemplate()` | BelongsTo  | ReleaseChecklistTemplate   |

---

## 4. Release Status Management

### 4.1 Status Values

| Status                            | Meaning                                                     |
|-----------------------------------|-------------------------------------------------------------|
| `Created`                         | Initial status, auto-set when release is first created      |
| `Release In Progress`             | Release process has started (triggers Slack notification)    |
| `PO Review provided`              | Product Owner has reviewed                                  |
| `Released to Dev`                 | Deployed to development (triggers Slack completion)         |
| `Approved to Release to Production` | Approved for production deployment                       |
| `Released to Production`          | Deployed to production (triggers Slack completion)          |

### 4.2 Status Transition Rules

There are **no enforced transition rules** — any status can move to any other status. However, specific transitions trigger Slack notifications (see Section 8).

### 4.3 Status Denormalization

Status is stored in **two places**:
1. `releases.status` — the current status on the release record
2. `release_histories.status` — the status at the time that history record was created

On the **index/list view**, the displayed status comes from `release.history.last().status` (the most recent history record), NOT directly from `releases.status`.

---

## 5. Checklist Template System

### 5.1 Complete Flow

```
Step 1: Admin creates a ReleaseChecklistTemplate
        ├── name: "Production Deployment Checklist"
        └── items: [{text: "Run migrations", order: 1},
                    {text: "Clear cache", order: 2},
                    {text: "Verify health check", order: 3}]

Step 2: Admin assigns template to a ProductEnvironment
        └── product_environments row:
            ├── product_id: 5
            ├── environment: "prod"
            └── release_checklist_template_id: 1  ← links to the template

Step 3: User creates a Release
        ├── product_id: 5
        ├── environment: "prod"
        └── (model boot event creates ReleaseHistory)

Step 4: ReleaseHistory boot event fires
        ├── Looks up product_environments WHERE product_id=5 AND environment="prod"
        ├── Finds template_id=1
        └── Creates 3 ReleaseChecklistItem records:
            ├── {text: "Run migrations", order: 1, done: false}
            ├── {text: "Clear cache", order: 2, done: false}
            └── {text: "Verify health check", order: 3, done: false}

Step 5: User checks off items via API
        └── PUT /releases/update-checklist-item-state {id: X, done: true}
            └── Triggers Slack notification update
```

### 5.2 Template Management API

Templates are managed through a custom API (not standard Nova CRUD for items):
- Template **items** are replaced wholesale — the update endpoint deletes all existing items and recreates them from the request payload
- This is a **destructive replace**, not an incremental update

### 5.3 Key Design Decisions

- Checklist items are **copied** from the template at ReleaseHistory creation time — they are independent copies, not references
- Changing a template does NOT affect already-created checklist items
- Each ReleaseHistory gets its own set of checklist items
- The `Release.checklist_items` accessor returns items from the **latest** history record only

---

## 6. CRUD Operations

### 6.1 Release CRUD

#### Create

**Fields on form:**
| Field                | Type            | Required | Notes                                              |
|----------------------|-----------------|----------|----------------------------------------------------|
| Product              | BelongsTo       | Yes      | Dropdown, searchable                               |
| Work Order           | BelongsTo       | No       | **Dependent on Product** — only shows work orders belonging to the selected product |
| Version              | Text            | Yes      |                                                    |
| Description          | Text            | No       |                                                    |
| Environment          | Select          | Yes      | Options: local, dev, test, stage, prod, dev-train, stg-train |
| Status               | Select          | Yes      | Options: see Section 4.1                           |
| Project Jira Issue   | Text (Link)     | No       | Stored as URL, displayed as clickable link         |
| Customer Contact     | Text            | No       |                                                    |
| Planned Release Date | Date            | No       |                                                    |
| User                 | BelongsTo       | No       | Defaults to authenticated user                     |

**Side effects on create:**
1. ReleaseHistory record auto-created (status='Created', environment copied)
2. Checklist items auto-generated from template (if product+environment has a template)
3. Slack notification sent (if status is 'Release In Progress')

#### Read — Index/List View

**Displayed columns:**
| Column               | Display Type      | Sortable | Notes                                    |
|----------------------|-------------------|----------|------------------------------------------|
| Product              | BelongsTo         | —        |                                          |
| Version              | Text              | —        |                                          |
| Description          | Text              | —        |                                          |
| Environment          | Select (readonly) | —        |                                          |
| Status               | Text (readonly)   | —        | Shows `history.last().status`, not `releases.status` |
| Project Jira Issue   | Clickable Link    | —        |                                          |
| Customer Contact     | Text              | —        |                                          |
| Planned Release Date | Date              | —        |                                          |
| User                 | BelongsTo         | —        |                                          |

**Search:** By `id` only

#### Read — Detail View

Shows all fields plus:
- **Release History** section (HasMany) — all history records
- **Release Checklist** card — interactive checklist from latest history (custom Nova card, full-width)
- **Video** card — conditional, only if latest history has a `release_video` URL

#### Update

Same fields as create. Side effects:
- If `environment` changes → new ReleaseHistory record created → new checklist items generated
- If `status` changes → Slack notification triggered (see Section 8)

#### Delete

Standard delete. Cascading deletes handle related checklist items.

### 6.2 Release History CRUD

#### Create (from Release detail page)

**Fields on form:**
| Field                | Type       | Required | Notes                                         |
|----------------------|------------|----------|-----------------------------------------------|
| Approved By          | Select     | No       | Dropdown populated from all Users              |
| Date of Approval     | DateTime   | No       |                                               |
| Comment              | Textarea   | No       |                                               |
| Release Manager      | Select     | Yes      | Dropdown populated from all Users              |
| Status               | Select     | Yes      | Same options as Release status                 |
| Environment          | Select     | Yes      | Same options as Release environment            |
| Server               | Text       | No       | Free-text server name/URL                      |
| Port                 | Number     | No       |                                               |
| Release Date         | DateTime   | No       |                                               |
| Release Notes        | Text       | No       | URL                                            |
| Release Video        | Text       | No       | URL                                            |
| Smoke Test Date      | DateTime   | No       |                                               |
| Smoke Test Result    | Select     | No       | Options: (empty), `pass`, `fail`               |

**Side effects on create:**
- Checklist items auto-generated from template (if product+environment has a template)

**Redirects:** After create/update → redirects back to parent Release detail page

#### Read — Display differences

| Field          | Index/Detail Display                                                        |
|----------------|-----------------------------------------------------------------------------|
| Approved By    | Shows user **name** (text), not a relationship link                         |
| Release Manager| Shows user **name** (text), not a relationship link                         |
| Server         | Displayed as clickable HTML link (`<a href>`) on index                      |
| Release Notes  | Displayed as truncated clickable link (max 300px width) on index            |

### 6.3 Release Checklist Template CRUD

#### Create/Update (Template itself)

Only field: `name`

#### Manage Template Items (Custom Card + API)

Template items are managed through a custom Nova card (`release-checklist-template` component) displayed on the template's detail page. The card provides a UI for adding/removing/reordering items.

**Update flow:**
1. User edits items in the card UI
2. Card sends `PUT /v1/release-checklist-templates/{id}` with all items
3. Backend **deletes all existing items** and **recreates** from the payload (transactional)

---

## 7. API Endpoints

All endpoints require authentication.

### `GET /releases/{id}`

**Purpose:** Fetch a single release with all data

**Response:** `{ "release": <Release object> }`

**Error:** 404 if not found

---

### `PUT /releases/update-checklist-item-state`

**Purpose:** Toggle a checklist item's done state

**Request Body:**
```json
{
    "id": 123,
    "done": true
}
```

**Validation:**
- `id`: integer, must exist in `release_checklist_items`
- `done`: boolean

**Response:** `{ "item": <ReleaseChecklistItem object> }`

**Side effects:** Triggers Slack notification update for the associated release

**Error:** 500 with error message on failure

---

### `GET /v1/release-checklist-templates/{id}`

**Purpose:** Fetch a template with its items

**Response:** `{ "template": <ReleaseChecklistTemplate object with items> }`

**Error:** 404 if not found

---

### `PUT /v1/release-checklist-templates/{id}`

**Purpose:** Replace all items in a template

**Request Body:**
```json
{
    "items": [
        { "text": "Step 1 description", "order": 1 },
        { "text": "Step 2 description", "order": 2 }
    ]
}
```

**Validation:**
- `items`: array
- `items.*.text`: required, string
- `items.*.order`: required, integer

**Behavior:**
1. Runs in a database transaction
2. Deletes ALL existing `release_checklist_template_items` for this template
3. Creates new items from the request payload

**Response:** `{ "template": <ReleaseChecklistTemplate object with new items> }`

**Error:** 500 with error message on failure

---

## 8. Slack Integration

### 8.1 Overview

The Release system sends Slack notifications to the product's configured Slack channel (`products.slack_channel_id`). If a product has no `slack_channel_id`, no notifications are sent.

### 8.2 Notification Types

#### "Release In Progress" Notification

**Triggered when:** Release status changes to `'Release In Progress'` (on create or update)

**Message format:**
```
<!here> *The release v{version} process has started for {product.name}*
*Description: {description}*          ← only if description is not empty
*Environment: {environment}*
<{nova_release_detail_url}|ECO release link>
 •   {checklist_item_text} :white_check_mark:     ← if done=true
 •   {checklist_item_text}                         ← if done=false
...
```

**Behavior:**
- Sends message to `product.slack_channel_id`
- Saves the Slack message timestamp (`ts`) to `releases.slack_notification_timestamp`
- The timestamp is used to update the same message later

#### "Checklist Update" Notification

**Triggered when:** Any `ReleaseChecklistItem` is updated (typically toggling `done`)

**Behavior:**
- Uses the saved `slack_notification_timestamp` to update the **same Slack message** (not a new message)
- Regenerates the full message with updated checkmark status
- If no `slack_notification_timestamp` exists, does nothing

#### "Release Completed" Notification

**Triggered when:** Release status changes to `'Released to Dev'` OR `'Released to Production'`

**Message format:**
```
*The release v{version} for {product.name} has been completed*
```

### 8.3 Dependencies

- `products.slack_channel_id` must be set for the release's product
- `SlackService` handles the actual Slack API calls (`sendMessageToChannel`, `updateMessage`)

---

## 9. Filtering & Search

### 9.1 Detached Filters (on Release index page)

These are persistent filters displayed as a card above the list:

| Filter             | Type              | Field Searched            | Notes                          |
|--------------------|-------------------|---------------------------|--------------------------------|
| Product            | BelongsToFilter   | `product` (by name)       |                                |
| User               | BelongsToFilter   | `user` (by name)          |                                |
| Status             | SelectFilter      | `status`                  | Same status options            |
| Dates              | DateRangeFilter   | `created_at`              | Date range picker              |

Filters support persistence (remembered across page loads) and a reset button.

### 9.2 Search

Release is searchable by `id` only.

---

## 10. Authorization & Security

### 10.1 Access Control

| Resource                    | Create | Read | Update | Delete | Notes                                    |
|-----------------------------|--------|------|--------|--------|------------------------------------------|
| Release                     | Yes    | Yes  | Yes    | Yes    | Standard Nova authorization              |
| Release History             | Yes    | Yes  | Yes    | Yes    | Standard Nova authorization              |
| Release Checklist Template  | Yes    | Yes  | Yes    | Yes    | Standard Nova authorization              |
| Release Checklist Item      | —      | Yes  | Yes    | —      | Updated via API only, created by system  |

### 10.2 Menu Visibility

Release-related resources are in the **DevOps** menu section, visible only to admin users (`$request->user()->isAdmin()`).

**Menu placement:**
```
DevOps
├── ...
├── Releases
├── Release Checklist Templates
└── ...
```

### 10.3 Additional Requirements

- Users must have 2FA enabled to access Nova (checked in NovaServiceProvider)
- All API routes require authentication middleware

---

## 11. Seeded / Predefined Data

### 11.1 Environment Options

These are hardcoded in the Nova resource (not stored in a lookup table):

```
local, dev, test, stage, prod, dev-train, stg-train
```

### 11.2 Status Options

These are hardcoded in the Nova resource (not stored in a lookup table):

```
Created, Release In Progress, PO Review provided, Released to Dev,
Approved to Release to Production, Released to Production
```

### 11.3 Smoke Test Result Options

```
(empty/null), pass, fail
```

---

## 12. Nova UI Details

### 12.1 Release Detail Page — Cards

The Release detail page includes these custom cards (in order):

1. **Detached Filters Card** — Persistent filters (full-width, position 0)
2. **Release Checklist Card** — Interactive checklist UI (full-width, detail-only)
   - Component: `release-checklist`
   - Shows checklist items from latest ReleaseHistory
   - Allows toggling `done` state via the API
3. **Video Card** — Conditional (only if `release_history.release_video` has a URL)
   - Extracts media ID from URL pattern `/media/(\d+)/`
   - Position 2

### 12.2 Release Checklist Template Detail Page — Cards

1. **Release Checklist Template Card** — Template item management UI (full-width, detail-only)
   - Component: `release-checklist-template`
   - Provides add/remove/reorder interface for template items
   - Saves via `PUT /v1/release-checklist-templates/{id}`

### 12.3 Work Order Dependency in Release Form

When creating/editing a Release:
- The **Work Order** field is dependent on the **Product** selection
- Only work orders that belong to the selected product (via `work_order_products` pivot) are shown
- This is implemented via Nova's `relatableQueryUsing()` with `FormData`

### 12.4 Release History Redirects

After creating or updating a ReleaseHistory record, Nova redirects back to the parent Release detail page (`/resources/releases/{release_id}`) instead of staying on the history record.

### 12.5 Field Display Variations

Some fields display differently depending on context:

| Field (ReleaseHistory) | Form View        | Index/Detail View                            |
|------------------------|------------------|----------------------------------------------|
| Approved By            | Select (user ID) | Text (user name)                             |
| Release Manager        | Select (user ID) | Text (user name)                             |
| Server                 | Text input       | Clickable HTML link                          |
| Release Notes          | Text input       | Truncated clickable link (max-width 300px)   |

---

## Appendix: Complete Event Chain — Release Lifecycle

```
1. User creates Release (product=X, environment="prod", status="Created")
   │
   ├── Release.boot::created fires
   │   ├── Creates ReleaseHistory (status="Created", environment="prod", manager=user)
   │   │   └── ReleaseHistory.boot::created fires
   │   │       ├── Looks up ProductEnvironment (product=X, environment="prod")
   │   │       └── If template found → creates ReleaseChecklistItems (done=false)
   │   └── Status is "Created" → no Slack notification
   │
2. User updates Release status to "Release In Progress"
   │
   ├── Release.boot::updated fires
   │   ├── status is dirty → calls SlackController::sendReleaseInProgressNotification()
   │   │   ├── Builds message with checklist status
   │   │   ├── Sends to product.slack_channel_id
   │   │   └── Saves Slack message `ts` to release.slack_notification_timestamp
   │   └── environment NOT dirty → no new history
   │
3. User toggles checklist item done=true
   │
   ├── PUT /releases/update-checklist-item-state {id: Y, done: true}
   │   └── ReleaseChecklistItem.boot::updated fires
   │       └── Calls SlackController::updateReleaseInProgressNotification()
   │           └── Updates existing Slack message (same thread) with checkmarks on completed items
   │
4. User updates Release status to "Released to Production"
   │
   ├── Release.boot::updated fires
   │   └── status is dirty → calls SlackController::sendReleaseCompletedNotification()
   │       └── Sends completion message to Slack channel
```

---

## Appendix: External Dependencies

These are existing tables your new app must be aware of (but does not manage in the Release context):

| Table                        | Used By                                    | Relationship                                              |
|------------------------------|--------------------------------------------|------------------------------------------------------------|
| `products`                   | `releases.product_id`                      | A release belongs to a product                             |
| `products.slack_channel_id`  | Slack notifications                        | Determines which Slack channel to notify                   |
| `product_environments`       | Checklist template lookup                  | Links product+environment to a checklist template          |
| `work_orders`                | `releases.work_order_id`                   | A release optionally belongs to a work order               |
| `users`                      | `releases.user_id`, `release_histories.approved_by_user_id`, `release_histories.release_manager_user_id` | User tracking |
