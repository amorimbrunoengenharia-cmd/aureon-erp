import { Tenant } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Middleware para identificar e validar o tenant da requisição
 * Suporta 3 métodos de identificação:
 * 1. Header X-Tenant-ID (UUID direto)
 * 2. Header X-Tenant-Slug (slug do tenant)
 * 3. Subdomínio (ex: empresa1.aureon.com)
 */
export const tenantMiddleware = async (req, res, next) => {
  try {
    // 🔍 DEBUG: Verificar estado de req.user no início
    logger.debug('🔍 tenantMiddleware iniciado', {
      hasUser: !!req.user,
      userId: req.user?.id,
      username: req.user?.username,
      userTenantId: req.user?.tenant_id,
      path: req.path,
      method: req.method
    });

    let tenant = null;
    let tenantIdentifier = null;
    let identificationMethod = null;

    // Método 1: Header X-Tenant-ID (prioridade)
    const tenantId = req.headers['x-tenant-id'];
    if (tenantId) {
      tenant = await Tenant.findByPk(tenantId);
      tenantIdentifier = tenantId;
      identificationMethod = 'header-id';
    }

    // Método 2: Header X-Tenant-Slug
    if (!tenant) {
      const tenantSlug = req.headers['x-tenant-slug'];
      if (tenantSlug) {
        tenant = await Tenant.findOne({ where: { slug: tenantSlug } });
        tenantIdentifier = tenantSlug;
        identificationMethod = 'header-slug';
      }
    }

    // Método 3: Subdomínio
    if (!tenant) {
      const host = req.headers.host || req.hostname;
      const subdomain = extractSubdomain(host);
      
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        tenant = await Tenant.findOne({ where: { slug: subdomain } });
        tenantIdentifier = subdomain;
        identificationMethod = 'subdomain';
      }
    }

    // Método 4: Domínio customizado
    if (!tenant) {
      const host = req.headers.host || req.hostname;
      const domain = host.split(':')[0]; // Remove porta se houver
      
      tenant = await Tenant.findOne({ where: { domain } });
      if (tenant) {
        tenantIdentifier = domain;
        identificationMethod = 'custom-domain';
      }
    }

    // Método 5: Usar tenant_id do usuário autenticado (fallback)
    if (!tenant && req.user && req.user.tenant_id) {
      logger.debug('🔍 Tentando método 5: req.user.tenant_id', {
        tenant_id: req.user.tenant_id,
        user_id: req.user.id,
        username: req.user.username
      });
      tenant = await Tenant.findByPk(req.user.tenant_id);
      if (tenant) {
        tenantIdentifier = req.user.tenant_id;
        identificationMethod = 'user-tenant';
        logger.info('✅ Tenant identificado via JWT', {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          user: req.user.username
        });
      } else {
        logger.warn('⚠️ tenant_id no JWT não encontrado no banco', {
          tenant_id: req.user.tenant_id
        });
      }
    } else if (!tenant) {
      logger.warn('⚠️ Método 5 falhou - req.user:', {
        hasUser: !!req.user,
        hasTenantId: req.user ? !!req.user.tenant_id : false,
        user: req.user ? { id: req.user.id, username: req.user.username } : null
      });
    }

    // Se não encontrou tenant, verificar se usuário é super admin
    if (!tenant && req.user && req.user.is_super_admin) {
      // Super admin pode acessar sem tenant específico
      req.tenant = null;
      req.isSuperAdmin = true;
      logger.debug('Super admin access without tenant', {
        user: req.user.username,
        path: req.path
      });
      return next();
    }

    // Se não encontrou tenant e não é super admin
    if (!tenant) {
      return res.status(400).json({
        error: 'Tenant not identified',
        message: 'Please provide a valid tenant identifier via header (X-Tenant-ID or X-Tenant-Slug), subdomain, or custom domain',
        methods: [
          'Header: X-Tenant-ID (UUID)',
          'Header: X-Tenant-Slug (tenant slug)',
          'Subdomain: {slug}.aureon.com',
          'Custom domain: configured in tenant settings',
          'Authenticated user tenant_id (automatic)'
        ]
      });
    }

    // Verificar se o tenant está ativo
    if (!tenant.isActive()) {
      logger.warn('Attempt to access inactive tenant', {
        tenantId: tenant.id,
        slug: tenant.slug,
        method: identificationMethod
      });

      return res.status(403).json({
        error: 'Tenant suspended',
        message: 'This tenant account is currently suspended. Please contact support.',
        tenant: {
          name: tenant.name,
          slug: tenant.slug
        }
      });
    }

    // Anexar tenant ao request
    req.tenant = tenant;
    req.tenantId = tenant.id;
    req.identificationMethod = identificationMethod;

    logger.debug('Tenant identified', {
      tenantId: tenant.id,
      slug: tenant.slug,
      method: identificationMethod,
      identifier: tenantIdentifier,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Error in tenant middleware', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Middleware para verificar se usuário tem acesso ao tenant
 * Deve ser usado DEPOIS do tenantMiddleware e authenticate
 */
export const validateTenantAccess = (req, res, next) => {
  try {
    // Super admin tem acesso a tudo
    if (req.user && req.user.is_super_admin) {
      return next();
    }

    // Verificar se o usuário pertence ao tenant
    if (!req.user || !req.tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication and tenant required'
      });
    }

    // Verificar se o tenant_id do usuário corresponde ao tenant da requisição
    if (req.user.tenant_id !== req.tenant.id) {
      logger.warn('User attempting to access different tenant', {
        userId: req.user.id,
        userTenantId: req.user.tenant_id,
        requestTenantId: req.tenant.id
      });

      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this tenant'
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating tenant access', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

/**
 * Middleware opcional para rotas que podem funcionar com ou sem tenant
 * Útil para rotas públicas ou de autenticação
 */
export const optionalTenant = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const tenantSlug = req.headers['x-tenant-slug'];

    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId);
      if (tenant && tenant.isActive()) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
      }
    } else if (tenantSlug) {
      const tenant = await Tenant.findOne({ where: { slug: tenantSlug } });
      if (tenant && tenant.isActive()) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
      }
    }

    next();
  } catch (error) {
    logger.error('Error in optional tenant middleware', {
      error: error.message
    });
    next();
  }
};

/**
 * Helper para extrair subdomínio do host
 */
function extractSubdomain(host) {
  const parts = host.split('.');
  
  // Para localhost ou IP, não há subdomínio
  if (parts.length <= 2 || parts[0] === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // Retorna o primeiro segmento (subdomínio)
  return parts[0];
}

/**
 * Middleware para injetar tenant_id automaticamente em operações de criação
 */
export const injectTenantId = (req, res, next) => {
  if (req.tenant && req.body && !req.body.tenant_id) {
    req.body.tenant_id = req.tenant.id;
  }
  next();
};

export default {
  tenantMiddleware,
  validateTenantAccess,
  optionalTenant,
  injectTenantId
};
