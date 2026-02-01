/**
 * Upgrade Command - Upgrade @uptrade/site-kit to latest version
 */

import chalk from 'chalk'
import ora from 'ora'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

interface UpgradeOptions {
  version?: string
  dryRun?: boolean
}

export async function upgradeCommand(options: UpgradeOptions) {
  console.log('')
  console.log(chalk.bold('  Upgrade @uptrade/site-kit'))
  console.log('')

  // Check current version
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.log(chalk.red('  ✗ No package.json found'))
    console.log('')
    process.exit(1)
  }

  let currentVersion = 'unknown'
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps['@uptrade/site-kit']) {
      currentVersion = deps['@uptrade/site-kit'].replace(/[\^~]/, '')
    }
  } catch {
    // Ignore
  }

  console.log(chalk.gray(`  Current version: ${currentVersion}`))

  // Detect package manager
  const pm = detectPackageManager()
  const targetVersion = options.version || 'latest'

  const upgradeCmd = pm === 'pnpm' ? 'pnpm add' :
                     pm === 'yarn' ? 'yarn add' :
                     'npm install'

  const fullCmd = `${upgradeCmd} @uptrade/site-kit@${targetVersion}`

  console.log('')
  console.log(chalk.gray(`  $ ${fullCmd}`))
  console.log('')

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would run the above command'))
    console.log('')
    return
  }

  const spinner = ora('Upgrading...').start()

  try {
    const result = execSync(fullCmd, { 
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    spinner.succeed(`Upgraded @uptrade/site-kit to ${targetVersion}`)
    console.log('')

    // Check for breaking changes or migration notes
    console.log(chalk.gray('  Run `uptrade-setup status` to check integration health'))
    console.log('')
  } catch (error: any) {
    spinner.fail('Upgrade failed')
    console.log(chalk.red(`  ${error.message}`))
    console.log('')
  }
}

function detectPackageManager(): 'pnpm' | 'yarn' | 'npm' {
  if (existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(path.join(process.cwd(), 'yarn.lock'))) {
    return 'yarn'
  }
  return 'npm'
}
