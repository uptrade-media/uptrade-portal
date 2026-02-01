# Backend Audit Report (portal-api-nestjs)

**Date:** 2025-01-31  
**Scope:** portal-api-nestjs controllers vs uptrade-portal-vite frontend API usage (`src/lib/portal-api.js` + hooks).

---

## 1. Methodology

1. **Backend:** Extracted all `@Controller('path')` route prefixes from `portal-api-nestjs/src`. Multiple controllers can live in one file (e.g. `crm.controller.ts` has many class-level controllers). Result: **98 controller route prefixes** across **77 controller files**.
2. **Frontend:** All portal API calls from the Portal UI go through `src/lib/portal-api.js` (authApi, oauthApi, messagesApi, chatkitApi, engageApi, proposalsApi, auditsApi, formsApi, billingApi, filesApi, screenshotsApi, seoApi, analytics/reports, projectsApi, crmApi, commerceApi, trendsApi, broadcastApi, syncApi, adminApi, blogApi, reputationApi, affiliatesApi, bookingApi, contactsApi, dashboardApi, setupApi, configApi, portfolioApi, emailApi, signalApi, reportsApi). No other repo was assumed to call the Portal API for this audit.
3. **Mapping:** A backend controller path is considered **used by the Portal UI** if the frontend has any `portalApi.get/post/put/patch/delete` call whose URL path starts with that prefix (or with the first path segment, e.g. `seo` for `seo/projects/...`). Paths under `api/public/*` or `public/*` are **public/external** (customer sites, site-kit, etc.), not the Portal dashboard.
4. **Infrastructure / external:** Routes such as `health`, internal ingest, or webhook-only are noted as non–Portal UI.

---

## 2. Backend Controller Paths (portal-api-nestjs)

### 2.1 Public / External API (not Portal dashboard)

| Controller path | Purpose |
|-----------------|---------|
| `api/public/seo` | Public SEO (site-kit, customer sites) – 2 controllers |
| `api/public/llms` | Public LLM data for sites |
| `api/public/analytics` | Public analytics (e.g. ingest from sites) |
| `api/public/auth` | Public auth (e.g. magic link, setup) |
| `public/images` | Public image delivery |

### 2.2 Portal UI–facing (prefix matches frontend usage)

| Controller path | Frontend usage |
|-----------------|----------------|
| `auth` | authApi |
| `oauth` | oauthApi |
| `messages` | messagesApi |
| `chatkit` | chatkitApi |
| `engage/widget`, `engage/chat`, `engage/*` | engageApi (elements, chat, targeting, analytics, etc.) |
| `proposals` | proposalsApi |
| `audits` | auditsApi |
| `forms` | formsApi |
| `billing` | billingApi |
| `files` | filesApi |
| `screenshots` | screenshotsApi |
| `seo`, `seo/managed`, `seo/serp-queue`, `seo/projects/:projectId/pages`, `seo/projects/:projectId/opportunities`, `seo/location-templates`, `seo/location-pages`, `seo/:projectId/gbp` | seoApi |
| `analytics` | analytics (query) + reportsApi (lighthouse) |
| `projects/*` (projects, site, deliverables, user-tasks, uptrade-tasks) | projectsApi, site management |
| `crm/prospects`, `crm/calls`, `crm/tasks`, `crm/follow-ups`, `crm/notes`, `crm/timeline`, `crm/attribution`, `crm/activities`, `crm/users`, `crm/openphone`, `crm/sms`, `crm/client-prospects`, `crm/gmail`, `crm/custom-fields`, `crm/reminders`, `crm/analytics`, `crm/pipeline-stages`, `crm/assignments` | crmApi |
| `commerce` (commerce, customers, contracts, discounts, offerings, sales, oauth) | commerceApi (customers, etc.) |
| `trends` | trendsApi |
| `broadcast` | broadcastApi |
| `sync/public`, `sync/admin` | syncApi (admin UI) |
| `admin` | adminApi |
| `blog` | blogApi |
| `reputation` | reputationApi |
| `affiliates` (+ public-affiliates) | affiliatesApi |
| `booking` | bookingApi |
| `contacts` | contactsApi |
| `dashboard` | dashboardApi |
| `setup` | setupApi |
| `config` | configApi |
| `portfolio` | portfolioApi |
| `email` | emailApi (email marketing) |
| `signal/*` (experiments, signal-public) | signalApi / public Signal |
| `audits` | auditsApi |

### 2.3 Other backend controllers (infrastructure or no direct Portal path)

| Controller path | Notes |
|-----------------|--------|
| `health` | Health checks (k8s, load balancer). Not called from Portal UI. |
| `analytics/script`, `analytics/ingest`, `analytics/reports` | Analytics module sub-controllers; frontend uses `analytics` (query) and `reportsApi` (lighthouse). Script/ingest may be used by embed scripts or server-side. |
| `site-scrape` | Likely internal or jobs; no `site-scrape` prefix in portal-api.js. |
| `crm/target-companies` | Sales/target companies; frontend may call under `crm` or a specific path – verify if sales module uses this. |
| `reputation/platforms` | Reputation platforms; may be under `reputation` in frontend. |

---

## 3. Frontend Path Prefixes (portal-api.js)

All first-segment path prefixes used by the Portal UI:

- `/auth`, `/oauth`, `/messages`, `/chatkit`, `/engage`, `/proposals`, `/audits`, `/forms`, `/billing`, `/files`, `/screenshots`, `/seo`, `/analytics`, `/projects`, `/crm`, `/commerce`, `/trends`, `/broadcast`, `/sync`, `/admin`, `/blog`, `/reputation`, `/affiliates`, `/booking`, `/contacts`, `/dashboard`, `/setup`, `/config`, `/portfolio`, `/email`, `/signal`, `/reports` (lighthouse via reportsApi).

No frontend calls to: `/health`, `/site-scrape` (as a top-level prefix). Public endpoints (`api/public/*`, `public/images`) are called from customer sites / site-kit, not from the Portal dashboard.

---

## 4. Findings Summary

| Category | Count | Notes |
|----------|-------|--------|
| Public/External API | 5 prefix groups | api/public/*, public/images – not Portal UI. |
| Portal UI–facing | ~70+ controller prefixes | All have corresponding usage in portal-api.js or nested under same prefix. |
| Infrastructure / other | health, site-scrape, analytics sub-routes | health for ops; script/ingest for analytics pipeline; site-scrape for internal/jobs. |

- **No dead Portal UI–facing controllers:** Every non-public controller prefix either matches a frontend path prefix or is a sub-path of one (e.g. `crm/calls`, `engage/chat`).
- **Removed earlier (see DEAD-CODE-AUDIT-REPORT.md):** Frontend had dead `getTeamMetrics` calling non-existent `GET /analytics/team`; removed from portal-api.js. No backend route to remove.
- **Backend routes not called by Portal UI by design:** Public APIs, health, and internal/ingest routes are expected. No action required unless deprecating a product surface.

---

## 5. Recommendations

1. **Keep as-is:** All current backend controller paths are either used by the Portal UI, exposed for public/external clients, or used for health/analytics ingest. No dead Portal-facing routes identified.
2. **Optional follow-ups:**  
   - Confirm `site-scrape` and `crm/target-companies` callers (other services or future UI).  
   - Add a simple script or CI step to diff backend `@Controller` prefixes vs frontend path prefixes to catch future drift.
3. **signal-api-nestjs:** This audit covered **portal-api-nestjs** only. signal-api-nestjs is a separate service; audit separately if needed.

---

## 6. References

- **Backend:** `portal-api-nestjs/src` – 77 `*.controller.ts` files, 98 `@Controller(...)` route prefixes.
- **Frontend:** `uptrade-portal-vite/src/lib/portal-api.js` – single source of Portal API calls for the dashboard.
- **Existing audit:** `DEAD-CODE-AUDIT-REPORT.md` – frontend dead code and API cleanup (getTeamMetrics, reportsApi, etc.).
