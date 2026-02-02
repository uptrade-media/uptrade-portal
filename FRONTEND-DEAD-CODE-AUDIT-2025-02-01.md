# Frontend Dead Code Audit (2025-02-01)

**Scope:** Full frontend (`src/`) for dead components, dead exports, stale barrel files, and unused lib/hooks/services. Complements the existing **FRONTEND-DEAD-COMPONENTS-AUDIT.md** (Sections 1–14).

---

## 1. Entry points and routing (verified)

- **App.jsx:** Routes `/`, `/login`, `/auth/*`, `/setup`, `/reset-password`, `/p/:slug`, `/audit/:id`, `/pay/:token`, `/sync/callback`, and `/*` → `Dashboard` (MainLayout). No unused lazy imports.
- **MainLayout:** Lazy-loads all section modules (Dashboard, RepDashboard, Analytics, Proposals, Files, Messages, Billing, CRM, Outreach, Blog, Portfolio, Audits, ProposalEditor, Forms, SEO, Commerce, Engage, Reputation, Broadcast, Affiliates, Sync, Signal, Projects, Website, Settings, OrgSettings). All routes are wired; no orphan modules.

---

## 2. Barrel / index issues (fixed)

| Location | Issue | Action |
|----------|--------|--------|
| **src/pages/analytics/views/index.js** | Exported `HighlightsView` from `./HighlightsView` but **no file** `HighlightsView.jsx` exists in that folder (only `PageAnalyticsView.jsx`, `JourneysView.tsx`, `index.js`). Stale export would break any `import { HighlightsView } from '@/pages/analytics/views'`. | **Fixed:** Removed the `HighlightsView` export. Forms and Commerce use their own `HighlightsView` from `pages/forms/components` and `pages/commerce/components`; analytics views are only PageAnalyticsView and JourneysView. |

---

## 3. Dead or unused hook exports (`@/lib/hooks`)

These are re-exported from `src/lib/hooks/index.js` but **never imported** by any component (only by the barrel or the defining file):

| Export | Source | Finding |
|--------|--------|---------|
| **use-contacts (entire block)** | `use-contacts.js` | No component imports `useContacts`, `useContact`, `contactsKeys`, or any contact hook. ChatBubbleManager only has a comment mentioning "useContacts"; it uses `useConversations`, `useMessagesContacts`, etc. Backend and `contactsApi` support list/get/create/update/delete/bulk/convert; timeline/notes/tasks/tags/updateStage are not implemented. Documented in FRONTEND-DEAD-COMPONENTS-AUDIT.md Section 14; **keep for future unified contacts** or remove if not planned. |
| **useCreateReputationCampaign** | `use-reputation.js` | Never imported. ReputationModule uses overview, reviews, health, platforms, settings only. |
| **useUpdateReputationCampaign** | `use-reputation.js` | Never imported. |
| **useCreateReputationTemplate** | `use-reputation.js` | Never imported. |
| **useUpdateReputationTemplate** | `use-reputation.js` | Never imported. |
| **useDeleteReputationTemplate** | `use-reputation.js` | Never imported. |

**Recommendation:** Remove the five reputation campaign/template hook exports from `index.js` (and optionally from `use-reputation.js`) if no campaigns/templates UI is planned; or leave as-is for future feature.

---

## 4. Unused lib files

| File | Finding |
|------|---------|
| **src/lib/blog-admin.js** | No imports found in `src/`. Dead. |
| **src/lib/portfolio-admin.js** | No imports found in `src/`. Dead. |
| **src/services/square.js** | No imports in frontend `src/`. Square config is used via `portal-api.js` (backend endpoints). This file is a Square SDK wrapper (e.g. for Netlify Functions or server-side); **not used by the Vite frontend bundle**. Remove from frontend if only backend uses Square, or keep if used by a server/edge function in this repo. |

---

## 5. Components and pages (verified in use)

- **SchedulerModal, UpcomingDeadlines:** Used by AuditPublicView and AgencyDashboard.
- **ModuleLayout, WebsiteModule:** Used by WebsiteModule, ReputationModule, SEOModule, ProjectsModule, etc.
- **BusinessProfileCard:** Used by LocalSeoCitations and ProjectSettingsPanel.
- **PageAnalyticsView, JourneysView, AIInsightsPanel:** Used by AnalyticsDashboard and/or WebsiteModuleView.
- **HighlightsView (analytics):** Removed from barrel; Forms and Commerce use their own HighlightsView from their `components` folders.

---

## 6. Summary of actions

| Action | Status |
|--------|--------|
| Remove stale `HighlightsView` export from `pages/analytics/views/index.js` | **Done** |
| Remove dead reputation campaign/template hook exports from `lib/hooks/index.js` | **Done** |
| Remove `lib/blog-admin.js`, `lib/portfolio-admin.js` | **Done** |
| Remove `services/square.js` (unused by frontend bundle) | **Done** |

---

## 7. Suggested next steps

1. **Reputation hooks:** If no reputation campaigns/templates UI is planned, remove the five reputation campaign/template hook exports from `src/lib/hooks/index.js` (and optionally the implementations in `use-reputation.js`).
2. **Lib dead files:** If blog/portfolio admin logic lives elsewhere or is deprecated, delete `src/lib/blog-admin.js` and `src/lib/portfolio-admin.js`.
3. **use-contacts:** Either wire a "Contacts" or "Directory" UI (and ChatBubbleManager contact resolution) to the aligned hooks, or remove the use-contacts re-exports from `index.js` and document as future-only.
4. **Square service:** Confirm whether `src/services/square.js` is used by any build target (e.g. Netlify Functions); if not, remove or move to backend repo.
5. **Smoke test:** Run the app and exercise analytics (PageAnalyticsView, JourneysView), website module, reputation, and billing to confirm no regressions after the barrel fix.

---

## 8. Continued audit (same day)

### 8.1 Additional dead hook exports

| Export | Source | Finding | Action |
|--------|--------|---------|--------|
| **use-contacts (entire block)** | `use-contacts.js` | No component imports from `@/lib/hooks` for contacts; ChatBubbleManager only has a comment. Documented in FRONTEND-DEAD-COMPONENTS-AUDIT.md §14. | **Done:** Removed entire CONTACTS re-export block from `lib/hooks/index.js`. Hooks remain in `use-contacts.js`; can still import from `@/lib/hooks/use-contacts` if a Contacts UI is added. |
| **useProjectReport** | `use-reports.js` | Never imported by any component. AgencyDashboard uses useOverviewReport, useActivityReport; BillingModule uses useFinancialReport. | **Done:** Removed from REPORTS export in `lib/hooks/index.js`. |
| **useLighthouseReport** | `use-reports.js` | Never imported by any component. | **Done:** Removed from REPORTS export in `lib/hooks/index.js`. |

### 8.2 Additional unused lib files

| File | Finding | Action |
|------|---------|--------|
| **src/lib/messages-cache.js** | No imports found in `src/`. Dead. | **Done:** Deleted (~15 KB). |

### 8.3 Verified in use (no action)

- **lib/constants/industries.js** (INDUSTRY_CATEGORIES): Used by ProjectSettingsPanel, BusinessProfileCard.
- **lib/utils.js** (cn, etc.): Heavily used across components.
- **lib/avatar-utils, toast, oauth-popup, use-seo-ai-generation:** All used.

### 8.4 Summary of continued actions

| Action | Status |
|--------|--------|
| Remove use-contacts re-exports from `lib/hooks/index.js` | **Done** |
| Remove useProjectReport, useLighthouseReport from REPORTS export | **Done** |
| Delete `lib/messages-cache.js` | **Done** |

### 8.5 ChatBubbleManager / ChatBubbleSingle (replaced by MessagesWidget + MessagesModuleV2)

| Item | Finding | Action |
|------|---------|--------|
| **ChatBubbleManager.jsx** | Never imported. MainLayout uses **MessagesWidget** for the floating chat; MessagesWidget renders **MessagesModuleV2**. Old multi-bubble flow replaced by minified messages module. | **Done:** Deleted (~24 KB). |
| **ChatBubbleSingle.jsx** | Only used by ChatBubbleManager. | **Done:** Deleted (~26 KB). |
| **useLegacyEchoStream** | Only used by ChatBubbleSingle. | **Done:** Removed from `lib/hooks/index.js` barrel. Implementation remains in `use-messages.js` for potential reuse. |

Comments updated: `messages/shared.jsx`, `lib/hooks/use-messages.js`.

---

## 9. Continued audit (third pass)

### 9.1 Dead code in use-messages.js

| Item | Finding | Action |
|------|---------|--------|
| **useLegacyEchoStream** | Only caller was ChatBubbleSingle (deleted). No other imports from `@/lib/hooks/use-messages` for this hook. | **Done:** Removed the full function (~145 lines) from `use-messages.js`. Removed unused `useState`, `useCallback` from React import (they were only used by this hook). |

### 9.2 Unused root proposal-blocks library

| Item | Finding | Action |
|------|---------|--------|
| **src/components/proposal-blocks/** (root) | **Never imported** anywhere. The proposal viewer uses **proposals/mdx/ProposalBlocks.jsx** → **proposals/mdx/proposal-blocks/** for MDX + ProposalHero. Root **components/proposal-blocks/** was a separate, unused library (Core, Story, Scope, Audit, Investment, Terms, Acceptance, Shared) with 22 files. | **Done:** Deleted all 22 files (~95 KB). Confirmed ProposalView uses only `./mdx/ProposalBlocks` and `./mdx/proposal-blocks/`. Empty dirs may remain; remove manually if desired. |

### 9.3 Summary of third-pass actions

| Action | Status |
|--------|--------|
| Remove useLegacyEchoStream implementation from `lib/hooks/use-messages.js` | **Done** |
| Delete root `components/proposal-blocks/` (22 files) | **Done** |

---

## 10. Continued audit (fourth pass)

### 10.1 Dead implementations in use-reports.js

Barrel already stopped exporting `useProjectReport` and `useLighthouseReport` (Section 8.1). No component imports them (or imports from `@/lib/hooks/use-reports` for these; BillingModule only imports `useFinancialReport` from that file).

| Item | Finding | Action |
|------|---------|--------|
| **useProjectReport** | Never imported. | **Done:** Removed function from `lib/hooks/use-reports.js`. |
| **useLighthouseReport** | Never imported. | **Done:** Removed function from `lib/hooks/use-reports.js`. |

`reportsKeys.project` and `reportsKeys.lighthouse` remain in the file (used by invalidation in `useRunAudit` for lighthouse; project key kept for consistency).

### 10.2 Summary of fourth-pass actions

| Action | Status |
|--------|--------|
| Remove useProjectReport from `lib/hooks/use-reports.js` | **Done** |
| Remove useLighthouseReport from `lib/hooks/use-reports.js` | **Done** |

### 10.3 Optional follow-ups (no change this pass)

- **use-contacts.js:** Still no imports (barrel re-export removed in Section 8.1). File remains for potential future “Contacts” or “Directory” UI. To remove: delete `src/lib/hooks/use-contacts.js` and any references.
- **Reputation campaign/template hooks:** Implementations remain in `use-reputation.js`; barrel no longer exports them. Remove from source file if no campaigns/templates UI is planned.
