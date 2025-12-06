import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Event extends Model {}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trace_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Unique identifier for tracing related events'
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Event type in format: domain.entity.action'
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Event data payload'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata (userId, source, timestamp, etc)'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'dlq'),
      defaultValue: 'completed',
      comment: 'Event processing status'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dlq_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When event was sent to Dead Letter Queue'
    }
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    indexes: [
      { fields: ['trace_id'] },
      { fields: ['event_type'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['processed_at'] },
      { fields: ['dlq_at'] },
      { 
        fields: ['trace_id', 'event_type'],
        name: 'events_trace_type_idx'
      }
    ]
  }
);

export default Event;
