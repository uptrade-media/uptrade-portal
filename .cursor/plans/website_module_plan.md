# Website Module – Consolidated Page View

## Module roles: SEO vs Website

- **SEO module**: Tracking rankings (GSC, keywords, positions) and using **Signal to auto-optimize** (bulk pipeline, opportunities, AI suggestions). Focus = monitoring + automation.
- **Website module**: **CRUD / manual editing** of page-level managed content: metadata, images, FAQ, schema, content blocks, links, forms. Focus = content management and direct edits.

Same underlying data (e.g. metadata, images, schema) can be *optimized* in SEO and *edited* in Website. Website is the place users go to manually change title, description, alt text, FAQ, schema, etc.; SEO is where they see performance and run Signal optimization.

---

## Goal

Replace the current **Website tab** inside Projects with a **Website module**: one consolidated view where the user selects a **page** (via ModuleLayout), then sees **subheader tabs** for everything relevant to that page — **all focused on viewing and editing** (analytics, metadata, images, FAQ, schema, forms, links).

## Current State

- **Projects module** has center tabs: Overview, Tasks, Creative, Connections, **Website**, Settings. When **Website** is active, the left sidebar shows SiteNavigation (Pages, Images, Redirects, FAQs, Content, Links, Scripts, Schema) and the center shows SiteManagementPanel. This is **site-wide**, not page-scoped.
- **ModuleLayout** provides Header, Content, optional leftSidebar / rightSidebar. No built-in subheader; tabs go in content or a custom bar below the header.
- **SEO** has page-level UX (SEOPageDetail with tabs) but is oriented toward **optimization and rankings**. Website module will own the **manual edit** experience for the same page-level assets.

## Architecture

- **Left sidebar**: Page list. Pages come from the **sitemap at build time**; users **cannot add pages** from this module — they only select an existing page. Source: e.g. `useSeoPages(projectId)` or `useSitePages(projectId)`. Selecting a page drives all tab content.
- **Header**: “Website” + selected page (path/title).
- **Subheader**: Tabs — **Analytics**, **Metadata**, **Images**, **FAQ**, **Schema**, **Content**, **Forms**, **Links**, **Scripts**. **Every tab is full CRUD (create, read, update, delete) except Page Analytics**, which is read-only.
- **Content**: Active tab panel; panels support full CRUD (list, add, edit, delete) except Analytics (view only).

## Data and UX per tab (full CRUD except Analytics)

| Tab        | CRUD | Purpose |
|-----------|------|---------|
| **Analytics** | Read-only | View page-level traffic (usePageViewsByDay / usePageViewsByHour with path). No create/update/delete. |
| **Metadata** | Full CRUD | Title, description, canonical; create/read/update (seoApi.updatePage / updatePageMetadata). |
| **Images** | Full CRUD | Managed images for this page; add, edit, remove slots, alt text (useSiteImages + mutations). |
| **FAQ** | Full CRUD | FAQs for this page; create, read, update, delete (site FAQs filtered by path + create/update/delete). |
| **Schema** | Full CRUD | JSON-LD for this page; add, edit, remove schema (getPageSchemas + create/update/delete). |
| **Content** | Full CRUD | Managed content blocks for this page; create, read, update, delete. |
| **Forms** | Full CRUD | Forms on this page; list, add, edit, remove (forms API filtered by page/path if supported). |
| **Links** | Full CRUD | Internal links for this page; add, edit, remove (site links filtered by path + mutations). |
| **Scripts** | Full CRUD | Scripts for this page; add, edit, remove (full CRUD, page-scoped if API supports). |

## Implementation requirements

- **Full implementation only.** Every item in this module (every tab, every panel, every list and form) must be fully implemented. **No stubs, no mock data, no placeholders.** All tabs must read from and write to real APIs; all CRUD actions must persist; analytics must use real analytics APIs. Empty or “coming soon” states are acceptable only when the backend returns no data, not as substitutes for unimplemented features.

## Implementation outline

1. **Website module shell**: ModuleLayout + left sidebar (page selector) + header (Website + selected page) + subheader (Tabs) + content (active tab panel).
2. **WebsitePageSelector**: Left sidebar; list pages; on select, set selected page (and optional URL param).
3. **Tab panels**: One component per tab; each receives `projectId` and selected page (`id`, `path`). Every panel supports **full CRUD** (list, add, edit, delete) except **Analytics**, which is read-only (view only).
4. **Replace Projects Website tab**: When `activeTab === 'website'` in ProjectsModule, render this new Website module instead of SiteNavigation + SiteManagementPanel.
5. **Backend (required for full implementation)**: Add `page_path` (or path) query param to site FAQs, content, and links list endpoints so those tabs can load only the selected page’s items. Without this, FAQ/Content/Links tabs would need to fetch all and filter client-side; backend filter is preferred for correctness and performance.

---

## Other considerations (decide before or during build)

- **URL / deep links**: Use search params for selected page (and optionally active tab), e.g. `?pageId=...` or `?path=/about`, so links and refresh preserve state.
- **No page selected**: When the list has pages but none is selected, show a clear empty state (“Select a page”) or auto-select the first page. When the project has no pages, show empty state explaining that pages are pulled from the sitemap at build time (no “Add page” in this module).
- **Page list source**: Decide single source of truth for “pages” — e.g. `useSeoPages(projectId)` (SEO pages) or `useSitePages(projectId)` (site pages) — and whether to merge or link the two if both exist.
- **Redirects**: **Not in this module.** Redirects are managed in the **SEO module** (e.g. redirect manager). Do not add a Redirects tab here.
- **Scripts**: **In scope.** Scripts tab has **full CRUD**; implement add, edit, remove for scripts (page-scoped if the API supports it).
- **Loading and error states**: Each tab should show loading skeletons while fetching and clear error + retry when the API fails (full implementation, no silent failures).
- **Validation**: Client-side validation where applicable (e.g. metadata title/description length, schema valid JSON-LD, required fields) and surface API validation errors in the UI.
- **Reuse**: Prefer reusing existing site panels (e.g. SiteImagesPanel, SiteFAQsPanel) and adapting them to accept `page_path` / `pageId` and filter to one page, rather than building duplicate components from scratch, as long as they support full CRUD and real APIs.

## Summary

- **SEO module**: Rankings + Signal auto-optimize (tracking, pipelines, opportunities).
- **Website module**: Full CRUD for all page-level content (metadata, images, FAQ, schema, content, forms, links, **scripts**). Only **Page Analytics** is read-only. Pages come from sitemap at build time (no “Add page” here). **Redirects** are managed in SEO, not here. Page-centric layout with ModuleLayout + subheader tabs.
- **No stubs or mock data**: Every tab and panel must be fully implemented and wired to real APIs; no placeholders.
