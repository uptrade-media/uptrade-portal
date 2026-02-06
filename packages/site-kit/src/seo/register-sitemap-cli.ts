#!/usr/bin/env node
/**
 * CLI script to register sitemap entries at build time
 * 
 * Usage:
 *   npx uptrade-register-sitemap
 *   npx uptrade-register-sitemap --auto-discover
 *   npx uptrade-register-sitemap --no-optimize  # Skip Signal AI meta optimization
 * 
 * Or in package.json:
 * {
 *   "scripts": {
 *     "postbuild": "uptrade-register-sitemap --auto-discover"
 *   }
 * }
 */

import { registerLocalSitemap } from './routing'

async function main() {
  const args = process.argv.slice(2)
  const autoDiscover = args.includes('--auto-discover') || args.includes('-a')
  const skipOptimize = args.includes('--no-optimize') || args.includes('--skip-optimize')
  
  console.log('[Uptrade] Registering sitemap entries...')
  
  try {
    const result = await registerLocalSitemap({
      autoDiscover,
      optimize_meta: !skipOptimize,
    })
    
    if (result.success) {
      console.log(`[Uptrade] ✓ Sitemap registered successfully`)
      console.log(`[Uptrade]   Created: ${result.created}`)
      console.log(`[Uptrade]   Updated: ${result.updated}`)
      if (result.removed !== undefined && result.removed > 0) {
        console.log(`[Uptrade]   Removed: ${result.removed}`)
      }
      if (result.meta_optimization?.triggered) {
        console.log(`[Uptrade] ✓ Signal AI meta optimization triggered for ${result.meta_optimization.pages_queued} pages`)
        console.log(`[Uptrade]   (Running in background - check Portal SEO module for results)`)
      }
      process.exit(0)
    } else {
      console.error('[Uptrade] ✗ Failed to register sitemap')
      process.exit(1)
    }
  } catch (error) {
    console.error('[Uptrade] ✗ Error:', error)
    process.exit(1)
  }
}

main()
