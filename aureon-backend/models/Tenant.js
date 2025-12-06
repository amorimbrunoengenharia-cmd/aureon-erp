import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nome da empresa/organização'
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Slug único para identificação (usado em subdomínios)'
  },
  domain: {
    type: DataTypes.STRING(255),
    unique: true,
    comment: 'Domínio customizado (opcional)'
  },
  settings: {
    type: DataTypes.TEXT,
    get() {
      const value = this.getDataValue('settings');
      return value ? JSON.parse(value) : {
        features: {
          multiCurrency: false,
          advancedReports: true,
          apiAccess: true,
          customBranding: false
        },
        limits: {
          maxUsers: 10,
          maxProducts: 1000,
          maxStorage: 5368709120 // 5GB in bytes
        },
        branding: {
          primaryColor: '#3b82f6',
          logo: null,
          favicon: null
        },
        notifications: {
          email: true,
          sms: false,
          push: false
        },
        integrations: {
          mercadoLivre: false,
          shopee: false,
          whatsapp: false
        }
      };
    },
    set(value) {
      this.setDataValue('settings', JSON.stringify(value));
    },
    comment: 'Configurações específicas do tenant (JSON)'
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'professional', 'enterprise'),
    defaultValue: 'free',
    comment: 'Plano de assinatura do tenant'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se false, tenant está suspenso'
  },
  logo: {
    type: DataTypes.TEXT,
    comment: 'URL ou base64 do logo'
  },
  contact_email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    },
    comment: 'Email de contato principal'
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    comment: 'Telefone de contato'
  },
  trial_ends_at: {
    type: DataTypes.DATE,
    comment: 'Data de término do período trial'
  },
  subscription_ends_at: {
    type: DataTypes.DATE,
    comment: 'Data de término da assinatura'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      unique: true,
      fields: ['domain']
    },
    {
      fields: ['active']
    },
    {
      fields: ['plan']
    }
  ]
});

// Métodos de instância
Tenant.prototype.isActive = function() {
  if (!this.active) return false;
  
  // Verificar se o trial expirou
  if (this.trial_ends_at && new Date() > this.trial_ends_at && !this.subscription_ends_at) {
    return false;
  }
  
  // Verificar se a assinatura expirou
  if (this.subscription_ends_at && new Date() > this.subscription_ends_at) {
    return false;
  }
  
  return true;
};

Tenant.prototype.hasFeature = function(feature) {
  const settings = this.settings;
  return settings.features && settings.features[feature] === true;
};

Tenant.prototype.isWithinLimits = function(resource, currentCount) {
  const settings = this.settings;
  const limits = settings.limits || {};
  
  switch(resource) {
    case 'users':
      return !limits.maxUsers || currentCount < limits.maxUsers;
    case 'products':
      return !limits.maxProducts || currentCount < limits.maxProducts;
    case 'storage':
      return !limits.maxStorage || currentCount < limits.maxStorage;
    default:
      return true;
  }
};

export default Tenant;
