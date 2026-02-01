/**
 * @uptrade/site-kit/llms - Next.js Route Handlers
 * 
 * Ready-to-use route handlers for /llms.txt and /llms-full.txt
 */

import { generateLLMsTxt, generateLLMsFullTxt } from './generateLLMsTxt'
import type { GenerateLLMSTxtOptions } from './types'

/**
 * Create a route handler for /llms.txt
 * 
 * Zero-config by default - uses NEXT_PUBLIC_UPTRADE_API_KEY from environment.
 * 
 * @example
 * ```ts
 * // app/llms.txt/route.ts (zero-config)
 * import { createLLMsTxtHandler } from '@uptrade/site-kit/llms'
 * 
 * export const GET = createLLMsTxtHandler()
 * ```
 * 
 * @example
 * ```ts
 * // With custom options
 * export const GET = createLLMsTxtHandler({
 *   includeServices: false
 * })
 * ```
 */
export function createLLMsTxtHandler(
  options: GenerateLLMSTxtOptions = {}
): () => Promise<Response> {
  return async function GET(): Promise<Response> {
    try {
      const { markdown, metadata } = await generateLLMsTxt(options)
      
      return new Response(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Generated-At': metadata.generated_at,
          'X-Sections': metadata.sections.join(','),
        },
      })
    } catch (error) {
      console.error('@uptrade/llms: Error generating llms.txt:', error)
      return new Response('# Error\n\nUnable to generate llms.txt content.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  }
}

/**
 * Create a route handler for /llms-full.txt
 * 
 * Zero-config by default - uses NEXT_PUBLIC_UPTRADE_API_KEY from environment.
 * 
 * @example
 * ```ts
 * // app/llms-full.txt/route.ts (zero-config)
 * import { createLLMsFullTxtHandler } from '@uptrade/site-kit/llms'
 * 
 * export const GET = createLLMsFullTxtHandler()
 * ```
 */
export function createLLMsFullTxtHandler(
  options: GenerateLLMSTxtOptions = {}
): () => Promise<Response> {
  return async function GET(): Promise<Response> {
    try {
      const { markdown, metadata } = await generateLLMsFullTxt(options)
      
      return new Response(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Generated-At': metadata.generated_at,
          'X-Sections': metadata.sections.join(','),
        },
      })
    } catch (error) {
      console.error('@uptrade/llms: Error generating llms-full.txt:', error)
      return new Response('# Error\n\nUnable to generate llms-full.txt content.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  }
}
