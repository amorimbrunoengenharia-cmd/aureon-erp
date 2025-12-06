import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class FinanceTransaction extends Model {}

FinanceTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.ENUM('receita', 'despesa', 'transferencia'),
      allowNull: false
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pendente', 'pago', 'recebido', 'cancelado'),
      defaultValue: 'pendente'
    },
    forma_pagamento: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    conta_bancaria_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    conta_bancaria: {
      type: DataTypes.STRING(100),
      allowNull: true
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
      allowNull: true
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
    sale_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    recorrente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recorrencia: {
      type: DataTypes.JSONB,
      defaultValue: null
    },
    parcelas: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    parcela_atual: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    comprovante_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    responsavel_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    responsavel: {
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
    modelName: 'FinanceTransaction',
    tableName: 'finance_transactions',
    indexes: [
      { fields: ['tipo'] },
      { fields: ['categoria'] },
      { fields: ['data'] },
      { fields: ['status'] },
      { fields: ['cliente_id'] },
      { fields: ['fornecedor_id'] },
      { fields: ['sale_id'] },
      { fields: ['conta_bancaria_id'] },
      { fields: ['responsavel_id'] }
    ]
  }
);

export default FinanceTransaction;
