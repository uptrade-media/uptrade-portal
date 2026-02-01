/**
 * @uptrade/site-kit/llms - llms.txt Generator
 * 
 * Generates llms.txt content following the llms.txt specification.
 * https://llmstxt.org/
 * 
 * The llms.txt file provides a markdown-formatted overview of a website
 * specifically designed for LLM consumption. It helps AI systems understand
 * what a business does, what services it offers, and how to answer questions.
 */

import { getLLMsData, getBusinessInfo, getServices, getFAQItems, getPageSummaries } from './api'
import type { 
  GenerateLLMSTxtOptions, 
  LLMSTxtContent,
  LLMBusinessInfo,
  LLMContactInfo,
  LLMService,
  LLMFAQItem,
  LLMPageSummary
} from './types'

/**
 * Generate llms.txt content from Portal data
 * 
 * @example
 * ```ts
 * // app/llms.txt/route.ts
 * import { generateLLMsTxt } from '@uptrade/site-kit/llms'
 * 
 * export async function GET() {
 *   const { markdown } = await generateLLMsTxt({
 *     projectId: process.env.UPTRADE_PROJECT_ID!
 *   })
 *   
 *   return new Response(markdown, {
 *     headers: { 'Content-Type': 'text/plain; charset=utf-8' }
 *   })
 * }
 * ```
 */
export async function generateLLMsTxt(
  options: GenerateLLMSTxtOptions
): Promise<LLMSTxtContent> {
  const {
    projectId,
    includeBusinessInfo = true,
    includeServices = true,
    includeFAQ = true,
    includePages = true,
    includeContact = true,
    maxFAQItems = 20,
    maxPages = 50,
    customSections = [],
  } = options

  // Fetch all data
  const data = await getLLMsData(projectId)
  
  if (!data) {
    // Return minimal content if no data
    return {
      markdown: '# Website\n\n> Information not available.',
      metadata: {
        generated_at: new Date().toISOString(),
        project_id: projectId || '',
        sections: [],
      }
    }
  }

  const sections: string[] = []
  const sectionNames: string[] = []

  // ========================================
  // Header Section (H1 + blockquote summary)
  // ========================================
  if (includeBusinessInfo && data.business) {
    const header = generateHeaderSection(data.business)
    sections.push(header)
    sectionNames.push('header')
  }

  // ========================================
  // About Section
  // ========================================
  if (includeBusinessInfo && data.business?.description) {
    const about = generateAboutSection(data.business)
    sections.push(about)
    sectionNames.push('about')
  }

  // ========================================
  // Services Section
  // ========================================
  if (includeServices && data.services?.length > 0) {
    const services = generateServicesSection(data.services)
    sections.push(services)
    sectionNames.push('services')
  }

  // ========================================
  // Contact Section
  // ========================================
  if (includeContact && data.contact) {
    const contact = generateContactSection(data.contact)
    sections.push(contact)
    sectionNames.push('contact')
  }

  // ========================================
  // FAQ Section
  // ========================================
  if (includeFAQ && data.faq?.length > 0) {
    const faq = generateFAQSection(data.faq.slice(0, maxFAQItems))
    sections.push(faq)
    sectionNames.push('faq')
  }

  // ========================================
  // Pages Section (sitemap-like index)
  // ========================================
  if (includePages && data.pages?.length > 0) {
    const pages = generatePagesSection(data.pages.slice(0, maxPages), data.business?.website || '')
    sections.push(pages)
    sectionNames.push('pages')
  }

  // ========================================
  // Custom Sections
  // ========================================
  for (const custom of customSections) {
    sections.push(`## ${custom.title}\n\n${custom.content}`)
    sectionNames.push(custom.title.toLowerCase().replace(/\s+/g, '-'))
  }

  return {
    markdown: sections.join('\n\n---\n\n'),
    metadata: {
      generated_at: new Date().toISOString(),
      project_id: projectId || '',
      sections: sectionNames,
    }
  }
}

/**
 * Generate llms-full.txt with comprehensive knowledge dump
 * Use this for AI systems that can handle larger context
 */
export async function generateLLMsFullTxt(
  options: GenerateLLMSTxtOptions
): Promise<LLMSTxtContent> {
  return generateLLMsTxt({
    ...options,
    includeBusinessInfo: true,
    includeServices: true,
    includeFAQ: true,
    includePages: true,
    includeContact: true,
    maxFAQItems: 100,
    maxPages: 200,
  })
}

// ============================================
// Section Generators
// ============================================

function generateHeaderSection(business: LLMBusinessInfo): string {
  const lines: string[] = []
  
  // H1 with business name
  lines.push(`# ${business.name}`)
  lines.push('')
  
  // Blockquote summary (per llms.txt spec)
  const summary = business.tagline || business.description.split('.')[0]
  lines.push(`> ${summary}`)
  
  if (business.industry) {
    lines.push('')
    lines.push(`**Industry:** ${business.industry}`)
  }
  
  if (business.service_area) {
    lines.push(`**Service Area:** ${business.service_area}`)
  }
  
  if (business.website) {
    lines.push(`**Website:** ${business.website}`)
  }

  return lines.join('\n')
}

function generateAboutSection(business: LLMBusinessInfo): string {
  const lines: string[] = []
  
  lines.push('## About')
  lines.push('')
  lines.push(business.description)
  
  if (business.founded) {
    lines.push('')
    lines.push(`Established: ${business.founded}`)
  }

  return lines.join('\n')
}

function generateServicesSection(services: LLMService[]): string {
  const lines: string[] = []
  
  lines.push('## Services')
  lines.push('')
  
  for (const service of services) {
    if (service.url) {
      lines.push(`- **[${service.name}](${service.url})**: ${service.description}`)
    } else {
      lines.push(`- **${service.name}**: ${service.description}`)
    }
  }

  return lines.join('\n')
}

function generateContactSection(contact: LLMContactInfo): string {
  const lines: string[] = []
  
  lines.push('## Contact Information')
  lines.push('')
  
  if (contact.phone) {
    lines.push(`- **Phone:** ${contact.phone}`)
  }
  if (contact.email) {
    lines.push(`- **Email:** ${contact.email}`)
  }
  if (contact.address || contact.city) {
    const addressParts = [
      contact.address,
      contact.city,
      contact.state,
      contact.postal_code,
      contact.country
    ].filter(Boolean)
    lines.push(`- **Address:** ${addressParts.join(', ')}`)
  }
  if (contact.hours) {
    lines.push(`- **Hours:** ${contact.hours}`)
  }

  return lines.join('\n')
}

function generateFAQSection(faq: LLMFAQItem[]): string {
  const lines: string[] = []
  
  lines.push('## Frequently Asked Questions')
  lines.push('')
  
  for (const item of faq) {
    lines.push(`### ${item.question}`)
    lines.push('')
    lines.push(item.answer)
    lines.push('')
  }

  return lines.join('\n').trim()
}

function generatePagesSection(pages: LLMPageSummary[], baseUrl: string): string {
  const lines: string[] = []
  
  lines.push('## Site Pages')
  lines.push('')
  
  for (const page of pages) {
    const url = page.path.startsWith('http') ? page.path : `${baseUrl}${page.path}`
    if (page.description) {
      lines.push(`- [${page.title}](${url}): ${page.description}`)
    } else {
      lines.push(`- [${page.title}](${url})`)
    }
  }

  return lines.join('\n')
}

export default generateLLMsTxt
