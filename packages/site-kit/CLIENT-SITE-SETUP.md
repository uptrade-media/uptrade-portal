# Client Site Setup Guide

## Quick Start - Minimal Configuration

Client sites using `@uptrade/site-kit` require **ONLY ONE environment variable** to work.

### Environment Variables

```bash
# .env.local

# ============================================
# Uptrade Site-Kit Configuration
# ============================================
# ONLY need the API key - site-kit handles everything else

NEXT_PUBLIC_UPTRADE_API_KEY=your_project_api_key_here

# Optional: Override API URL for local development
# NEXT_PUBLIC_UPTRADE_API_URL=http://localhost:3002
```

**That's it!** 🎉

### What You DON'T Need

❌ **DO NOT add these variables:**
- `NEXT_PUBLIC_UPTRADE_PROJECT_ID` - API key identifies the project
- `NEXT_PUBLIC_SUPABASE_URL` - Site-kit never talks to Supabase directly
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Not needed
- `NEXT_PUBLIC_SIGNAL_API_URL` - Sites never talk to Signal API directly
- `NEXT_PUBLIC_SITE_KIT_API_KEY` - Duplicate of NEXT_PUBLIC_UPTRADE_API_KEY

### Layout Setup

```jsx
// app/layout.jsx
import { SiteKitProvider } from '@uptrade/site-kit'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteKitProvider
          apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
          analytics={{ enabled: true }}
          engage={{ enabled: true }}
          forms={{ enabled: true }}
        >
          {children}
        </SiteKitProvider>
      </body>
    </html>
  )
}
```

**Optional props:**
- `apiUrl` - Override API URL (defaults to `https://api.uptrademedia.com`)
- `debug` - Enable console logging (defaults to `false`)

---

## Architecture - How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SITE (Next.js)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           @uptrade/site-kit Package                 │   │
│  │                                                     │   │
│  │  • Analytics tracking                              │   │
│  │  • Engage widgets                                  │   │
│  │  • Forms submission                                │   │
│  │  • SEO metadata                                    │   │
│  │  • LLM visibility (llms.txt)                       │   │
│  │                                                     │   │
│  │  All modules use: API key only                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS with API key
                            ▼
        ┌───────────────────────────────────┐
        │       Portal API                  │
        │  api.uptrademedia.com             │
        │                                   │
        │  • Validates API key              │
        │  • Identifies project             │
        │  • Returns data                   │
        │  • Stores analytics               │
        │  • Handles form submissions       │
        └───────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────┐
                │     Supabase      │
                │   (Database)      │
                └───────────────────┘
```

**Key Points:**
- Client sites **never** talk to Supabase directly
- Client sites **never** talk to Signal API directly
- All data flows through Portal API with API key authentication
- API key identifies the project - no need for project_id

---

## Module Configuration

### Analytics

```jsx
<SiteKitProvider
  apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
  analytics={{
    enabled: true,
    trackPageViews: true,      // Default: true
    trackWebVitals: true,       // Default: true
    trackScrollDepth: true,     // Default: true
    trackClicks: true,          // Default: true
    excludePaths: ['/admin'],   // Optional
  }}
>
```

### Engage (Chat & Popups)

```jsx
<SiteKitProvider
  apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
  engage={{
    enabled: true,
    position: 'bottom-right',   // Default: 'bottom-right'
    chatEnabled: true,          // Default: true
  }}
>
```

### Forms

```jsx
<SiteKitProvider
  apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
  forms={{
    enabled: true,
    honeypotField: '_hp',       // Optional spam protection
  }}
>
```

---

## Real-World Example: Heinrich Law

**Environment variables:**
```bash
# .env.local
NEXT_PUBLIC_UPTRADE_API_KEY=uptrade_dc19506c_814120e6df2d6f386edeaeaba2e0a5118cbe950bfd6b04f6
NEXT_PUBLIC_SITE_URL=https://heinrichlaw.com
```

**Layout:**
```jsx
// app/layout.jsx
import { SiteKitProvider } from '@uptrade/site-kit'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteKitProvider
          apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
          analytics={{ enabled: true }}
          engage={{ enabled: true }}
          forms={{ enabled: true }}
          debug={process.env.NODE_ENV === 'development'}
        >
          {children}
        </SiteKitProvider>
      </body>
    </html>
  )
}
```

**LLMs.txt route:**
```typescript
// app/llms.txt/route.ts
import { createLLMsTxtHandler } from '@uptrade/site-kit/llms'

export const GET = createLLMsTxtHandler()
export const revalidate = 3600
```

---

## Local Development

For local development against local Portal API:

```bash
# .env.local
NEXT_PUBLIC_UPTRADE_API_KEY=your_api_key
NEXT_PUBLIC_UPTRADE_API_URL=http://localhost:3002
```

**Important:** Make sure Portal API is running on port 3002:
```bash
cd portal-api-nestjs
pnpm dev
```

---

## Troubleshooting

### "No API key configured" error

**Problem:** Site-kit can't find the API key

**Solution:** Make sure you have `NEXT_PUBLIC_UPTRADE_API_KEY` in `.env.local`

### Analytics/Forms not working

**Problem:** Portal API not receiving data

**Solutions:**
1. Check that Portal API is running (production: api.uptrademedia.com)
2. Verify API key is valid
3. Check browser console for errors (enable `debug={true}`)
4. Check Network tab for failed API calls

### LLMs.txt returns error

**Problem:** Portal API endpoints not available

**Solutions:**
1. Make sure Portal API is deployed with latest code
2. Check `/api/public/llms/data` endpoint exists
3. Verify API key has access to project

---

## Security Best Practices

### ✅ Safe to expose (client-side):
- `NEXT_PUBLIC_UPTRADE_API_KEY` - Public API key for client-side calls
- `NEXT_PUBLIC_UPTRADE_API_URL` - API endpoint URL

### ❌ NEVER expose (server-side only):
- Database credentials
- Supabase service role keys
- Internal API secrets

**Note:** The public API key has limited permissions - it can only:
- Submit analytics events
- Submit form data
- Fetch public SEO metadata
- Fetch public LLM visibility data

It **cannot**:
- Access other projects' data
- Modify database directly
- Access admin endpoints
- Access sensitive customer data

---

## Getting Your API Key

1. Log into Portal at portal.uptrademedia.com
2. Go to Project Settings
3. Navigate to API Keys section
4. Copy the public API key (starts with `uptrade_`)

---

## Summary

**For Client Sites:**
- ✅ ONE environment variable: `NEXT_PUBLIC_UPTRADE_API_KEY`
- ✅ Simple SiteKitProvider with `apiKey` prop
- ✅ All modules work automatically
- ✅ No Supabase configuration needed
- ✅ No Signal API configuration needed
- ✅ No project ID needed

**Site-kit handles:**
- API routing to Portal API
- Project identification via API key
- Data fetching and caching
- Error handling
- TypeScript types

Keep it simple! 🚀
