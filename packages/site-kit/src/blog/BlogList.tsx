/**
 * @uptrade/site-kit/blog - Blog List Component
 * 
 * Fetches and displays a list of blog posts with pagination, filtering, and sorting.
 * Supports both server-side and client-side rendering.
 * 
 * @example Tailwind styling
 * ```tsx
 * <BlogList
 *   styles={{
 *     container: 'max-w-7xl mx-auto px-4',
 *     categoryNav: 'flex flex-wrap gap-2 mb-8',
 *     categoryLink: 'px-4 py-2 rounded-full text-sm font-medium',
 *     categoryLinkActive: 'bg-primary-600 text-white',
 *     categoryLinkInactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
 *     grid: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8',
 *     card: 'bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow',
 *     cardImage: 'w-full h-48 object-cover',
 *     cardBody: 'p-6',
 *     cardTitle: 'text-xl font-bold text-gray-900',
 *     cardExcerpt: 'text-gray-600 line-clamp-3',
 *     cardMeta: 'text-sm text-gray-500',
 *     pagination: 'flex justify-center gap-4 mt-12',
 *     paginationLink: 'px-6 py-3 bg-primary-600 text-white rounded-lg',
 *     emptyState: 'text-center py-12 text-gray-500',
 *   }}
 * />
 * ```
 */

import React from 'react'
import type { BlogListResult, BlogPost, BlogCategory } from './types'

// ============================================================================
// STYLE TYPES
// ============================================================================

export interface BlogListStyles {
  /** Container wrapper */
  container?: string
  /** Category navigation wrapper */
  categoryNav?: string
  /** Individual category link */
  categoryLink?: string
  /** Active category link (combined with categoryLink) */
  categoryLinkActive?: string
  /** Inactive category link (combined with categoryLink) */
  categoryLinkInactive?: string
  /** Posts grid container */
  grid?: string
  /** Individual post card */
  card?: string
  /** Card image wrapper */
  cardImageWrapper?: string
  /** Card image */
  cardImage?: string
  /** Card body/content area */
  cardBody?: string
  /** Card meta row (date, category) */
  cardMeta?: string
  /** Card category badge */
  cardCategory?: string
  /** Card date */
  cardDate?: string
  /** Card title */
  cardTitle?: string
  /** Card title link */
  cardTitleLink?: string
  /** Card excerpt */
  cardExcerpt?: string
  /** Card footer */
  cardFooter?: string
  /** Card author */
  cardAuthor?: string
  /** Card reading time */
  cardReadingTime?: string
  /** Card read more link */
  cardReadMore?: string
  /** Pagination container */
  pagination?: string
  /** Pagination link */
  paginationLink?: string
  /** Pagination info text */
  paginationInfo?: string
  /** Empty state */
  emptyState?: string
}

// ============================================================================
// DATA FETCHING
// ============================================================================

interface FetchBlogListParams {
  apiUrl: string
  apiKey: string
  category?: string
  tag?: string
  author?: string
  featured?: boolean
  search?: string
  page?: number
  perPage?: number
  orderBy?: 'published_at' | 'title' | 'view_count'
  order?: 'asc' | 'desc'
}

async function fetchBlogList(params: FetchBlogListParams): Promise<BlogListResult> {
  const {
    apiUrl,
    apiKey,
    category,
    tag,
    author,
    featured,
    search,
    page = 1,
    perPage = 12,
    orderBy = 'published_at',
    order = 'desc',
  } = params

  const queryParams = new URLSearchParams()
  if (category) queryParams.set('category', category)
  if (tag) queryParams.set('tag', tag)
  if (author) queryParams.set('author', author)
  if (featured) queryParams.set('featured', 'true')
  if (search) queryParams.set('search', search)
  queryParams.set('page', String(page))
  queryParams.set('per_page', String(perPage))
  queryParams.set('order_by', orderBy)
  queryParams.set('order', order)

  try {
    const response = await fetch(`${apiUrl}/public/blog/posts?${queryParams}`, {
      headers: {
        'x-api-key': apiKey,
      },
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!response.ok) {
      console.error('[Blog] Failed to fetch posts:', response.statusText)
      return {
        posts: [],
        pagination: {
          page: 1,
          perPage: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      }
    }

    const data = await response.json()
    
    return {
      posts: data.posts || [],
      pagination: {
        page: data.pagination?.page || 1,
        perPage: data.pagination?.per_page || 12,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.total_pages || 0,
        hasNext: data.pagination?.has_next || false,
        hasPrev: data.pagination?.has_prev || false,
      },
    }
  } catch (error) {
    console.error('[Blog] Error fetching posts:', error)
    return {
      posts: [],
      pagination: {
        page: 1,
        perPage: 12,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }
  }
}

async function fetchCategories(apiUrl: string, apiKey: string): Promise<BlogCategory[]> {
  try {
    const response = await fetch(`${apiUrl}/public/blog/categories`, {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.categories || []
  } catch (error) {
    console.error('[Blog] Error fetching categories:', error)
    return []
  }
}

// ============================================================================
// BLOG LIST COMPONENT
// ============================================================================

export interface BlogListServerProps {
  /** Portal API URL */
  apiUrl?: string
  /** Project API key */
  apiKey?: string
  /** Filter by category slug */
  category?: string
  /** Filter by tag */
  tag?: string
  /** Filter by author */
  author?: string
  /** Only featured posts */
  featured?: boolean
  /** Search query */
  search?: string
  /** Page number (1-indexed) */
  page?: number
  /** Items per page */
  perPage?: number
  /** Sort field */
  orderBy?: 'published_at' | 'title' | 'view_count'
  /** Sort direction */
  order?: 'asc' | 'desc'
  /** Show category filter UI */
  showCategoryFilter?: boolean
  /** Show pagination */
  showPagination?: boolean
  /** Custom class name (applied to container) */
  className?: string
  /** Base URL for post links */
  basePath?: string
  /** 
   * Custom Tailwind/CSS classes for each element.
   * When provided, inline styles are disabled for that element.
   */
  styles?: BlogListStyles
  /** Use CSS classes only (no inline styles) - set to true for Tailwind sites */
  unstyled?: boolean
  /** Custom render function for post card */
  renderPost?: (post: BlogPost) => React.ReactNode
  /** Custom render function for entire grid */
  children?: (props: {
    posts: BlogPost[]
    pagination: BlogListResult['pagination']
    categories: BlogCategory[]
  }) => React.ReactNode
}

export async function BlogList({
  apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com',
  apiKey = process.env.NEXT_PUBLIC_UPTRADE_API_KEY || '',
  category,
  tag,
  author,
  featured,
  search,
  page = 1,
  perPage = 12,
  orderBy = 'published_at',
  order = 'desc',
  showCategoryFilter = false,
  showPagination = true,
  className,
  basePath = '/blog',
  styles = {},
  unstyled = false,
  renderPost,
  children,
}: BlogListServerProps) {
  if (!apiKey) {
    console.warn('[Blog] No API key configured')
    return null
  }

  // Helper to conditionally apply inline styles
  const inlineStyle = (defaultStyle: React.CSSProperties, classKey: keyof BlogListStyles) =>
    unstyled || styles[classKey] ? undefined : defaultStyle

  // Fetch data in parallel
  const [blogData, categories] = await Promise.all([
    fetchBlogList({
      apiUrl,
      apiKey,
      category,
      tag,
      author,
      featured,
      search,
      page,
      perPage,
      orderBy,
      order,
    }),
    showCategoryFilter ? fetchCategories(apiUrl, apiKey) : Promise.resolve([]),
  ])

  // Use custom render function if provided
  if (children) {
    return children({ posts: blogData.posts, pagination: blogData.pagination, categories })
  }

  const { posts, pagination } = blogData

  if (posts.length === 0) {
    return (
      <div 
        className={`${styles.container || ''} ${styles.emptyState || ''} ${className || ''}`.trim() || undefined}
        style={inlineStyle({ textAlign: 'center', padding: 40 }, 'emptyState')}
      >
        <p style={inlineStyle({ color: '#6b7280' }, 'emptyState')}>No posts found.</p>
      </div>
    )
  }

  return (
    <div className={`${styles.container || ''} ${className || ''}`.trim() || undefined}>
      {/* Category Filter */}
      {showCategoryFilter && categories.length > 0 && (
        <nav 
          className={styles.categoryNav}
          style={inlineStyle({ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }, 'categoryNav')}
        >
          <a
            href={basePath}
            className={`${styles.categoryLink || ''} ${!category ? styles.categoryLinkActive || '' : styles.categoryLinkInactive || ''}`.trim() || undefined}
            style={inlineStyle({
              padding: '6px 12px',
              borderRadius: 9999,
              fontSize: 14,
              textDecoration: 'none',
              backgroundColor: !category ? '#3b82f6' : '#f3f4f6',
              color: !category ? '#fff' : '#374151',
            }, 'categoryLink')}
          >
            All
          </a>
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`${basePath}?category=${cat.slug}`}
              className={`${styles.categoryLink || ''} ${category === cat.slug ? styles.categoryLinkActive || '' : styles.categoryLinkInactive || ''}`.trim() || undefined}
              style={inlineStyle({
                padding: '6px 12px',
                borderRadius: 9999,
                fontSize: 14,
                textDecoration: 'none',
                backgroundColor: category === cat.slug ? '#3b82f6' : '#f3f4f6',
                color: category === cat.slug ? '#fff' : '#374151',
              }, 'categoryLink')}
            >
              {cat.name} ({cat.post_count})
            </a>
          ))}
        </nav>
      )}

      {/* Blog Grid */}
      <div
        className={styles.grid}
        style={inlineStyle({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }, 'grid')}
      >
        {posts.map((post) =>
          renderPost ? (
            <React.Fragment key={post.id}>{renderPost(post)}</React.Fragment>
          ) : (
            <BlogPostCard key={post.id} post={post} basePath={basePath} styles={styles} unstyled={unstyled} />
          )
        )}
      </div>

      {/* Pagination */}
      {showPagination && pagination.totalPages > 1 && (
        <nav
          className={styles.pagination}
          style={inlineStyle({
            marginTop: 40,
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
          }, 'pagination')}
        >
          {pagination.hasPrev && (
            <a
              href={buildPaginationUrl(basePath, page - 1, category)}
              className={styles.paginationLink}
              style={inlineStyle(paginationLinkStyle, 'paginationLink')}
            >
              ← Previous
            </a>
          )}
          
          <span 
            className={styles.paginationInfo}
            style={inlineStyle({ padding: '8px 16px', color: '#6b7280' }, 'paginationInfo')}
          >
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          {pagination.hasNext && (
            <a
              href={buildPaginationUrl(basePath, page + 1, category)}
              className={styles.paginationLink}
              style={inlineStyle(paginationLinkStyle, 'paginationLink')}
            >
              Next →
            </a>
          )}
        </nav>
      )}
    </div>
  )
}

// ============================================================================
// BLOG POST CARD (Default rendering)
// ============================================================================

interface BlogPostCardProps {
  post: BlogPost
  basePath: string
  styles?: BlogListStyles
  unstyled?: boolean
}

function BlogPostCard({ post, basePath, styles = {}, unstyled = false }: BlogPostCardProps) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  // Helper to conditionally apply inline styles
  const inlineStyle = (defaultStyle: React.CSSProperties, classKey: keyof BlogListStyles) =>
    unstyled || styles[classKey] ? undefined : defaultStyle

  return (
    <article
      className={styles.card}
      style={inlineStyle({
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }, 'card')}
    >
      {post.featured_image && (
        <a href={`${basePath}/${post.slug}`} className={styles.cardImageWrapper}>
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className={styles.cardImage}
            style={inlineStyle({
              width: '100%',
              height: 200,
              objectFit: 'cover',
            }, 'cardImage')}
          />
        </a>
      )}
      
      <div 
        className={styles.cardBody}
        style={inlineStyle({ padding: 20 }, 'cardBody')}
      >
        {/* Meta */}
        <div 
          className={styles.cardMeta}
          style={inlineStyle({ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }, 'cardMeta')}
        >
          {post.category && (
            <span
              className={styles.cardCategory}
              style={inlineStyle({
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: '#eff6ff',
                color: '#3b82f6',
                textTransform: 'uppercase',
              }, 'cardCategory')}
            >
              {typeof post.category === 'string' ? post.category : post.category?.name || 'Uncategorized'}
            </span>
          )}
          {date && (
            <span 
              className={styles.cardDate}
              style={inlineStyle({ fontSize: 13, color: '#6b7280' }, 'cardDate')}
            >
              {date}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 
          className={styles.cardTitle}
          style={inlineStyle({ margin: '0 0 8px', fontSize: 18, fontWeight: 600, lineHeight: 1.4 }, 'cardTitle')}
        >
          <a
            href={`${basePath}/${post.slug}`}
            className={styles.cardTitleLink}
            style={inlineStyle({ color: 'inherit', textDecoration: 'none' }, 'cardTitleLink')}
          >
            {post.title}
          </a>
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            className={styles.cardExcerpt}
            style={inlineStyle({
              margin: '0 0 16px',
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }, 'cardExcerpt')}
          >
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div 
          className={styles.cardFooter}
          style={inlineStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, 'cardFooter')}
        >
          {post.author && (
            <span 
              className={styles.cardAuthor}
              style={inlineStyle({ fontSize: 13, color: '#6b7280' }, 'cardAuthor')}
            >
              By {typeof post.author === 'string' ? post.author : post.author.name}
            </span>
          )}
          {post.reading_time_minutes && (
            <span 
              className={styles.cardReadingTime}
              style={inlineStyle({ fontSize: 13, color: '#9ca3af' }, 'cardReadingTime')}
            >
              {post.reading_time_minutes} min read
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function buildPaginationUrl(basePath: string, page: number, category?: string): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  if (category) params.set('category', category)
  return `${basePath}?${params}`
}

const paginationLinkStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  backgroundColor: '#3b82f6',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
}