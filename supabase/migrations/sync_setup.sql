-- ============================================================
-- FASE 6: football-data.org Sync Setup
-- ============================================================

-- 1. Config table for API keys
CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add external_id to matches for deduplication
ALTER TABLE matches ADD COLUMN IF NOT EXISTS external_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_external_id ON matches(external_id) WHERE external_id IS NOT NULL;
