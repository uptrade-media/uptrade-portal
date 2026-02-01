# LLM Visibility Module - Usage Guide

Comprehensive LLM visibility and Answer Engine Optimization (AEO) for Next.js sites.

## Overview

This module provides three cutting-edge techniques for maximum LLM/AI visibility:

1. **llms.txt** - Machine-readable business information following llmstxt.org spec
2. **Speakable Schema** - JSON-LD for voice assistants and AI content targeting
3. **AEO Components** - Semantic HTML components optimized for AI extraction

---

## Quick Start

### 1. llms.txt Implementation

**Zero-config setup:**

```typescript
// app/llms.txt/route.ts
import { createLLMsTxtHandler } from '@uptrade/site-kit/llms'

export const GET = createLLMsTxtHandler()
export const revalidate = 3600 // Cache for 1 hour
```

This automatically:
- Fetches business data from Portal API
- Generates markdown following llmstxt.org spec
- Includes business info, services, FAQs, contact info
- Serves at `https://yoursite.com/llms.txt`

**With custom options:**

```typescript
export const GET = createLLMsTxtHandler({
  includeServices: true,
  includeFAQ: true,
  includePages: false, // Skip page index
  maxFAQItems: 10, // Limit FAQ count
  customSections: [
    {
      title: 'Specializations',
      content: 'We specialize in family law, divorce, and adoption cases.'
    }
  ]
})
```

### 2. llms-full.txt (Extended Version)

For comprehensive context including all pages and FAQs:

```typescript
// app/llms-full.txt/route.ts
import { createLLMsFullTxtHandler } from '@uptrade/site-kit/llms'

export const GET = createLLMsFullTxtHandler()
export const revalidate = 3600
```

---

## Speakable Schema

### Auto-integrated with ManagedSchema

If you're using ManagedSchema from site-kit, speakable is auto-added:

```tsx
import { ManagedSchema } from '@uptrade/site-kit/seo'

export default function ServicePage() {
  return (
    <>
      <ManagedSchema
        pageType="service"
        pageName="Divorce Law"
        pageUrl="/divorce"
        speakable={true} // Auto-uses default selectors
      />
      
      <article data-speakable="main">
        <h1>Divorce Law Services</h1>
        <div data-speakable="summary">
          We provide compassionate divorce representation...
        </div>
      </article>
    </>
  )
}
```

### Manual Implementation

```tsx
import { SpeakableSchema } from '@uptrade/site-kit/llms'

export default function Page() {
  return (
    <>
      <SpeakableSchema
        pageUrl="/divorce"
        cssSelectors={[
          'h1',
          '[data-speakable="summary"]',
          '[data-speakable="services"]'
        ]}
      />
      
      <article>
        <h1>Divorce Law</h1>
        <div data-speakable="summary">
          Voice assistants will read this section...
        </div>
      </article>
    </>
  )
}
```

### Default Selectors by Page Type

The module provides smart defaults for different page types:

| Page Type | Selectors |
|-----------|-----------|
| `page` | `h1`, `[data-speakable]`, `.intro`, `[role="main"] > p:first-of-type` |
| `article` | `h1`, `.article-summary`, `article > p:first-of-type`, `[data-speakable]` |
| `service` | `h1`, `.service-description`, `[data-speakable="summary"]` |
| `faq` | `.faq-question`, `[data-speakable]` |
| `contact` | `h1`, `.contact-info`, `[itemprop="address"]` |

---

## AEO Components

Semantic HTML components with microdata for AI extraction.

### AEOBlock (Question/Answer)

For FAQ-style content that AI can extract for featured snippets:

```tsx
import { AEOBlock } from '@uptrade/site-kit/llms'

<AEOBlock
  question="What is the cost of a divorce in Kentucky?"
  answer="Divorce costs in Kentucky vary based on complexity. Uncontested divorces typically range from $1,500-$3,000, while contested divorces can be $5,000-$15,000 or more."
  speakable={true} // Mark for voice assistants
/>
```

### AEOSummary

For key page summaries that AI should prioritize:

```tsx
import { AEOSummary } from '@uptrade/site-kit/llms'

<AEOSummary
  content="Rene Heinrich has represented families in Northern Kentucky divorce cases for over 25 years, providing compassionate and strategic legal guidance."
  speakable={true}
/>
```

### AEODefinition

For defining key terms:

```tsx
import { AEODefinition } from '@uptrade/site-kit/llms'

<AEODefinition
  term="Collaborative Divorce"
  definition="A process where both parties work with their attorneys to reach a mutually beneficial settlement without going to court."
  speakable={true}
/>
```

### AEOSteps

For process/how-to content:

```tsx
import { AEOSteps, AEOStep } from '@uptrade/site-kit/llms'

<AEOSteps
  title="The Divorce Process in Kentucky"
  description="A step-by-step guide to filing for divorce"
  speakable={true}
>
  <AEOStep
    name="File the Petition"
    text="Submit divorce petition to the circuit court in your county"
    position={1}
  />
  <AEOStep
    name="Serve Your Spouse"
    text="Legally notify your spouse of the divorce proceedings"
    position={2}
  />
  <AEOStep
    name="Negotiate Settlement"
    text="Work with attorneys to reach agreement on assets, custody, and support"
    position={3}
  />
  <AEOStep
    name="Finalize Decree"
    text="Court approves and issues final divorce decree"
    position={4}
  />
</AEOSteps>
```

### AEOComparison

For comparing options/services:

```tsx
import { AEOComparison } from '@uptrade/site-kit/llms'

<AEOComparison
  items={[
    {
      name: 'Contested Divorce',
      description: 'When spouses cannot agree on key issues',
      pros: ['Full court advocacy', 'Protects your interests'],
      cons: ['More expensive', 'Takes longer']
    },
    {
      name: 'Uncontested Divorce',
      description: 'When both parties agree on all terms',
      pros: ['Faster resolution', 'Lower cost'],
      cons: ['Requires cooperation', 'May need mediation']
    }
  ]}
  speakable={true}
/>
```

---

## Real-World Example

Heinrich Law divorce page with full AEO implementation:

```tsx
// app/divorce/page.tsx
import { 
  AEOBlock, 
  AEOSummary, 
  AEOSteps, 
  AEOStep,
  SpeakableSchema 
} from '@uptrade/site-kit/llms'

export default function DivorcePage() {
  return (
    <>
      <SpeakableSchema
        pageUrl="/divorce"
        pageType="service"
        pageName="Divorce Law"
      />
      
      <article>
        <h1>Divorce Law in Northern Kentucky</h1>
        
        {/* AI-optimized summary */}
        <AEOSummary
          content="Rene Heinrich provides experienced divorce representation in Northern Kentucky with 25+ years of family law expertise."
          speakable={true}
        />
        
        {/* Process walkthrough for AI */}
        <AEOSteps
          title="Kentucky Divorce Process"
          description="Step-by-step guide to filing for divorce"
          speakable={true}
        >
          <AEOStep
            name="Consultation"
            text="Meet with attorney to discuss your situation and goals"
            position={1}
          />
          <AEOStep
            name="File Petition"
            text="Submit divorce petition to circuit court"
            position={2}
          />
          <AEOStep
            name="Negotiate"
            text="Work toward fair settlement on assets and custody"
            position={3}
          />
          <AEOStep
            name="Finalize"
            text="Court approves and issues final decree"
            position={4}
          />
        </AEOSteps>
        
        {/* FAQ section for featured snippets */}
        <section>
          <h2>Common Questions</h2>
          
          <AEOBlock
            question="How long does a divorce take in Kentucky?"
            answer="Uncontested divorces in Kentucky can be finalized in 60-90 days. Contested divorces typically take 6-12 months or longer depending on complexity."
            speakable={true}
          />
          
          <AEOBlock
            question="What is the cost of divorce?"
            answer="Costs vary based on complexity. Uncontested divorces range from $1,500-$3,000, while contested cases can be $5,000-$15,000 or more."
            speakable={true}
          />
        </section>
      </article>
    </>
  )
}
```

---

## Environment Configuration

Required environment variables (Heinrich Law already has these):

```bash
NEXT_PUBLIC_UPTRADE_API_URL=https://api.uptrademedia.com
NEXT_PUBLIC_UPTRADE_API_KEY=your_project_api_key
```

The API key identifies your project - no need to pass `projectId` explicitly.

---

## API Endpoints (Portal API)

These endpoints are automatically called by the llms module:

| Endpoint | Purpose |
|----------|---------|
| `/api/public/llms/data` | Full LLM visibility data |
| `/api/public/llms/business` | Business info only |
| `/api/public/llms/services` | Services list |
| `/api/public/llms/faq` | FAQ items |
| `/api/public/llms/pages` | Page summaries |

All endpoints use `x-api-key` header for authentication.

---

## Benefits

### For AI/LLM Visibility

- ✅ **ChatGPT, Claude, Perplexity** can read `/llms.txt` for business context
- ✅ **Google Assistant, Alexa** use Speakable schema for voice content
- ✅ **Featured snippets** more likely with AEO microdata
- ✅ **AI search engines** (Perplexity, You.com) can extract structured answers

### For SEO

- ✅ Better semantic understanding by search engines
- ✅ Enhanced rich snippet eligibility
- ✅ Voice search optimization
- ✅ Answer box targeting

### For Development

- ✅ Zero-config by default
- ✅ TypeScript support
- ✅ React Server Components compatible
- ✅ Automatic caching via React cache()
- ✅ Drop-in components with sensible defaults

---

## Technical Details

### llms.txt Format

Follows the [llmstxt.org](https://llmstxt.org) specification:

```markdown
# Business Name

> Tagline or mission statement

## About

Business description and history...

## Services

- Service 1: Description
- Service 2: Description

## Contact

- Phone: (859) xxx-xxxx
- Email: contact@business.com
- Address: 123 Main St, City, State

## FAQ

**Q: Question 1?**
A: Answer 1

**Q: Question 2?**
A: Answer 2
```

### Speakable Schema Structure

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Title",
  "url": "https://site.com/page",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", "[data-speakable]"]
  }
}
```

### AEO Microdata

Uses schema.org microdata for AI extraction:

- `itemscope itemtype="https://schema.org/Question"` - Q&A blocks
- `itemscope itemtype="https://schema.org/HowTo"` - Process steps
- `itemscope itemtype="https://schema.org/DefinedTerm"` - Term definitions
- `data-speakable` attribute - Voice assistant targeting

---

## Testing

### Test llms.txt

```bash
curl https://heinrichlaw.com/llms.txt
```

Expected output: Markdown with business info, services, FAQ

### Test Speakable Schema

View page source and search for:

```json
"speakable": {
  "@type": "SpeakableSpecification"
}
```

### Test AEO Microdata

Use Google's Rich Results Test:
https://search.google.com/test/rich-results

---

## Next Steps for Heinrich Law

✅ **Implemented:**
- `/llms.txt` route handler
- `/llms-full.txt` route handler
- Portal API endpoints for LLM data

⚠️ **Recommended:**
- Add AEO components to key service pages (divorce, custody, adoption)
- Add Speakable schema to service pages via ManagedSchema
- Test llms.txt in local dev: `http://localhost:3000/llms.txt`

---

## Support

Issues? Check:
1. Environment variables are set correctly
2. Portal API endpoints return data (test with curl + API key)
3. site-kit package is built: `pnpm build` in uptrade-portal-vite

For bugs/questions: Contact Uptrade Portal team
