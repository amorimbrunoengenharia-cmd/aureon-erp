/**
 * Audit Middleware - Log automático de todas as operações
 * 
 * Registra:
 * - Todas as requisições HTTP (GET, POST, PUT, DELETE)
 * - Usuário responsável pela ação
 * - Recurso acessado/modificado
 * - Mudanças realizadas (antes/depois)
 * - Metadata (IP, User-Agent, timestamp)
 */

import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Middleware para logging de auditoria
 * Captura dados da requisição e resposta para registro completo
 */
export const auditMiddleware = (options = {}) => {
  const {
    excludePaths = ['/health', '/api/auth/login', '/api/auth/refresh'],
    excludeMethods = [],
    logBody = true,
    logQuery = true,
    logResponse = false
  } = options;

  return async (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip excluded methods
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    // Store original send function
    const originalSend = res.send;
    let responseBody = null;

    // Override send to capture response
    res.send = function(data) {
      responseBody = data;
      res.send = originalSend;
      return originalSend.call(this, data);
    };

    // Wait for response to finish
    res.on('finish', async () => {
      try {
        // Extract resource info from path
        const pathParts = req.path.split('/').filter(Boolean);
        const resourceType = pathParts[1] || 'unknown'; // api/products -> products
        const resourceId = pathParts[2] && !isNaN(pathParts[2]) ? parseInt(pathParts[2]) : null;

        // Determine action from method
        const actionMap = {
          GET: 'read',
          POST: 'create',
          PUT: 'update',
          PATCH: 'update',
          DELETE: 'delete'
        };
        const action = actionMap[req.method] || req.method.toLowerCase();

        // Build audit data
        const auditData = {
          user_id: req.user?.id || null,
          username: req.user?.username || 'anonymous',
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent') || 'unknown',
          method: req.method,
          path: req.path,
          status_code: res.statusCode
        };

        // Add request body (sanitize passwords)
        if (logBody && req.body && Object.keys(req.body).length > 0) {
          const sanitizedBody = { ...req.body };
          if (sanitizedBody.password) sanitizedBody.password = '***REDACTED***';
          if (sanitizedBody.senha) sanitizedBody.senha = '***REDACTED***';
          auditData.request_body = JSON.stringify(sanitizedBody);
        }

        // Add query parameters
        if (logQuery && req.query && Object.keys(req.query).length > 0) {
          auditData.query_params = JSON.stringify(req.query);
        }

        // Add response body for modifications (POST, PUT, DELETE)
        if (logResponse && responseBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          try {
            const parsedResponse = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            auditData.response_body = JSON.stringify(parsedResponse);
          } catch (e) {
            // Response is not JSON, skip
          }
        }

        // Add changes metadata for specific actions
        if (req.method === 'PUT' || req.method === 'PATCH') {
          auditData.changes = JSON.stringify({
            updated_fields: Object.keys(req.body || {}),
            timestamp: new Date().toISOString()
          });
        }

        // Create audit log entry
        await AuditLog.create(auditData);

        logger.debug(`Audit log created: ${action} ${resourceType} by ${auditData.username}`);
      } catch (error) {
        // Don't fail the request if audit fails
        logger.error('Failed to create audit log:', error);
      }
    });

    next();
  };
};

/**
 * Audit específico para recursos críticos
 * Captura estado antes/depois para mudanças
 */
export const auditResource = (resourceType) => {
  return async (req, res, next) => {
    // Only for modifications
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Store original state for updates/deletes
    if ((req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') && req.params.id) {
      try {
        // Get model dynamically
        const models = (await import('../models/index.js')).default;
        const Model = models[resourceType.charAt(0).toUpperCase() + resourceType.slice(1)];
        
        if (Model) {
          const originalRecord = await Model.findByPk(req.params.id);
          if (originalRecord) {
            req.audit_original = originalRecord.toJSON();
          }
        }
      } catch (error) {
        logger.error(`Failed to capture original state for ${resourceType}:`, error);
      }
    }

    // Store original send
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log after successful operation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            let parsedData;
            try {
              parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            } catch {
              parsedData = {};
            }

            const auditData = {
              user_id: req.user?.id || null,
              username: req.user?.username || 'system',
              action: req.method.toLowerCase(),
              resource_type: resourceType,
              resource_id: req.params.id ? parseInt(req.params.id) : (parsedData.data?.id || null),
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.get('user-agent') || 'unknown',
              method: req.method,
              path: req.path,
              status_code: res.statusCode
            };

            // Add detailed changes for updates
            if ((req.method === 'PUT' || req.method === 'PATCH') && req.audit_original) {
              const changes = {};
              const newData = parsedData.data || req.body;
              
              for (const key in newData) {
                if (req.audit_original[key] !== newData[key] && key !== 'updated_at') {
                  changes[key] = {
                    from: req.audit_original[key],
                    to: newData[key]
                  };
                }
              }

              auditData.changes = JSON.stringify(changes);
            }

            // Add deletion info
            if (req.method === 'DELETE' && req.audit_original) {
              auditData.changes = JSON.stringify({
                deleted_record: req.audit_original
              });
            }

            // Add creation info
            if (req.method === 'POST') {
              const sanitizedBody = { ...req.body };
              if (sanitizedBody.password) sanitizedBody.password = '***REDACTED***';
              auditData.changes = JSON.stringify({
                created_record: sanitizedBody
              });
            }

            await AuditLog.create(auditData);
            logger.info(`Audit: ${req.user?.username || 'system'} ${req.method} ${resourceType} ${auditData.resource_id || 'new'}`);
          } catch (error) {
            logger.error('Failed to create detailed audit log:', error);
          }
        });
      }

      res.send = originalSend;
      return originalSend.call(this, data);
    };

    next();
  };
};

export default auditMiddleware;
