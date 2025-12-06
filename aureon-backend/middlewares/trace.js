/**
 * Trace ID Middleware
 * Gera e propaga trace_id (UUID) em todas as requisições
 * Para distributed tracing e correlação de logs
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export const traceMiddleware = (req, res, next) => {
  let traceId;
  
  try {
    // Generate or use existing trace ID
    traceId = req.headers['x-trace-id'] || 
              req.headers['traceid'] || 
              uuidv4();
  } catch (error) {
    logger.warn('⚠️ Trace middleware UUID generation failed, using fallback', {
      error: error.message
    });
    traceId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    // Attach to request
    req.traceId = traceId;

    // Add to response headers
    res.setHeader('X-Trace-Id', traceId);

    // Add to logger context
    req.log = logger.child({ trace_id: traceId });

    // Log request with trace ID
    req.log.info(`${req.method} ${req.path}`, {
      trace_id: traceId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      user: req.user?.username || 'anonymous'
    });

    // Intercept res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
      req.log.info('Response sent', {
        trace_id: traceId,
        status: res.statusCode,
        hasData: !!data
      });
      return originalJson.call(this, data);
    };
  } catch (error) {
    logger.warn('⚠️ Trace middleware setup failed, continuing without tracing', {
      error: error.message,
      traceId
    });
  }

  next();
};

/**
 * Helper to create child trace ID
 * For operations that spawn sub-operations
 */
export const createChildTraceId = (parentTraceId) => {
  return `${parentTraceId}.${uuidv4().split('-')[0]}`;
};

/**
 * Extract trace ID from request
 */
export const getTraceId = (req) => {
  return req.traceId || 'unknown';
};

export default traceMiddleware;
