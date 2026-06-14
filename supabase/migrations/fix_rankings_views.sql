-- Fix global_rankings and league_rankings to only count finished matches
-- Run in Supabase SQL Editor

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
