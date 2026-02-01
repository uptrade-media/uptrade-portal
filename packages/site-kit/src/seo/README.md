# @uptrade/site-kit/seo - SEO Module Documentation

## Overview

The SEO module provides React Server Components and utilities for managing SEO metadata, schema markup, FAQs, redirects, and more through the Uptrade Portal API.

## 🔒 Security Update (v2.0)

**CRITICAL**: Previous versions exposed API keys in client bundles. Version 2.0 introduces secure server-only API functions.

### Migration Required

If you're using the old API configuration:

**Before (INSECURE):**
```typescript
// ❌ DON'T: This exposes API keys in client bundles
import { getSEOPageData } from '@uptrade/site-kit/seo/api'
// Uses: NEXT_PUBLIC_UPTRADE_API_KEY (exposed to client)
```

**After (SECURE):**
```typescript
// ✅ DO: Use server-only imports
import { getSEOPageData } from '@uptrade/site-kit/seo/server'
// Uses: UPTRADE_API_KEY (server-only)
```

### Environment Variables Update

**Old Configuration (Deprecated):**
```env
NEXT_PUBLIC_UPTRADE_API_KEY=your_api_key_here
NEXT_PUBLIC_UPTRADE_API_URL=https://api.uptrademedia.com
```

**New Configuration (Secure):**
```env
# Server-only variables (NOT prefixed with NEXT_PUBLIC)
UPTRADE_API_KEY=your_api_key_here
UPTRADE_API_URL=https://api.uptrademedia.com
UPTRADE_PROJECT_ID=your_project_id

# Optional: Signal API for AI features
SIGNAL_API_URL=https://signal.uptrademedia.com
```

## Installation

```bash
npm install @uptrade/site-kit
# or
pnpm add @uptrade/site-kit
```

## Quick Start

### 1. Configure Environment Variables

Create a `.env.local` file:

```env
UPTRADE_API_KEY=your_api_key_from_portal
UPTRADE_PROJECT_ID=your_project_id
```

### 2. Generate Metadata (App Router)

```typescript
// app/layout.tsx or app/page.tsx
import { getManagedMetadata } from '@uptrade/site-kit/seo'

export async function generateMetadata({ params }) {
  return getManagedMetadata({
    projectId: process.env.UPTRADE_PROJECT_ID!,
    path: '/',
    fallback: {
      title: 'Default Title',
      description: 'Default Description'
    }
  })
}
```

### 3. Add Schema Markup

```typescript
// app/page.tsx (Server Component)
import { ManagedSchema } from '@uptrade/site-kit/seo'

export default function Page() {
  return (
    <>
      <ManagedSchema 
        projectId={process.env.UPTRADE_PROJECT_ID!}
        path="/"
        includeEntityGraph={true}
      />
      {/* Your content */}
    </>
  )
}
```

### 4. Add FAQs

```typescript
import { ManagedFAQ } from '@uptrade/site-kit/seo'

<ManagedFAQ 
  projectId={process.env.UPTRADE_PROJECT_ID!}
  path="/services/plumbing"
  includeSchema={true}
/>
```

## API Reference

### Metadata Functions

#### `getManagedMetadata(options)`

Fetches SEO metadata from Portal and returns Next.js Metadata object.

```typescript
import { getManagedMetadata } from '@uptrade/site-kit/seo'

const metadata = await getManagedMetadata({
  projectId: 'your-project-id',
  path: '/about',
  fallback: {
    title: 'About Us',
    description: 'Learn about our company'
  }
})
```

**Returns:** Next.js `Metadata` object

#### `getManagedMetadataWithAB(options)`

Like `getManagedMetadata` but supports A/B testing.

```typescript
const metadata = await getManagedMetadataWithAB({
  projectId: 'your-project-id',
  path: '/products',
  sessionId: cookies().get('session_id')?.value
})
```

### React Server Components

#### `<ManagedSchema>`

Injects JSON-LD schema markup.

```typescript
<ManagedSchema 
  projectId={projectId}
  path="/services/plumbing"
  includeEntityGraph={true}
  includeTypes={['LocalBusiness', 'Service']}
  excludeTypes={['FAQPage']}
/>
```

**Props:**
- `projectId` (required): Your Uptrade project ID
- `path` (required): Page path
- `includeEntityGraph`: Include entity knowledge graph
- `includeTypes`: Array of schema types to include
- `excludeTypes`: Array of schema types to exclude

#### `<ManagedFAQ>`

Renders FAQ section with schema.

```typescript
<ManagedFAQ 
  projectId={projectId}
  path="/faq"
  includeSchema={true}
  renderItem={(faq) => (
    <div>
      <h3>{faq.question}</h3>
      <p>{faq.answer}</p>
    </div>
  )}
/>
```

#### `<ManagedInternalLinks>`

Displays AI-suggested internal links.

```typescript
<ManagedInternalLinks 
  projectId={projectId}
  path="/blog/post-1"
  position="related"
  limit={5}
/>
```

**Positions:** `'inline'`, `'sidebar'`, `'bottom'`, `'related'`

#### `<ManagedContent>`

Renders CMS-managed content blocks.

```typescript
<ManagedContent 
  projectId={projectId}
  path="/homepage"
  section="hero"
/>
```

### Server-Side Functions

#### `getSEOPageData(projectId, path)`

Fetches full page data.

```typescript
import { getSEOPageData } from '@uptrade/site-kit/seo'

const pageData = await getSEOPageData(projectId, '/about')
// Returns: { title, description, h1, canonical, robots, ... }
```

#### `getSchemaMarkups(projectId, path, options?)`

Fetches schema markups for a page.

```typescript
const schemas = await getSchemaMarkups(projectId, '/services', {
  includeTypes: ['LocalBusiness', 'Service'],
  excludeTypes: ['FAQPage']
})
```

#### `registerSitemap(entries)`

Registers sitemap entries at build time.

```typescript
// scripts/register-sitemap.ts
import { registerSitemap } from '@uptrade/site-kit/seo'

const result = await registerSitemap([
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about', priority: 0.8, changefreq: 'weekly' },
])
```

## Routing & Redirects

### Handle Redirects

```typescript
// middleware.ts
import { getRedirect } from '@uptrade/site-kit/seo'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const redirect = await getRedirect(projectId, path)
  
  if (redirect) {
    return NextResponse.redirect(
      new URL(redirect.destination, request.url),
      redirect.statusCode
    )
  }
  
  return NextResponse.next()
}
```

### Generate Sitemap

```typescript
// app/sitemap.ts
import { generateSitemap } from '@uptrade/site-kit/seo'

export default async function sitemap() {
  return generateSitemap(process.env.UPTRADE_PROJECT_ID!)
}
```

## AI Visibility & Entity Graph

### Get Entities

```typescript
import { getEntities, getPrimaryEntity } from '@uptrade/site-kit/seo'

// Get all entities
const entities = await getEntities(projectId, { type: 'service' })

// Get primary business entity
const business = await getPrimaryEntity(projectId)
```

### Get AI Visibility Score

```typescript
import { getVisibilityScore } from '@uptrade/site-kit/seo'

const score = await getVisibilityScore(projectId, '/services/plumbing')
// Returns: { overall_score, entity_coverage, answer_density, ... }
```

## Advanced Features

### A/B Testing

```typescript
// Enable A/B testing in Portal dashboard first
const metadata = await getManagedMetadataWithAB({
  projectId,
  path: '/landing-page',
  sessionId: cookies().get('session_id')?.value
})

// Track impression
import { recordABImpression } from '@uptrade/site-kit/seo'
await recordABImpression(testId, variant, sessionId)
```

### Custom Rendering

```typescript
<ManagedFAQ 
  projectId={projectId}
  path="/faq"
  renderItem={(faq) => (
    <AccordionItem key={faq.id}>
      <AccordionTrigger>{faq.question}</AccordionTrigger>
      <AccordionContent>{faq.answer}</AccordionContent>
    </AccordionItem>
  )}
/>
```

## Caching

All API functions use React's `cache()` for request-level deduplication:

- **SEO Data**: 60 seconds
- **Schema & FAQs**: 60 seconds
- **Entity Graph**: 300 seconds (5 minutes)
- **Redirects**: Cached in middleware (5 minutes)

### Cache Invalidation

After making changes in the Portal, there may be a delay of up to 60 seconds before changes appear on your site. To invalidate immediately, implement on-demand revalidation:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const { path } = await request.json()
  revalidatePath(path)
  return Response.json({ revalidated: true })
}
```

Then call from Portal after deployment:
```bash
curl -X POST https://your-site.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path": "/services/plumbing"}'
```

## Troubleshooting

### API Key Errors

**Error:** `@uptrade/seo: UPTRADE_API_KEY environment variable is required`

**Solution:** Make sure you're using the server-only import and have set `UPTRADE_API_KEY` (not `NEXT_PUBLIC_UPTRADE_API_KEY`).

### Data Not Updating

**Issue:** Changes in Portal not reflected on site.

**Causes:**
1. Cache TTL (60s default)
2. Build-time static generation

**Solutions:**
- Wait 60 seconds for cache to expire
- Use on-demand revalidation (see Caching section)
- Use `dynamic = 'force-dynamic'` in page config

### Schema Not Rendering

**Issue:** JSON-LD not appearing in page source.

**Checks:**
1. Verify `<ManagedSchema>` is in a Server Component
2. Check projectId is correct
3. Verify schema exists in Portal dashboard
4. Check browser console for errors

## Migration from v1.x

### 1. Update Imports

```diff
- import { getSEOPageData } from '@uptrade/seo/api'
+ import { getSEOPageData } from '@uptrade/site-kit/seo'
```

### 2. Update Environment Variables

```diff
- NEXT_PUBLIC_UPTRADE_API_KEY=...
+ UPTRADE_API_KEY=...

- NEXT_PUBLIC_UPTRADE_API_URL=...
+ UPTRADE_API_URL=...

+ UPTRADE_PROJECT_ID=...
```

### 3. Add projectId to All Calls

```diff
- await getSEOPageData('/about')
+ await getSEOPageData(process.env.UPTRADE_PROJECT_ID!, '/about')
```

## Support

- **Documentation:** https://docs.uptrademedia.com
- **Dashboard:** https://portal.uptrademedia.com
- **API Status:** https://status.uptrademedia.com

## License

Proprietary - Uptrade Media Inc.
