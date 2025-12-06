import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

class User extends Model {
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: true, // Permitir null para usuários super admin
      references: {
        model: 'tenants',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'ID do tenant (null para super admin)'
    },
    role: {
      type: DataTypes.ENUM('CEO', 'VENDAS', 'ESTOQUE', 'COMPRAS', 'FINANCEIRO'),
      allowNull: false,
      defaultValue: 'VENDAS'
    },
    is_super_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Super admin pode gerenciar múltiplos tenants'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default User;
