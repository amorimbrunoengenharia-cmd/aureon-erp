import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PatientHistory extends Model {}

PatientHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    event_type: {
      type: DataTypes.ENUM('prescription', 'purchase', 'override', 'recheck', 'adjustment', 'consultation'),
      allowNull: false,
      comment: 'Type of patient history entry'
    },
    related_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'prescription_id, sale_id, or version_id depending on event_type'
    },
    related_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'prescription, sale, version, etc'
    },
    trace_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For correlating multi-step operations'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Event-specific data: {sphere_far, cylinder_far, diagnosis, recommendations}'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of the event'
    },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created this history entry'
    },
    occurred_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the event occurred (may differ from created_at)'
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
      comment: 'Severity for clinical alerts (e.g., rapid progression)'
    },
    flags: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Clinical flags: ["rapid_progression", "needs_recheck", "high_risk"]'
    }
  },
  {
    sequelize,
    modelName: 'PatientHistory',
    tableName: 'patient_history',
    indexes: [
      { fields: ['patient_id', 'occurred_at'] },
      { fields: ['event_type'] },
      { fields: ['trace_id'] },
      { fields: ['actor_id'] },
      { fields: ['occurred_at'] }
    ]
  }
);

export default PatientHistory;
