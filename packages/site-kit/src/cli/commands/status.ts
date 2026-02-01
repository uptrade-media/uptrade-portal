/**
 * Status Command - Show integration health and configuration
 * 
 * Checks:
 * - Environment variables
 * - API connectivity
 * - SiteKitProvider setup
 * - Module configurations
 */

import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs/promises'
import path from 'path'

interface StatusOptions {
  verbose?: boolean
}

interface HealthCheck {
  name: string
  status: 'ok' | 'warn' | 'error'
  message: string
  details?: string
}

export async function statusCommand(options: StatusOptions) {
  console.log('')
  console.log(chalk.bold('  Site-Kit Integration Status'))
  console.log('')

  const checks: HealthCheck[] = []

  // Check environment variables
  const envChecks = await checkEnvironment()
  checks.push(...envChecks)

  // Check API connectivity
  const apiCheck = await checkApiConnectivity()
  checks.push(apiCheck)

  // Check project configuration
  const configChecks = await checkProjectConfig()
  checks.push(...configChecks)

  // Check SiteKitProvider
  const providerCheck = await checkSiteKitProvider()
  checks.push(providerCheck)

  // Check sitemap
  const sitemapCheck = await checkSitemap()
  checks.push(sitemapCheck)

  // Display results
  console.log(chalk.bold('  Environment'))
  displayChecks(checks.filter(c => 
    ['UPTRADE_API_KEY', 'NEXT_PUBLIC_UPTRADE_PROJECT_ID', 'Supabase Config'].includes(c.name)
  ), options.verbose)
  console.log('')

  console.log(chalk.bold('  Connectivity'))
  displayChecks(checks.filter(c => c.name === 'Portal API'), options.verbose)
  console.log('')

  console.log(chalk.bold('  Configuration'))
  displayChecks(checks.filter(c => 
    ['package.json', 'SiteKitProvider', 'Sitemap'].includes(c.name)
  ), options.verbose)
  console.log('')

  // Summary
  const errors = checks.filter(c => c.status === 'error').length
  const warnings = checks.filter(c => c.status === 'warn').length
  const ok = checks.filter(c => c.status === 'ok').length

  if (errors > 0) {
    console.log(chalk.red(`  ✗ ${errors} error(s) found`))
    console.log(chalk.gray('    Run `uptrade-setup init` to fix configuration issues'))
  } else if (warnings > 0) {
    console.log(chalk.yellow(`  ⚠ ${warnings} warning(s)`))
    console.log(chalk.green(`  ✓ ${ok} checks passed`))
  } else {
    console.log(chalk.green(`  ✓ All ${ok} checks passed - Site-Kit is properly configured!`))
  }
  console.log('')
}

function displayChecks(checks: HealthCheck[], verbose?: boolean) {
  for (const check of checks) {
    const icon = check.status === 'ok' ? chalk.green('✓') :
                 check.status === 'warn' ? chalk.yellow('⚠') :
                 chalk.red('✗')
    
    console.log(`  ${icon} ${check.name}: ${check.message}`)
    
    if (verbose && check.details) {
      console.log(chalk.gray(`      ${check.details}`))
    }
  }
}

async function checkEnvironment(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []

  // Check UPTRADE_API_KEY
  const apiKey = process.env.UPTRADE_API_KEY
  if (apiKey) {
    const masked = apiKey.slice(0, 12) + '...' + apiKey.slice(-4)
    checks.push({
      name: 'UPTRADE_API_KEY',
      status: 'ok',
      message: 'Set',
      details: masked,
    })
  } else {
    checks.push({
      name: 'UPTRADE_API_KEY',
      status: 'error',
      message: 'Missing',
      details: 'Required for API operations. Run `uptrade-setup init` to configure.',
    })
  }

  // Check NEXT_PUBLIC_UPTRADE_PROJECT_ID
  const projectId = process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID
  if (projectId) {
    checks.push({
      name: 'NEXT_PUBLIC_UPTRADE_PROJECT_ID',
      status: 'ok',
      message: projectId.slice(0, 8) + '...',
    })
  } else {
    checks.push({
      name: 'NEXT_PUBLIC_UPTRADE_PROJECT_ID',
      status: 'error',
      message: 'Missing',
      details: 'Required for client-side features.',
    })
  }

  // Check Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseKey) {
    checks.push({
      name: 'Supabase Config',
      status: 'ok',
      message: 'Configured',
    })
  } else {
    checks.push({
      name: 'Supabase Config',
      status: 'warn',
      message: 'Missing',
      details: 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY not set',
    })
  }

  return checks
}

async function checkApiConnectivity(): Promise<HealthCheck> {
  const apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY

  if (!apiKey) {
    return {
      name: 'Portal API',
      status: 'error',
      message: 'Cannot test - no API key',
    }
  }

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      return {
        name: 'Portal API',
        status: 'ok',
        message: `Connected (${apiUrl})`,
      }
    } else {
      return {
        name: 'Portal API',
        status: 'warn',
        message: `HTTP ${response.status}`,
        details: `${apiUrl} returned ${response.status}`,
      }
    }
  } catch (error: any) {
    return {
      name: 'Portal API',
      status: 'error',
      message: 'Connection failed',
      details: error.message,
    }
  }
}

async function checkProjectConfig(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))

    const hasSiteKit = packageJson.dependencies?.['@uptrade/site-kit'] ||
                       packageJson.devDependencies?.['@uptrade/site-kit']

    if (hasSiteKit) {
      checks.push({
        name: 'package.json',
        status: 'ok',
        message: `@uptrade/site-kit ${hasSiteKit}`,
      })
    } else {
      checks.push({
        name: 'package.json',
        status: 'error',
        message: '@uptrade/site-kit not installed',
        details: 'Run: pnpm add @uptrade/site-kit',
      })
    }

    // Check for postbuild script
    const hasPostbuild = packageJson.scripts?.postbuild?.includes('uptrade')
    if (hasPostbuild) {
      checks.push({
        name: 'Sitemap Sync',
        status: 'ok',
        message: 'postbuild script configured',
      })
    }
  } catch {
    checks.push({
      name: 'package.json',
      status: 'error',
      message: 'Could not read package.json',
    })
  }

  return checks
}

async function checkSiteKitProvider(): Promise<HealthCheck> {
  const layoutPaths = [
    path.join(process.cwd(), 'app', 'layout.tsx'),
    path.join(process.cwd(), 'app', 'layout.jsx'),
    path.join(process.cwd(), 'src', 'app', 'layout.tsx'),
    path.join(process.cwd(), 'src', 'app', 'layout.jsx'),
  ]

  for (const layoutPath of layoutPaths) {
    try {
      const content = await fs.readFile(layoutPath, 'utf-8')
      if (content.includes('SiteKitProvider')) {
        return {
          name: 'SiteKitProvider',
          status: 'ok',
          message: 'Configured in layout',
        }
      }
    } catch {
      continue
    }
  }

  return {
    name: 'SiteKitProvider',
    status: 'warn',
    message: 'Not found in layout',
    details: 'Add <SiteKitProvider> to your root layout for full functionality',
  }
}

async function checkSitemap(): Promise<HealthCheck> {
  const sitemapPaths = [
    path.join(process.cwd(), 'app', 'sitemap.ts'),
    path.join(process.cwd(), 'app', 'sitemap.tsx'),
    path.join(process.cwd(), 'app', 'sitemap.js'),
    path.join(process.cwd(), 'src', 'app', 'sitemap.ts'),
    path.join(process.cwd(), 'src', 'app', 'sitemap.tsx'),
  ]

  for (const sitemapPath of sitemapPaths) {
    try {
      const content = await fs.readFile(sitemapPath, 'utf-8')
      if (content.includes('createSitemap') || content.includes('@uptrade/site-kit')) {
        return {
          name: 'Sitemap',
          status: 'ok',
          message: 'Using Site-Kit sitemap',
        }
      } else {
        return {
          name: 'Sitemap',
          status: 'warn',
          message: 'Custom sitemap (not managed)',
          details: 'Consider using createSitemap from @uptrade/site-kit/sitemap',
        }
      }
    } catch {
      continue
    }
  }

  return {
    name: 'Sitemap',
    status: 'warn',
    message: 'No sitemap.ts found',
    details: 'Create app/sitemap.ts for SEO',
  }
}
