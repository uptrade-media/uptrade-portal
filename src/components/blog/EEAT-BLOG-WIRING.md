# E-E-A-T and the Blog Module

## Current state

- **Backend (Signal API)**  
  - `POST /skills/seo/eeat/generate-blog` – full E-E-A-T blog generation (author, citations, FAQ, schema).  
  - `POST /skills/seo/eeat/suggest-author` – suggest author(s) for a topic.  
  - `POST /skills/seo/eeat/suggest-citations` – suggest citations for content/claims.  
  - `POST /skills/seo/eeat/author-schema` – Person JSON-LD for author.

- **Frontend (signal-api.js)**  
  - `signalSeoApi.generateBlogWithEEAT(projectId, params)`  
  - `signalSeoApi.suggestAuthor(projectId, topic, existingAuthors)`  
  - `signalSeoApi.suggestCitations(projectId, content, claims)`  
  - `signalSeoApi.generateAuthorSchema(projectId, authorData)`

- **Blog module**  
  - **EchoBlogCreator** uses `skillsApi.invoke('content', 'generate_blog', …)` (generic content skill).  
  - It does **not** call the E-E-A-T endpoints by default.  
  - **SEOBlogBrain** has `addBlogPostCitations` (seo-store), which uses a different “add-citations” action, not `suggestCitations`.

So E-E-A-T **is implemented in the API and in signalSeoApi**, but the **Blog UI is not wired to it** unless we add an explicit path (e.g. “Generate with E-E-A-T” or “Suggest author” / “Suggest citations”).

## Does it need to be wired in?

**Yes, if you want:**

1. **Author suggestion** when creating or editing a post (suggest and assign author from E-E-A-T).  
2. **Citation suggestions** for the post content (suggest sources, then insert links).  
3. **Full E-E-A-T generation** – one flow that produces a post with author, citations, FAQ, and schema in one go.

**Wiring options**

1. **EchoBlogCreator**  
   - Add a “Generate with E-E-A-T” option (e.g. toggle or separate button).  
   - When on: call `signalSeoApi.generateBlogWithEEAT(projectId, { topic, targetKeyword, ... })` instead of `skillsApi.invoke('content', 'generate_blog', …)`.  
   - Use the returned `author`, `citations`, `schema` when saving the post.

2. **Review / edit step**  
   - After a post is generated (either path), add “Suggest author” and “Suggest citations” actions that call `signalSeoApi.suggestAuthor(projectId, topic)` and `signalSeoApi.suggestCitations(projectId, content)`, then let the user apply author and insert citation links.

3. **SEO Blog Brain**  
   - In the audit/optimize flow, add “Enhance with E-E-A-T” that runs suggest-author + suggest-citations (and optionally author-schema) for the selected post and shows suggestions to apply.

## Summary

- E-E-A-T **methodology is in the backend and in `signalSeoApi`**; the **Blog module does not use it yet**.  
- It **does need to be wired in** if you want author suggestion, citation suggestion, or full E-E-A-T blog generation from the Blog UI.  
- Minimal wiring: add a “Generate with E-E-A-T” path in EchoBlogCreator that calls `generateBlogWithEEAT` and uses the result; optionally add “Suggest author” / “Suggest citations” in the same flow or in the review step.
