-- Add duration_hours, expires_at, and notes columns to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS duration_hours integer NOT NULL DEFAULT 24;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS notes text;
