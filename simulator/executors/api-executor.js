/**
 * AUREON ERP - API Executor
 * Executes HTTP API calls
 */

import config from '../config.js';

export class ApiExecutor {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.log = [];
  }

  async execute(action, params = {}) {
    const [method, path] = action.split(' ');
    const url = `${this.baseUrl}${path}`;

    const options = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...params.headers
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (params.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      options.body = JSON.stringify(params.body);
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      const logEntry = {
        timestamp: new Date().toISOString(),
        method,
        path,
        status: response.status,
        duration: Date.now() - startTime,
        request: { headers: params.headers, body: params.body },
        response: { status: response.status, data }
      };

      this.log.push(logEntry);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Request failed'}`);
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: data
      };

    } catch (error) {
      this.log.push({
        timestamp: new Date().toISOString(),
        method,
        path,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  getLog() {
    return this.log;
  }

  clearLog() {
    this.log = [];
  }
}
