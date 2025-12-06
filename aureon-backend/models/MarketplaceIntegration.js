/**
 * MarketplaceIntegration Model
 * Integração com marketplaces externos (Mercado Livre, Shopee, Amazon, etc)
 */

import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'aureon-erp-secret-key-32-bytes!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

// Funções de criptografia para credenciais sensíveis
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return null;
  
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return null;
  }
}

const MarketplaceIntegration = sequelize.define('MarketplaceIntegration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tenants',
      key: 'id'
    }
  },
  plataforma: {
    type: DataTypes.ENUM('MERCADO_LIVRE', 'SHOPEE', 'AMAZON', 'B2W', 'MAGALU', 'VIA_VAREJO', 'OUTROS'),
    allowNull: false,
    comment: 'Marketplace conectado'
  },
  nome_integracao: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nome customizado da integração'
  },
  status: {
    type: DataTypes.ENUM('ATIVA', 'INATIVA', 'ERRO', 'CONFIGURANDO'),
    allowNull: false,
    defaultValue: 'CONFIGURANDO'
  },
  // Credenciais criptografadas (JSON stringified)
  credenciais_encrypted: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Credenciais criptografadas (client_id, client_secret, access_token, etc)'
  },
  // Configurações específicas da integração (JSON)
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Configurações: sync_auto, sync_interval, campos mapeados, etc'
  },
  // Última sincronização
  ultima_sync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ultimo_erro: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Último erro de sincronização'
  },
  // Estatísticas
  total_produtos_sync: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_pedidos_importados: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Metadados
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Dados adicionais: seller_id, store_name, categorias, etc'
  }
}, {
  tableName: 'marketplace_integrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tenant_id']
    },
    {
      fields: ['plataforma']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['tenant_id', 'plataforma', 'nome_integracao']
    }
  ]
});

// Métodos de instância para credenciais
MarketplaceIntegration.prototype.setCredenciais = function(credenciais) {
  if (!credenciais) {
    this.credenciais_encrypted = null;
    return;
  }
  
  const jsonCredenciais = JSON.stringify(credenciais);
  this.credenciais_encrypted = encrypt(jsonCredenciais);
};

MarketplaceIntegration.prototype.getCredenciais = function() {
  if (!this.credenciais_encrypted) {
    return null;
  }
  
  const decrypted = decrypt(this.credenciais_encrypted);
  if (!decrypted) return null;
  
  try {
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Erro ao parsear credenciais:', error);
    return null;
  }
};

// Hook para serialização JSON (não expor credenciais)
MarketplaceIntegration.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.credenciais_encrypted;
  
  // Adicionar flag se tem credenciais
  values.hasCredenciais = !!this.credenciais_encrypted;
  
  return values;
};

export default MarketplaceIntegration;
