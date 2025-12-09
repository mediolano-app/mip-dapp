-- Migration: Add reports table for content moderation
-- Created: 2024-01-01
-- Description: Table to store user reports of inappropriate content

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(255) PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('asset', 'collection', 'profile')),
  content_id VARCHAR(255) NOT NULL,
  content_title TEXT NOT NULL,
  content_owner VARCHAR(255),
  reporter_wallet VARCHAR(255) NOT NULL,
  reporter_user_id VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  blockchain_tx_hash VARCHAR(255),
  source VARCHAR(50) NOT NULL DEFAULT 'mip-dapp',
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(content_type);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_wallet ON reports(reporter_wallet);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_content_id ON reports(content_id);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE reports IS 'Stores user reports of inappropriate content for moderation';
COMMENT ON COLUMN reports.id IS 'Unique report identifier';
COMMENT ON COLUMN reports.report_type IS 'Category of the report (inappropriate-content, copyright-infringement, etc.)';
COMMENT ON COLUMN reports.content_type IS 'Type of content being reported (asset, collection, profile)';
COMMENT ON COLUMN reports.content_id IS 'Identifier of the reported content';
COMMENT ON COLUMN reports.content_title IS 'Title of the reported content';
COMMENT ON COLUMN reports.content_owner IS 'Username/ID of the content owner';
COMMENT ON COLUMN reports.reporter_wallet IS 'Wallet address of the user submitting the report';
COMMENT ON COLUMN reports.reporter_user_id IS 'User ID of the reporter (from authentication system)';
COMMENT ON COLUMN reports.description IS 'Detailed description of the issue';
COMMENT ON COLUMN reports.status IS 'Current status of the report in moderation workflow';
COMMENT ON COLUMN reports.blockchain_tx_hash IS 'Optional blockchain transaction hash if report is recorded on-chain';
COMMENT ON COLUMN reports.source IS 'Source application that submitted the report';
COMMENT ON COLUMN reports.version IS 'Version of the report schema';
COMMENT ON COLUMN reports.created_at IS 'Timezone-aware timestamp when the report was created';
COMMENT ON COLUMN reports.updated_at IS 'Timezone-aware timestamp when the report was last updated';
