/**
 * Database Retry Utility
 * Implementa retry logic com exponential backoff para operações de DB
 */

import logger from './logger.js';

/**
 * Retry logic with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - { retries: 5, backoff: 1000, maxBackoff: 30000 }
 * @returns {Promise} Result of the function
 */
export async function retry(fn, options = {}) {
  const { retries = 5, backoff = 1000, maxBackoff = 30000 } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        logger.error(`❌ All ${retries} retry attempts failed`, { 
          error: error.message,
          stack: error.stack 
        });
        throw error;
      }
      
      const delay = Math.min(backoff * Math.pow(2, attempt - 1), maxBackoff);
      logger.warn(`⚠️ Attempt ${attempt}/${retries} failed, retrying in ${delay}ms...`, {
        error: error.message,
        attempt,
        nextRetryIn: delay
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default retry;
