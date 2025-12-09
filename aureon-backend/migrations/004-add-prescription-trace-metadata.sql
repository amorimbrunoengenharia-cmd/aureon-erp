-- Migration: Add trace_id and metadata to prescriptions table
-- Created: 2025-12-09

-- Add trace_id column for event correlation
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS trace_id UUID,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for trace_id
CREATE INDEX IF NOT EXISTS idx_prescriptions_trace_id ON prescriptions(trace_id);

-- Add comment
COMMENT ON COLUMN prescriptions.trace_id IS 'For correlating with events and operations';
COMMENT ON COLUMN prescriptions.metadata IS 'Additional metadata for AI/ML: {confidence, source, ai_recommendations}';
