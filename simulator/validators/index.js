/**
 * AUREON ERP - Validator
 * Validates assertions and system state
 */

import { StockValidator } from './stock-validator.js';
import { EventsValidator } from './events-validator.js';
import { AuditValidator } from './audit-validator.js';
import { KpiValidator } from './kpi-validator.js';

export class Validator {
  constructor(executors) {
    this.executors = executors;
    this.validators = {
      stock: new StockValidator(executors),
      events: new EventsValidator(executors),
      audit: new AuditValidator(executors),
      kpi: new KpiValidator(executors)
    };
  }

  async validate(assertions, variables) {
    const results = [];

    for (const assertion of assertions) {
      const result = await this.validateAssertion(assertion, variables);
      results.push(result);
    }

    return results;
  }

  async validateAssertion(assertion, variables) {
    const { type, condition, failure_message } = assertion;
    
    const startTime = Date.now();
    let status = 'passed';
    let actual = null;
    let error = null;

    try {
      switch (type) {
        case 'db_count':
          actual = await this.validators.stock.validateCount(condition);
          break;
        
        case 'db_value':
          actual = await this.validators.stock.validateValue(condition);
          break;
        
        case 'db_exists':
          actual = await this.validators.stock.validateExists(condition);
          break;
        
        case 'event_count':
          actual = await this.validators.events.validateCount(condition);
          break;
        
        case 'event_exists':
          actual = await this.validators.events.validateExists(condition);
          break;
        
        case 'api_response':
          actual = await this.validateApiResponse(condition);
          break;
        
        case 'ui_element':
          actual = await this.validateUiElement(condition);
          break;
        
        case 'kpi_value':
          actual = await this.validators.kpi.validateValue(condition);
          break;
        
        case 'no_errors_in_log':
          actual = await this.validators.audit.validateNoErrors(condition);
          break;
        
        default:
          throw new Error(`Unknown assertion type: ${type}`);
      }

      if (!this.checkCondition(condition, actual)) {
        status = 'failed';
        error = this.interpolate(failure_message || 'Assertion failed', variables);
      }

    } catch (err) {
      status = 'failed';
      error = err.message;
    }

    return {
      type,
      condition,
      status,
      actual,
      error,
      duration: Date.now() - startTime
    };
  }

  checkCondition(condition, actual) {
    const { operator, expected } = condition;

    switch (operator) {
      case 'equals':
      case '==':
        return actual == expected;
      
      case 'not_equals':
      case '!=':
        return actual != expected;
      
      case 'greater_than':
      case '>':
        return actual > expected;
      
      case 'greater_than_or_equal':
      case '>=':
        return actual >= expected;
      
      case 'less_than':
      case '<':
        return actual < expected;
      
      case 'less_than_or_equal':
      case '<=':
        return actual <= expected;
      
      case 'contains':
        return JSON.stringify(actual).includes(expected);
      
      case 'not_contains':
        return !JSON.stringify(actual).includes(expected);
      
      default:
        return actual == expected;
    }
  }

  async validateApiResponse(condition) {
    const { status, body } = condition;
    const log = this.executors.api.getLog();
    const lastEntry = log[log.length - 1];

    if (!lastEntry) {
      throw new Error('No API requests found in log');
    }

    if (status && lastEntry.status !== status) {
      throw new Error(`Expected status ${status}, got ${lastEntry.status}`);
    }

    if (body) {
      return this.getNestedValue(lastEntry.response.data, body);
    }

    return lastEntry.response.data;
  }

  async validateUiElement(condition) {
    const { selector, attribute, text } = condition;
    
    if (!this.executors.ui.page) {
      throw new Error('UI executor not initialized');
    }

    const element = await this.executors.ui.page.$(selector);
    
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (attribute) {
      return await element.getAttribute(attribute);
    }

    if (text) {
      return await element.textContent();
    }

    return !!element;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  interpolate(str, variables) {
    return str.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });
  }
}
