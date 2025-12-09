-- Migration: Create simulator_runs table
-- Created: 2025-12-09

CREATE TABLE IF NOT EXISTS simulator_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id VARCHAR(100) NOT NULL,
  scenario_name VARCHAR(200),
  status VARCHAR(20) CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')) DEFAULT 'pending' NOT NULL,
  seed INTEGER,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  report_url TEXT,
  created_records JSONB DEFAULT '{}',
  assertions JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  trace_id UUID,
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  executed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simulator_runs_scenario_id ON simulator_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulator_runs_status ON simulator_runs(status);
CREATE INDEX IF NOT EXISTS idx_simulator_runs_trace_id ON simulator_runs(trace_id);
CREATE INDEX IF NOT EXISTS idx_simulator_runs_start_at ON simulator_runs(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulator_runs_created_at ON simulator_runs(created_at DESC);

-- Comments
COMMENT ON TABLE simulator_runs IS 'Tracks simulator execution runs with results and artifacts';
COMMENT ON COLUMN simulator_runs.scenario_id IS 'Scenario identifier (e.g., prescription-create-happy)';
COMMENT ON COLUMN simulator_runs.seed IS 'Random seed for deterministic execution';
COMMENT ON COLUMN simulator_runs.duration_ms IS 'Run duration in milliseconds';
COMMENT ON COLUMN simulator_runs.report_url IS 'Path to generated report (JSON/HTML)';
COMMENT ON COLUMN simulator_runs.created_records IS 'Count of created records: {prescriptions: 10, sales: 5, events: 20}';
COMMENT ON COLUMN simulator_runs.assertions IS 'Assertion results: {total: 10, passed: 9, failed: 1}';
COMMENT ON COLUMN simulator_runs.errors IS 'Array of errors encountered during run';
COMMENT ON COLUMN simulator_runs.trace_id IS 'Root trace ID for all operations in this run';
COMMENT ON COLUMN simulator_runs.config IS 'Run configuration: {parallel: 5, failFast: true, injectFailures: false}';
COMMENT ON COLUMN simulator_runs.executed_by IS 'User who triggered the simulation (null for CI)';
