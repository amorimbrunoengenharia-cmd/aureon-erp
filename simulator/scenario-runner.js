/**
 * AUREON ERP - Scenario Runner
 * Executes simulation scenarios with support for:
 * - API calls, UI interactions, DB queries, events
 * - Parallel execution
 * - Failure injection
 * - Variable capture and interpolation
 * - Assertions validation
 */

import seedrandom from 'seedrandom';
import chalk from 'chalk';
import { ApiExecutor } from './executors/api-executor.js';
import { UiExecutor } from './executors/ui-executor.js';
import { DbExecutor } from './executors/db-executor.js';
import { EventExecutor } from './executors/event-executor.js';
import { Validator } from './validators/index.js';
import { FailureInjector } from './failure-injector.js';

export default class ScenarioRunner {
  constructor(options = {}) {
    this.options = {
      seed: options.seed || Date.now(),
      parallel: options.parallel || 1,
      failFast: options.failFast || false,
      debug: options.debug || false,
      injectFailures: options.injectFailures || false
    };

    // Initialize RNG with seed
    this.rng = seedrandom(this.options.seed);

    // Initialize executors
    this.executors = {
      api: new ApiExecutor({ debug: this.options.debug }),
      ui: new UiExecutor({ debug: this.options.debug }),
      db: new DbExecutor({ debug: this.options.debug }),
      event: new EventExecutor({ debug: this.options.debug })
    };

    // Initialize validator
    this.validator = new Validator({ debug: this.options.debug });

    // Initialize failure injector
    this.failureInjector = new FailureInjector({
      enabled: this.options.injectFailures,
      rng: this.rng
    });

    this.log = {
      info: (msg) => console.log(chalk.blue('  ℹ️ '), msg),
      success: (msg) => console.log(chalk.green('  ✅'), msg),
      error: (msg) => console.log(chalk.red('  ❌'), msg),
      warn: (msg) => console.log(chalk.yellow('  ⚠️ '), msg),
      debug: (msg) => this.options.debug && console.log(chalk.gray('  🔍'), msg)
    };
  }

  /**
   * Run multiple scenarios
   */
  async runScenarios(scenarios) {
    const results = [];

    if (this.options.parallel > 1) {
      // Run scenarios in parallel batches
      for (let i = 0; i < scenarios.length; i += this.options.parallel) {
        const batch = scenarios.slice(i, i + this.options.parallel);
        const batchResults = await Promise.all(
          batch.map(scenario => this.runScenario(scenario))
        );
        results.push(...batchResults);

        // Check fail-fast
        if (this.options.failFast && batchResults.some(r => r.status === 'failed')) {
          this.log.warn('Fail-fast enabled, stopping execution');
          break;
        }
      }
    } else {
      // Run scenarios sequentially
      for (const scenario of scenarios) {
        const result = await this.runScenario(scenario);
        results.push(result);

        // Check fail-fast
        if (this.options.failFast && result.status === 'failed') {
          this.log.warn('Fail-fast enabled, stopping execution');
          break;
        }
      }
    }

    return results;
  }

  /**
   * Run single scenario
   */
  async runScenario(scenario) {
    console.log(chalk.bold.white(`\n▶️  ${scenario.name}`));
    this.log.info(`ID: ${scenario.id} | Priority: ${scenario.priority}`);

    const result = {
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      status: 'running',
      started_at: new Date().toISOString(),
      steps: [],
      assertions: [],
      artifacts: {},
      variables: {},
      errors: []
    };

    try {
      // Validate preconditions
      await this.validatePreconditions(scenario.preconditions);

      // Execute steps
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        
        this.log.info(`Step ${i + 1}/${scenario.steps.length}: ${step.action}`);

        // Check for failure injection
        if (scenario.failure_injections) {
          const injection = scenario.failure_injections.find(f => f.at_step === i);
          if (injection) {
            this.log.warn(`Injecting failure: ${injection.type}`);
            await this.failureInjector.inject(injection, step);
          }
        }

        // Execute step
        const stepResult = await this.executeStep(step, result.variables);
        result.steps.push(stepResult);

        // Capture variables
        if (step.capture && stepResult.data) {
          this.captureVariables(step.capture, stepResult.data, result.variables);
        }

        // Check step status
        if (stepResult.status === 'failed' && !step.continueOnError) {
          throw new Error(`Step ${i + 1} failed: ${stepResult.error}`);
        }
      }

      // Run assertions
      this.log.info('Running assertions...');
      for (const assertion of scenario.assertions) {
        const assertionResult = await this.validator.validate(
          assertion,
          result.variables
        );
        result.assertions.push(assertionResult);

        if (!assertionResult.passed) {
          throw new Error(`Assertion failed: ${assertionResult.message}`);
        }
      }

      // Collect artifacts
      if (scenario.artifacts_to_collect) {
        this.log.info('Collecting artifacts...');
        result.artifacts = await this.collectArtifacts(
          scenario.artifacts_to_collect,
          result.variables
        );
      }

      result.status = 'passed';
      this.log.success('Scenario passed');

    } catch (error) {
      result.status = 'failed';
      result.errors.push({
        message: error.message,
        stack: error.stack
      });
      this.log.error(`Scenario failed: ${error.message}`);
    } finally {
      result.finished_at = new Date().toISOString();
      result.duration = new Date(result.finished_at) - new Date(result.started_at);
    }

    return result;
  }

  /**
   * Validate scenario preconditions
   */
  async validatePreconditions(preconditions) {
    if (!preconditions) return;

    // Validate required services are running
    if (preconditions.services) {
      for (const service of preconditions.services) {
        this.log.debug(`Checking service: ${service}`);
        // TODO: Implement service health checks
      }
    }

    // Setup database if needed
    if (preconditions.database) {
      if (preconditions.database.cleanup) {
        this.log.debug('Cleaning up database');
        await this.executors.db.cleanup();
      }
      if (preconditions.database.seed_file) {
        this.log.debug(`Loading seed: ${preconditions.database.seed_file}`);
        await this.executors.db.loadSeed(preconditions.database.seed_file);
      }
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step, variables) {
    const stepResult = {
      type: step.type,
      action: step.action,
      started_at: new Date().toISOString(),
      status: 'running'
    };

    try {
      // Interpolate variables in step params
      const params = this.interpolateVariables(step.params, variables);

      // Execute based on step type
      let data;
      switch (step.type) {
        case 'api':
          data = await this.executors.api.execute(step.action, params);
          break;
        case 'ui':
          data = await this.executors.ui.execute(step.action, params);
          break;
        case 'db':
          data = await this.executors.db.execute(step.action, params);
          break;
        case 'event':
          data = await this.executors.event.execute(step.action, params);
          break;
        case 'wait':
          await this.wait(params.ms || 1000);
          break;
        case 'parallel':
          data = await this.executeParallel(params.requests, variables);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      stepResult.status = 'passed';
      stepResult.data = data;

      // Validate expected response if provided
      if (step.expected) {
        this.validateExpected(step.expected, data);
      }

    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error = error.message;
      stepResult.stack = error.stack;
    } finally {
      stepResult.finished_at = new Date().toISOString();
      stepResult.duration = new Date(stepResult.finished_at) - new Date(stepResult.started_at);
    }

    return stepResult;
  }

  /**
   * Execute multiple requests in parallel
   */
  async executeParallel(requests, variables) {
    const results = await Promise.all(
      requests.map(req => this.executeStep(req, variables))
    );
    return results;
  }

  /**
   * Wait for specified milliseconds
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Capture variables from step data
   */
  captureVariables(captures, data, variables) {
    for (const capture of captures) {
      // Parse capture string: "body.accessToken as token"
      const match = capture.match(/^(.+?)\s+as\s+(.+)$/);
      if (!match) continue;

      const [, path, varName] = match;
      const value = this.getNestedValue(data, path);
      
      if (value !== undefined) {
        variables[varName] = value;
        this.log.debug(`Captured: ${varName} = ${JSON.stringify(value).substring(0, 50)}`);
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Interpolate variables in params
   */
  interpolateVariables(params, variables) {
    if (!params) return params;

    const json = JSON.stringify(params);
    const interpolated = json.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? JSON.stringify(variables[varName]).slice(1, -1) : match;
    });

    return JSON.parse(interpolated);
  }

  /**
   * Validate expected response
   */
  validateExpected(expected, actual) {
    for (const [key, expectedValue] of Object.entries(expected)) {
      const actualValue = this.getNestedValue(actual, key);
      
      if (expectedValue === 'string' && typeof actualValue !== 'string') {
        throw new Error(`Expected ${key} to be string, got ${typeof actualValue}`);
      }
      if (expectedValue === 'number' && typeof actualValue !== 'number') {
        throw new Error(`Expected ${key} to be number, got ${typeof actualValue}`);
      }
      if (expectedValue === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualValue)) {
        throw new Error(`Expected ${key} to be UUID, got ${actualValue}`);
      }
      if (typeof expectedValue !== 'string' && actualValue !== expectedValue) {
        throw new Error(`Expected ${key} to be ${expectedValue}, got ${actualValue}`);
      }
    }
  }

  /**
   * Collect artifacts after scenario execution
   */
  async collectArtifacts(artifactTypes, variables) {
    const artifacts = {};

    for (const type of artifactTypes) {
      try {
        switch (type) {
          case 'db_snapshot':
            artifacts.db_snapshot = await this.executors.db.snapshot();
            break;
          case 'event_log':
            artifacts.event_log = await this.executors.event.getLog();
            break;
          case 'api_log':
            artifacts.api_log = this.executors.api.getLog();
            break;
          case 'ui_screenshot':
            artifacts.ui_screenshot = await this.executors.ui.screenshot();
            break;
          case 'performance_metrics':
            artifacts.performance_metrics = this.getPerformanceMetrics();
            break;
        }
      } catch (error) {
        this.log.warn(`Failed to collect ${type}: ${error.message}`);
      }
    }

    return artifacts;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.executors.ui.close();
  }
}
