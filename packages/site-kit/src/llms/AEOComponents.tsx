/**
 * @uptrade/site-kit/llms - AEO Components
 * 
 * Answer Engine Optimization (AEO) components for structuring content
 * in a way that AI systems can easily extract and cite.
 * 
 * These components create semantic HTML with proper structure for:
 * - Featured snippets
 * - AI-generated answers
 * - Voice assistant responses
 * - AI retrieval and citation (Sonor AI Visibility)
 */

import * as React from 'react'
import type { AEOBlockProps, AEOSummaryProps, AEODefinitionProps, AEOClaimProps } from './types'

/**
 * AEOBlock - Generic content block optimized for AI extraction
 * 
 * Wraps content with semantic HTML and Sonor data attributes.
 * Use for any content you want AI systems to prioritize.
 * 
 * @example
 * ```tsx
 * <AEOBlock type="answer" question="What is family law?" speakable>
 *   Family law is the area of legal practice that deals with family-related 
 *   matters such as divorce, child custody, adoption, and domestic relations.
 * </AEOBlock>
 * ```
 */
export function AEOBlock({
  id,
  type,
  question,
  speakable = true,
  entityId,
  children,
  className = '',
}: AEOBlockProps): React.ReactElement {
  const blockId = id || `aeo-${type}-${Math.random().toString(36).slice(2, 8)}`
  
  const baseClasses = `aeo-block aeo-${type}`
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  // Common data attributes for Sonor AI
  const sonorAttrs = {
    'data-sonor-ai': type,
    'data-sonor-block': 'true',
    ...(entityId && { 'data-sonor-entity': entityId }),
  }

  // Q&A format for answer type
  if (type === 'answer' && question) {
    return (
      <section 
        id={blockId}
        className={combinedClasses}
        data-speakable={speakable ? 'true' : undefined}
        data-aeo-type={type}
        {...sonorAttrs}
        itemScope
        itemType="https://schema.org/Question"
      >
        <h3 itemProp="name" className="aeo-question">
          {question}
        </h3>
        <div 
          itemScope 
          itemType="https://schema.org/Answer" 
          itemProp="acceptedAnswer"
          className="aeo-answer"
        >
          <div itemProp="text">
            {children}
          </div>
        </div>
      </section>
    )
  }

  // Definition format
  if (type === 'definition') {
    return (
      <section 
        id={blockId}
        className={combinedClasses}
        data-speakable={speakable ? 'true' : undefined}
        data-aeo-type={type}
        {...sonorAttrs}
      >
        {children}
      </section>
    )
  }

  // Steps format (numbered list)
  if (type === 'steps') {
    return (
      <section 
        id={blockId}
        className={combinedClasses}
        data-speakable={speakable ? 'true' : undefined}
        data-aeo-type={type}
        {...sonorAttrs}
        itemScope
        itemType="https://schema.org/HowTo"
      >
        {children}
      </section>
    )
  }

  // Default wrapper
  return (
    <section 
      id={blockId}
      className={combinedClasses}
      data-speakable={speakable ? 'true' : undefined}
      data-aeo-type={type}
      {...sonorAttrs}
    >
      {children}
    </section>
  )
}

/**
 * AEOSummary - Key points summary for AI extraction
 * 
 * Creates a scannable list of key points that AI can easily cite.
 * Perfect for "at a glance" or "key takeaways" sections.
 * 
 * @example
 * ```tsx
 * <AEOSummary 
 *   title="Key Points" 
 *   points={[
 *     "Family law covers divorce, custody, and adoption",
 *     "Ohio is an equitable distribution state",
 *     "Child custody decisions prioritize the child's best interests"
 *   ]} 
 * />
 * ```
 */
export function AEOSummary({
  title = 'Key Points',
  points,
  speakable = true,
  entityId,
  className = '',
}: AEOSummaryProps): React.ReactElement {
  const baseClasses = 'aeo-summary'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <div 
      className={combinedClasses}
      data-speakable={speakable ? 'true' : undefined}
      data-aeo-type="summary"
      data-sonor-ai="summary"
      data-sonor-block="true"
      {...(entityId && { 'data-sonor-entity': entityId })}
    >
      {title && <h3 className="aeo-summary-title">{title}</h3>}
      <ul className="aeo-summary-points">
        {points.map((point, index) => (
          <li key={index} className="aeo-summary-point">
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * AEODefinition - Term definition optimized for featured snippets
 * 
 * Creates a clear definition format that works well for
 * "What is X?" queries in AI search results.
 * 
 * @example
 * ```tsx
 * <AEODefinition 
 *   term="Equitable Distribution" 
 *   definition="A legal principle used in Ohio divorce cases where marital 
 *   property is divided fairly, though not necessarily equally, between spouses."
 * />
 * ```
 */
export function AEODefinition({
  term,
  definition,
  speakable = true,
  entityId,
  source,
  className = '',
}: AEODefinitionProps): React.ReactElement {
  const baseClasses = 'aeo-definition'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <dl 
      className={combinedClasses}
      data-speakable={speakable ? 'true' : undefined}
      data-aeo-type="definition"
      data-sonor-ai="definition"
      data-sonor-block="true"
      {...(entityId && { 'data-sonor-entity': entityId })}
      {...(source && { 'data-sonor-source': source })}
      itemScope
      itemType="https://schema.org/DefinedTerm"
    >
      <dt className="aeo-term" itemProp="name">
        <strong>{term}</strong>
      </dt>
      <dd className="aeo-definition-text" itemProp="description">
        {definition}
      </dd>
    </dl>
  )
}

/**
 * AEOSteps - How-to steps for featured snippets
 * 
 * Creates numbered steps with HowTo schema markup.
 * 
 * @example
 * ```tsx
 * <AEOSteps title="How to File for Divorce in Ohio">
 *   <AEOStep number={1} name="Gather Documents">
 *     Collect financial records, property deeds, and marriage certificate.
 *   </AEOStep>
 *   <AEOStep number={2} name="File Petition">
 *     Submit divorce petition to the county court.
 *   </AEOStep>
 * </AEOSteps>
 * ```
 */
export function AEOSteps({
  title,
  children,
  speakable = true,
  entityId,
  className = '',
}: {
  title: string
  children: React.ReactNode
  speakable?: boolean
  entityId?: string
  className?: string
}): React.ReactElement {
  const baseClasses = 'aeo-steps'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <section 
      className={combinedClasses}
      data-speakable={speakable ? 'true' : undefined}
      data-aeo-type="steps"
      data-sonor-ai="steps"
      data-sonor-block="true"
      {...(entityId && { 'data-sonor-entity': entityId })}
      itemScope
      itemType="https://schema.org/HowTo"
    >
      <h3 className="aeo-steps-title" itemProp="name">{title}</h3>
      <ol className="aeo-steps-list">
        {children}
      </ol>
    </section>
  )
}

/**
 * AEOStep - Individual step within AEOSteps
 */
export function AEOStep({
  number,
  name,
  children,
}: {
  number: number
  name: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <li 
      className="aeo-step"
      itemScope
      itemType="https://schema.org/HowToStep"
      itemProp="step"
    >
      <span className="aeo-step-number" itemProp="position">{number}</span>
      <strong className="aeo-step-name" itemProp="name">{name}</strong>
      <div className="aeo-step-content" itemProp="text">
        {children}
      </div>
    </li>
  )
}

/**
 * AEOComparison - Comparison table for AI extraction
 * 
 * Creates a structured comparison that AI can understand and cite.
 * 
 * @example
 * ```tsx
 * <AEOComparison 
 *   title="Divorce vs. Dissolution in Ohio"
 *   items={[
 *     { aspect: 'Agreement', optionA: 'May be contested', optionB: 'Must be agreed upon' },
 *     { aspect: 'Timeline', optionA: '6-12 months', optionB: '30-90 days' },
 *   ]}
 *   labelA="Divorce"
 *   labelB="Dissolution"
 * />
 * ```
 */
export function AEOComparison({
  title,
  items,
  labelA,
  labelB,
  speakable = true,
  entityId,
  className = '',
}: {
  title: string
  items: Array<{ aspect: string; optionA: string; optionB: string }>
  labelA: string
  labelB: string
  speakable?: boolean
  entityId?: string
  className?: string
}): React.ReactElement {
  const baseClasses = 'aeo-comparison'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <section 
      className={combinedClasses}
      data-speakable={speakable ? 'true' : undefined}
      data-aeo-type="comparison"
      data-sonor-ai="comparison"
      data-sonor-block="true"
      {...(entityId && { 'data-sonor-entity': entityId })}
    >
      <h3 className="aeo-comparison-title">{title}</h3>
      <table className="aeo-comparison-table">
        <thead>
          <tr>
            <th>Aspect</th>
            <th>{labelA}</th>
            <th>{labelB}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="aeo-comparison-aspect">{item.aspect}</td>
              <td className="aeo-comparison-a">{item.optionA}</td>
              <td className="aeo-comparison-b">{item.optionB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/**
 * AEOClaim - AI-Verifiable Claim with Provenance
 * 
 * Wraps factual claims with machine-readable source and confidence data.
 * LLMs prioritize verifiable facts with clear provenance.
 * 
 * @example
 * ```tsx
 * <AEOClaim 
 *   source="KRS 281A.170" 
 *   sourceUrl="https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=6398"
 *   confidence={0.95}
 *   claimType="statute"
 * >
 *   A CDL suspension is triggered at 26 MPH over the limit.
 * </AEOClaim>
 * ```
 */
export function AEOClaim({
  source,
  sourceUrl,
  confidence = 1.0,
  claimType = 'fact',
  retrievedAt,
  children,
  className = '',
}: AEOClaimProps): React.ReactElement {
  const baseClasses = 'aeo-claim'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <span 
      className={combinedClasses}
      data-sonor-claim="true"
      data-sonor-source={source}
      {...(sourceUrl && { 'data-sonor-source-url': sourceUrl })}
      data-sonor-confidence={confidence.toString()}
      data-sonor-claim-type={claimType}
      {...(retrievedAt && { 'data-sonor-retrieved': retrievedAt })}
      itemScope
      itemType="https://schema.org/Claim"
    >
      <span itemProp="text">{children}</span>
      {sourceUrl ? (
        <meta itemProp="citation" content={sourceUrl} />
      ) : (
        <meta itemProp="citation" content={source} />
      )}
    </span>
  )
}

/**
 * AEOEntity - Inline entity annotation
 * 
 * Wraps entity mentions with machine-readable entity IDs for knowledge graph linking.
 * 
 * @example
 * ```tsx
 * <AEOEntity entityId="person-123" entityType="person" name="Shannon Sexton">
 *   Attorney Shannon Sexton
 * </AEOEntity> handles CDL defense cases.
 * ```
 */
export function AEOEntity({
  entityId,
  entityType,
  name,
  url,
  children,
  className = '',
}: {
  entityId: string
  entityType: 'organization' | 'person' | 'service' | 'product' | 'location' | 'concept' | 'credential'
  name: string
  url?: string
  children: React.ReactNode
  className?: string
}): React.ReactElement {
  const baseClasses = 'aeo-entity'
  const combinedClasses = className ? `${baseClasses} aeo-entity-${entityType} ${className}` : `${baseClasses} aeo-entity-${entityType}`

  return (
    <span 
      className={combinedClasses}
      data-sonor-entity={entityId}
      data-sonor-entity-type={entityType}
      data-sonor-entity-name={name}
      {...(url && { 'data-sonor-entity-url': url })}
      itemScope
      itemType={`https://schema.org/${entityType === 'organization' ? 'Organization' : entityType === 'person' ? 'Person' : entityType === 'location' ? 'Place' : 'Thing'}`}
    >
      <span itemProp="name">{children}</span>
      {url && <link itemProp="url" href={url} />}
    </span>
  )
}

// ============================================
// Content Provenance Components
// ============================================

/**
 * AEOProvenanceList - Display sources/citations for content
 * 
 * Shows a list of provenance sources with machine-readable attributes.
 * LLMs use this to verify claims and assess source quality.
 * 
 * @example
 * ```tsx
 * <AEOProvenanceList 
 *   title="Sources"
 *   sources={[
 *     { id: '1', source_type: 'legal_statute', title: 'KRS 281A.170', url: '...' },
 *     { id: '2', source_type: 'news_article', title: 'CDL News', publisher: 'Transport Weekly' }
 *   ]}
 * />
 * ```
 */
export function AEOProvenanceList({
  sources,
  title = 'Sources & References',
  className = '',
}: {
  sources: Array<{
    id: string
    source_type: 'press_release' | 'news_article' | 'legal_statute' | 'research_paper' | 'official_document' | 'internal' | 'citation'
    title: string
    url?: string
    publisher?: string
    published_at?: string
    accessed_at?: string
    excerpt?: string
    confidence?: number
    identifier?: string
  }>
  title?: string
  className?: string
}): React.ReactElement {
  const baseClasses = 'aeo-provenance-list'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  const getSchemaType = (sourceType: string): string => {
    switch (sourceType) {
      case 'legal_statute':
        return 'https://schema.org/Legislation'
      case 'research_paper':
        return 'https://schema.org/ScholarlyArticle'
      case 'news_article':
        return 'https://schema.org/NewsArticle'
      case 'press_release':
        return 'https://schema.org/NewsArticle'
      default:
        return 'https://schema.org/CreativeWork'
    }
  }

  return (
    <aside 
      className={combinedClasses}
      data-sonor-provenance="list"
      data-sonor-source-count={sources.length.toString()}
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <h4 className="aeo-provenance-title" itemProp="name">{title}</h4>
      <ol className="aeo-provenance-sources">
        {sources.map((source, index) => (
          <li 
            key={source.id}
            className="aeo-provenance-item"
            data-sonor-source-id={source.id}
            data-sonor-source-type={source.source_type}
            {...(source.confidence && { 'data-sonor-confidence': source.confidence.toString() })}
            itemScope
            itemType={getSchemaType(source.source_type)}
            itemProp="itemListElement"
          >
            <span className="aeo-provenance-number">[{index + 1}]</span>
            {source.url ? (
              <a 
                href={source.url} 
                className="aeo-provenance-link"
                itemProp="url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span itemProp="name">{source.title}</span>
              </a>
            ) : (
              <span itemProp="name">{source.title}</span>
            )}
            {source.publisher && (
              <span className="aeo-provenance-publisher" itemProp="publisher">
                — {source.publisher}
              </span>
            )}
            {source.published_at && (
              <time 
                className="aeo-provenance-date" 
                itemProp="datePublished"
                dateTime={source.published_at}
              >
                ({new Date(source.published_at).toLocaleDateString()})
              </time>
            )}
            {source.identifier && (
              <span className="aeo-provenance-identifier" data-sonor-identifier={source.identifier}>
                {source.identifier}
              </span>
            )}
            {source.excerpt && (
              <blockquote className="aeo-provenance-excerpt" itemProp="description">
                {source.excerpt}
              </blockquote>
            )}
          </li>
        ))}
      </ol>
    </aside>
  )
}

/**
 * AEOCitedContent - Content with inline citations linked to sources
 * 
 * Wraps content that contains numbered citations [1], [2] etc., and links them
 * to a list of provenance sources for AI verification.
 * 
 * @example
 * ```tsx
 * <AEOCitedContent 
 *   sources={[
 *     { id: '1', source_type: 'legal_statute', title: 'KRS 281A.170' },
 *     { id: '2', source_type: 'news_article', title: 'FMCSA Guidelines 2024' }
 *   ]}
 *   showSourcesList={true}
 * >
 *   <p>Kentucky law requires CDL holders to report violations within 30 days [1]. 
 *   Federal guidelines add additional requirements [2].</p>
 * </AEOCitedContent>
 * ```
 */
export function AEOCitedContent({
  children,
  sources,
  showSourcesList = true,
  className = '',
}: {
  children: React.ReactNode
  sources: Array<{
    id: string
    source_type: 'press_release' | 'news_article' | 'legal_statute' | 'research_paper' | 'official_document' | 'internal' | 'citation'
    title: string
    url?: string
    publisher?: string
    published_at?: string
    accessed_at?: string
    excerpt?: string
    confidence?: number
    identifier?: string
  }>
  showSourcesList?: boolean
  className?: string
}): React.ReactElement {
  const baseClasses = 'aeo-cited-content'
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses

  return (
    <section 
      className={combinedClasses}
      data-sonor-ai="cited-content"
      data-sonor-provenance="inline"
      data-sonor-source-count={sources.length.toString()}
    >
      <div className="aeo-cited-body">
        {children}
      </div>
      {showSourcesList && sources.length > 0 && (
        <AEOProvenanceList sources={sources} title="References" />
      )}
    </section>
  )
}

export default AEOBlock
