/**
 * Sync Command - Sync local content to Portal
 * 
 * Syncs:
 * - Pages → SEO module (via sitemap registration)
 * - Blog posts → Blog module (optional)
 * - Schema markup → SEO module (optional)
 */

import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs/promises'
import path from 'path'
import { readdirSync, statSync, existsSync } from 'fs'

interface SyncOptions {
  pages?: boolean
  blog?: boolean
  schemas?: boolean
  dryRun?: boolean
}

// Page file patterns
const PAGE_FILES = ['page.tsx', 'page.jsx', 'page.js', 'page.ts']

// Folders to ignore
const IGNORED_FOLDERS = ['api', 'admin', '_uptrade', 'offline', 'node_modules', '.next']

export async function syncCommand(options: SyncOptions) {
  console.log('')
  console.log(chalk.bold('  Site-Kit Sync'))
  console.log('')

  const apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY

  if (!apiKey) {
    console.log(chalk.red('  ✗ Missing UPTRADE_API_KEY'))
    console.log(chalk.gray('    Run `uptrade-setup init` to configure.'))
    console.log('')
    process.exit(1)
  }

  // Default to syncing pages if no specific option given
  const syncPages = options.pages !== false
  const syncBlog = options.blog === true
  const syncSchemas = options.schemas === true

  if (options.dryRun) {
    console.log(chalk.yellow('  Running in dry-run mode - no changes will be made'))
    console.log('')
  }

  // Sync pages
  if (syncPages) {
    await syncPagesToPortal(apiUrl, apiKey, options.dryRun)
  }

  // Sync blog posts (if requested)
  if (syncBlog) {
    await syncBlogToPortal(apiUrl, apiKey, options.dryRun)
  }

  // Sync schemas (if requested)
  if (syncSchemas) {
    await syncSchemasToPortal(apiUrl, apiKey, options.dryRun)
  }

  console.log('')
}

// ============================================
// Page Sync
// ============================================

async function syncPagesToPortal(apiUrl: string, apiKey: string, dryRun?: boolean) {
  const spinner = ora('Discovering pages...').start()

  // Find app directory
  const appDir = findAppDir()
  if (!appDir) {
    spinner.fail('Could not find app directory')
    return
  }

  // Discover all pages
  const pages = discoverPages(appDir)
  spinner.succeed(`Found ${pages.length} pages`)

  // Show pages
  console.log(chalk.bold('  Pages to sync:'))
  for (const page of pages.slice(0, 10)) {
    console.log(chalk.gray(`    ${page.path} (priority: ${page.priority})`))
  }
  if (pages.length > 10) {
    console.log(chalk.gray(`    ... and ${pages.length - 10} more`))
  }
  console.log('')

  if (dryRun) {
    console.log(chalk.yellow(`  [DRY RUN] Would sync ${pages.length} pages`))
    return
  }

  // Sync to Portal
  const syncSpinner = ora('Syncing to Portal...').start()
  
  try {
    const response = await fetch(`${apiUrl}/api/public/seo/register-sitemap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        entries: pages.map(p => ({
          path: p.path,
          priority: p.priority,
          changefreq: p.changeFreq,
        })),
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    syncSpinner.succeed(`Synced pages: ${result.created || 0} created, ${result.updated || 0} updated`)
  } catch (error: any) {
    syncSpinner.fail(`Sync failed: ${error.message}`)
  }
}

function findAppDir(): string | null {
  const candidates = [
    path.join(process.cwd(), 'app'),
    path.join(process.cwd(), 'src', 'app'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

interface PageInfo {
  path: string
  priority: number
  changeFreq: string
}

function discoverPages(appDir: string, currentPath: string = '', pages: PageInfo[] = []): PageInfo[] {
  const fullPath = path.join(appDir, currentPath)

  if (!existsSync(fullPath)) {
    return pages
  }

  const entries = readdirSync(fullPath)

  // Check if this directory has a page file
  const hasPage = entries.some(entry => PAGE_FILES.includes(entry))

  if (hasPage) {
    let urlPath = '/' + currentPath
    // Handle route groups
    urlPath = urlPath.replace(/\/\([^)]+\)/g, '')
    urlPath = urlPath.replace(/\/+/g, '/')
    if (urlPath !== '/' && urlPath.endsWith('/')) {
      urlPath = urlPath.slice(0, -1)
    }

    // Calculate priority based on depth
    const depth = urlPath.split('/').filter(Boolean).length
    const priority = urlPath === '/' ? 1.0 :
                     depth === 1 ? 0.8 :
                     depth === 2 ? 0.6 : 0.5

    pages.push({
      path: urlPath,
      priority,
      changeFreq: 'weekly',
    })
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry)
    const stat = statSync(entryPath)

    if (stat.isDirectory()) {
      const folderName = entry.toLowerCase()
      if (IGNORED_FOLDERS.some(ignored => folderName.includes(ignored))) {
        continue
      }
      if (entry.startsWith('[') && entry.endsWith(']')) {
        continue // Skip dynamic routes
      }
      if (entry.startsWith('_')) {
        continue // Skip private folders
      }

      discoverPages(appDir, path.join(currentPath, entry), pages)
    }
  }

  return pages
}

// ============================================
// Blog Sync (placeholder)
// ============================================

async function syncBlogToPortal(apiUrl: string, apiKey: string, dryRun?: boolean) {
  console.log(chalk.yellow('  Blog sync coming soon'))
  console.log(chalk.gray('    For now, manage blog posts in Portal → SEO → Blog'))
}

// ============================================
// Schema Sync (placeholder)
// ============================================

async function syncSchemasToPortal(apiUrl: string, apiKey: string, dryRun?: boolean) {
  console.log(chalk.yellow('  Schema sync coming soon'))
  console.log(chalk.gray('    For now, manage schemas in Portal → SEO → Schema Markup'))
}
