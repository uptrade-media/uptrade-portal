/**
 * @uptrade/site-kit CLI
 * 
 * Setup wizard for integrating Site-Kit into existing Next.js projects.
 * 
 * Usage:
 *   npx @uptrade/site-kit init
 *   npx uptrade-setup
 */

import { config } from 'dotenv'
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { initCommand } from './commands/init'
import { scanCommand } from './commands/scan'
import { migrateCommand } from './commands/migrate'
import { imagesCommand } from './commands/images'
import { locationsCommand } from './commands/locations'
import { faqsCommand } from './commands/faqs'
import { setupCommand } from './commands/setup'
import { statusCommand } from './commands/status'
import { syncCommand } from './commands/sync'
import { apiRoutesCommand } from './commands/api-routes'
import { installCommand } from './commands/install'
import { upgradeCommand } from './commands/upgrade'

// Load .env.local if it exists (for API keys)
config({ path: '.env.local' })
config({ path: '.env' })

const program = new Command()

program
  .name('uptrade-setup')
  .description('Setup wizard for @uptrade/site-kit')
  .version('1.0.0')

program
  .command('init')
  .description('Initialize Site-Kit in your Next.js project')
  .option('-k, --api-key <key>', 'Uptrade API key')
  .option('-p, --project <id>', 'Project ID')
  .option('--skip-scan', 'Skip codebase scanning')
  .option('--ui', 'Launch visual setup wizard instead of CLI')
  .action(initCommand)

program
  .command('scan')
  .description('Scan codebase for forms, metadata, widgets, schemas, FAQs, analytics, and images')
  .option('-d, --dir <path>', 'Directory to scan', '.')
  .option('--forms', 'Only scan for forms')
  .option('--meta', 'Only scan for metadata')
  .option('--widgets', 'Only scan for widgets')
  .option('--schemas', 'Only scan for schema markup')
  .option('--faqs', 'Only scan for FAQ sections')
  .option('--analytics', 'Only scan for analytics scripts')
  .option('--images', 'Only scan for images')
  .option('--sitemaps', 'Only scan for sitemaps')
  .action(scanCommand)

program
  .command('migrate')
  .description('Migrate detected components to Site-Kit')
  .option('--dry-run', 'Show changes without applying')
  .option('-f, --file <path>', 'Migrate specific file')
  .option('--images', 'Also upload and migrate images (will prompt if not set)')
  .option('--no-images', 'Skip image migration entirely')
  .action(migrateCommand)

program
  .command('images <subcommand>')
  .description('Manage images: scan, upload, migrate, all (combined)')
  .option('-d, --dir <path>', 'Directory to scan', '.')
  .option('--dry-run', 'Show changes without applying')
  .option('--folder <path>', 'Target folder in Files module')
  .option('--category <name>', 'File category (website, blog, etc.)')
  .option('--skip-critical', 'Keep hero/logo/header images local for PageSpeed (LCP)', true)
  .option('--no-skip-critical', 'Upload all images including critical ones')
  .action(imagesCommand)

program
  .command('locations <subcommand> [arg]')
  .description('Manage location pages: template, upload, generate')
  .option('-n, --name <name>', 'Template name')
  .option('-t, --template <name>', 'Template to use')
  .option('--type <type>', 'Page type: area-index, location-hub, service-location')
  .option('-l, --locations <cities...>', 'List of cities (e.g., "Seattle, WA")')
  .option('--locations-file <path>', 'JSON file with locations array')
  .option('--dry-run', 'Show changes without applying')
  .option('--enhance', 'Use Signal AI to enhance extracted template')
  .action(locationsCommand)

program
  .command('faqs <subcommand>')
  .description('Sync ManagedFAQ paths to Portal so they show in SEO Managed FAQs')
  .option('--dry-run', 'Show what would be synced without creating sections')
  .action((subcommand: string, options: { dryRun?: boolean }) => faqsCommand(subcommand, options))

program
  .command('setup')
  .description('🚀 AI-powered comprehensive SEO setup (FAQs, metadata, schema)')
  .option('--dry-run', 'Preview what would be created')
  .option('--faqs-only', 'Only extract and setup FAQs')
  .option('--schema-only', 'Only generate schema markup')
  .option('--metadata-only', 'Only generate metadata')
  .option('-v, --verbose', 'Show detailed output')
  .action(setupCommand)

program
  .command('status')
  .description('Show Site-Kit integration status and health')
  .option('-v, --verbose', 'Show detailed output')
  .action(statusCommand)

program
  .command('sync')
  .description('Sync local content to Portal (pages, blog, schemas)')
  .option('--pages', 'Sync pages to SEO module')
  .option('--blog', 'Sync blog posts to Blog module')
  .option('--schemas', 'Sync schema markup to SEO module')
  .option('--dry-run', 'Show changes without syncing')
  .action(syncCommand)

program
  .command('api-routes')
  .description('Generate _uptrade API proxy routes')
  .option('--dry-run', 'Show changes without applying')
  .option('--force', 'Overwrite existing routes')
  .action(apiRoutesCommand)

program
  .command('install')
  .description('Install @uptrade/site-kit in current project')
  .option('-D, --dev', 'Install as dev dependency')
  .option('--dry-run', 'Show command without running')
  .action(installCommand)

program
  .command('upgrade')
  .description('Upgrade @uptrade/site-kit to latest version')
  .option('-v, --version <version>', 'Target version (default: latest)')
  .option('--dry-run', 'Show command without running')
  .action(upgradeCommand)

// Default to init if no command specified
if (process.argv.length === 2) {
  process.argv.push('init')
}

program.parse()
