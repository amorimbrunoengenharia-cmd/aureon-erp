/**
 * Helper para aplicar filtro de tenant_id automaticamente nas queries
 */

/**
 * Adiciona tenant_id ao where clause se o usuário não for super admin
 */
export function withTenantScope(req, whereClause = {}) {
  // Super admin vê tudo
  if (req.user && req.user.is_super_admin && !req.tenantId) {
    return whereClause;
  }

  // Adiciona filtro de tenant
  const tenantId = req.tenantId || req.user?.tenant_id;
  
  if (!tenantId) {
    throw new Error('Tenant ID not found in request');
  }

  return {
    ...whereClause,
    tenant_id: tenantId
  };
}

/**
 * Valida se o recurso pertence ao tenant do usuário
 */
export function validateResourceTenant(resource, req) {
  // Super admin pode acessar qualquer recurso
  if (req.user && req.user.is_super_admin) {
    return true;
  }

  const tenantId = req.tenantId || req.user?.tenant_id;
  
  if (!tenantId) {
    throw new Error('Tenant ID not found in request');
  }

  if (resource.tenant_id !== tenantId) {
    throw new Error('Access denied: Resource belongs to different tenant');
  }

  return true;
}

/**
 * Prepara dados para criação, adicionando tenant_id
 */
export function prepareTenantData(req, data) {
  const tenantId = req.tenantId || req.user?.tenant_id;
  
  if (!tenantId && !req.user?.is_super_admin) {
    throw new Error('Tenant ID required for resource creation');
  }

  // Se já tem tenant_id no data, validar
  if (data.tenant_id) {
    // Super admin pode especificar qualquer tenant
    if (req.user?.is_super_admin) {
      return data;
    }

    // Usuário comum só pode criar no próprio tenant
    if (data.tenant_id !== tenantId) {
      throw new Error('Cannot create resources for different tenant');
    }
  }

  // Adiciona tenant_id do usuário
  return {
    ...data,
    tenant_id: tenantId
  };
}

/**
 * Adiciona opções de include com tenant scope
 */
export function withTenantInclude(req, includeOptions = []) {
  const tenantId = req.tenantId || req.user?.tenant_id;
  
  if (!tenantId || (req.user && req.user.is_super_admin)) {
    return includeOptions;
  }

  // Adiciona where tenant_id em cada include
  return includeOptions.map(include => {
    if (!include.model) return include;

    return {
      ...include,
      where: {
        ...include.where,
        tenant_id: tenantId
      },
      required: include.required !== undefined ? include.required : false
    };
  });
}

export default {
  withTenantScope,
  validateResourceTenant,
  prepareTenantData,
  withTenantInclude
};
