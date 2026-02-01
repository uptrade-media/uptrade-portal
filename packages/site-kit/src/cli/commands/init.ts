/**
 * Init Command - Main setup wizard
 */

import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import fs from 'fs/promises'
import path from 'path'
import { scanCodebase } from '../scanner'
import { migrateFiles } from '../migrator'
import { generateProvider, generateEnvFile } from '../generators'
import { 
  authenticateWithUptrade, 
  authenticateWithApiKey, 
  fetchOrganizations, 
  fetchProjects, 
  createProject,
  generateApiKey 
} from '../api/uptrade'

interface InitOptions {
  apiKey?: string
  project?: string
  skipScan?: boolean
  ui?: boolean
}

export async function initCommand(options: InitOptions) {
  console.log('')
  console.log(chalk.bold.green('  ╭──────────────────────────────────────╮'))
  console.log(chalk.bold.green('  │                                      │'))
  console.log(chalk.bold.green('  │   Uptrade Site-Kit Setup             │'))
  console.log(chalk.bold.green('  │                                      │'))
  console.log(chalk.bold.green('  ╰──────────────────────────────────────╯'))
  console.log('')

  // Check if we're in a Next.js project
  const isNextProject = await checkNextJsProject()
  if (!isNextProject) {
    console.log(chalk.red('  ✗ This doesn\'t appear to be a Next.js project.'))
    console.log(chalk.gray('    Site-Kit currently supports Next.js 13+ with App Router.'))
    console.log('')
    process.exit(1)
  }

  // If --ui flag, launch dev server setup
  if (options.ui) {
    await launchVisualSetup()
    return
  }

  // Step 1: Authentication
  const spinner = ora('Connecting to Uptrade...').start()
  
  let apiKey = options.apiKey || process.env.UPTRADE_API_KEY
  let auth: { 
    accessToken: string
    userId: string
    email: string
    projectId?: string
    projectName?: string
    orgId?: string
    orgName?: string
    isApiKey?: boolean
  }

  if (apiKey) {
    // Use API key authentication
    try {
      auth = await authenticateWithApiKey(apiKey)
      spinner.succeed(`Authenticated as ${chalk.cyan(auth.email)}`)
    } catch (error: any) {
      spinner.fail('Authentication failed')
      console.log(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  } else {
    // Use OAuth browser flow
    spinner.text = 'Opening browser for authentication...'
    try {
      auth = await authenticateWithUptrade()
      spinner.succeed(`Authenticated as ${chalk.cyan(auth.email)}`)
      apiKey = auth.accessToken
    } catch (error: any) {
      spinner.fail('Authentication failed')
      console.log(chalk.red(`  ${error.message}`))
      process.exit(1)
    }
  }

  let selectedProjectId: string
  let projectName: string = ''

  // If using API key, we already have the project info
  if (auth.isApiKey && auth.projectId) {
    selectedProjectId = auth.projectId
    projectName = auth.projectName || 'Unknown Project'
    console.log(chalk.gray(`  Using project: ${chalk.cyan(projectName)}`))
  } else {
    // Step 2: Select Organization (OAuth flow only)
    const orgs = await fetchOrganizations(auth.accessToken)
  
    const { orgId } = await inquirer.prompt([{
      type: 'list',
      name: 'orgId',
      message: 'Select organization:',
      choices: [
        ...orgs.map((o: any) => ({ name: o.name, value: o.id })),
        { name: chalk.gray('+ Create new organization'), value: 'new' }
      ]
    }])

    let selectedOrgId = orgId
    if (orgId === 'new') {
      const { orgName } = await inquirer.prompt([{
        type: 'input',
        name: 'orgName',
        message: 'New organization name:',
        validate: (input) => input.length > 0 || 'Name is required'
      }])
      // Create org logic here
      console.log(chalk.yellow('  (Org creation coming soon - please create in Portal first)'))
      process.exit(1)
    }

    // Step 3: Select or Create Project
    const projects = await fetchProjects(auth.accessToken, selectedOrgId)
  
    const { projectId } = await inquirer.prompt([{
      type: 'list',
      name: 'projectId',
      message: 'Select project:',
      choices: [
        { name: chalk.gray('+ Create new project'), value: 'new' },
        ...projects.map((p: any) => ({ name: p.name, value: p.id })),
      ]
    }])

    selectedProjectId = projectId

    if (projectId === 'new') {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: path.basename(process.cwd()),
          validate: (input) => input.length > 0 || 'Name is required'
        },
        {
          type: 'input',
          name: 'domain',
          message: 'Project domain (e.g., https://example.com):',
          validate: (input) => {
            if (!input) return true // Optional
            return input.startsWith('http') || 'Must start with http:// or https://'
          }
        }
      ])
    
      const createSpinner = ora('Creating project...').start()
      try {
        const project = await createProject(auth.accessToken, selectedOrgId, {
          name: answers.name,
          domain: answers.domain || ''
        })
        selectedProjectId = project.id
        projectName = project.name
        createSpinner.succeed(`Created project: ${chalk.cyan(project.name)}`)
      } catch (error: any) {
        createSpinner.fail('Failed to create project')
        console.log(chalk.red(`  ${error.message}`))
        process.exit(1)
      }
    } else {
      const project = projects.find((p: any) => p.id === projectId)
      projectName = project?.name || ''
    }
  }

  // Step 4: Scan Codebase
  if (!options.skipScan) {
    console.log('')
    console.log(chalk.bold('  Scanning codebase...'))
    
    const scanSpinner = ora('Looking for forms, metadata, and widgets...').start()
    const scanResults = await scanCodebase(process.cwd())
    scanSpinner.stop()

    console.log('')
    console.log(chalk.bold('  Found:'))
    console.log(`  📝 Forms: ${chalk.cyan(scanResults.forms.length)}`)
    scanResults.forms.forEach(f => {
      console.log(chalk.gray(`     └─ ${f.filePath} (${f.fields.length} fields)`))
    })
    
    console.log(`  🏷️  Meta tags: ${chalk.cyan(scanResults.metadata.length)} pages`)
    console.log(`  💬 Widgets: ${chalk.cyan(scanResults.widgets.length)}`)
    console.log('')

    if (scanResults.forms.length > 0 || scanResults.widgets.length > 0) {
      const { migrate } = await inquirer.prompt([{
        type: 'confirm',
        name: 'migrate',
        message: 'Migrate detected components to Site-Kit?',
        default: true
      }])

      if (migrate) {
        const migrateSpinner = ora('Migrating components...').start()
        const migrations = await migrateFiles(scanResults, {
          projectId: selectedProjectId,
          apiKey: apiKey!
        })
        migrateSpinner.succeed(`Migrated ${migrations.length} files`)
        
        migrations.forEach(m => {
          console.log(chalk.gray(`  ✓ ${m.filePath}`))
        })
      }
    }
  }

  // Step 5: Generate Provider & Env
  console.log('')
  const setupSpinner = ora('Setting up Site-Kit...').start()

  // Supabase config (public keys)
  const SUPABASE_URL = 'https://mwcjtnoqxolplwpkxnfe.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Y2p0bm9xeG9scGx3cGt4bmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5MTQxMTUsImV4cCI6MjAxNTQ5MDExNX0.9vBVpQTqhCQmNk-I3dqQKpH0Xyq1i1_E7Dxv3zJQKdU'

  try {
    // Generate API key for the project if we used OAuth
    let projectApiKey = apiKey
    if (!options.apiKey && !process.env.UPTRADE_API_KEY) {
      const keySpinner = ora('Generating API key...').start()
      try {
        projectApiKey = await generateApiKey(auth.accessToken, selectedProjectId)
        keySpinner.succeed('Generated API key')
      } catch {
        keySpinner.warn('Could not generate API key - you may need to create one in Portal')
        projectApiKey = 'your-api-key-here'
      }
    }

    // Generate .env.local
    await generateEnvFile({
      projectId: selectedProjectId,
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      apiKey: projectApiKey!
    })

    // Add SiteKitProvider to layout
    await generateProvider({
      projectId: selectedProjectId,
    })

    setupSpinner.succeed('Site-Kit configured')
  } catch (error: any) {
    setupSpinner.fail('Setup failed')
    console.log(chalk.red(`  ${error.message}`))
    process.exit(1)
  }

  // Done!
  console.log('')
  console.log(chalk.bold.green('  ╭──────────────────────────────────────╮'))
  console.log(chalk.bold.green('  │                                      │'))
  console.log(chalk.bold.green('  │   🎉 Setup complete!                 │'))
  console.log(chalk.bold.green('  │                                      │'))
  console.log(chalk.bold.green('  │   Run `pnpm dev` to start.           │'))
  console.log(chalk.bold.green('  │   Visit portal.uptrademedia.com      │'))
  console.log(chalk.bold.green('  │   to manage your content.            │'))
  console.log(chalk.bold.green('  │                                      │'))
  console.log(chalk.bold.green('  ╰──────────────────────────────────────╯'))
  console.log('')
}

async function checkNextJsProject(): Promise<boolean> {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8')
    )
    return !!(packageJson.dependencies?.next || packageJson.devDependencies?.next)
  } catch {
    return false
  }
}

async function launchVisualSetup() {
  console.log(chalk.cyan('  Launching visual setup wizard...'))
  console.log('')
  console.log(chalk.gray('  The setup wizard will open in your browser.'))
  console.log(chalk.gray('  Make sure your dev server is running.'))
  console.log('')
  
  // This would inject the setup route and open browser
  // For now, just show instructions
  console.log(chalk.yellow('  Add this to your layout.tsx temporarily:'))
  console.log('')
  console.log(chalk.gray('  import { UptradeSetup } from \'@uptrade/site-kit/setup\''))
  console.log('')
  console.log(chalk.gray('  // In your layout:'))
  console.log(chalk.gray('  {process.env.NODE_ENV === \'development\' && <UptradeSetup />}'))
  console.log('')
  console.log(chalk.gray('  Then visit: http://localhost:3000/_uptrade/setup'))
  console.log('')
}
