import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Client extends Model {}

Client.init(
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
    cpf_cnpj: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    endereco: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    origem: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'whatsapp'
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_compras: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total_pedidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    ultima_compra: {
      type: DataTypes.DATE,
      allowNull: true
    },
    score_rfm: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    modelName: 'Client',
    tableName: 'clients',
    indexes: [
      { fields: ['nome'] },
      { fields: ['email'] },
      { fields: ['cpf_cnpj'] },
      { fields: ['categoria'] },
      { fields: ['origem'] },
      { fields: ['active'] },
      { fields: ['ultima_compra'] }
    ]
  }
);

export default Client;
