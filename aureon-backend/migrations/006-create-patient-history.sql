-- Migration: Create patient_history table
-- Created: 2025-12-09

CREATE TABLE IF NOT EXISTS patient_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type VARCHAR(50) CHECK (event_type IN ('prescription', 'purchase', 'override', 'recheck', 'adjustment', 'consultation')) NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  trace_id UUID,
  metadata JSONB DEFAULT '{}',
  description TEXT,
  actor_id UUID REFERENCES users(id),
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  flags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_history_patient_occurred ON patient_history(patient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_history_event_type ON patient_history(event_type);
CREATE INDEX IF NOT EXISTS idx_patient_history_trace_id ON patient_history(trace_id);
CREATE INDEX IF NOT EXISTS idx_patient_history_actor ON patient_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_patient_history_occurred_at ON patient_history(occurred_at DESC);

-- Comments
COMMENT ON TABLE patient_history IS 'Tracks patient clinical history including prescriptions, purchases, overrides';
COMMENT ON COLUMN patient_history.event_type IS 'Type of patient history entry';
COMMENT ON COLUMN patient_history.related_id IS 'prescription_id, sale_id, or version_id depending on event_type';
COMMENT ON COLUMN patient_history.trace_id IS 'For correlating multi-step operations';
COMMENT ON COLUMN patient_history.metadata IS 'Event-specific data: {sphere_far, cylinder_far, diagnosis, recommendations}';
COMMENT ON COLUMN patient_history.actor_id IS 'User who created this history entry';
COMMENT ON COLUMN patient_history.occurred_at IS 'When the event occurred (may differ from created_at)';
COMMENT ON COLUMN patient_history.severity IS 'Severity for clinical alerts (e.g., rapid progression)';
COMMENT ON COLUMN patient_history.flags IS 'Clinical flags: ["rapid_progression", "needs_recheck", "high_risk"]';
