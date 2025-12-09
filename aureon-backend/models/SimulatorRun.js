import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SimulatorRun extends Model {}

SimulatorRun.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    scenario_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Scenario identifier (e.g., prescription-create-happy)'
    },
    scenario_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    seed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Random seed for deterministic execution'
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Run duration in milliseconds'
    },
    report_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Path to generated report (JSON/HTML)'
    },
    created_records: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Count of created records: {prescriptions: 10, sales: 5, events: 20}'
    },
    assertions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Assertion results: {total: 10, passed: 9, failed: 1}'
    },
    errors: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of errors encountered during run'
    },
    trace_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Root trace ID for all operations in this run'
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Run configuration: {parallel: 5, failFast: true, injectFailures: false}'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata: {git_commit, environment, user}'
    },
    executed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who triggered the simulation (null for CI)'
    }
  },
  {
    sequelize,
    modelName: 'SimulatorRun',
    tableName: 'simulator_runs',
    indexes: [
      { fields: ['scenario_id'] },
      { fields: ['status'] },
      { fields: ['trace_id'] },
      { fields: ['start_at'] },
      { fields: ['created_at'] }
    ]
  }
);

export default SimulatorRun;
