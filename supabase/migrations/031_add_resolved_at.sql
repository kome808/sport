-- Add resolved_at column to pain_reports
ALTER TABLE pain_reports
ADD COLUMN resolved_at TIMESTAMPTZ DEFAULT NULL;

-- Update existing resolved reports (optional, if any exist and resolved_at is null)
UPDATE pain_reports
SET resolved_at = updated_at
WHERE is_resolved = true AND resolved_at IS NULL;
