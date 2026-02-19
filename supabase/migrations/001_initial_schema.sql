CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(key_hash)
);

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eaten_at TIMESTAMPTZ NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'snack',
  raw_text TEXT,
  totals JSONB DEFAULT '{}',
  ranges JSONB,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_log_id UUID NOT NULL REFERENCES food_logs(id) ON DELETE CASCADE,
  nutrients JSONB DEFAULT '{}',
  ranges JSONB,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  body_fat_percent NUMERIC(4,2),
  lean_mass_kg NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  title TEXT NOT NULL DEFAULT 'Workout',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('strength', 'cardio')),
  sets JSONB,
  cardio_block JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_logs_user_eaten ON food_logs(user_id, eaten_at);
CREATE INDEX idx_body_metrics_user_measured ON body_metrics(user_id, measured_at);
CREATE INDEX idx_workouts_user_started ON workouts(user_id, started_at);
CREATE INDEX idx_food_items_log ON food_items(food_log_id);
CREATE INDEX idx_workout_entries_workout ON workout_entries(workout_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_select ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY api_keys_insert ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY api_keys_delete ON api_keys FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY food_logs_all ON food_logs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY food_items_select ON food_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM food_logs fl WHERE fl.id = food_log_id AND fl.user_id = auth.uid())
);
CREATE POLICY food_items_insert ON food_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM food_logs fl WHERE fl.id = food_log_id AND fl.user_id = auth.uid())
);
CREATE POLICY food_items_update ON food_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM food_logs fl WHERE fl.id = food_log_id AND fl.user_id = auth.uid())
);
CREATE POLICY food_items_delete ON food_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM food_logs fl WHERE fl.id = food_log_id AND fl.user_id = auth.uid())
);

CREATE POLICY body_metrics_all ON body_metrics FOR ALL USING (auth.uid() = user_id);

CREATE POLICY workouts_all ON workouts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY workout_entries_select ON workout_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
);
CREATE POLICY workout_entries_insert ON workout_entries FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
);
CREATE POLICY workout_entries_update ON workout_entries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
);
CREATE POLICY workout_entries_delete ON workout_entries FOR DELETE USING (
  EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
);
