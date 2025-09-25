# Copilot Instructions for heimdall-ng

## Project Overview
- **Framework:** Angular 20.x (CLI generated)
- **Main app entry:** `src/main.ts`, root HTML: `src/index.html`
- **App structure:**
  - `src/app/` contains all features, core services, layout, and shared modules
  - Features are grouped by domain (e.g., `features/finance`, `features/home`, `features/it`)
  - Core services, guards, interceptors, and tokens are under `src/app/core/`
  - Layout components (shell, breadcrumbs, side-nav, topbar) are in `src/app/layout/`
  - Environment configs: `src/environments/`

## Build & Test Workflows
- **Start dev server:** `npm start` or `ng serve` (default: development config)
- **Build:** `npm run build` or `ng build` (default: production config)
- **Unit tests:** `npm test` or `ng test` (Karma runner)
- **Watch mode:** `npm run watch` (development build)
- **Environment switching:**
  - Production: replaces `environment.ts` with `environment.prod.ts`
  - Testing: replaces `environment.ts` with `environment.testing.ts`

## Conventions & Patterns
- **Component styles:** SCSS only (see Angular schematics config)
- **App prefix:** All selectors use `app-` prefix
- **Assets:** All static assets are in `public/`, referenced in `angular.json`
- **Routing:**
  - Feature-level routes in `features/*/*.routes.ts`
  - App-level routes in `app.routes.ts`
- **Services:**
  - Core services in `core/services/` (e.g., `breadcrumbs.service.ts`, `device.service.ts`)
  - Interceptors in `core/interceptors/`
- **Authentication:**
  - Uses Azure MSAL (`@azure/msal-angular`, `@azure/msal-browser`)
  - Auth config in `auth-config.ts`

## External Dependencies
- **Angular Material & CDK** for UI components
- **RxJS** for reactive programming
- **Azure MSAL** for authentication

## Examples
- To add a new feature: create a folder under `features/`, add routes, pages, and shell component
- To add a new service: place in `core/services/`, inject via Angular DI
- To add a new layout element: update `layout/` and reference in `app-shell.html`

## Key Files
- `angular.json`, `package.json`: build/test scripts, config
- `src/app/app.ts`, `src/app/app.routes.ts`: main app logic and routing
- `src/app/core/`: shared logic, services, interceptors
- `src/app/features/`: domain features
- `src/app/layout/`: UI shell and navigation
- `src/environments/`: environment configs

---
For more details, see the [README.md](../README.md) and `angular.json` for build/test specifics.
