# 1033 Lenox

A luxury condominium owner portal and HOA management platform for 1033 Lenox Avenue in Miami Beach, Florida. Built with Nuxt 3, Vue 3, and Directus CMS.

## Overview

This application serves as the resident portal for a 28-unit boutique condominium building in the Flamingo Park neighborhood. It provides secure access to building documents, financial records, unit management, and community features for owners, residents, board members, and administrators.

## Tech Stack

- **Framework**: Nuxt 3 with Vue 3 Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **CMS/Backend**: Directus 11 (headless CMS)
- **Authentication**: nuxt-auth-utils with Directus JWT tokens
- **UI Components**: Nuxt UI
- **Animations**: GSAP with ScrollTrigger
- **Charts**: Chart.js with vue-chartjs
- **Forms**: VeeValidate with Yup validation
- **PWA**: @vite-pwa/nuxt

## Features

### Authentication & Authorization

- Email/password authentication via Directus
- Role-based access control (Admin, Board Member, Member, Pending)
- Property relationship types (Owner, Tenant, Property Manager)
- Secure session management with automatic token refresh

### Core Modules

- **Dashboard**: Personalized overview for authenticated users
- **Documents**: Secure document management for owners
- **Financials**: Budget tracking, reconciliation, and reports (Board/Admin)
- **Tasks**: Kanban-style task management (Board/Admin)
- **Announcements**: Building-wide communications
- **Units**: Unit information with pets and vehicles
- **Meetings**: Meeting schedules and minutes (Owners)
- **Security**: Building security integrations

### Additional Features

- PWA with offline support and caching
- Real-time updates via Directus WebSockets
- SendGrid email integration
- Swiftlane access control integration
- Responsive mobile-first design
- Custom typography (Bauer Bodoni Pro, Proxima Nova)

## Project Structure

```
├── components/           # Vue components
│   ├── Financials/       # Budget, reconciliation components
│   ├── Form/             # Form input components
│   ├── Layout/           # Header, footer, navigation
│   └── Tasks/            # Task board components
├── composables/          # Vue composables
│   ├── useDirectusAuth   # Authentication flows
│   ├── useDirectusItems  # Generic CRUD operations
│   ├── useRoles          # RBAC utilities
│   └── useBudgetData     # Financial data
├── layouts/              # Nuxt layouts
├── middleware/           # Route middleware
│   ├── auth.ts           # Authentication guard
│   └── role.ts           # Role-based access control
├── pages/                # File-based routing
│   ├── admin/            # Admin-only pages
│   ├── auth/             # Login, register, password reset
│   ├── financials/       # Financial dashboards
│   └── ...
├── server/
│   ├── api/              # Server API routes
│   │   ├── auth/         # Auth endpoints
│   │   └── directus/     # Directus proxy endpoints
│   └── utils/            # Server utilities
├── types/                # TypeScript definitions
├── public/               # Static assets
└── nuxt.config.ts        # Nuxt configuration
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0 < 23.0.0
- pnpm >= 8.6.0
- Directus 11 instance

### Environment Variables

Create a `.env` file:

```env
# Directus
DIRECTUS_URL=https://admin.1033lenox.com
DIRECTUS_SERVER_TOKEN=your-static-token

# Session
NUXT_SESSION_PASSWORD=at-least-32-characters-long-secret-key

# Public URLs
NUXT_PUBLIC_SITE_URL=https://1033lenox.com
DIRECTUS_ASSETS_URL=https://admin.1033lenox.com/assets/
DIRECTUS_WEBSOCKET_URL=wss://admin.1033lenox.com/websocket

# SendGrid (optional)
SENDGRID_ACCESS_REQUEST_ADMIN_TEMPLATE=template-id
SENDGRID_ACCESS_REQUEST_USER_TEMPLATE=template-id
```

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Key Composables

### `useDirectusAuth`

Handles authentication flows including login, logout, and registration.

```typescript
const {login, logout, user, loggedIn} = useDirectusAuth();
await login({email: 'user@example.com', password: 'password'});
```

### `useDirectusItems`

Generic CRUD operations for any Directus collection.

```typescript
const posts = useDirectusItems('posts');
const items = await posts.list({filter: {status: {_eq: 'published'}}});
```

### `useRoles`

Role-based access control with property relationship checks.

```typescript
const {isAdmin, isBoardMember, isOwner, canAccessRoute} = useRoles();
```

## API Routes

All Directus operations are proxied through server endpoints for security:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/refresh-session` - Token refresh
- `POST /api/directus/items` - Generic collection operations
- `GET /api/directus/users/me` - Current user data

## Role Hierarchy

| Role          | Access Level                    |
| ------------- | ------------------------------- |
| Administrator | Full system access              |
| Board Member  | Financials, tasks, documents    |
| Member        | Dashboard, announcements, units |
| Pending       | Limited access pending approval |

## Development

```bash
# Lint code
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format
```

## Deployment

The application runs on DigitalOcean with Docker Compose. Production builds are optimized with:

- Static asset caching via Directus CDN
- PWA service worker for offline support
- Image optimization via Nuxt Image

## License

Private - All rights reserved.

---

**1033 Lenox Avenue · Miami Beach, FL 33139**
