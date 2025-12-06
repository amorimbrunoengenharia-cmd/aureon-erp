import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class StockMovement extends Model {}

StockMovement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    produto_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    produto: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('entrada', 'saida', 'ajuste', 'devolucao', 'perda'),
      allowNull: false
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantidade_anterior: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantidade_nova: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    motivo: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    origem: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Sale ID, Purchase ID, or manual adjustment'
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
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'StockMovement',
    tableName: 'stock_movements',
    indexes: [
      { fields: ['produto_id'] },
      { fields: ['tipo'] },
      { fields: ['data'] },
      { fields: ['responsavel_id'] },
      { fields: ['origem'] }
    ]
  }
);

export default StockMovement;
