# E-E-A-T Blog Contract (Portal ↔ Site-Kit)

Blog posts created in the Portal with **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) include author profile, citations, FAQ, and optional JSON-LD schema. For the **managed blog components** in site-kit to display and use this data correctly, the following contract applies.

## Data the Portal should store and return

When a post is created via EchoBlogCreator (Signal E-E-A-T generation), the Portal receives:

| Field        | Shape | Purpose |
|-------------|--------|---------|
| `author`    | **Object** `{ name, title?, bio?, image?, url?, socialProfiles? }` | E-E-A-T author; site-kit shows AuthorCard and Article schema |
| `faqItems`  | `{ question, answer }[]` | FAQ section + FAQPage schema |
| `schema`    | JSON-LD object or array (optional) | Pre-built Article/FAQ/Person schema from Signal |

- **Author**: The Portal API currently accepts `author` as a **string** only. For E-E-A-T posts, the Portal should accept and store the full author **object** (e.g. in an `author_profile` JSONB column) and return it from the public post endpoint so site-kit can render the author card and include it in Article schema.
- **FAQ**: Already supported: Portal stores `faq_items` and returns them; site-kit renders the FAQ section and can emit FAQPage schema.
- **Schema**: Optional. If the Portal stores and returns `schema` (or `schema_json`) for a post, site-kit can inject it on the page instead of generating Article/FAQ schema from post fields.

## What site-kit already does

- **BlogPost** renders `post.faq_items` (or `post.faqItems`) as a “Frequently Asked Questions” section.
- **BlogPost** shows an author section when `post.author` is an **object** (name, bio, avatar, social links).
- **server.ts** provides `generateBlogPostSchema`, `generateFaqSchema`, and `generateAllBlogSchemas(post, options)` so the client site can emit Article + FAQ + Breadcrumb JSON-LD from post data.

## What site-kit does for E-E-A-T

- **Author shape**: Site-kit normalizes author so both shapes work:
  - **BlogAuthor**: `name`, `bio`, `avatar_url`, `social_links: { twitter, linkedin, github }`
  - **E-E-A-T author**: `name`, `title`, `bio`, `image` or `image_url`, `url` (profile), `socialProfiles` (array of URLs)
- **FAQ**: Accepts both `faq_items` and `faqItems` for compatibility.
- **Schema**: If the API returns `post.schema` (single object or array), the client page can pass it to `ManagedSchema` or the blog layout as `additionalSchemas` so the E-E-A-T Article/FAQ/Person schema is used.

## Summary

**For E-E-A-T to work end-to-end:**

1. **Portal**: Persist and return author as an **object** when present (e.g. `author_profile` → response `author`), and optionally store/return `schema` for the post.
2. **EchoBlogCreator**: Already sends `author`, `faqItems`, and `schema` when publishing; the Portal DTO/API need to accept author as object (and optionally schema).
3. **Site-kit**: Managed blog components already support FAQ and author-as-object; author is normalized to support both BlogAuthor and E-E-A-T shapes. Use `generateAllBlogSchemas(post)` (or `post.schema` when provided) on the blog post page so Article + FAQ schema are emitted.

No change is required on the client site if it already uses `BlogPost` and the server schema helpers; once the Portal returns author object and `faq_items`/`faqItems`, the same components will show E-E-A-T content and schema.
