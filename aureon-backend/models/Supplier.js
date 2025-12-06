import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Supplier extends Model {}

Supplier.init(
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
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    razao_social: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    cnpj: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    endereco: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    prazo_entrega_dias: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    valor_minimo_pedido: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    condicoes_pagamento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contatos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    total_pedidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_comprado: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    ultima_compra: {
      type: DataTypes.DATE,
      allowNull: true
    },
    avaliacao: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
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
    modelName: 'Supplier',
    tableName: 'suppliers',
    indexes: [
      { fields: ['nome'] },
      { fields: ['cnpj'] },
      { fields: ['categoria'] },
      { fields: ['active'] },
      { fields: ['ultima_compra'] }
    ]
  }
);

export default Supplier;
