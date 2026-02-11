# Copilot Instructions for heimdall-ng

## Architecture Overview
- **Framework:** Angular 20.x standalone components + lazy-loaded routes
- **App structure:** Feature-based architecture with centralized core services
  - `app/layout/app-shell.ts`: Root layout wrapping all features (Material sidenav + topbar + breadcrumbs)
  - `app/features/*`: Domain modules (IT, Finance, Home) with local shell components and route configs
  - `app/core/`: Cross-cutting concerns (services, interceptors, tokens, config)
- **Entry:** `src/main.ts` → `app.ts` → `app-shell` → feature outlets

## Critical Routing Pattern
Routes follow a **nested lazy-loading hierarchy** (see `app.routes.ts`):
```typescript
AppShell (layout wrapper)
  ├─ '' → Home (public)
  ├─ 'it' → ItShell [MsalGuard] → lazy IT_ROUTES (inventory, devices, devices/:id)
  └─ 'finance' → FinanceShell [MsalGuard] → lazy FINANCE_ROUTES (billing)
```
- **All protected routes use `canActivate: [MsalGuard]`** for Azure AD auth
- Feature routes export const arrays (e.g., `IT_ROUTES`) with loadComponent for each page
- Breadcrumbs auto-generate from route `data: { title: '...' }` metadata

## Authentication & API Integration
- **Azure MSAL setup** (`auth-config.ts`): 
  - SPA client ID `c6213e0d-...` for login/token acquisition
  - API scope `api://09496fd4-.../access_as_user` injected into backend requests
  - `MsalInterceptor` auto-attaches tokens to `protectedResourceMap` URLs
- **API prefix interceptor** (`api-prefix.interceptor.ts`):
  - **Key behavior:** Prepends `{API_BASE_URL}{API_PREFIX}` to relative URLs
  - Services use relative paths like `/devices` → interceptor → `http://192.168.1.116/api/v1/devices`
  - Skip with `X-Skip-BaseUrl: true` header for external APIs
  - Base URL/prefix injected via `API_BASE_URL` and `API_PREFIX` tokens from `environment.ts`

## Service Layer Patterns
- **Standard structure** (example: `DeviceService`):
  ```typescript
  @Injectable({ providedIn: 'root' })
  export class DeviceService {
    private http = inject(HttpClient);
    
    list(params?: { search?: string; page?: number; ... }) {
      let p = new HttpParams();
      // Build params dynamically, return http.get<Paginated<T>>('/devices', { params: p })
    }
  }
  ```
- Services return typed responses (`Device`, `Paginated<Device>`) matching Laravel API structure
- Use `HttpParams` for query string construction (handles undefined/null gracefully)

## Environment Configuration
- **Three environments** (fileReplacements in `angular.json`):
  - `development` (default): `apiBaseUrl: 'http://192.168.1.116'`
  - `production`: `apiBaseUrl: 'http://192.168.1.115'`
  - `testing`: separate testing backend
- **No hardcoded base URLs in services** — always inject `API_BASE_URL`/`API_PREFIX` tokens

## Layout & Navigation
- **Sidenav state management** (`app-shell.ts`):
  - Reads `localStorage` key `sidenavCollapsed` for persistence
  - Uses `BreakpointObserver` at 768px: mobile → `mode='over'`, desktop → `mode='side'`
  - Must call `container.updateContentMargins()` after mode changes (Material sidenav quirk)
- **Navigation config** (`core/config/nav.config.ts`):
  - `NAV_ITEMS` array drives sidebar rendering (supports nested children)
  - Each item has `label`, `icon` (Material icon name), `path`, and unique `key`
- **Breadcrumbs** (`breadcrumbs.service.ts`):
  - Listens to `NavigationEnd`, walks `ActivatedRoute` tree
  - Extracts `data.title` from each route segment → generates `Crumb[]` with labels + URLs

## Styling System
- **Global styles:** `src/styles.scss` imports `_brand.scss` (CSS vars) + Material theme
- **CSS variables approach** (`_brand.scss`):
  - Centralized design tokens: `--brand-primary`, `--nav-active-bg`, `--text-muted`, etc.
  - Color palette: `$verde: #008000`, `$amarillo: #FFD600`, `$gris: #878787`
  - All components consume CSS vars (no direct color values in component SCSS)
- **Component styles:** SCSS only (enforced by schematics config), scoped to component

## Development Workflows
- **Dev server:** `npm start` (serves with development env at localhost:4200)
- **Build:** `npm run build` (production config by default)
- **Tests:** `npm test` (Karma + Jasmine, runs in watch mode)
- **Reinstall deps:** `npm run reinstall` (nukes node_modules, runs audit fix, reinstalls)

## Code Generation & Conventions
- **Prefix:** All selectors use `app-` (enforced by `angular.json`)
- **New feature module:**
  1. Create `features/<name>/<name>.routes.ts` exporting `<NAME>_ROUTES`
  2. Add shell component at `features/<name>/pages/<name>-shell.ts` with `<router-outlet>`
  3. Add child pages under `features/<name>/pages/`
  4. Import routes in `app.routes.ts` with `canActivate: [MsalGuard]` if protected
- **New service:** Place in `core/services/`, use `inject(HttpClient)` + relative URLs
- **New interceptor:** Implement `HttpInterceptorFn`, add to `provideHttpClient(withInterceptors([...]))`

## Key Files Reference
- `app.config.ts`: DI providers (MSAL, HTTP interceptors, tokens, router config)
- `auth-config.ts`: MSAL factory functions, tenant/client IDs, protected resource map
- `core/interceptors/api-prefix.interceptor.ts`: URL rewriting logic (critical for API calls)
- `core/config/nav.config.ts`: Sidebar menu structure
- `layout/app-shell.ts`: Root layout + responsive sidenav logic
- `environments/environment.ts`: API base URL + prefix (varies by build config)

---
For build/test commands, see `package.json` scripts. For route protection, always check `app.routes.ts` and feature route files.
