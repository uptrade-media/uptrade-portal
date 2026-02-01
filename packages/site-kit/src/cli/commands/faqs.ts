/**
 * FAQs Command - Extract and sync FAQs from codebase to Portal
 *
 * Subcommands:
 *   extract  - AI-powered extraction of hardcoded FAQs, uploads to Portal
 *   sync     - Sync ManagedFAQ component paths to Portal (for existing migrations)
 *
 * Usage:
 *   npx uptrade-setup faqs extract           # AI extracts FAQs from codebase
 *   npx uptrade-setup faqs extract --dry-run # Preview what would be extracted
 *   npx uptrade-setup faqs sync              # Register ManagedFAQ paths
 */

import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { scanForManagedFAQPaths, scanCodebase } from '../scanner'

const API_URL = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'

interface Config {
  projectId: string
  apiKey: string
}

interface FAQItem {
  question: string
  answer: string
}

interface ExtractedFAQ {
  path: string
  title?: string
  items: FAQItem[]
  sourceFile: string
}

async function loadConfig(): Promise<Config | null> {
  const configPath = path.join('.uptrade', 'config.json')
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      return {
        projectId: config.projectId || config.project_id,
        apiKey: config.apiKey || config.api_key,
      }
    } catch {
      return null
    }
  }
  const projectId = process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID || process.env.UPTRADE_PROJECT_ID
  const apiKey = process.env.UPTRADE_API_KEY
  if (projectId && apiKey) return { projectId, apiKey }
  return null
}

export async function faqsCommand(subcommand: string, options: { dryRun?: boolean }) {
  console.log('')

  const config = await loadConfig()
  if (!config?.projectId || !config?.apiKey) {
    console.log(chalk.red('  ✗ Not configured. Run `npx uptrade-setup init` first.'))
    console.log(chalk.gray('    Set NEXT_PUBLIC_UPTRADE_PROJECT_ID and UPTRADE_API_KEY, or use .uptrade/config.json'))
    console.log('')
    return
  }

  switch (subcommand) {
    case 'extract':
      await extractCommand(options, config)
      break
    case 'sync':
      await syncCommand(options, config)
      break
    default:
      console.log(chalk.bold('  FAQ Management'))
      console.log('')
      console.log(chalk.yellow('  Available subcommands:'))
      console.log('')
      console.log(chalk.white('    extract') + chalk.gray('   AI-powered extraction of hardcoded FAQs → uploads to Portal'))
      console.log(chalk.white('    sync') + chalk.gray('      Register ManagedFAQ component paths in Portal'))
      console.log('')
      console.log(chalk.gray('  Options:'))
      console.log(chalk.gray('    --dry-run    Preview changes without making them'))
      console.log('')
      console.log(chalk.gray('  Example:'))
      console.log(chalk.gray('    npx uptrade-setup faqs extract'))
      console.log(chalk.gray('    npx uptrade-setup faqs extract --dry-run'))
      console.log('')
  }
}

// ============================================
// Extract Command - AI-powered FAQ extraction
// ============================================

async function extractCommand(options: { dryRun?: boolean }, config: Config) {
  console.log(chalk.bold('  FAQ Extract – AI-powered extraction from codebase'))
  console.log('')

  // Step 1: Scan for FAQ components
  const scanSpinner = ora('Scanning codebase for FAQ sections...').start()
  let scanResults
  try {
    scanResults = await scanCodebase(process.cwd())
  } catch (e) {
    scanSpinner.fail('Scan failed')
    console.log(chalk.red(`  ${(e as Error).message}`))
    return
  }

  const faqSections = scanResults.faqs || []
  if (faqSections.length === 0) {
    scanSpinner.warn('No FAQ sections found in codebase')
    console.log('')
    console.log(chalk.gray('  Looking for: FAQSection, Accordion, details/summary elements, FAQ arrays'))
    console.log('')
    return
  }

  scanSpinner.succeed(`Found ${faqSections.length} FAQ section(s)`)

  // Step 2: Gather context for each FAQ section
  const contextSpinner = ora('Gathering FAQ content and context...').start()
  const faqContexts: Array<{
    filePath: string
    pagePath: string
    content: string
    imports: string[]
    importedFiles: Record<string, string>
  }> = []

  for (const faq of faqSections) {
    try {
      const fullPath = path.resolve(process.cwd(), faq.filePath)
      const content = await fs.readFile(fullPath, 'utf-8')

      // Determine page path from file path
      let pagePath = faq.filePath
        .replace(/^app\//, '/')
        .replace(/^src\/app\//, '/')
        .replace(/\/page\.(tsx?|jsx?)$/, '')
        .replace(/\[([^\]]+)\]/g, ':$1')
      if (pagePath === '' || pagePath === '/page') pagePath = '/'

      // Find imports that might contain FAQ data
      const importMatches = content.matchAll(/import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g)
      const imports: string[] = []
      const importedFiles: Record<string, string> = {}

      for (const match of importMatches) {
        const importPath = match[1]
        // Look for FAQ-related imports
        if (importPath.toLowerCase().includes('faq') || 
            importPath.includes('@/data') || 
            importPath.includes('./data') ||
            importPath.includes('../data')) {
          imports.push(importPath)

          // Try to resolve and read the imported file
          let resolvedPath = importPath
          if (importPath.startsWith('@/')) {
            resolvedPath = importPath.replace('@/', './')
          } else if (importPath.startsWith('.')) {
            resolvedPath = path.resolve(path.dirname(fullPath), importPath)
          }

          // Try common extensions
          const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.json']
          for (const ext of extensions) {
            const tryPath = resolvedPath + ext
            if (existsSync(tryPath)) {
              try {
                importedFiles[importPath] = await fs.readFile(tryPath, 'utf-8')
              } catch {
                // Skip if can't read
              }
              break
            }
          }
        }
      }

      faqContexts.push({
        filePath: faq.filePath,
        pagePath,
        content,
        imports,
        importedFiles,
      })
    } catch (e) {
      // Skip files that can't be read
    }
  }

  contextSpinner.succeed(`Gathered context for ${faqContexts.length} FAQ section(s)`)

  if (options.dryRun) {
    console.log('')
    console.log(chalk.yellow('  [DRY RUN] Would send to AI for extraction:'))
    for (const ctx of faqContexts) {
      console.log('')
      console.log(chalk.white(`    ${ctx.filePath}`))
      console.log(chalk.gray(`      Page path: ${ctx.pagePath}`))
      if (ctx.imports.length > 0) {
        console.log(chalk.gray(`      Imports: ${ctx.imports.join(', ')}`))
      }
      if (Object.keys(ctx.importedFiles).length > 0) {
        console.log(chalk.gray(`      Resolved files: ${Object.keys(ctx.importedFiles).join(', ')}`))
      }
    }
    console.log('')
    return
  }

  // Step 3: Send to Portal API for AI extraction
  const extractSpinner = ora('Extracting FAQs via AI...').start()

  try {
    const response = await fetch(`${API_URL}/seo/managed/faqs/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        project_id: config.projectId,
        files: faqContexts.map(ctx => ({
          file_path: ctx.filePath,
          page_path: ctx.pagePath,
          content: ctx.content,
          imported_files: ctx.importedFiles,
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    const extractedFaqs: ExtractedFAQ[] = result.faqs || []

    extractSpinner.succeed(`Extracted ${extractedFaqs.length} FAQ section(s)`)

    if (extractedFaqs.length === 0) {
      console.log('')
      console.log(chalk.yellow('  No FAQs could be extracted from the scanned files.'))
      console.log(chalk.gray('  This might happen if FAQs are dynamically generated or in an unsupported format.'))
      console.log('')
      return
    }

    // Step 4: Upload each FAQ section to Portal
    const uploadSpinner = ora('Uploading FAQs to Portal...').start()
    let uploaded = 0
    let failed = 0

    for (const faq of extractedFaqs) {
      try {
        const res = await fetch(`${API_URL}/seo/managed/faqs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            project_id: config.projectId,
            path: faq.path,
            title: faq.title || 'Frequently Asked Questions',
            items: faq.items.map((item, index) => ({
              id: `faq-${index + 1}`,
              question: item.question,
              answer: item.answer,
              order: index,
              is_visible: true,
            })),
            include_schema: true,
            is_published: true,
          }),
        })

        if (res.ok) {
          uploaded++
          console.log(chalk.green(`  ✓ ${faq.path}`) + chalk.gray(` (${faq.items.length} items)`))
        } else if (res.status === 409 || res.status === 400) {
          // Already exists - try to update
          const updateRes = await fetch(`${API_URL}/seo/managed/faqs/by-path`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              project_id: config.projectId,
              path: faq.path,
              title: faq.title || 'Frequently Asked Questions',
              items: faq.items.map((item, index) => ({
                id: `faq-${index + 1}`,
                question: item.question,
                answer: item.answer,
                order: index,
                is_visible: true,
              })),
              include_schema: true,
              is_published: true,
            }),
          })
          if (updateRes.ok) {
            uploaded++
            console.log(chalk.blue(`  ↻ ${faq.path}`) + chalk.gray(` (updated, ${faq.items.length} items)`))
          } else {
            failed++
            console.log(chalk.red(`  ✗ ${faq.path}: ${await updateRes.text()}`))
          }
        } else {
          failed++
          console.log(chalk.red(`  ✗ ${faq.path}: ${await res.text()}`))
        }
      } catch (e) {
        failed++
        console.log(chalk.red(`  ✗ ${faq.path}: ${(e as Error).message}`))
      }
    }

    if (failed > 0) {
      uploadSpinner.fail(`Uploaded ${uploaded}, failed ${failed}`)
    } else {
      uploadSpinner.succeed(`Uploaded ${uploaded} FAQ section(s) to Portal`)
    }

    console.log('')
    console.log(chalk.green('  ✓ FAQs are now managed in Portal → SEO → Managed FAQs'))
    console.log(chalk.gray('    The FAQSection component will automatically fetch from Portal.'))
    console.log('')

  } catch (e) {
    extractSpinner.fail('AI extraction failed')
    console.log(chalk.red(`  ${(e as Error).message}`))
    console.log('')
    console.log(chalk.gray('  Make sure the Portal API is running and accessible.'))
    console.log('')
  }
}

// ============================================
// Sync Command - Register ManagedFAQ paths
// ============================================

async function syncCommand(options: { dryRun?: boolean }, config: Config) {
  console.log(chalk.bold('  FAQ Sync – Register ManagedFAQ paths in Portal'))
  console.log('')

  const spinner = ora('Scanning codebase for ManagedFAQ usage...').start()
  let codePaths: string[]
  try {
    codePaths = await scanForManagedFAQPaths(process.cwd())
  } catch (e) {
    spinner.fail('Scan failed')
    console.log(chalk.red(`  ${(e as Error).message}`))
    console.log('')
    return
  }

  if (codePaths.length === 0) {
    spinner.warn('No ManagedFAQ components found')
    console.log('')
    console.log(chalk.gray('  Add <ManagedFAQ projectId={...} path="/your-page" /> to your pages, then run:'))
    console.log(chalk.gray('    npx uptrade-setup migrate  (to add the component)'))
    console.log(chalk.gray('    npx uptrade-setup faqs sync  (to register paths in Portal)'))
    console.log('')
    return
  }

  spinner.succeed(`Found ${codePaths.length} ManagedFAQ path(s): ${codePaths.join(', ')}`)

  if (options.dryRun) {
    console.log('')
    console.log(chalk.yellow('  [DRY RUN] Would ensure these paths exist in Portal SEO Managed FAQs:'))
    codePaths.forEach((p) => console.log(chalk.gray(`    • ${p}`)))
    console.log('')
    return
  }

  const listSpinner = ora('Fetching existing FAQ sections from Portal...').start()
  let existing: Array<{ path: string }> = []
  try {
    const res = await fetch(`${API_URL}/seo/managed/faqs/project/${config.projectId}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    if (!res.ok) {
      throw new Error(await res.text())
    }
    const data = await res.json()
    existing = Array.isArray(data) ? data : data?.sections ?? data?.data ?? []
  } catch (e) {
    listSpinner.fail('Failed to fetch existing FAQs')
    console.log(chalk.red(`  ${(e as Error).message}`))
    console.log('')
    return
  }
  listSpinner.succeed(`Found ${existing.length} existing FAQ section(s) in Portal`)

  const existingPaths = new Set((existing as Array<{ path?: string }>).map((s) => (s.path && s.path.startsWith('/') ? s.path : `/${s.path || ''}`)))
  const toCreate = codePaths.filter((p) => !existingPaths.has(p))

  if (toCreate.length === 0) {
    console.log('')
    console.log(chalk.green('  ✓ All ManagedFAQ paths are already registered in Portal.'))
    console.log(chalk.gray('    Open SEO → Managed FAQs in the Portal to edit content.'))
    console.log('')
    return
  }

  const createSpinner = ora(`Creating ${toCreate.length} FAQ section(s) in Portal...`).start()
  let created = 0
  let failed = 0
  for (const p of toCreate) {
    try {
      const res = await fetch(`${API_URL}/seo/managed/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          project_id: config.projectId,
          path: p,
          items: [],
          include_schema: true,
          is_published: false,
        }),
      })
      if (res.ok) {
        created++
      } else if (res.status === 409 || res.status === 400) {
        // Conflict or duplicate - treat as already exists
        created++
      } else {
        failed++
        console.log(chalk.red(`  Failed to create ${p}: ${await res.text()}`))
      }
    } catch (e) {
      failed++
      console.log(chalk.red(`  Failed to create ${p}: ${(e as Error).message}`))
    }
  }

  if (failed > 0) {
    createSpinner.fail(`Created ${created}, failed ${failed}`)
  } else {
    createSpinner.succeed(`Created ${created} FAQ section(s) in Portal`)
  }
  console.log('')
  console.log(chalk.green('  ✓ Managed FAQs are now visible in Portal under SEO → Managed FAQs.'))
  console.log(chalk.gray('    Add questions and answers there; they will appear on your site.'))
  console.log('')
}
