/*
# Add per-user authentication to HydroMind

1. Overview
- Converts the prototype from a single shared demo row to per-user data.
- Adds a user_id column so each signed-in user owns their own hydration state.
- Replaces the open anon CRUD policies with authenticated owner-scoped policies.

2. Modified Tables
- `hydromind_demo_state`
  - New column: `user_id` (uuid, not null, defaults to the authenticated user)
  - New unique constraint on `user_id` so each user has at most one state row
  - The old `id` text column is kept (never drop columns); new rows use user_id as the ownership key

3. Security Changes
- RLS stays enabled.
- Old anon/all-access policies are dropped.
- New policies scope SELECT, INSERT, UPDATE, DELETE to `TO authenticated` using `auth.uid() = user_id`.
- The old single-tenant demo row (id = 'default', user_id null) is removed because it has no owner and is no longer reachable — it was placeholder prototype data, not real user data.

4. Important Notes
- The frontend must build a sign-in / sign-up screen so users can authenticate; without a session every query returns zero rows.
- The `user_id` column defaults to `auth.uid()` so inserts that omit it still satisfy the INSERT policy.
- Upsert uses `user_id` as the conflict target.
*/

ALTER TABLE hydromind_demo_state
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- Remove the old ownerless demo row so the NOT NULL constraint can be applied
DELETE FROM hydromind_demo_state WHERE user_id IS NULL;

ALTER TABLE hydromind_demo_state
  ALTER COLUMN user_id SET NOT NULL;

-- Ensure one state row per user (used as upsert conflict target)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hydromind_demo_state_user_id_key'
  ) THEN
    ALTER TABLE hydromind_demo_state ADD CONSTRAINT hydromind_demo_state_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Replace open anon policies with authenticated owner-scoped policies
DROP POLICY IF EXISTS "anon_select_hydromind_demo_state" ON hydromind_demo_state;
DROP POLICY IF EXISTS "anon_insert_hydromind_demo_state" ON hydromind_demo_state;
DROP POLICY IF EXISTS "anon_update_hydromind_demo_state" ON hydromind_demo_state;
DROP POLICY IF EXISTS "anon_delete_hydromind_demo_state" ON hydromind_demo_state;

DROP POLICY IF EXISTS "select_own_state" ON hydromind_demo_state;
CREATE POLICY "select_own_state" ON hydromind_demo_state FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_state" ON hydromind_demo_state;
CREATE POLICY "insert_own_state" ON hydromind_demo_state FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_state" ON hydromind_demo_state;
CREATE POLICY "update_own_state" ON hydromind_demo_state FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_state" ON hydromind_demo_state;
CREATE POLICY "delete_own_state" ON hydromind_demo_state FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
