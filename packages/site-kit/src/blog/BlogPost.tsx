/**
 * @uptrade/site-kit/blog - Blog Post Component
 * 
 * Fetches and displays a single blog post with full content, table of contents,
 * author info, related posts, and SEO metadata support.
 * 
 * @example Tailwind styling
 * ```tsx
 * <BlogPost
 *   slug={params.slug}
 *   unstyled
 *   styles={{
 *     article: 'max-w-4xl mx-auto',
 *     header: 'mb-8',
 *     breadcrumb: 'text-sm text-gray-500 mb-4',
 *     title: 'text-4xl font-bold text-gray-900',
 *     subtitle: 'text-xl text-gray-600 mt-4',
 *     meta: 'flex gap-4 text-sm text-gray-500 mt-4',
 *     featuredImage: 'w-full h-auto rounded-xl',
 *     content: 'prose prose-lg max-w-none',
 *     tocSidebar: 'sticky top-24 p-4 bg-gray-50 rounded-lg',
 *     tocTitle: 'text-sm font-semibold uppercase text-gray-500',
 *     tocList: 'space-y-2 mt-3',
 *     tocLink: 'text-sm text-gray-600 hover:text-primary-600',
 *     tags: 'flex gap-2 mt-8',
 *     tag: 'px-3 py-1 bg-gray-100 rounded-full text-sm',
 *     faqSection: 'mt-12',
 *     faqTitle: 'text-2xl font-bold mb-6',
 *     faqItem: 'p-4 bg-gray-50 rounded-lg',
 *     authorCard: 'mt-12 p-6 bg-gray-50 rounded-xl',
 *     relatedSection: 'mt-12',
 *     relatedTitle: 'text-2xl font-bold mb-6',
 *     relatedGrid: 'grid md:grid-cols-3 gap-6',
 *   }}
 * />
 * ```
 */

import React from 'react'
import type { BlogPost as BlogPostType, TocItem, BlogAuthor } from './types'

// ============================================================================
// STYLE TYPES
// ============================================================================

export interface BlogPostStyles {
  /** Article wrapper */
  article?: string
  /** Header section */
  header?: string
  /** Breadcrumb navigation */
  breadcrumb?: string
  /** Breadcrumb link */
  breadcrumbLink?: string
  /** Post title (h1) */
  title?: string
  /** Post subtitle */
  subtitle?: string
  /** Meta info row */
  meta?: string
  /** Meta item */
  metaItem?: string
  /** Featured image wrapper */
  featuredImageWrapper?: string
  /** Featured image */
  featuredImage?: string
  /** Content layout (grid with TOC) */
  contentLayout?: string
  /** Main content wrapper */
  content?: string
  /** Table of contents sidebar */
  tocSidebar?: string
  /** TOC title */
  tocTitle?: string
  /** TOC list */
  tocList?: string
  /** TOC list item */
  tocItem?: string
  /** TOC link */
  tocLink?: string
  /** Tags container */
  tags?: string
  /** Individual tag */
  tag?: string
  /** FAQ section */
  faqSection?: string
  /** FAQ title */
  faqTitle?: string
  /** FAQ item container */
  faqItem?: string
  /** FAQ question (summary) */
  faqQuestion?: string
  /** FAQ answer */
  faqAnswer?: string
  /** Author card section */
  authorCard?: string
  /** Related posts section */
  relatedSection?: string
  /** Related posts title */
  relatedTitle?: string
  /** Related posts grid */
  relatedGrid?: string
  /** Related post card */
  relatedCard?: string
  /** Not found state */
  notFound?: string
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchBlogPost(
  apiUrl: string,
  apiKey: string,
  slug: string
): Promise<BlogPostType | null> {
  try {
    const response = await fetch(`${apiUrl}/public/blog/posts/${slug}`, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      console.error('[Blog] Failed to fetch post:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.post
  } catch (error) {
    console.error('[Blog] Error fetching post:', error)
    return null
  }
}

async function fetchRelatedPosts(
  apiUrl: string,
  apiKey: string,
  postId: string,
  limit: number = 3
): Promise<BlogPostType[]> {
  try {
    const response = await fetch(`${apiUrl}/public/blog/related`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ current_post_id: postId, limit }),
      next: { revalidate: 300 },
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('[Blog] Error fetching related posts:', error)
    return []
  }
}

// ============================================================================
// TOC GENERATION
// ============================================================================

function generateTableOfContents(html: string): TocItem[] {
  const headingRegex = /<h([2-4])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h[2-4]>/gi
  const items: TocItem[] = []
  let match

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const existingId = match[2]
    const text = match[3].replace(/<[^>]*>/g, '') // Strip nested HTML
    const id = existingId || slugify(text)

    items.push({ id, text, level })
  }

  return items
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ============================================================================
// BLOG POST COMPONENT
// ============================================================================

export interface BlogPostServerProps {
  /** Portal API URL */
  apiUrl?: string
  /** Project API key */
  apiKey?: string
  /** Blog post slug */
  slug: string
  /** Show table of contents sidebar */
  showToc?: boolean
  /** Show related posts */
  showRelated?: boolean
  /** Number of related posts */
  relatedCount?: number
  /** Show author card */
  showAuthor?: boolean
  /** Base URL for blog links */
  basePath?: string
  /** Custom class name (applied to article) */
  className?: string
  /** 
   * Custom Tailwind/CSS classes for each element.
   * When provided, inline styles are disabled for that element.
   */
  styles?: BlogPostStyles
  /** Use CSS classes only (no inline styles) - set to true for Tailwind sites */
  unstyled?: boolean
  /** Custom render function */
  children?: (props: {
    post: BlogPostType
    tableOfContents: TocItem[]
    relatedPosts: BlogPostType[]
  }) => React.ReactNode
}

export async function BlogPost({
  apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com',
  apiKey = process.env.NEXT_PUBLIC_UPTRADE_API_KEY || '',
  slug,
  showToc = true,
  showRelated = true,
  relatedCount = 3,
  showAuthor = true,
  basePath = '/blog',
  className,
  styles = {},
  unstyled = false,
  children,
}: BlogPostServerProps) {
  // Helper to conditionally apply inline styles
  const inlineStyle = (defaultStyle: React.CSSProperties, classKey: keyof BlogPostStyles) =>
    unstyled || styles[classKey] ? undefined : defaultStyle

  if (!apiKey) {
    console.warn('[Blog] No API key configured')
    return null
  }

  const post = await fetchBlogPost(apiUrl, apiKey, slug)

  if (!post) {
    return (
      <div 
        className={`${styles.notFound || ''} ${className || ''}`.trim() || undefined}
        style={inlineStyle({ textAlign: 'center', padding: 60 }, 'notFound')}
      >
        <h1 style={inlineStyle({ fontSize: 24, marginBottom: 16 }, 'notFound')}>Post Not Found</h1>
        <p style={inlineStyle({ color: '#6b7280' }, 'notFound')}>
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <a
          href={basePath}
          style={inlineStyle({
            display: 'inline-block',
            marginTop: 24,
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
          }, 'notFound')}
        >
          ← Back to Blog
        </a>
      </div>
    )
  }

  const content = post.content_html || post.content || ''
  const tableOfContents = showToc ? generateTableOfContents(content) : []
  const relatedPosts = showRelated
    ? await fetchRelatedPosts(apiUrl, apiKey, post.id, relatedCount)
    : []

  // Custom render
  if (children) {
    return children({ post, tableOfContents, relatedPosts })
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <article className={`${styles.article || ''} ${className || ''}`.trim() || undefined}>
      {/* Header */}
      <header 
        className={styles.header}
        style={inlineStyle({ marginBottom: 32 }, 'header')}
      >
        {/* Breadcrumb */}
        <nav 
          className={styles.breadcrumb}
          style={inlineStyle({ marginBottom: 16, fontSize: 14, color: '#6b7280' }, 'breadcrumb')}
        >
          <a 
            href={basePath} 
            className={styles.breadcrumbLink}
            style={inlineStyle({ color: '#3b82f6', textDecoration: 'none' }, 'breadcrumbLink')}
          >
            Blog
          </a>
          {post.category && (
            <>
              <span style={inlineStyle({ margin: '0 8px' }, 'breadcrumb')}>/</span>
              <a
                href={`${basePath}?category=${post.category}`}
                className={styles.breadcrumbLink}
                style={inlineStyle({ color: '#3b82f6', textDecoration: 'none' }, 'breadcrumbLink')}
              >
                {typeof post.category === 'string' ? post.category : post.category?.name || 'Uncategorized'}
              </a>
            </>
          )}
        </nav>

        {/* Title */}
        <h1 
          className={styles.title}
          style={inlineStyle({ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }, 'title')}
        >
          {post.title}
        </h1>

        {/* Subtitle */}
        {post.subtitle && (
          <p 
            className={styles.subtitle}
            style={inlineStyle({ fontSize: 20, color: '#6b7280', marginBottom: 16 }, 'subtitle')}
          >
            {post.subtitle}
          </p>
        )}

        {/* Meta */}
        <div 
          className={styles.meta}
          style={inlineStyle({ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }, 'meta')}
        >
          {post.author && (
            <span 
              className={styles.metaItem}
              style={inlineStyle({ fontSize: 14, color: '#374151' }, 'metaItem')}
            >
              By {typeof post.author === 'string' ? post.author : post.author.name}
            </span>
          )}
          {date && (
            <span 
              className={styles.metaItem}
              style={inlineStyle({ fontSize: 14, color: '#6b7280' }, 'metaItem')}
            >
              {date}
            </span>
          )}
          {post.reading_time_minutes && (
            <span 
              className={styles.metaItem}
              style={inlineStyle({ fontSize: 14, color: '#9ca3af' }, 'metaItem')}
            >
              {post.reading_time_minutes} min read
            </span>
          )}
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <figure 
          className={styles.featuredImageWrapper}
          style={inlineStyle({ margin: '0 0 32px' }, 'featuredImageWrapper')}
        >
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className={styles.featuredImage}
            style={inlineStyle({
              width: '100%',
              maxHeight: 500,
              objectFit: 'cover',
              borderRadius: 12,
            }, 'featuredImage')}
          />
        </figure>
      )}

      {/* Content Layout with TOC */}
      <div
        className={styles.contentLayout}
        style={inlineStyle({
          display: showToc && tableOfContents.length > 0 ? 'grid' : 'block',
          gridTemplateColumns: showToc && tableOfContents.length > 0 ? '1fr 250px' : undefined,
          gap: 48,
        }, 'contentLayout')}
      >
        {/* Main Content */}
        <div
          className={`blog-content ${styles.content || ''}`.trim()}
          style={inlineStyle({
            fontSize: 17,
            lineHeight: 1.8,
            color: '#374151',
          }, 'content')}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Table of Contents Sidebar */}
        {showToc && tableOfContents.length > 0 && (
          <aside
            className={styles.tocSidebar}
            style={inlineStyle({
              position: 'sticky',
              top: 100,
              alignSelf: 'start',
              padding: 20,
              backgroundColor: '#f9fafb',
              borderRadius: 12,
            }, 'tocSidebar')}
          >
            <h4
              className={styles.tocTitle}
              style={inlineStyle({
                margin: '0 0 12px',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
              }, 'tocTitle')}
            >
              On This Page
            </h4>
            <ul 
              className={styles.tocList}
              style={inlineStyle({ listStyle: 'none', margin: 0, padding: 0 }, 'tocList')}
            >
              {tableOfContents.map((item) => (
                <li
                  key={item.id}
                  className={styles.tocItem}
                  style={inlineStyle({
                    paddingLeft: (item.level - 2) * 12,
                    marginBottom: 8,
                  }, 'tocItem')}
                >
                  <a
                    href={`#${item.id}`}
                    className={styles.tocLink}
                    style={inlineStyle({
                      fontSize: 14,
                      color: '#6b7280',
                      textDecoration: 'none',
                    }, 'tocLink')}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div 
          className={styles.tags}
          style={inlineStyle({ marginTop: 32, display: 'flex', gap: 8, flexWrap: 'wrap' }, 'tags')}
        >
          {post.tags.map((tag, index) => {
            const tagName = typeof tag === 'string' ? tag : tag?.name || '';
            return (
              <a
                key={`${tagName}-${index}`}
                href={`${basePath}?tag=${tagName}`}
                className={styles.tag}
                style={inlineStyle({
                  padding: '4px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 9999,
                  fontSize: 13,
                  color: '#374151',
                  textDecoration: 'none',
                }, 'tag')}
              >
                #{tagName}
              </a>
            );
          })}
        </div>
      )}

      {/* FAQ Section (supports faq_items or faqItems from Portal / E-E-A-T) */}
      {(post.faq_items ?? (post as any).faqItems) && Array.isArray(post.faq_items ?? (post as any).faqItems) && (post.faq_items ?? (post as any).faqItems).length > 0 && (
        <section 
          className={styles.faqSection}
          style={inlineStyle({ marginTop: 48 }, 'faqSection')}
        >
          <h2 
            className={styles.faqTitle}
            style={inlineStyle({ fontSize: 24, fontWeight: 600, marginBottom: 24 }, 'faqTitle')}
          >
            Frequently Asked Questions
          </h2>
          <div style={inlineStyle({ display: 'flex', flexDirection: 'column', gap: 16 }, 'faqSection')}>
            {(post.faq_items ?? (post as any).faqItems).map((faq: { question: string; answer: string }, index: number) => (
              <details
                key={index}
                className={styles.faqItem}
                style={inlineStyle({
                  padding: 16,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                }, 'faqItem')}
              >
                <summary
                  className={styles.faqQuestion}
                  style={inlineStyle({
                    fontWeight: 500,
                    cursor: 'pointer',
                    listStyle: 'none',
                  }, 'faqQuestion')}
                >
                  {faq.question}
                </summary>
                <p 
                  className={styles.faqAnswer}
                  style={inlineStyle({ marginTop: 12, color: '#6b7280' }, 'faqAnswer')}
                >
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Author Card (supports BlogAuthor or E-E-A-T author shape) */}
      {showAuthor && post.author && typeof post.author === 'object' && (
        <AuthorSection author={normalizeAuthorForDisplay(post.author)} className={styles.authorCard} unstyled={unstyled} />
      )}

      {/* Related Posts */}
      {showRelated && relatedPosts.length > 0 && (
        <section 
          className={styles.relatedSection}
          style={inlineStyle({ marginTop: 48 }, 'relatedSection')}
        >
          <h2 
            className={styles.relatedTitle}
            style={inlineStyle({ fontSize: 24, fontWeight: 600, marginBottom: 24 }, 'relatedTitle')}
          >
            Related Posts
          </h2>
          <div
            className={styles.relatedGrid}
            style={inlineStyle({
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }, 'relatedGrid')}
          >
            {relatedPosts.map((relatedPost) => (
              <article
                key={relatedPost.id}
                className={styles.relatedCard}
                style={inlineStyle({
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }, 'relatedCard')}
              >
                {relatedPost.featured_image && (
                  <a href={`${basePath}/${relatedPost.slug}`}>
                    <img
                      src={relatedPost.featured_image}
                      alt={relatedPost.title}
                      style={inlineStyle({ width: '100%', height: 150, objectFit: 'cover' }, 'relatedCard')}
                    />
                  </a>
                )}
                <div style={inlineStyle({ padding: 16 }, 'relatedCard')}>
                  <h3 style={inlineStyle({ fontSize: 16, fontWeight: 600, marginBottom: 8 }, 'relatedCard')}>
                    <a
                      href={`${basePath}/${relatedPost.slug}`}
                      style={inlineStyle({ color: 'inherit', textDecoration: 'none' }, 'relatedCard')}
                    >
                      {relatedPost.title}
                    </a>
                  </h3>
                  {relatedPost.excerpt && (
                    <p style={inlineStyle({ fontSize: 14, color: '#6b7280', margin: 0 }, 'relatedCard')}>
                      {relatedPost.excerpt.slice(0, 100)}...
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

// ============================================================================
// AUTHOR NORMALIZATION (BlogAuthor + E-E-A-T shapes)
// ============================================================================

/** Normalize author from Portal: supports BlogAuthor (avatar_url, social_links) or E-E-A-T (image, url, socialProfiles) */
function normalizeAuthorForDisplay(
  author: Record<string, unknown> | BlogAuthor
): BlogAuthor & { sameAs?: string[]; title?: string } {
  const a = author as Record<string, unknown>
  const avatarUrl =
    (a.avatar_url as string) ?? (a.image as string) ?? (a.image_url as string)
  const socialLinks = a.social_links as BlogAuthor['social_links'] | undefined
  const socialProfiles = a.socialProfiles as string[] | undefined
  return {
    id: (a.id as string) ?? 'author',
    project_id: (a.project_id as string) ?? '',
    name: (a.name as string) ?? 'Author',
    slug: (a.slug as string) ?? 'author',
    bio: (a.bio as string) ?? undefined,
    avatar_url: avatarUrl ?? undefined,
    email: (a.email as string) ?? undefined,
    website: (a.website as string) ?? (a.url as string) ?? undefined,
    social_links: socialLinks ?? undefined,
    is_active: (a.is_active as boolean) ?? true,
    ...(socialProfiles?.length ? { sameAs: socialProfiles } : {}),
    ...(a.title ? { title: a.title as string } : {}),
  } as BlogAuthor & { sameAs?: string[]; title?: string }
}

// ============================================================================
// AUTHOR SECTION
// ============================================================================

function AuthorSection({
  author,
  className,
  unstyled = false,
}: {
  author: BlogAuthor & { sameAs?: string[]; title?: string }
  className?: string
  unstyled?: boolean
}) {
  return (
    <section
      className={className}
      style={unstyled || className ? undefined : {
        marginTop: 48,
        padding: 24,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
      }}
    >
      {author.avatar_url && (
        <img
          src={author.avatar_url}
          alt={author.name}
          style={unstyled || className ? undefined : {
            width: 80,
            height: 80,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      )}
      <div>
        <h3 style={unstyled || className ? undefined : { margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>
          {author.name}
        </h3>
        {'title' in author && author.title && (
          <p style={unstyled || className ? undefined : { margin: '0 0 4px', fontSize: 14, color: '#6b7280' }}>
            {author.title}
          </p>
        )}
        {author.bio && (
          <p style={unstyled || className ? undefined : { margin: '0 0 12px', color: '#6b7280', fontSize: 14 }}>
            {author.bio}
          </p>
        )}
        {author.social_links && (
          <div style={unstyled || className ? undefined : { display: 'flex', gap: 16 }}>
            {author.social_links.twitter && (
              <a
                href={`https://twitter.com/${author.social_links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                style={unstyled || className ? undefined : { color: '#3b82f6', fontSize: 14 }}
              >
                Twitter
              </a>
            )}
            {author.social_links.linkedin && (
              <a
                href={author.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={unstyled || className ? undefined : { color: '#3b82f6', fontSize: 14 }}
              >
                LinkedIn
              </a>
            )}
          </div>
        )}
        {'sameAs' in author && author.sameAs && author.sameAs.length > 0 && !author.social_links && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {author.sameAs.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', fontSize: 14 }}
              >
                Profile
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}