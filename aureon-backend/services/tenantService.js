import { Tenant, User, Product, Client, Sale, Supplier } from '../models/index.js';
import { Op } from 'sequelize';
import logger from '../utils/logger.js';

class TenantService {
  /**
   * Criar novo tenant
   */
  async createTenant(data) {
    try {
      // Validar slug único
      const existingTenant = await Tenant.findOne({
        where: { slug: data.slug }
      });

      if (existingTenant) {
        throw new Error('Slug already in use');
      }

      // Verificar domínio customizado (se fornecido)
      if (data.domain) {
        const existingDomain = await Tenant.findOne({
          where: { domain: data.domain }
        });

        if (existingDomain) {
          throw new Error('Domain already in use');
        }
      }

      const tenant = await Tenant.create({
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        plan: data.plan || 'free',
        settings: data.settings || {},
        trial_ends_at: data.trial_ends_at || this.calculateTrialEnd(),
        active: true
      });

      logger.info('Tenant created', {
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      });

      return tenant;
    } catch (error) {
      logger.error('Error creating tenant', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  /**
   * Obter tenant por ID
   */
  async getTenantById(tenantId) {
    const tenant = await Tenant.findByPk(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  /**
   * Obter tenant por slug
   */
  async getTenantBySlug(slug) {
    const tenant = await Tenant.findOne({ where: { slug } });
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return tenant;
  }

  /**
   * Listar todos os tenants (apenas super admin)
   */
  async listTenants(filters = {}) {
    const where = {};

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.plan) {
      where.plan = filters.plan;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { slug: { [Op.like]: `%${filters.search}%` } },
        { contact_email: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      tenants: rows,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    };
  }

  /**
   * Atualizar tenant
   */
  async updateTenant(tenantId, updates) {
    try {
      const tenant = await this.getTenantById(tenantId);

      // Verificar slug único se estiver sendo alterado
      if (updates.slug && updates.slug !== tenant.slug) {
        const existingTenant = await Tenant.findOne({
          where: { slug: updates.slug, id: { [Op.ne]: tenantId } }
        });

        if (existingTenant) {
          throw new Error('Slug already in use');
        }
      }

      // Verificar domínio único se estiver sendo alterado
      if (updates.domain && updates.domain !== tenant.domain) {
        const existingDomain = await Tenant.findOne({
          where: { domain: updates.domain, id: { [Op.ne]: tenantId } }
        });

        if (existingDomain) {
          throw new Error('Domain already in use');
        }
      }

      await tenant.update(updates);

      logger.info('Tenant updated', {
        tenantId: tenant.id,
        updates: Object.keys(updates)
      });

      return tenant;
    } catch (error) {
      logger.error('Error updating tenant', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Atualizar configurações do tenant
   */
  async updateSettings(tenantId, settings) {
    const tenant = await this.getTenantById(tenantId);
    
    const currentSettings = tenant.settings;
    const newSettings = { ...currentSettings, ...settings };
    
    await tenant.update({ settings: newSettings });

    logger.info('Tenant settings updated', {
      tenantId,
      updatedKeys: Object.keys(settings)
    });

    return tenant;
  }

  /**
   * Ativar tenant
   */
  async activateTenant(tenantId) {
    const tenant = await this.getTenantById(tenantId);
    await tenant.update({ active: true });

    logger.info('Tenant activated', { tenantId });

    return tenant;
  }

  /**
   * Desativar tenant (suspender)
   */
  async deactivateTenant(tenantId) {
    const tenant = await this.getTenantById(tenantId);
    await tenant.update({ active: false });

    logger.warn('Tenant deactivated', { tenantId });

    return tenant;
  }

  /**
   * Deletar tenant (CUIDADO: operação destrutiva)
   */
  async deleteTenant(tenantId) {
    const tenant = await this.getTenantById(tenantId);

    // Por segurança, verificar se há dados
    const [userCount, productCount, clientCount, saleCount] = await Promise.all([
      User.count({ where: { tenant_id: tenantId } }),
      Product.count({ where: { tenant_id: tenantId } }),
      Client.count({ where: { tenant_id: tenantId } }),
      Sale.count({ where: { tenant_id: tenantId } })
    ]);

    const totalRecords = userCount + productCount + clientCount + saleCount;

    if (totalRecords > 0) {
      logger.warn('Attempted to delete tenant with data', {
        tenantId,
        records: { userCount, productCount, clientCount, saleCount }
      });
      
      throw new Error(
        `Cannot delete tenant with existing data. Found ${totalRecords} records. ` +
        `Please deactivate instead or contact support for data migration.`
      );
    }

    await tenant.destroy();

    logger.warn('Tenant deleted', { tenantId });

    return { success: true, message: 'Tenant deleted successfully' };
  }

  /**
   * Obter estatísticas do tenant
   */
  async getTenantStats(tenantId) {
    const [
      userCount,
      productCount,
      clientCount,
      supplierCount,
      saleCount,
      sales
    ] = await Promise.all([
      User.count({ where: { tenant_id: tenantId } }),
      Product.count({ where: { tenant_id: tenantId } }),
      Client.count({ where: { tenant_id: tenantId } }),
      Supplier.count({ where: { tenant_id: tenantId } }),
      Sale.count({ where: { tenant_id: tenantId } }),
      Sale.findAll({
        where: { tenant_id: tenantId },
        attributes: ['valor_venda', 'data_venda']
      })
    ]);

    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.valor_venda || 0), 0);
    
    const tenant = await this.getTenantById(tenantId);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        active: tenant.active
      },
      counts: {
        users: userCount,
        products: productCount,
        clients: clientCount,
        suppliers: supplierCount,
        sales: saleCount
      },
      revenue: {
        total: totalRevenue,
        average: saleCount > 0 ? totalRevenue / saleCount : 0
      },
      limits: tenant.settings?.limits || {},
      withinLimits: {
        users: tenant.isWithinLimits('users', userCount),
        products: tenant.isWithinLimits('products', productCount)
      }
    };
  }

  /**
   * Verificar se tenant pode criar mais recursos
   */
  async canCreateResource(tenantId, resourceType) {
    const tenant = await this.getTenantById(tenantId);
    let currentCount = 0;

    switch (resourceType) {
      case 'users':
        currentCount = await User.count({ where: { tenant_id: tenantId } });
        break;
      case 'products':
        currentCount = await Product.count({ where: { tenant_id: tenantId } });
        break;
      default:
        return true;
    }

    return tenant.isWithinLimits(resourceType, currentCount);
  }

  /**
   * Upgrade de plano
   */
  async upgradePlan(tenantId, newPlan, subscriptionEndDate) {
    const tenant = await this.getTenantById(tenantId);

    const updates = {
      plan: newPlan,
      subscription_ends_at: subscriptionEndDate
    };

    // Atualizar limites baseados no plano
    const planLimits = this.getPlanLimits(newPlan);
    const currentSettings = tenant.settings;
    updates.settings = {
      ...currentSettings,
      limits: planLimits
    };

    await tenant.update(updates);

    logger.info('Tenant plan upgraded', {
      tenantId,
      oldPlan: tenant.plan,
      newPlan
    });

    return tenant;
  }

  /**
   * Calcular data de término do trial (30 dias)
   */
  calculateTrialEnd() {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);
    return trialEnd;
  }

  /**
   * Obter limites do plano
   */
  getPlanLimits(plan) {
    const limits = {
      free: {
        maxUsers: 3,
        maxProducts: 100,
        maxStorage: 1073741824 // 1GB
      },
      basic: {
        maxUsers: 10,
        maxProducts: 1000,
        maxStorage: 5368709120 // 5GB
      },
      professional: {
        maxUsers: 50,
        maxProducts: 10000,
        maxStorage: 21474836480 // 20GB
      },
      enterprise: {
        maxUsers: null, // Ilimitado
        maxProducts: null,
        maxStorage: null
      }
    };

    return limits[plan] || limits.free;
  }
}

export default new TenantService();
