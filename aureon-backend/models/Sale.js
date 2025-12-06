import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Sale extends Model {}

Sale.init(
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
    produto_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    produto: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    cliente: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: 'Cliente Avulso'
    },
    prescription_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'prescriptions',
        key: 'id'
      }
    },
    valor_venda: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    valor_custo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    lucro: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    margem: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    quantidade: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    canal: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'whatsapp'
    },
    status: {
      type: DataTypes.ENUM('pendente', 'confirmado', 'pago', 'enviado', 'entregue', 'cancelado'),
      defaultValue: 'confirmado'
    },
    forma_pagamento: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    parcelas: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    data_venda: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    data_entrega: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vendedor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    vendedor: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    marketplace_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['produto_id'] },
      { fields: ['prescription_id'] },
      { fields: ['canal'] },
      { fields: ['status'] },
      { fields: ['data_venda'] },
      { fields: ['vendedor_id'] },
      { fields: ['marketplace_order_id'] }
    ]
  }
);

export default Sale;
