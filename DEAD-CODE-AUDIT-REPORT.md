# Dead Code / Components Audit Report

**Date:** 2025-01-31  
**Scope:** uptrade-portal-vite, portal-api-nestjs, signal-api-nestjs (references)

---

## 1. Fixed: Broken Barrel Exports (uptrade-portal-vite)

Barrel files were exporting from **deleted or renamed** component files, which would cause runtime errors for any consumer importing from the barrel.

| Barrel | Broken Export | Fix Applied |
|--------|---------------|-------------|
| `src/components/crm/index.js` | `CRMDashboard` from `./CRMDashboard` (file deleted; component lives in `CRMModule.jsx`) | Now exports from `./CRMModule` |
| `src/components/sales/index.js` | `SalesDashboard` from `./SalesDashboard` (file deleted; main dashboard is `SalesModule.jsx`) | Now exports from `./SalesModule` |
| `src/components/projects/index.js` | `ProjectsV2` from `./ProjectsV2` (file deleted; component lives in `ProjectsModule.jsx`) | Now exports from `./ProjectsModule` |

**Note:** Routes in `MainLayout.jsx` already import `CRMModule` and `ProjectsModule` directly via lazy imports, so the app did not break at runtime. The barrel fixes ensure that any future `import { CRMDashboard, ProjectsV2, SalesDashboard } from '@/components/crm'` (etc.) will resolve correctly.

---

## 2. Deleted vs Current Paths (No Broken Imports)

Git status showed many **deleted** files under `src/components/` (e.g. `Dashboard.jsx`, `Billing.jsx`, `EditProposalDialog.jsx`, `Messages.jsx`, `TeamMetrics.jsx`). These were either:

- **Moved into subfolders:** e.g. `EditProposalDialog.jsx`, `SendProposalDialog.jsx`, `NewContractModal.jsx`, `ProposalTemplate.jsx`, `ProposalViewWithAnalytics.jsx`, `InvoicePaymentDialog.jsx` now live under `src/components/proposals/` or `src/components/billing/`, and are imported from there. No broken imports.
- **Replaced by pages or modules:** e.g. `Dashboard.jsx` → `src/pages/Dashboard`; CRM/Sales/Projects use `CRMModule.jsx`, `SalesModule.jsx`, `ProjectsModule.jsx`.

No remaining imports were found that reference the old top-level paths (e.g. `from '@/components/Dashboard'`, `from '@/components/Billing'`, `from '@/components/Messages'`, `from '@/components/TeamMetrics'`).

---

## 3. Dead API Surface (Frontend)

| Item | Location | Notes |
|------|----------|--------|
| `getTeamMetrics` | `src/lib/portal-api.js` | **Removed.** Was never called; `TeamMetrics.jsx` was deleted. It called `GET /analytics/team`, which has no handler in the analytics module (backend unchanged). |

---

## 4. Backend (portal-api-nestjs)

- **Modules:** All modules imported in `app.module.ts` are registered and correspond to feature areas (CRM, Projects, Billing, SEO, etc.). No obviously dead modules.
- **Controllers:** Not exhaustively audited for unused routes; all controllers are registered via their respective modules. A follow-up could grep for route paths in the frontend to find unused API endpoints.

**Backend audit (initial):**
- **ecommerceApi.getTenantSalesStats** was removed from the frontend (only caller was deleted `TenantSales.jsx`). Grep of `portal-api-nestjs/src` for `ecommerce/tenants` and `sales-stats` found **no matching route**; the backend may never have implemented this endpoint or it lives elsewhere. No backend change required.
- **Approach for full backend audit:** (1) Extract all path prefixes from `portal-api.js` (e.g. `/auth`, `/analytics`, `/ecommerce`). (2) List all `@Controller(...)` prefixes in portal-api-nestjs. (3) For each backend route, confirm at least one frontend call (portal-api.js or hooks). (4) Flag backend-only routes for deprecation or removal. Full route-by-route audit deferred.
- **Spot-check (trends, screenshots):** Frontend calls `trendsApi` (`/trends/feed`, `/trends/daily`, `/trends/jobs/*`) and `screenshotsApi` (`/screenshots/project/:id/responsive`, `/screenshots/project/:id/capture`); ProjectsModule/ProjectTile also build screenshot URLs. No dead backend routes found in this sample.

---

## 5. Recommendations

1. **Barrel exports:** ✅ Fixed for crm, sales, projects.
2. **getTeamMetrics:** Removed from `portal-api.js`. No `/analytics/team` backend endpoint exists to remove.
3. **Ongoing:** Run the app and any E2E tests after barrel changes to confirm no regressions. Optionally add a lint rule or script to detect imports of non-existent files.

---

## 6. Summary

| Category | Status |
|----------|--------|
| Broken barrel exports (crm, sales, projects) | **Fixed** |
| Imports of deleted component paths | **None found** |
| Dead API surface (getTeamMetrics) | **Removed from portal-api.js** |
| Backend dead modules/controllers | **Not identified; all modules in use** |

---

## 7. Continued audit (cleanup applied)

- **getTeamMetrics removed** from `src/lib/portal-api.js`. It called `GET /analytics/team`; the analytics module has no such route (only overview, page-views, events, reports/top-pages, etc.). The CRM module exposes `GET crm/.../team-performance` for team metrics; the old frontend TeamMetrics UI and its `/analytics/team` client are dead. Backend was not changed; no `/analytics/team` handler exists to remove.

---

## 8. Continued audit – reportsApi (cleanup + hook fix)

- **Removed unused `reportsApi` methods:** `getProjectReports` and `getRevenueReport` were never called anywhere in the app (only defined in `portal-api.js`). Both removed. They called `GET /analytics/projects` and `GET /analytics/revenue`; backend may still expose those routes for other clients.
- **Fixed hook/API mismatch:** `use-reports.js` calls `reportsApi.lighthouse(projectId)` and `reportsApi.runAudit(projectId, { url })`, but `reportsApi` only had `getLighthouseReport(params)` and `runLighthouseAudit(data)`. Added **aliases** on `reportsApi`: `lighthouse(projectId)` and `runAudit(projectId, params)` so the existing hooks work without changing hook code.

---

## 9. Frontend dead components / dashboards (see FRONTEND-DEAD-COMPONENTS-AUDIT.md)

- **App.jsx:** Removed six unused lazy imports (SEOModule, CommerceModule, ReputationModule, CustomersModule, Broadcast, SyncModule from pages).
- **Deprecated Customers module:** Removed `components/customers/` and `pages/customers/` (no route in MainLayout; Commerce owns customer management).
- **Dead page components:** Removed `pages/analytics/AnalyticsModule.jsx`, `pages/Forms.jsx`. Removed `pages/sync/SyncModule.jsx` (MainLayout uses `components/sync/SyncModule`; only `SyncOAuthCallback` from pages/sync is used).
- **use-customers.js:** Switched all requests from `/customers/` to `/commerce/customers/` to match backend.
- **MainLayout:** Removed dead `'sales'` from moduleMap (no route or Sidebar item).

---

## 10. ProposalLayout removed; BlogManagement (optional follow-up)

- **ProposalLayout.jsx:** Documented in `src/proposals/README.md` as the layout wrapper for MDX proposals but **never imported** anywhere. The proposal flow is ProposalGate → ProposalTemplate → ProposalView; no code path used ProposalLayout. **Removed** `src/components/ProposalLayout.jsx` and updated README to state layout is provided by ProposalTemplate/ProposalView.
- **BlogManagement.jsx:** No imports found; the blog route uses `blog/BlogModule.jsx`. **Removed** `src/components/BlogManagement.jsx`.
- **WavePreview.jsx, WavePreviewAnimated.jsx, WavePreview.jsx.backup:** Never imported (demo-only components). **Removed** all three.
- **Echo.jsx, Tooltip.jsx (standalone), TenantSetupWizard.jsx:** Never imported. **Removed** all three.
- **BlogAIDialog.jsx:** Never imported. **Removed**.
- **App.jsx:** Removed dead lazy imports: `Audits`, `AuditDetail`, `UserProfile` (not used in any route; MainLayout uses its own AuditsModule for audits).
- **pages/AuditDetail.jsx, pages/UserProfile.jsx:** Orphaned after App cleanup; no remaining imports. **Removed** both.
- **common/SignalUpgradePrompt.jsx, shared/ModuleLayout.jsx:** Never imported. **Removed** both (shared/ModuleLayout was duplicate of components/ModuleLayout.jsx). Removed empty **common/** directory.
- **tenant/TenantSales.jsx:** Never imported. **Removed**; removed empty **tenant/** directory. **ecommerceApi.getTenantSalesStats** (only caller was TenantSales) removed from portal-api.js.

---

## 11. Backend audit (portal-api-nestjs)

A full backend audit was completed and written to **BACKEND-AUDIT-REPORT.md**. Summary:

- **98 controller route prefixes** across 77 controller files were mapped against frontend API usage in `src/lib/portal-api.js`.
- **Public/external** routes (`api/public/*`, `public/images`) are used by customer sites and site-kit, not the Portal dashboard; no change.
- **No dead Portal UI–facing routes** were found; every non-public controller prefix has a matching frontend path or is a sub-path of one.
- **Infrastructure / other:** `health`, analytics script/ingest, and `site-scrape` are not called from the Portal UI by design; optional follow-up to confirm callers for `site-scrape` and `crm/target-companies`.

---

## 12. Frontend re-audit (second pass)

A second pass over the frontend for dead code found:

| Item | Action |
|------|--------|
| **src/components/AddProspectDialog.jsx** (root) | **Removed.** Never imported; all callers use `crm/AddProspectDialog` or `prospects/AddProspectDialog`. |
| **src/pages/reputation/ReputationRoutes.jsx** | **Removed.** Never imported; MainLayout uses `components/reputation/ReputationModule` → `pages/reputation/ReputationModule` directly. |

Details in **FRONTEND-DEAD-COMPONENTS-AUDIT.md** §9.
