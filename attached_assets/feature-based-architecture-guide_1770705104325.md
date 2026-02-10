# Building Feature-Based Apps with Redux Toolkit

A practical guide for creating new applications using the feature-based architecture pattern with Redux Toolkit, based on the Work Orders module.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Step 1 — Set Up the Redux Store](#step-1--set-up-the-redux-store)
4. [Step 2 — Create Typed Hooks](#step-2--create-typed-hooks)
5. [Step 3 — Create the Base Query (API Layer)](#step-3--create-the-base-query-api-layer)
6. [Step 4 — Define Shared Types](#step-4--define-shared-types)
7. [Step 5 — Define Shared Constants](#step-5--define-shared-constants)
8. [Step 6 — Create Shared Utility Functions](#step-6--create-shared-utility-functions)
9. [Step 7 — Build Your First Feature](#step-7--build-your-first-feature)
   - [7a. RTK Query API](#7a-rtk-query-api)
   - [7b. Redux Slice (Local State)](#7b-redux-slice-local-state)
   - [7c. Feature Components](#7c-feature-components)
   - [7d. Feature Page](#7d-feature-page)
10. [Step 8 — Register the Feature in the Store](#step-8--register-the-feature-in-the-store)
11. [Step 9 — Wire Up the App Root](#step-9--wire-up-the-app-root)
12. [Step 10 — Add Navigation / Routing](#step-10--add-navigation--routing)
13. [Adding More Features](#adding-more-features)
14. [State Management Decision Guide](#state-management-decision-guide)
15. [RTK Query Patterns](#rtk-query-patterns)
16. [Common Mistakes](#common-mistakes)
17. [Checklist for New Features](#checklist-for-new-features)

---

## Architecture Overview

The architecture splits the frontend into three layers:

```
app/          Infrastructure shared by the entire application
shared/       Types, constants, and utilities used across features
features/     Self-contained feature modules (each with its own API, state, and UI)
```

Each **feature** is a self-contained folder that owns its:
- **API definitions** (RTK Query endpoints)
- **State slice** (Redux Toolkit reducers and selectors)
- **Components** (UI building blocks)
- **Page** (top-level view that composes the components)

This means you can add, remove, or refactor a feature without touching other parts of the app.

### Why This Pattern?

| Benefit | How |
|---|---|
| **Scalability** | Each feature is isolated — new features don't bloat existing files |
| **Discoverability** | Everything related to "work orders" lives in `features/work-orders/` |
| **Caching & Performance** | RTK Query handles caching, deduplication, and background refetching automatically |
| **Type Safety** | Shared types flow from `shared/types.ts` into every feature |
| **Testability** | Slices and APIs can be tested independently |

---

## Folder Structure

```
client/src/
├── app/                          # App-level infrastructure
│   ├── store.ts                  # Redux store configuration
│   ├── hooks.ts                  # Typed useAppDispatch / useAppSelector
│   ├── baseQuery.ts              # Axios-based RTK Query base query
│   └── routerSlice.ts            # (Optional) Routing state
│
├── shared/                       # Cross-feature shared code
│   ├── types.ts                  # Domain interfaces and type aliases
│   ├── constants.ts              # Lookup maps, variants, enums
│   └── utils.ts                  # Pure helper functions
│
├── features/                     # Feature modules
│   ├── work-orders/              # Example feature
│   │   ├── api.ts                # RTK Query API (endpoints)
│   │   ├── slice.ts              # Redux slice (filters, pagination, etc.)
│   │   ├── WorkOrdersPage.tsx    # Page component
│   │   └── components/           # Feature-specific UI components
│   │       ├── WorkOrderFilters.tsx
│   │       ├── WorkOrdersTable.tsx
│   │       └── PaginationBar.tsx
│   │
│   ├── timeline/                 # Another feature
│   │   ├── TimelinePage.tsx
│   │   ├── utils.ts              # Feature-specific helpers
│   │   └── components/
│   │       ├── TimelineEventCard.tsx
│   │       ├── TimelineNavigator.tsx
│   │       └── VideoPlayer.tsx
│   │
│   └── documentation/            # Another feature
│       ├── DocumentationPage.tsx
│       └── data.ts
│
├── providers/                    # React Context providers (auth, API, etc.)
├── components/ui/                # Reusable UI primitives (shadcn, etc.)
├── App.tsx                       # Mount/unmount + Provider wiring
└── AppContent.tsx                # Top-level router / view switcher
```

---

## Step 1 — Set Up the Redux Store

Create `client/src/app/store.ts`. This is where all feature reducers and RTK Query APIs are registered.

```ts
// client/src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';

// Feature imports (added as you build features)
import routerReducer from './routerSlice';
import workOrdersReducer from '../features/work-orders/slice';
import { workOrdersApi } from '../features/work-orders/api';

export const store = configureStore({
  reducer: {
    router: routerReducer,
    workOrders: workOrdersReducer,
    [workOrdersApi.reducerPath]: workOrdersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(workOrdersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Key points:**
- Each feature adds its slice reducer and (optionally) its RTK Query API reducer + middleware.
- `serializableCheck: false` is needed if your state contains non-serializable values (dates, class instances). Keep it `true` if possible.

---

## Step 2 — Create Typed Hooks

Create `client/src/app/hooks.ts` so every component uses properly typed dispatch and selector hooks.

```ts
// client/src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Usage in components:**
```ts
import { useAppDispatch, useAppSelector } from '@/app/hooks';
```

---

## Step 3 — Create the Base Query (API Layer)

RTK Query needs a "base query" function that tells it how to make HTTP requests. Wrap Axios so all endpoints share the same configuration (base URL, auth headers, error handling).

```ts
// client/src/app/baseQuery.ts
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { AxiosInstance } from 'axios';

let apiInstance: AxiosInstance | null = null;

export function configureApiInstance(
  baseUrl: string,
  token?: string,
  permissions?: string[]
) {
  apiInstance = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(permissions?.length
        ? { 'X-Permissions': permissions.join(',') }
        : {}),
    },
  });
}

interface BaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
}

export const axiosBaseQuery: BaseQueryFn<BaseQueryArgs, unknown, unknown> =
  async ({ url, method = 'GET', data, params }) => {
    if (!apiInstance) {
      return { error: { status: 500, data: 'API not configured' } };
    }
    try {
      const result = await apiInstance({ url, method, data, params });
      return { data: result.data };
    } catch (err) {
      const axiosError = err as AxiosError;
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };
```

**Call `configureApiInstance()` once at app startup** (before rendering), typically in `App.tsx`.

---

## Step 4 — Define Shared Types

Put all domain interfaces in `client/src/shared/types.ts`. Every feature imports from here, ensuring consistency.

```ts
// client/src/shared/types.ts
export interface WorkOrderStatus {
  id: number;
  name: string;
}

export interface WorkOrder {
  id: number;
  title: string;
  summary: string | null;
  priority: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  status: WorkOrderStatus;
  client: WorkOrderClient | null;
  products: WorkOrderProduct[];
}

export type SortField = 'title' | 'status' | 'client' | 'priority' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';
```

**Rule of thumb:** If two or more features need the same type, it belongs in `shared/types.ts`. If only one feature uses it, define it inside that feature's files.

---

## Step 5 — Define Shared Constants

Put lookup maps, color variants, and enum-like values in `client/src/shared/constants.ts`.

```ts
// client/src/shared/constants.ts
export const priorityLabels: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

export const statusVariant: Record<string, string> = {
  Backlog: 'bg-muted text-muted-foreground',
  'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};
```

---

## Step 6 — Create Shared Utility Functions

Pure helper functions that multiple features need go in `client/src/shared/utils.ts`.

```ts
// client/src/shared/utils.ts
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(dateStr));
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
```

---

## Step 7 — Build Your First Feature

Each feature lives in its own folder under `features/`. A feature typically contains:

### 7a. RTK Query API

This file defines all the backend endpoints your feature needs. RTK Query automatically generates React hooks for each endpoint.

```ts
// client/src/features/work-orders/api.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../app/baseQuery';
import type { WorkOrder, WorkOrderStatus } from '../../shared/types';

interface WorkOrdersResponse {
  data: WorkOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface WorkOrdersQueryParams {
  search?: string;
  status_id?: string;
  sort_field: string;
  sort_direction: string;
  page: number;
  page_size: number;
}

export const workOrdersApi = createApi({
  reducerPath: 'workOrdersApi',
  baseQuery: axiosBaseQuery,
  endpoints: (builder) => ({
    getWorkOrders: builder.query<WorkOrdersResponse, WorkOrdersQueryParams>({
      query: (params) => ({
        url: '/work-orders',
        params,
      }),
    }),
    getStatuses: builder.query<WorkOrderStatus[], void>({
      query: () => ({ url: '/work-orders/statuses' }),
    }),
    getWorkOrderById: builder.query<WorkOrder, number>({
      query: (id) => ({ url: `/work-orders/${id}` }),
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetStatusesQuery,
  useGetWorkOrderByIdQuery,
} = workOrdersApi;
```

**What you get for free:**
- `useGetWorkOrdersQuery(params)` returns `{ data, isLoading, error, isFetching }`
- Automatic caching — identical requests are deduplicated
- Background refetching when args change
- Generated hooks for every endpoint

### 7b. Redux Slice (Local State)

Use a slice for state that the user controls (filters, pagination, sorting, selections) rather than server data.

```ts
// client/src/features/work-orders/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SortField, SortDirection, WorkOrder } from '../../shared/types';
import type { RootState } from '../../app/store';

interface WorkOrdersState {
  searchQuery: string;
  debouncedSearch: string;
  statusFilter: string;
  currentPage: number;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedWorkOrder: WorkOrder | null;
}

const initialState: WorkOrdersState = {
  searchQuery: '',
  debouncedSearch: '',
  statusFilter: 'all',
  currentPage: 1,
  sortField: 'updatedAt',
  sortDirection: 'desc',
  selectedWorkOrder: null,
};

const workOrdersSlice = createSlice({
  name: 'workOrders',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setDebouncedSearch(state, action: PayloadAction<string>) {
      state.debouncedSearch = action.payload;
      state.currentPage = 1; // Reset page when search changes
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    toggleSort(state, action: PayloadAction<SortField>) {
      if (state.sortField === action.payload) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = action.payload;
        state.sortDirection = 'asc';
      }
      state.currentPage = 1;
    },
    setSelectedWorkOrder(state, action: PayloadAction<WorkOrder | null>) {
      state.selectedWorkOrder = action.payload;
    },
    clearFilters(state) {
      state.searchQuery = '';
      state.debouncedSearch = '';
      state.statusFilter = 'all';
      state.currentPage = 1;
    },
  },
});

export const {
  setSearchQuery,
  setDebouncedSearch,
  setStatusFilter,
  setCurrentPage,
  toggleSort,
  setSelectedWorkOrder,
  clearFilters,
} = workOrdersSlice.actions;

// Selectors
export const selectWorkOrdersState = (state: RootState) => state.workOrders;
export const selectCurrentPage = (state: RootState) => state.workOrders.currentPage;

export default workOrdersSlice.reducer;
```

**Key pattern:** Reducers that change filters should also reset `currentPage` to 1 so the user doesn't land on an empty page.

### 7c. Feature Components

Break the UI into focused components. Each component reads from Redux (via `useAppSelector`) and dispatches actions (via `useAppDispatch`).

```
features/work-orders/components/
├── WorkOrderFilters.tsx     # Search input + dropdown filters
├── WorkOrdersTable.tsx      # Sortable data table
└── PaginationBar.tsx        # Page navigation controls
```

Example component pattern:

```tsx
// features/work-orders/components/WorkOrderFilters.tsx
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectWorkOrdersState, setSearchQuery, setStatusFilter } from '../slice';

export function WorkOrderFilters() {
  const dispatch = useAppDispatch();
  const { searchQuery, statusFilter } = useAppSelector(selectWorkOrdersState);

  return (
    <div className="flex gap-2">
      <input
        data-testid="input-search"
        value={searchQuery}
        onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        placeholder="Search..."
      />
      {/* More filter controls */}
    </div>
  );
}
```

### 7d. Feature Page

The page component ties everything together. It calls the RTK Query hooks and passes data to child components.

```tsx
// features/work-orders/WorkOrdersPage.tsx
import { useAppSelector } from '@/app/hooks';
import { selectWorkOrdersState } from './slice';
import { useGetWorkOrdersQuery } from './api';
import { WorkOrderFilters } from './components/WorkOrderFilters';
import { WorkOrdersTable } from './components/WorkOrdersTable';
import { PaginationBar } from './components/PaginationBar';

export function WorkOrdersPage() {
  const {
    debouncedSearch, statusFilter, sortField,
    sortDirection, currentPage,
  } = useAppSelector(selectWorkOrdersState);

  const { data, isLoading } = useGetWorkOrdersQuery({
    search: debouncedSearch || undefined,
    status_id: statusFilter !== 'all' ? statusFilter : undefined,
    sort_field: sortField,
    sort_direction: sortDirection,
    page: currentPage,
    page_size: 10,
  });

  return (
    <div className="p-4 space-y-4">
      <WorkOrderFilters />
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <WorkOrdersTable workOrders={data?.data || []} />
          <PaginationBar
            currentPage={data?.page || 1}
            totalPages={data?.totalPages || 1}
          />
        </>
      )}
    </div>
  );
}
```

---

## Step 8 — Register the Feature in the Store

Every time you create a new feature with a slice or API, add it to the store:

```ts
// client/src/app/store.ts
import newFeatureReducer from '../features/new-feature/slice';
import { newFeatureApi } from '../features/new-feature/api';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    newFeature: newFeatureReducer,
    [newFeatureApi.reducerPath]: newFeatureApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(workOrdersApi.middleware)
      .concat(newFeatureApi.middleware),  // Add the new API middleware
});
```

---

## Step 9 — Wire Up the App Root

Wrap your app with the Redux `Provider` and configure the API instance before rendering.

```tsx
// client/src/App.tsx
import { Provider } from 'react-redux';
import { store } from './app/store';
import { configureApiInstance } from './app/baseQuery';
import { AppContent } from './AppContent';

function mount(container, props) {
  // Configure API before rendering
  configureApiInstance(props.apiBaseUrl, props.auth.token, props.auth.permissions);

  root = createRoot(container);
  root.render(
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
```

---

## Step 10 — Add Navigation / Routing

For simple apps, use a Redux slice to track which view is active. For complex apps, consider a client-side router.

**Simple approach (Redux-based):**

```tsx
// client/src/AppContent.tsx
import { useAppSelector } from './app/hooks';
import { selectShowDocs } from './app/routerSlice';
import { selectWorkOrdersState } from './features/work-orders/slice';
import { WorkOrdersPage } from './features/work-orders/WorkOrdersPage';
import { TimelinePage } from './features/timeline/TimelinePage';
import { DocumentationPage } from './features/documentation/DocumentationPage';

export function AppContent() {
  const showDocs = useAppSelector(selectShowDocs);
  const { selectedWorkOrder } = useAppSelector(selectWorkOrdersState);

  if (showDocs) return <DocumentationPage />;
  if (selectedWorkOrder) return <TimelinePage workOrder={selectedWorkOrder} />;
  return <WorkOrdersPage />;
}
```

---

## Adding More Features

To add a new feature (e.g., "notifications"), follow this checklist:

1. **Create the folder**: `client/src/features/notifications/`
2. **Define shared types** (if needed): Add interfaces to `shared/types.ts`
3. **Create the API** (`api.ts`): Define RTK Query endpoints
4. **Create the slice** (`slice.ts`): Define state, reducers, selectors
5. **Build components** (`components/`): Feature-specific UI pieces
6. **Build the page** (`NotificationsPage.tsx`): Compose components + call hooks
7. **Register in store** (`app/store.ts`): Add reducer + API middleware
8. **Add routing** (`AppContent.tsx`): Add the new page to the view switcher

---

## State Management Decision Guide

Use this to decide where state should live:

| Question | Answer | Where to put it |
|---|---|---|
| Does it come from the server? | Yes | **RTK Query** (automatic caching) |
| Is it shared across features? | Yes | **Redux slice** in `app/` |
| Is it specific to one feature? | Yes | **Redux slice** in `features/xxx/` |
| Is it transient UI state? (modal open, expanded row) | Yes | **React `useState`** in the component |
| Is it derived from other state? | Yes | **Selector** (memoized with `createSelector`) |

**Examples from this project:**

| State | Location | Why |
|---|---|---|
| Work orders list | RTK Query cache | Server data, auto-managed |
| Search query | Redux slice (`workOrders`) | Shared by filters + table |
| Current page | Redux slice (`workOrders`) | Shared by table + pagination bar |
| Selected work order | Redux slice (`workOrders`) | Used by AppContent to switch views |
| Hash route (`#/docs`) | Redux slice (`router`) | Used by AppContent for navigation |
| Expanded video URL | `useState` in `VideoPlayer` | Transient, only matters to that component |
| Open day groups | `useState` in `TimelinePage` | Transient, only matters to that page |
| Note modal content | `useState` in `TimelinePage` | Transient, only matters to that page |

---

## RTK Query Patterns

### Basic query with parameters

```ts
getWorkOrders: builder.query<ResponseType, ParamsType>({
  query: (params) => ({
    url: '/work-orders',
    params,
  }),
}),
```

### Query with no parameters

```ts
getStatuses: builder.query<StatusType[], void>({
  query: () => ({ url: '/work-orders/statuses' }),
}),
```

### Query with URL parameter

```ts
getTimeline: builder.query<TimelineEvent[], number>({
  query: (workOrderId) => ({
    url: `/work-orders/${workOrderId}/timeline`,
  }),
}),
```

### Using query hooks in components

```tsx
// Skip fetching when condition is not met
const { data, isLoading, error } = useGetTimelineQuery(workOrderId, {
  skip: !workOrderId,
});

// Polling (refetch every 30 seconds)
const { data } = useGetWorkOrdersQuery(params, {
  pollingInterval: 30000,
});
```

### Conditional parameters (skip "all" filters)

```ts
const { data } = useGetWorkOrdersQuery({
  search: debouncedSearch || undefined,
  status_id: statusFilter !== 'all' ? statusFilter : undefined,
  sort_field: sortField,
  sort_direction: sortDirection,
  page: currentPage,
  page_size: 10,
});
```

RTK Query will automatically re-fetch when any parameter changes.

---

## Common Mistakes

### 1. Forgetting to add API middleware to the store

RTK Query will silently fail to cache or refetch if you forget `.concat(myApi.middleware)`.

### 2. Not resetting pagination when filters change

Always set `currentPage = 1` inside filter reducers, otherwise users may see an empty page.

### 3. Putting server data in a slice

Don't use `createAsyncThunk` or manual `useEffect` + `useState` for server data. Use RTK Query instead — it handles caching, loading states, and error states automatically.

### 4. Putting transient UI state in Redux

Modal open/close, accordion expanded, tooltip visible — these belong in `useState`. Putting them in Redux creates unnecessary complexity and re-renders.

### 5. Not typing selectors

Always export typed selectors from your slice so components get autocomplete:

```ts
// Good
export const selectCurrentPage = (state: RootState) => state.workOrders.currentPage;

// Bad — loses type safety
const page = useSelector((state: any) => state.workOrders.currentPage);
```

### 6. Circular imports between features

Features should never import from each other. If two features need the same data, move it to `shared/`. If feature A needs to trigger something in feature B, dispatch an action and let AppContent coordinate.

---

## Checklist for New Features

- [ ] Created `features/my-feature/` folder
- [ ] Added types to `shared/types.ts` (if shared)
- [ ] Created `api.ts` with RTK Query endpoints
- [ ] Created `slice.ts` with state, reducers, and selectors
- [ ] Built components in `components/` subfolder
- [ ] Created `MyFeaturePage.tsx` composing the components
- [ ] Added reducer to `store.ts`
- [ ] Added API middleware to `store.ts`
- [ ] Added page to `AppContent.tsx` routing logic
- [ ] Added `data-testid` attributes to interactive and display elements
- [ ] Verified feature works with other features (no circular imports)
