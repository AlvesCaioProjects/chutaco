-- ============================================================
-- COPA 2026 PALPITES - DATABASE SCHEMA
-- Execute this SQL in Supabase SQL Editor
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  team_a VARCHAR(100) NOT NULL,
  team_b VARCHAR(100) NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  result VARCHAR(10) CHECK (result IS NULL OR result IN ('team_a', 'team_b', 'draw')),
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  prediction VARCHAR(10) NOT NULL CHECK (prediction IN ('team_a', 'team_b', 'draw')),
  points INTEGER DEFAULT 0 CHECK (points IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code UUID UNIQUE DEFAULT uuid_generate_v4(),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League Members table
CREATE TABLE IF NOT EXISTS league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- 3. Create indexes
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_matches_scheduled_time ON matches(scheduled_time);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Users: Only see own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR is_admin = TRUE);

-- Competitions: Everyone can read
CREATE POLICY "Competitions are readable by all"
  ON competitions FOR SELECT
  USING (TRUE);

-- Matches: Everyone can read
CREATE POLICY "Matches are readable by all"
  ON matches FOR SELECT
  USING (TRUE);

-- Only admin can update matches
CREATE POLICY "Only admin can update matches"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::uuid 
      AND users.is_admin = TRUE
    )
  );

-- Predictions: Users can see own, members can see league predictions after match starts
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- Users can see league members' predictions after match starts (scheduled_time <= now)
CREATE POLICY "Users can view league predictions after match starts"
  ON predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM league_members lm1
      JOIN league_members lm2 ON lm1.league_id = lm2.league_id
      JOIN matches m ON predictions.match_id = m.id
      WHERE lm1.user_id = auth.uid()::uuid
      AND lm2.user_id = predictions.user_id
      AND m.scheduled_time <= NOW()
    )
  );

-- Users can insert own predictions
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

-- Users can update own predictions
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (user_id = auth.uid()::uuid);

-- Leagues: Owner and members can view
CREATE POLICY "Users can view own leagues"
  ON leagues FOR SELECT
  USING (
    owner_id = auth.uid()::uuid 
    OR EXISTS (
      SELECT 1 FROM league_members 
      WHERE league_id = leagues.id 
      AND user_id = auth.uid()::uuid
    )
  );

-- Users can create leagues
CREATE POLICY "Users can create leagues"
  ON leagues FOR INSERT
  WITH CHECK (owner_id = auth.uid()::uuid);

-- League Members: Users can see who's in their leagues
CREATE POLICY "Users can view league members"
  ON league_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_members.league_id
      AND (
        leagues.owner_id = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM league_members lm2
          WHERE lm2.league_id = league_members.league_id
          AND lm2.user_id = auth.uid()::uuid
        )
      )
    )
  );

-- Users can join leagues
CREATE POLICY "Users can join leagues"
  ON league_members FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

-- 6. View for Global Rankings
CREATE OR REPLACE VIEW global_rankings AS
SELECT 
  u.id,
  u.username,
  SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END)::INTEGER as total_points,
  COUNT(p.id)::INTEGER as total_predictions,
  CASE 
    WHEN COUNT(p.id) = 0 THEN 0
    ELSE ROUND(100.0 * SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END) / COUNT(p.id), 2)
  END::FLOAT as accuracy_rate,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM predictions p2
      JOIN matches m2 ON m2.id = p2.match_id AND m2.result IS NOT NULL
      WHERE p2.user_id = u.id
      AND p2.points = 1
      AND NOT EXISTS (
        SELECT 1 FROM predictions p3
        JOIN matches m3 ON m3.id = p3.match_id AND m3.result IS NOT NULL
        WHERE p3.user_id = u.id
        AND p3.created_at > p2.created_at
        AND p3.points = 0
      )
    ),
    0
  )::INTEGER as current_streak
FROM users u
LEFT JOIN predictions p ON u.id = p.user_id
  AND EXISTS (SELECT 1 FROM matches m WHERE m.id = p.match_id AND m.result IS NOT NULL)
GROUP BY u.id, u.username
ORDER BY total_points DESC, accuracy_rate DESC, current_streak DESC;

-- 7. View for League Rankings
CREATE OR REPLACE VIEW league_rankings AS
SELECT 
  lm.league_id,
  u.id,
  u.username,
  SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END)::INTEGER as total_points,
  COUNT(p.id)::INTEGER as total_predictions,
  CASE 
    WHEN COUNT(p.id) = 0 THEN 0
    ELSE ROUND(100.0 * SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END) / COUNT(p.id), 2)
  END::FLOAT as accuracy_rate,
  COALESCE(
    (
      SELECT COUNT(*)
      FROM predictions p2
      JOIN matches m2 ON m2.id = p2.match_id AND m2.result IS NOT NULL
      WHERE p2.user_id = u.id
      AND p2.points = 1
      AND NOT EXISTS (
        SELECT 1 FROM predictions p3
        JOIN matches m3 ON m3.id = p3.match_id AND m3.result IS NOT NULL
        WHERE p3.user_id = u.id
        AND p3.created_at > p2.created_at
        AND p3.points = 0
      )
    ),
    0
  )::INTEGER as current_streak
FROM league_members lm
JOIN users u ON lm.user_id = u.id
LEFT JOIN predictions p ON u.id = p.user_id
  AND EXISTS (SELECT 1 FROM matches m WHERE m.id = p.match_id AND m.result IS NOT NULL)
GROUP BY lm.league_id, u.id, u.username
ORDER BY total_points DESC, accuracy_rate DESC, current_streak DESC;

-- ============================================================
-- INITIAL DATA (Copa 2026)
-- ============================================================

-- Insert competition
INSERT INTO competitions (name, status) 
VALUES ('Copa do Mundo 2026', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- NOTES FOR ADMIN
-- ============================================================
-- After creating tables:
-- 1. Go to Authentication > Users and set up auth method
-- 2. Or use Supabase Auth API via frontend (recommended)
-- 3. Create your admin user manually with is_admin = TRUE
-- 4. Test RLS policies with different users
