#!/usr/bin/env node

/**
 * AUREON ERP - Advanced Simulation Runner
 * 
 * Usage:
 *   npm run simulate -- --scenario=venda-completa-happy
 *   npm run simulate -- --suite=sales --parallel=5
 *   npm run simulate -- --scenario=all --report=html --seed=123
 *   npm run simulate -- --dry-run --suite=critical
 * 
 * Flags:
 *   --scenario=<id>         Run specific scenario by ID
 *   --suite=<tag>           Run all scenarios with tag (sales, stock, critical, etc)
 *   --parallel=<N>          Run N virtual users concurrently
 *   --seed=<int>            Seed for deterministic RNG
 *   --report=<json|html>    Report format (default: both)
 *   --dry-run               Validate scenarios without execution
 *   --fail-fast             Exit on first failure
 *   --debug                 Enable verbose logging
 *   --no-mocks              Disable mock services
 *   --inject-failures       Enable failure injection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import config from '../simulator/config.js';
import ScenarioRunner from '../simulator/scenario-runner.js';
import { ReportGenerator } from '../simulator/report-generator.js';
import { startMockServices, stopMockServices } from '../simulator/mocks/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  scenario: getArg('--scenario'),
  suite: getArg('--suite'),
  parallel: parseInt(getArg('--parallel') || config.scenarios.parallel),
  seed: parseInt(getArg('--seed') || config.scenarios.seed),
  report: getArg('--report') || 'both',
  dryRun: hasFlag('--dry-run'),
  failFast: hasFlag('--fail-fast'),
  debug: hasFlag('--debug'),
  noMocks: hasFlag('--no-mocks'),
  injectFailures: hasFlag('--inject-failures')
};

function getArg(flag) {
  const arg = args.find(a => a.startsWith(flag + '='));
  return arg ? arg.split('=')[1] : null;
}

function hasFlag(flag) {
  return args.includes(flag);
}

// Logging helpers
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️ '), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠️ '), msg),
  debug: (msg) => options.debug && console.log(chalk.gray('🔍'), msg)
};

// Load scenarios
function loadScenarios() {
  const scenariosPath = path.join(__dirname, '..', 'simulator', 'scenarios');
  
  if (!fs.existsSync(scenariosPath)) {
    log.error(`Scenarios directory not found: ${scenariosPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(scenariosPath).filter(f => f.endsWith('.json'));
  const scenarios = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(scenariosPath, file), 'utf-8');
      const scenario = JSON.parse(content);
      scenarios.push(scenario);
      log.debug(`Loaded scenario: ${scenario.id}`);
    } catch (error) {
      log.warn(`Failed to load ${file}: ${error.message}`);
    }
  }

  return scenarios;
}

// Filter scenarios based on options
function filterScenarios(scenarios) {
  let filtered = scenarios;

  if (options.scenario && options.scenario !== 'all') {
    filtered = filtered.filter(s => s.id === options.scenario);
    if (filtered.length === 0) {
      log.error(`Scenario not found: ${options.scenario}`);
      process.exit(1);
    }
  }

  if (options.suite) {
    filtered = filtered.filter(s => s.tags && s.tags.includes(options.suite));
    if (filtered.length === 0) {
      log.error(`No scenarios found with tag: ${options.suite}`);
      process.exit(1);
    }
  }

  // Sort by priority (XS > S > M > L)
  const priorityOrder = { XS: 0, S: 1, M: 2, L: 3 };
  filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return filtered;
}

// Main execution
async function main() {
  console.log(chalk.bold.cyan('\n🚀 AUREON ERP - Simulation Runner\n'));
  
  log.info(`Configuration:`);
  console.log(`  • Scenario: ${options.scenario || 'all'}`);
  console.log(`  • Suite: ${options.suite || 'none'}`);
  console.log(`  • Parallel: ${options.parallel}`);
  console.log(`  • Seed: ${options.seed}`);
  console.log(`  • Dry Run: ${options.dryRun ? 'yes' : 'no'}`);
  console.log(`  • Mocks: ${options.noMocks ? 'disabled' : 'enabled'}`);
  console.log('');

  // Load scenarios
  log.info('Loading scenarios...');
  const allScenarios = loadScenarios();
  const scenarios = filterScenarios(allScenarios);
  
  log.success(`Loaded ${scenarios.length} scenario(s)`);
  scenarios.forEach(s => {
    console.log(`  • [${s.priority}] ${s.id} - ${s.name}`);
  });
  console.log('');

  if (options.dryRun) {
    log.info('Dry run mode - scenarios validated successfully');
    process.exit(0);
  }

  // Start mock services
  if (!options.noMocks) {
    log.info('Starting mock services...');
    try {
      await startMockServices(config.mocks);
      log.success('Mock services started');
    } catch (error) {
      log.error(`Failed to start mocks: ${error.message}`);
      process.exit(1);
    }
  }

  // Initialize runner
  const runner = new ScenarioRunner({
    seed: options.seed,
    parallel: options.parallel,
    failFast: options.failFast,
    debug: options.debug,
    injectFailures: options.injectFailures
  });

  // Run scenarios
  log.info('Starting simulation...\n');
  const startTime = Date.now();
  
  try {
    const results = await runner.runScenarios(scenarios);
    const duration = Date.now() - startTime;

    // Generate reports
    log.info('\nGenerating reports...');
    const reportGenerator = new ReportGenerator(config.reports);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      duration,
      options,
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    };

    if (options.report === 'json' || options.report === 'both') {
      const jsonPath = await reportGenerator.generateJSON(reportData);
      log.success(`JSON report: ${jsonPath}`);
    }

    if (options.report === 'html' || options.report === 'both') {
      const htmlPath = await reportGenerator.generateHTML(reportData);
      log.success(`HTML report: ${htmlPath}`);
    }

    // Print summary
    console.log(chalk.bold('\n📊 SUMMARY'));
    console.log(`  • Total: ${reportData.summary.total}`);
    console.log(chalk.green(`  • Passed: ${reportData.summary.passed}`));
    console.log(chalk.red(`  • Failed: ${reportData.summary.failed}`));
    console.log(chalk.yellow(`  • Skipped: ${reportData.summary.skipped}`));
    console.log(`  • Duration: ${(duration / 1000).toFixed(2)}s\n`);

    // Exit code
    const exitCode = reportData.summary.failed > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      log.success('All scenarios passed! 🎉');
    } else {
      log.error(`${reportData.summary.failed} scenario(s) failed`);
    }

    process.exit(exitCode);

  } catch (error) {
    log.error(`Simulation failed: ${error.message}`);
    if (options.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Stop mock services
    if (!options.noMocks) {
      log.info('Stopping mock services...');
      await stopMockServices();
    }
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  if (options.debug) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('SIGINT', async () => {
  log.warn('\nReceived SIGINT, cleaning up...');
  if (!options.noMocks) {
    await stopMockServices();
  }
  process.exit(130);
});

// Run
main();
