/**
 * LocationPageContent - Server Component for fetching location page sections
 * 
 * Usage:
 *   <LocationPageContent 
 *     projectId="uuid" 
 *     path="/areas/seattle-wa/plumbing" 
 *     section="hero" 
 *   />
 * 
 * This component fetches content from seo_location_pages.sections for a given
 * path and section, making it editable in Portal without code deploys.
 */

import * as React from 'react'
import { cache } from 'react'

// ============================================
// Types
// ============================================

export interface LocationPageContentProps {
  /** Uptrade project ID */
  projectId: string
  /** Page path (e.g., /areas/seattle-wa/plumbing) */
  path: string
  /** Section ID or type to fetch (e.g., "hero", "intro", "services") */
  section: string
  /** Fallback content if section not found */
  fallback?: React.ReactNode
  /** Additional className for wrapper */
  className?: string
  /** Custom renderer for the section data */
  render?: (data: LocationSectionData) => React.ReactNode
}

export interface LocationSectionData {
  type: string
  content: any
}

export interface HeroSectionContent {
  title: string
  subtitle?: string
  cta_text?: string
  cta_href?: string
  stats?: Array<{ label: string; value: string }>
  background_image?: string
}

export interface ServiceGridContent {
  services: Array<{
    title: string
    description: string
    href: string
    icon?: string
  }>
}

export interface TextSectionContent {
  heading?: string
  paragraphs: string[]
  html?: string
}

// ============================================
// API Config
// ============================================

function getApiConfig() {
  const apiUrl = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  return { apiUrl }
}

// ============================================
// Cached API Call
// ============================================

/**
 * Fetch location page section content from Portal
 * Cached with React's cache() for request deduplication
 */
export const getLocationSection = cache(async (
  projectId: string,
  path: string,
  section: string
): Promise<LocationSectionData | null> => {
  const { apiUrl } = getApiConfig()
  
  try {
    const response = await fetch(`${apiUrl}/api/public/seo/location-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        path,
        section,
      }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!response.ok) {
      console.error(`LocationPageContent: Failed to fetch section "${section}" for path "${path}"`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('LocationPageContent: API error:', error)
    return null
  }
})

// ============================================
// Default Renderers
// ============================================

function HeroRenderer({ data, className }: { data: HeroSectionContent; className?: string }) {
  return (
    <section className={className || 'location-hero'}>
      <h1>{data.title}</h1>
      {data.subtitle && <p className="subtitle">{data.subtitle}</p>}
      {data.stats && (
        <div className="stats-grid">
          {data.stats.map((stat, i) => (
            <div key={i} className="stat">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
      {data.cta_text && data.cta_href && (
        <a href={data.cta_href} className="cta-button">
          {data.cta_text}
        </a>
      )}
    </section>
  )
}

function TextRenderer({ data, className }: { data: TextSectionContent; className?: string }) {
  if (data.html) {
    return (
      <section 
        className={className || 'location-text'} 
        dangerouslySetInnerHTML={{ __html: data.html }} 
      />
    )
  }
  
  return (
    <section className={className || 'location-text'}>
      {data.heading && <h2>{data.heading}</h2>}
      {data.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </section>
  )
}

function ServicesGridRenderer({ data, className }: { data: ServiceGridContent; className?: string }) {
  return (
    <section className={className || 'location-services-grid'}>
      <div className="services-list">
        {data.services.map((service, i) => (
          <a key={i} href={service.href} className="service-card">
            {service.icon && <span className="service-icon">{service.icon}</span>}
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

function DefaultRenderer({ data, className }: { data: any; className?: string }) {
  // Fallback: just render as JSON for debugging
  if (process.env.NODE_ENV === 'development') {
    return (
      <section className={className}>
        <pre style={{ fontSize: '12px', background: '#f0f0f0', padding: '1rem' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>
    )
  }
  
  // In production, try to render content as text/html
  if (typeof data.content === 'string') {
    return (
      <section 
        className={className} 
        dangerouslySetInnerHTML={{ __html: data.content }} 
      />
    )
  }
  
  return null
}

// ============================================
// Main Component
// ============================================

/**
 * LocationPageContent - Server Component
 * 
 * Fetches and renders a section of a location page from Portal.
 * Content is fully editable in Portal → SEO → Location Pages.
 */
export async function LocationPageContent({
  projectId,
  path,
  section,
  fallback = null,
  className,
  render,
}: LocationPageContentProps): Promise<React.ReactElement | null> {
  const data = await getLocationSection(projectId, path, section)
  
  if (!data) {
    return fallback as React.ReactElement | null
  }
  
  // If custom renderer provided, use it
  if (render) {
    return <>{render(data)}</>
  }
  
  // Use default renderers based on section type
  switch (data.type) {
    case 'hero':
      return <HeroRenderer data={data.content as HeroSectionContent} className={className} />
    
    case 'text':
    case 'intro':
    case 'about':
    case 'about_location':
      return <TextRenderer data={data.content as TextSectionContent} className={className} />
    
    case 'services_grid':
    case 'services':
      return <ServicesGridRenderer data={data.content as ServiceGridContent} className={className} />
    
    default:
      return <DefaultRenderer data={data} className={className} />
  }
}

// Export types for external use
export type {
  HeroSectionContent as LocationHeroContent,
  ServiceGridContent as LocationServicesContent,
  TextSectionContent as LocationTextContent,
}
