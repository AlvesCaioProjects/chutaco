-- Function to recalculate points for all predictions
-- Called after sync updates match results or admin changes a result
CREATE OR REPLACE FUNCTION recalculate_points()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE predictions p
  SET points = CASE
    WHEN m.result IS NULL THEN 0
    WHEN p.prediction = m.result THEN 1
    ELSE 0
  END
  FROM matches m
  WHERE p.match_id = m.id;
END;
$$;
