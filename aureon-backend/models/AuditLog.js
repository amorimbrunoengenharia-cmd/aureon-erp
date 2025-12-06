import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Action performed: CREATE, UPDATE, DELETE, LOGIN, etc'
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of resource: product, sale, client, etc'
    },
    resource_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the affected resource'
    },
    changes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of before/after values for updates'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'HTTP method: GET, POST, PUT, DELETE'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Request path'
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'HTTP response status code'
    },
    request_body: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of request body (sanitized)'
    },
    response_body: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of response body'
    },
    query_params: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of query parameters'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of additional metadata'
    }
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    indexes: [
      // Single column indexes
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['resource_type'] },
      { fields: ['resource_id'] },
      { fields: ['created_at'] },
      
      // Composite indexes for common queries
      { 
        fields: ['user_id', 'action', 'created_at'],
        name: 'audit_user_action_time_idx'
      },
      {
        fields: ['resource_type', 'resource_id', 'created_at'],
        name: 'audit_resource_history_idx'
      },
      {
        fields: ['action', 'resource_type', 'created_at'],
        name: 'audit_action_resource_time_idx'
      },
      {
        fields: ['user_id', 'resource_type'],
        name: 'audit_user_resource_idx'
      },
      {
        fields: ['created_at', 'action'],
        name: 'audit_time_action_idx'
      }
    ]
  }
);

export default AuditLog;
