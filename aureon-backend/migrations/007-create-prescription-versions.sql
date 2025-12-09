-- Migration: Create prescription_versions table
-- Created: 2025-12-09

CREATE TABLE IF NOT EXISTS prescription_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  reason VARCHAR(50) CHECK (reason IN ('manual_override', 'progression', 'recheck', 'correction', 'adjustment')) NOT NULL,
  changed_fields JSONB NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  changed_by UUID NOT NULL REFERENCES users(id),
  trace_id UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prescription_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prescription_versions_prescription_version ON prescription_versions(prescription_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_prescription_versions_trace_id ON prescription_versions(trace_id);
CREATE INDEX IF NOT EXISTS idx_prescription_versions_changed_by ON prescription_versions(changed_by);
CREATE INDEX IF NOT EXISTS idx_prescription_versions_created_at ON prescription_versions(created_at DESC);

-- Comments
COMMENT ON TABLE prescription_versions IS 'Tracks prescription changes and overrides for audit and AI analysis';
COMMENT ON COLUMN prescription_versions.version_number IS 'Incremental version number';
COMMENT ON COLUMN prescription_versions.reason IS 'Reason for creating new version';
COMMENT ON COLUMN prescription_versions.changed_fields IS 'Diff of changed fields: {od.esferico: {old: -2.0, new: -2.5}}';
COMMENT ON COLUMN prescription_versions.previous_data IS 'Full snapshot of previous prescription data';
COMMENT ON COLUMN prescription_versions.new_data IS 'Full snapshot of new prescription data';
COMMENT ON COLUMN prescription_versions.changed_by IS 'User who made the change';
COMMENT ON COLUMN prescription_versions.trace_id IS 'For correlating with events';
COMMENT ON COLUMN prescription_versions.notes IS 'Clinician notes explaining the change';
