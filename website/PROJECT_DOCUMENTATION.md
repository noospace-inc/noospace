# Aurora Cadence Board - Project Documentation

This documentation provides a comprehensive map of the project structure for AI assistants to navigate and understand the codebase.

## Project Overview

**Project Name:** Aurora Cadence Board (Noospace)
**Type:** Project Management Platform
**Tech Stack:** React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS v4
**Build Tool:** Vite

## Folder Structure

```
aurora-cadence-board/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # UI component library (46 components)
│   │   ├── app-shell.tsx   # Main application layout
│   │   ├── global-search.tsx # Command palette search
│   │   ├── performance-chart.tsx # Performance visualization
│   │   ├── schedule-timeline.tsx # Timeline component
│   │   └── ui-bits.tsx     # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   │   └── use-mobile.tsx  # Mobile detection hook
│   ├── lib/                # Utility libraries
│   │   ├── error-capture.ts    # Error handling utilities
│   │   ├── error-page.ts       # Error page renderer
│   │   ├── lovable-error-reporting.ts # Error reporting
│   │   ├── mock-data.ts        # Mock data and types
│   │   ├── store.tsx           # Global state management
│   │   └── utils.ts            # Utility functions
│   ├── routes/              # Route components
│   │   ├── __root.tsx      # Root route with providers
│   │   ├── index.tsx       # Dashboard page
│   │   ├── login.tsx       # Authentication page
│   │   ├── profile.tsx     # User profile page
│   │   ├── projects.index.tsx # Projects listing
│   │   ├── projects.$projectId.tsx # Project details
│   │   ├── projects.$projectId_.advance.tsx # Advance management
│   │   ├── projects.$projectId_.distribute.tsx # Distribution management
│   │   ├── calendar.tsx    # Calendar view
│   │   ├── calendar.$date.tsx # Specific date view
│   │   ├── employees.tsx   # Employee management
│   │   ├── users.tsx       # User & role management
│   │   └── cashbook.tsx    # Financial tracking
│   ├── router.tsx          # Router configuration
│   ├── server.ts           # Server entry point
│   ├── start.ts            # TanStack Start configuration
│   ├── routeTree.gen.ts    # Auto-generated route tree
│   └── styles.css          # Global CSS with Tailwind v4
├── public/                 # Static assets
├── node_modules/           # Dependencies
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # Project documentation
```

## CSS Origin and Styling

### Main CSS File
- **Location:** `src/styles.css`
- **Framework:** Tailwind CSS v4 with custom theme
- **Key Features:**
  - Imports: `tailwindcss`, `tw-animate-css`
  - Custom theme with OKLCH color system
  - Dark mode support via `.dark` class
  - Custom utilities: `card-surface`, `card-hover`, `no-scrollbar`
  - Brand colors: blue, pink, green, peach, lilac
  - Status colors: pending, approved, overdue

### CSS Import Pattern
All TSX files import CSS through the root route:
```typescript
import appCss from "../styles.css?url";
```
This is defined in `src/routes/__root.tsx` and applied globally through the `<HeadContent />` component.

## JSX/TSX Files with CSS Origins

### Core Application Files

#### `src/routes/__root.tsx`
- **Purpose:** Root route with global providers and error handling
- **CSS Origin:** Imports `../styles.css?url` and applies globally
- **Key Components:** 
  - `AppShell` (main layout)
  - `StoreProvider` (state management)
  - `Toaster` (notifications)
- **Styling:** Uses Tailwind utility classes from the global CSS

#### `src/components/app-shell.tsx`
- **Purpose:** Main application layout with sidebar and navigation
- **CSS Origin:** Uses global Tailwind classes from `styles.css`
- **Key Features:**
  - Responsive sidebar navigation
  - Mobile header navigation
  - Dark mode toggle
  - Notification dropdown
  - Global search trigger
- **Styling:** Extensive use of Tailwind utilities, custom card shadows, brand colors

#### `src/router.tsx`
- **Purpose:** Router configuration with QueryClient
- **CSS Origin:** No direct CSS, configuration only
- **Dependencies:** TanStack Router, TanStack Query

### Route Components

#### `src/routes/index.tsx` (Dashboard)
- **Purpose:** Main dashboard with stats and performance charts
- **CSS Origin:** Global Tailwind classes
- **Components Used:** `PerformanceChart`, `StatCard`, `ProgressBar`, `Surface`, `Initials`, `AvatarGroup`, `StatusPill`
- **Styling:** Grid layouts, card surfaces, brand color accents

#### `src/routes/login.tsx`
- **Purpose:** Authentication page
- **CSS Origin:** Global Tailwind classes
- **Styling:** Centered layout, form styling, brand accents

#### `src/routes/profile.tsx`
- **Purpose:** User profile management
- **CSS Origin:** Global Tailwind classes
- **Styling:** Form layouts, card surfaces, avatar display

#### `src/routes/projects.index.tsx`
- **Purpose:** Projects listing page
- **CSS Origin:** Global Tailwind classes
- **Styling:** Grid layouts, project cards, status indicators

#### `src/routes/projects.$projectId.tsx`
- **Purpose:** Individual project details
- **CSS Origin:** Global Tailwind classes
- **Styling:** Tabbed interface, timeline views, task lists

#### `src/routes/projects.$projectId_.advance.tsx`
- **Purpose:** Project advance management
- **CSS Origin:** Global Tailwind classes
- **Styling:** Form layouts, progress indicators

#### `src/routes/projects.$projectId_.distribute.tsx`
- **Purpose:** Payment distribution management
- **CSS Origin:** Global Tailwind classes
- **Styling:** Allocation tables, summary cards

#### `src/routes/calendar.tsx`
- **Purpose:** Calendar view
- **CSS Origin:** Global Tailwind classes + react-day-picker styles
- **Styling:** Calendar grid, event markers, date cells

#### `src/routes/calendar.$date.tsx`
- **Purpose:** Specific date view
- **CSS Origin:** Global Tailwind classes
- **Styling:** Daily schedule layout

#### `src/routes/employees.tsx`
- **Purpose:** Employee management
- **CSS Origin:** Global Tailwind classes
- **Styling:** Employee cards, punctuality displays

#### `src/routes/users.tsx`
- **Purpose:** User and role management (admin only)
- **CSS Origin:** Global Tailwind classes
- **Styling:** User tables, role badges

#### `src/routes/cashbook.tsx`
- **Purpose:** Financial tracking
- **CSS Origin:** Global Tailwind classes
- **Styling:** Financial tables, balance cards, transaction lists

### Component Files

#### `src/components/ui-bits.tsx`
- **Purpose:** Reusable UI components library
- **CSS Origin:** Global Tailwind classes + custom utility classes
- **Components:**
  - `Surface` - Card container with shadow
  - `SectionTitle` - Section headers
  - `Initials` - User avatar with initials
  - `AvatarGroup` - Stacked avatars
  - `ProgressBar` - Progress indicator
  - `StatCard` - Statistics display
  - `StatusPill` - Task status badges
  - `LinkChip` - Link display with copy
  - `EmptyState` - Empty state placeholder
- **Styling:** Uses `card-surface`, `card-hover` utilities from global CSS

#### `src/components/global-search.tsx`
- **Purpose:** Command palette search (Cmd+K)
- **CSS Origin:** Global Tailwind classes
- **Dependencies:** `@/components/ui/command`
- **Styling:** Dialog overlay, search input, command groups

#### `src/components/performance-chart.tsx`
- **Purpose:** Performance visualization chart
- **CSS Origin:** Global Tailwind classes
- **Dependencies:** Recharts library
- **Styling:** Chart container, legend styling

#### `src/components/schedule-timeline.tsx`
- **Purpose:** Timeline visualization for schedules
- **CSS Origin:** Global Tailwind classes
- **Styling:** Timeline layout, task cards, date markers

### UI Component Library (`src/components/ui/`)

All UI components use:
- **CSS Origin:** Global Tailwind classes from `styles.css`
- **Pattern:** Radix UI primitives + Tailwind styling
- **No component-specific CSS files** - all styling is utility-based

**Key UI Components:**
- `button.tsx` - Button variants
- `card.tsx` - Card containers
- `input.tsx` - Form inputs
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `tooltip.tsx` - Tooltips
- `calendar.tsx` - Date picker
- `table.tsx` - Data tables
- `form.tsx` - Form components
- `command.tsx` - Command palette
- `sonner.tsx` - Toast notifications
- `sidebar.tsx` - Sidebar navigation
- `chart.tsx` - Chart components

## JavaScript/TypeScript Files Related to Website

### Core Application Files

#### `src/start.ts`
- **Purpose:** TanStack Start configuration
- **Key Features:** Error middleware, CSRF protection
- **Dependencies:** `@tanstack/react-start`

#### `src/server.ts`
- **Purpose:** Server entry point for SSR
- **Key Features:** Error normalization, catastrophic SSR handling
- **Dependencies:** `@tanstack/react-start/server-entry`

#### `src/router.tsx`
- **Purpose:** Router setup with QueryClient
- **Key Features:** Route tree integration, scroll restoration
- **Dependencies:** `@tanstack/react-router`, `@tanstack/react-query`

### State Management

#### `src/lib/store.tsx`
- **Purpose:** Global state management (React Context)
- **Key Features:**
  - User management
  - Project CRUD operations
  - Schedule management
  - Task approval workflow
  - Payment tracking
  - Cashbook operations
  - Audit logging
- **Utilities:** `projectStats`, `projectPunctuality`, `userPunctuality`, `videoStats`, `distributionTotals`, `cashTotals`, `cashPeople`

### Data & Types

#### `src/lib/mock-data.ts`
- **Purpose:** Mock data generation and TypeScript types
- **Key Types:**
  - `User`, `Project`, `Schedule`, `Task`
  - `PaymentDetails`, `Distribution`, `CashEntry`
  - `CalendarNote`, `AuditEntry`
- **Functions:** Seed data generators, date utilities

### Utilities

#### `src/lib/utils.ts`
- **Purpose:** Utility functions
- **Key Functions:** `cn()` (className merger using clsx and tailwind-merge)

#### `src/lib/error-capture.ts`
- **Purpose:** Error capture and reporting
- **Key Features:** Global error listener, error storage

#### `src/lib/error-page.ts`
- **Purpose:** Error page HTML renderer
- **Key Features:** Server-side error page generation

#### `src/lib/lovable-error-reporting.ts`
- **Purpose:** Lovable platform error reporting
- **Key Features:** Error reporting to external service

### Hooks

#### `src/hooks/use-mobile.tsx`
- **Purpose:** Mobile device detection
- **Key Features:** Responsive breakpoint detection

### Configuration Files

#### `package.json`
- **Purpose:** Dependencies and scripts
- **Key Dependencies:**
  - React 19, React DOM 19
  - TanStack Router, Query, Start
  - Radix UI components
  - Tailwind CSS v4
  - Recharts (charts)
  - Lucide React (icons)
  - Sonner (toasts)
  - date-fns (date utilities)

#### `vite.config.ts`
- **Purpose:** Vite build configuration
- **Key Features:** TanStack router plugin, path aliases

#### `tsconfig.json`
- **Purpose:** TypeScript configuration
- **Key Features:** Path aliases (`@/*` -> `src/*`)

## Key Patterns for AI Navigation

### Finding CSS for Components
1. All components use global Tailwind classes from `src/styles.css`
2. No component-specific CSS files exist
3. Custom utilities are defined in `styles.css` (@utility directives)
4. Brand colors are CSS custom properties mapped in @theme

### State Management Pattern
- Global state is in `src/lib/store.tsx` via React Context
- Use `useStore()` hook to access state and actions
- State includes: users, projects, notes, audit, cash, currentUser

### Routing Pattern
- Routes are file-based in `src/routes/`
- Use `createFileRoute()` for route definition
- Dynamic routes use `$param` syntax
- Nested routes render via `<Outlet />`

### Component Import Pattern
- UI components: `@/components/ui/[component-name]`
- Custom components: `@/components/[component-name]`
- Utilities: `@/lib/[utility-name]`
- Hooks: `@/hooks/[hook-name]`

### Styling Pattern
- Use Tailwind utility classes
- Custom colors: `bg-brand-blue`, `text-brand-pink`, etc.
- Card styling: `card-surface` class + optional `card-hover`
- Status colors: `bg-status-pending`, `bg-status-approved`, `bg-status-overdue`

## Important Notes for AI Assistants

1. **No JSX files found** - The project uses TSX (TypeScript JSX) exclusively
2. **CSS is centralized** - All styling comes from `src/styles.css` with Tailwind v4
3. **State is client-side** - Uses React Context, no external state management
4. **Mock data** - Currently uses mock data in `src/lib/mock-data.ts`
5. **TypeScript everywhere** - All files are TypeScript (.ts or .tsx)
6. **Path aliases** - Use `@/` prefix for imports from src directory
7. **Dark mode** - Toggle via `.dark` class on html element
8. **Error handling** - Comprehensive error capture and reporting system

## Quick Reference

### Common Imports
```typescript
// State
import { useStore } from "@/lib/store";

// Routing
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Custom Components
import { Surface, StatCard, Initials } from "@/components/ui-bits";

// Utilities
import { cn } from "@/lib/utils";
```

### Styling Reference
- Cards: `className="card-surface p-5"`
- Hoverable: `className="card-surface card-hover p-5"`
- Brand colors: `bg-brand-blue`, `text-brand-pink`, `bg-brand-green-soft`
- Status: `bg-status-pending/15 text-status-pending`

### State Actions
```typescript
const { 
  approveTask, 
  addProject, 
  addSchedule, 
  updateProjectDetails,
  addPaymentReceived,
  addDistribution 
} = useStore();
```

This documentation should help any AI assistant quickly understand the project structure and locate relevant files for modifications or debugging.
