# Design Guide — Icons, Styles & Design Patterns

This document describes the icons, color system, UI components, and design patterns used throughout the Release Management System frontend.

---

## Table of Contents

1. [Icon Library](#icon-library)
2. [Color System & Theming](#color-system--theming)
3. [UI Component Library](#ui-component-library)
4. [Status & Environment Badges](#status--environment-badges)
5. [Layout Patterns](#layout-patterns)
6. [Interaction Patterns](#interaction-patterns)
7. [Permission-Based UI](#permission-based-ui)
8. [Typography & Spacing](#typography--spacing)
9. [Dark Mode](#dark-mode)
10. [Form Patterns](#form-patterns)
11. [Loading & Skeleton States](#loading--skeleton-states)
12. [Micro-Frontend Considerations](#micro-frontend-considerations)

---

## Icon Library

All icons come from **lucide-react**. Icons are sized consistently at `w-4 h-4` unless context demands otherwise.

### Navigation & Branding

| Icon | Import | Usage |
|------|--------|-------|
| `Package` | `lucide-react` | App logo in sidebar header |
| `Rocket` | `lucide-react` | Releases nav item |
| `ListChecks` | `lucide-react` | Checklist Templates nav item / template icon |
| `PanelLeftIcon` | `lucide-react` | Sidebar collapse/expand trigger |

### Actions

| Icon | Import | Usage |
|------|--------|-------|
| `Plus` | `lucide-react` | Create / Add new item |
| `Edit` | `lucide-react` | Edit action |
| `Trash2` | `lucide-react` | Delete action |
| `Save` | `lucide-react` | Save / submit form |
| `ArrowLeft` | `lucide-react` | Back navigation |
| `X` | `lucide-react` | Close / clear / cancel |
| `Search` | `lucide-react` | Search input |
| `ExternalLink` | `lucide-react` | Open external link |
| `GripVertical` | `lucide-react` | Drag handle for reorderable items |

### Status & Information

| Icon | Import | Usage |
|------|--------|-------|
| `CheckCircle2` | `lucide-react` | Completed checklist item |
| `Circle` | `lucide-react` | Incomplete checklist item |
| `Clock` | `lucide-react` | Timestamp / date display |
| `Calendar` | `lucide-react` | Date fields |
| `User` | `lucide-react` | User / assignee |
| `Server` | `lucide-react` | Environment indicator |
| `FileText` | `lucide-react` | Notes / description |
| `Video` | `lucide-react` | Release video section |
| `AlertCircle` | `lucide-react` | Error / not found states |
| `Loader2` | `lucide-react` | Loading spinner (animated with `animate-spin`) |

### Navigation Controls

| Icon | Import | Usage |
|------|--------|-------|
| `ChevronDown` | `lucide-react` | Expand section / dropdown |
| `ChevronUp` | `lucide-react` | Collapse section |
| `ChevronLeft` | `lucide-react` | Previous page (pagination) |
| `ChevronRight` | `lucide-react` | Next page (pagination) |

### Theme

| Icon | Import | Usage |
|------|--------|-------|
| `Sun` | `lucide-react` | Light mode indicator (shown in dark mode) |
| `Moon` | `lucide-react` | Dark mode indicator (shown in light mode) |

---

## Color System & Theming

The app uses CSS custom properties defined in `client/src/index.css` with HSL values (space-separated: `H S% L%`). Tailwind references these via `tailwind.config.ts`.

### Core Semantic Tokens

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `--background` | Page background | `0 0% 100%` (white) | `0 0% 9%` (near-black) |
| `--foreground` | Default text | `0 0% 9%` | `0 0% 98%` |
| `--card` | Card surfaces | `0 0% 98%` | `0 0% 11%` |
| `--card-foreground` | Card text | `0 0% 9%` | `0 0% 98%` |
| `--primary` | Primary accent (blue) | `217 91% 60%` | `217 91% 60%` |
| `--primary-foreground` | Text on primary | `0 0% 98%` | `0 0% 98%` |
| `--secondary` | Secondary surfaces | `0 0% 90%` | `0 0% 19%` |
| `--muted` | Muted backgrounds | `0 0% 92%` | `0 0% 17%` |
| `--muted-foreground` | Secondary text | `0 0% 45%` | `0 0% 65%` |
| `--destructive` | Danger actions (red) | `0 84% 60%` | `0 84% 60%` |
| `--accent` | Subtle highlights | `210 6% 93%` | `210 6% 16%` |
| `--border` | Default borders | `0 0% 89%` | `0 0% 18%` |
| `--input` | Input borders | `0 0% 70%` | `0 0% 30%` |
| `--ring` | Focus rings | `217 91% 60%` | `217 91% 60%` |

### Sidebar Tokens

| Token | Purpose |
|-------|---------|
| `--sidebar` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-border` | Sidebar border |
| `--sidebar-primary` | Active sidebar item accent |
| `--sidebar-accent` | Sidebar hover/selected |

### Elevation System

The app uses a custom CSS elevation system for hover/active interactions instead of manually specifying hover colors:

| CSS Variable | Light Mode | Dark Mode |
|--------------|------------|-----------|
| `--elevate-1` | `rgba(0,0,0, .03)` | `rgba(255,255,255, .04)` |
| `--elevate-2` | `rgba(0,0,0, .08)` | `rgba(255,255,255, .09)` |

### Border Radius

| Tailwind Class | Value |
|----------------|-------|
| `rounded-sm` | 3px |
| `rounded-md` | 6px |
| `rounded-lg` | 9px |

### Font Stack

| Variable | Value |
|----------|-------|
| `--font-sans` | Open Sans, sans-serif |
| `--font-serif` | Georgia, serif |
| `--font-mono` | Menlo, monospace |

---

## UI Component Library

Built on **shadcn/ui** (Radix UI primitives + Tailwind). Components live in `client/src/components/ui/`.

### Actively Used Components

| Component | Import Path | Where Used |
|-----------|-------------|------------|
| `Button` | `@/components/ui/button` | All pages — actions, navigation, form submission |
| `Card`, `CardContent`, `CardHeader` | `@/components/ui/card` | Detail pages, form containers, history cards |
| `Badge` | `@/components/ui/badge` | Status labels, environment tags, checklist counters |
| `Input` | `@/components/ui/input` | Search bars, form text fields |
| `Textarea` | `@/components/ui/textarea` | Multi-line form fields (notes, descriptions) |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | `@/components/ui/select` | Filters, form dropdowns |
| `Checkbox` | `@/components/ui/checkbox` | Checklist item toggle |
| `Skeleton` | `@/components/ui/skeleton` | Loading placeholders |
| `Separator` | `@/components/ui/separator` | Visual dividers |
| `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` | `@/components/ui/table` | Releases list table |
| `AlertDialog` (+ sub-components) | `@/components/ui/alert-dialog` | Delete confirmations |
| `Dialog` (+ sub-components) | `@/components/ui/dialog` | Template create/edit modals |
| `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` | `@/components/ui/form` | All form pages (wraps react-hook-form) |
| `Sidebar` (+ sub-components) | `@/components/ui/sidebar` | App navigation sidebar |
| `Toaster` | `@/components/ui/toaster` | Toast notifications |
| `TooltipProvider` | `@/components/ui/tooltip` | Tooltip context |

### Button Variants Used

| Variant | Usage |
|---------|-------|
| `default` | Primary actions (Save, Create) |
| `outline` | Secondary actions (Edit, Back, filters) |
| `ghost` | Subtle actions (theme toggle, sidebar trigger) |
| `destructive` | Delete actions |
| `size="icon"` | Icon-only buttons (theme toggle, close) |
| `size="sm"` | Compact buttons in dense UI areas |

---

## Status & Environment Badges

Custom badge components in `client/src/shared/StatusBadge.tsx` with color mappings in `client/src/shared/constants.ts`.

### Release Status Colors

| Status | Light Mode | Dark Mode |
|--------|------------|-----------|
| Created | `bg-muted text-muted-foreground` | (same semantic tokens) |
| Release In Progress | `bg-yellow-100 text-yellow-800` | `bg-yellow-900/30 text-yellow-300` |
| PO Review provided | `bg-blue-100 text-blue-800` | `bg-blue-900/30 text-blue-300` |
| Released to Dev | `bg-emerald-100 text-emerald-800` | `bg-emerald-900/30 text-emerald-300` |
| Approved to Release to Production | `bg-purple-100 text-purple-800` | `bg-purple-900/30 text-purple-300` |
| Released to Production | `bg-green-100 text-green-800` | `bg-green-900/30 text-green-300` |

### Environment Colors

| Environment | Light Mode | Dark Mode |
|-------------|------------|-----------|
| local | `bg-muted text-muted-foreground` | (same) |
| dev | `bg-blue-100 text-blue-800` | `bg-blue-900/30 text-blue-300` |
| test | `bg-orange-100 text-orange-800` | `bg-orange-900/30 text-orange-300` |
| stage | `bg-purple-100 text-purple-800` | `bg-purple-900/30 text-purple-300` |
| prod | `bg-red-100 text-red-800` | `bg-red-900/30 text-red-300` |
| dev-train | `bg-teal-100 text-teal-800` | `bg-teal-900/30 text-teal-300` |
| stg-train | `bg-indigo-100 text-indigo-800` | `bg-indigo-900/30 text-indigo-300` |

### Badge Pattern

All status/environment badges use `no-default-hover-elevate no-default-active-elevate` classes to disable interactive elevation since they are informational, not clickable.

```tsx
<Badge className={`${variant} no-default-hover-elevate no-default-active-elevate font-medium`}>
  {label}
</Badge>
```

---

## Layout Patterns

### App Shell (Standalone Mode)

```
+-------------------+------------------------------------------+
| Sidebar           | Header (SidebarTrigger + ThemeToggle)     |
| - Releases        +------------------------------------------+
| - Templates       | Main Content (scrollable)                |
|                   |                                          |
+-------------------+------------------------------------------+
```

- **SidebarProvider** wraps everything, with `--sidebar-width: 16rem`
- Header uses `sticky top-0 z-50 bg-background border-b`
- Main content uses `flex-1 overflow-auto`
- Sidebar is collapsible via `SidebarTrigger`

### Federation Mode

No sidebar or header — only `AppContent` is rendered. The host app provides its own shell. Hash-based routing (`#/releases`, `#/templates`) is used for federation, path-based routing (`/releases`, `/templates`) for standalone.

### Page Layout Conventions

- **List pages**: Filter bar at top, data table below, pagination at bottom
- **Detail pages**: Back button + title in header, content sections in cards, related data at bottom
- **Form pages**: Back button + title, single card containing the form, action buttons at bottom

---

## Interaction Patterns

### Elevation System

The app uses custom CSS utility classes for hover/active interactions instead of manual `hover:bg-*` classes:

| Class | Effect |
|-------|--------|
| `hover-elevate` | Subtle background elevation on hover (uses `--elevate-1`) |
| `active-elevate-2` | Stronger elevation on press (uses `--elevate-2`) |
| `toggle-elevate` | Prepares element for toggle state |
| `toggle-elevated` | Marks element as "on" in toggle state |
| `no-default-hover-elevate` | Removes built-in hover elevation |
| `no-default-active-elevate` | Removes built-in active elevation |

**Rules:**
- `Button` and `Badge` components have hover/active elevation built in — never add extra hover styles
- Elevation classes do not work with `overflow-hidden` or `overflow-scroll`
- Non-interactive badges should disable elevation with `no-default-hover-elevate`

### Delete Confirmation

All delete actions use `AlertDialog` for confirmation:

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="w-4 h-4 mr-1" /> Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm title</AlertDialogTitle>
      <AlertDialogDescription>Warning message</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Toast Notifications

Used for success/error feedback after mutations:

```tsx
const { toast } = useToast();
toast({ title: "Success", description: "Release created." });
toast({ title: "Error", description: message, variant: "destructive" });
```

---

## Permission-Based UI

The `useAuth()` hook provides `hasPermission(key)` for conditional rendering.

### Permission Format

`domain:action` — e.g., `release:view`, `template:create`, `history:edit`

### Domains & Actions

| Domain | Actions |
|--------|---------|
| `release` | `view`, `create`, `edit`, `delete` |
| `template` | `view`, `create`, `edit`, `delete` |
| `history` | `view`, `create`, `edit`, `delete` |

### Behavior

- **No permissions provided** (empty array or undefined): `hasPermission()` returns `true` for all checks — standalone mode works fully without restrictions
- **Permissions explicitly provided** (non-empty array from host): `hasPermission()` strictly checks the list — only matching permissions allow UI elements

### Usage Pattern

```tsx
const { hasPermission } = useAuth();

{hasPermission("release:create") && (
  <Button onClick={handleCreate}>
    <Plus className="w-4 h-4 mr-1" /> New Release
  </Button>
)}
```

---

## Typography & Spacing

### Text Hierarchy

| Level | Classes | Usage |
|-------|---------|-------|
| Page title | `text-2xl font-bold` | Main page headings |
| Section title | `text-lg font-semibold` | Card headers, section labels |
| Label | `text-sm font-medium` | Form labels, field names |
| Body | `text-sm` | General content |
| Caption | `text-xs text-muted-foreground` | Timestamps, secondary info |
| Sidebar title | `text-sm font-semibold` | App name in sidebar |
| Sidebar subtitle | `text-xs text-muted-foreground` | Category label |

### Spacing Scale

| Context | Value |
|---------|-------|
| Page padding | `p-6` |
| Card padding | `p-4` to `p-6` |
| Gap between sections | `gap-6` |
| Gap between inline elements | `gap-2` to `gap-4` |
| Button icon margin | `mr-1` |

### Date Formatting

Utility functions in `client/src/shared/utils.ts` using `date-fns`:

| Function | Format | Example Output |
|----------|--------|----------------|
| `formatDate()` | `MMM d, yyyy` | Feb 10, 2026 |
| `formatDateTime()` | `MMM d, yyyy h:mm a` | Feb 10, 2026 3:45 PM |
| `toDateInputValue()` | `YYYY-MM-DD` | 2026-02-10 |
| `toDateTimeInputValue()` | ISO 8601 (truncated) | 2026-02-10T15:45 |

---

## Dark Mode

Implemented via class-based toggling on `document.documentElement`.

### How It Works

1. `darkMode: ["class"]` in `tailwind.config.ts`
2. `ThemeToggle` component adds/removes `dark` class on `<html>`
3. All color tokens defined in both `:root` (light) and `.dark` (dark) blocks in `index.css`
4. User preference persisted in `localStorage` under key `theme`
5. Falls back to system preference via `prefers-color-scheme` media query

### Convention for Custom Colors

When using non-semantic Tailwind colors (e.g., for status badges), always provide both light and dark variants:

```tsx
className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
```

---

## Form Patterns

### Stack

- **react-hook-form** via shadcn `Form` component
- **Zod** validation with `zodResolver`
- **RTK Query** mutations for submission

### Pattern

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
      Save
    </Button>
  </form>
</Form>
```

---

## Loading & Skeleton States

All pages show `Skeleton` placeholders while data is loading:

```tsx
if (isLoading) {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
```

Mutation loading uses `Loader2` icon with `animate-spin`:

```tsx
<Loader2 className="w-4 h-4 animate-spin" />
```

---

## Micro-Frontend Considerations

### Standalone vs Federation Mode

| Aspect | Standalone | Federation |
|--------|-----------|------------|
| Entry | `bootstrap.tsx` | `App.tsx` (mount/unmount) |
| Shell | Sidebar + Header + ThemeToggle | None (host provides) |
| Routing | Path-based (`/releases`) | Hash-based (`#/releases`) |
| Auth | Mock auth, all permissions allowed | Host-provided via `RemoteAppProps` |
| API Base | `/api` (same origin) | Configurable via `apiBaseUrl` prop |
| CSS | Self-contained `index.css` | Bundled with federation output |

### Theme Detection in Embedded Content

The Tetheree video iframe uses `MutationObserver` to detect theme changes on `document.documentElement` class list, enabling real-time light/dark theme synchronization with the host.

---

## Data Test IDs

All interactive and meaningful display elements include `data-testid` attributes for automated testing:

| Pattern | Example |
|---------|---------|
| `button-{action}` | `button-sidebar-toggle`, `button-theme-toggle` |
| `link-nav-{name}` | `link-nav-releases`, `link-nav-checklist-templates` |
| `badge-status-{status}` | `badge-status-created` |
| `badge-env-{env}` | `badge-env-prod` |
| `text-{content}` | `text-app-title` |
| `input-{field}` | `input-search` |
| `row-{type}-{id}` | `row-release-42` |

---

## File Reference

| File | Purpose |
|------|---------|
| `client/src/index.css` | CSS custom properties, elevation system, base styles |
| `tailwind.config.ts` | Tailwind theme extension, color mappings, plugins |
| `client/src/shared/constants.ts` | Status/environment options and badge color mappings |
| `client/src/shared/StatusBadge.tsx` | Reusable StatusBadge and EnvironmentBadge components |
| `client/src/shared/utils.ts` | Date formatting utilities |
| `client/src/components/theme-toggle.tsx` | Dark/light mode toggle component |
| `client/src/components/app-sidebar.tsx` | Navigation sidebar component |
| `client/src/providers/AuthProvider.tsx` | Auth context with `hasPermission()` |
| `client/src/bootstrap.tsx` | Standalone dev shell with sidebar/header |
| `client/src/App.tsx` | Federation mount/unmount lifecycle |
| `client/src/AppContent.tsx` | Routes and Redux store wrapper |
