/**
 * AUREON ERP - Failure Injector
 * Simulates failures for resilience testing
 */

import config from './config.js';

export class FailureInjector {
  constructor(options = {}) {
    this.enabled = options.enabled || config.failures.enabled;
    this.rng = options.rng || Math.random;
    this.debug = options.debug || false;
  }

  shouldInject(failureConfig) {
    if (!this.enabled) return false;
    
    const { probability = 0.5 } = failureConfig;
    return this.rng() < probability;
  }

  async inject(failure) {
    if (!this.enabled) return;

    const { type, params = {} } = failure;

    if (this.debug) {
      console.log(`  💥 Injecting failure: ${type}`);
    }

    switch (type) {
      case 'network_delay':
        await this.injectNetworkDelay(params);
        break;
      
      case 'http_error':
        await this.injectHttpError(params);
        break;
      
      case 'db_error':
        await this.injectDbError(params);
        break;
      
      case 'timeout':
        await this.injectTimeout(params);
        break;
      
      case 'token_expiry':
        await this.injectTokenExpiry(params);
        break;
      
      case 'process_crash':
        await this.injectProcessCrash(params);
        break;
      
      default:
        console.warn(`  ⚠️  Unknown failure type: ${type}`);
    }
  }

  async injectNetworkDelay(params) {
    const { min, max } = params;
    const minDelay = min || config.failures.networkDelay.min;
    const maxDelay = max || config.failures.networkDelay.max;
    const delay = minDelay + Math.floor(this.rng() * (maxDelay - minDelay));

    if (this.debug) {
      console.log(`  ⏱️  Network delay: ${delay}ms`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async injectHttpError(params) {
    const { status_code } = params;
    const errorCode = status_code || this.selectRandom(config.failures.httpErrors);

    if (this.debug) {
      console.log(`  🚨 HTTP error: ${errorCode}`);
    }

    throw new Error(`Injected HTTP error: ${errorCode}`);
  }

  async injectDbError(params) {
    const { error_type = 'SQLITE_BUSY' } = params;

    if (this.debug) {
      console.log(`  🗄️  DB error: ${error_type}`);
    }

    throw new Error(`Injected DB error: ${error_type}`);
  }

  async injectTimeout(params) {
    const { duration = 60000 } = params;

    if (this.debug) {
      console.log(`  ⏰ Timeout: ${duration}ms`);
    }

    await new Promise(resolve => setTimeout(resolve, duration));
    throw new Error('Injected timeout');
  }

  async injectTokenExpiry(params) {
    if (this.debug) {
      console.log(`  🔑 Token expired`);
    }

    throw new Error('Injected token expiry: JWT expired');
  }

  async injectProcessCrash(params) {
    if (this.debug) {
      console.log(`  💀 Process crash simulated`);
    }

    // Don't actually crash the process in tests
    throw new Error('Injected process crash (simulated)');
  }

  selectRandom(array) {
    const index = Math.floor(this.rng() * array.length);
    return array[index];
  }

  async wrapExecutor(executor, failure) {
    if (!this.shouldInject(failure)) {
      return executor;
    }

    // Create a wrapper that injects failure before execution
    return async (...args) => {
      await this.inject(failure);
      return await executor(...args);
    };
  }
}
