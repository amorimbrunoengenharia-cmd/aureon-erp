-- Migration: Create prescription_attachments table
-- Created: 2025-12-09

CREATE TABLE IF NOT EXISTS prescription_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  file_type VARCHAR(20) CHECK (file_type IN ('pdf', 'image', 'csv', 'other')) DEFAULT 'image',
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  file_hash VARCHAR(64),
  mime_type VARCHAR(100),
  parsed_confidence FLOAT CHECK (parsed_confidence >= 0.0 AND parsed_confidence <= 1.0),
  parsed_data JSONB,
  trace_id UUID,
  uploaded_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prescription_attachments_prescription ON prescription_attachments(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_attachments_trace_id ON prescription_attachments(trace_id);
CREATE INDEX IF NOT EXISTS idx_prescription_attachments_uploaded_by ON prescription_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_prescription_attachments_created_at ON prescription_attachments(created_at);

-- Comments
COMMENT ON TABLE prescription_attachments IS 'Stores uploaded prescription files with OCR metadata';
COMMENT ON COLUMN prescription_attachments.file_hash IS 'SHA-256 hash for integrity';
COMMENT ON COLUMN prescription_attachments.parsed_confidence IS 'OCR confidence score (0.0-1.0)';
COMMENT ON COLUMN prescription_attachments.parsed_data IS 'Extracted OCR data';
COMMENT ON COLUMN prescription_attachments.trace_id IS 'For correlating with events';
