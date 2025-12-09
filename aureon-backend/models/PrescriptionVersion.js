import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PrescriptionVersion extends Model {}

PrescriptionVersion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    prescription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'prescriptions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Incremental version number'
    },
    reason: {
      type: DataTypes.ENUM('manual_override', 'progression', 'recheck', 'correction', 'adjustment'),
      allowNull: false,
      comment: 'Reason for creating new version'
    },
    changed_fields: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Diff of changed fields: {od.esferico: {old: -2.0, new: -2.5}}'
    },
    previous_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full snapshot of previous prescription data'
    },
    new_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full snapshot of new prescription data'
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who made the change'
    },
    trace_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For correlating with events'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Clinician notes explaining the change'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata: {approval_status, review_required}'
    }
  },
  {
    sequelize,
    modelName: 'PrescriptionVersion',
    tableName: 'prescription_versions',
    indexes: [
      { fields: ['prescription_id', 'version_number'] },
      { fields: ['trace_id'] },
      { fields: ['changed_by'] },
      { fields: ['created_at'] }
    ]
  }
);

export default PrescriptionVersion;
