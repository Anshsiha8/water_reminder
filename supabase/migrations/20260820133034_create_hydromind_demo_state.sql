/*
# Create HydroMind demo state storage

1. New Tables
- `hydromind_demo_state` stores the single shared prototype state as JSON so the interactive demo can survive reloads.
- `id` is the stable singleton key.
- `state` contains profile, daily activities, schedule, progress, and history data.
- `updated_at` records the latest saved state.

2. Security
- Row level security is enabled.
- The prototype intentionally has no sign-in screen, so anon and authenticated users receive separate CRUD policies for the shared demonstration record.

3. Important Notes
- This table is scoped to the prototype demo and is not a production multi-user health-data model.
- The JSON payload keeps the demonstration flexible while the recommendation rules are being validated.
*/

CREATE TABLE IF NOT EXISTS hydromind_demo_state (
  id text PRIMARY KEY,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hydromind_demo_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hydromind_demo_state" ON hydromind_demo_state;
CREATE POLICY "anon_select_hydromind_demo_state" ON hydromind_demo_state FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hydromind_demo_state" ON hydromind_demo_state;
CREATE POLICY "anon_insert_hydromind_demo_state" ON hydromind_demo_state FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hydromind_demo_state" ON hydromind_demo_state;
CREATE POLICY "anon_update_hydromind_demo_state" ON hydromind_demo_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hydromind_demo_state" ON hydromind_demo_state;
CREATE POLICY "anon_delete_hydromind_demo_state" ON hydromind_demo_state FOR DELETE TO anon, authenticated USING (true);
