import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PrescriptionAttachment extends Model {}

PrescriptionAttachment.init(
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
    file_type: {
      type: DataTypes.ENUM('pdf', 'image', 'csv', 'other'),
      allowNull: false,
      defaultValue: 'image'
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'S3 URL or local path'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes'
    },
    file_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'SHA-256 hash for integrity'
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    parsed_confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0.0,
        max: 1.0
      },
      comment: 'OCR confidence score (0.0-1.0)'
    },
    parsed_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Extracted OCR data'
    },
    trace_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For correlating with events'
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata (dimensions, ocr_provider, etc)'
    }
  },
  {
    sequelize,
    modelName: 'PrescriptionAttachment',
    tableName: 'prescription_attachments',
    indexes: [
      { fields: ['prescription_id'] },
      { fields: ['trace_id'] },
      { fields: ['uploaded_by'] },
      { fields: ['created_at'] }
    ]
  }
);

export default PrescriptionAttachment;
