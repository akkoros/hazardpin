-- Flags table for image and report flagging
CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  reportId TEXT NOT NULL REFERENCES hazard_reports(id) ON DELETE CASCADE,
  reporterId TEXT NOT NULL,
  imageKey TEXT,
  reason TEXT NOT NULL,
  comment TEXT DEFAULT '',
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flags_report ON flags(reportId);

-- Add flaggedImages column to hazard_reports for image hiding
ALTER TABLE hazard_reports ADD COLUMN flaggedImages TEXT DEFAULT '';