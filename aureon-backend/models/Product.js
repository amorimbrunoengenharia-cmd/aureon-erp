import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    produto: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    preco_custo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    preco_venda: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    margem: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    quantidade_estoque: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    estoque_minimo: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    fornecedor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    fornecedor: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    ean: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ncm: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    imagens: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    marketplace_ids: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    scopes: {
      tenant(tenantId) {
        return {
          where: {
            tenant_id: tenantId
          }
        };
      }
    },
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tipo'] },
      { fields: ['categoria'] },
      { fields: ['fornecedor_id'] },
      { fields: ['sku'] },
      { fields: ['active'] }
    ]
  }
);

export default Product;
