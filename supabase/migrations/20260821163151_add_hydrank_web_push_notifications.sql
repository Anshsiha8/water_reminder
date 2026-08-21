/*
# Add Hydrank web push notification state

1. Overview
- Adds the durable data needed for real browser/OS push notifications.
- Stores each user's push subscription so the service worker can receive reminders when Hydrank is closed.
- Adds a server-controlled notification queue for deduplication, scheduling, cancellation, and action handling.
- Adds persistent snooze/pause fields to the existing per-user Hydrank state row.

2. New Tables
- `hydrank_push_subscriptions`
  - `id` (uuid): subscription record identifier.
  - `user_id` (uuid): authenticated owner.
  - `endpoint` (text): browser push endpoint, unique per user.
  - `p256dh` and `auth` (text): encrypted Web Push subscription keys.
- `hydrank_notification_queue`
  - `id` (uuid): unique notification identifier sent to the service worker.
  - `user_id` (uuid): authenticated owner.
  - `reminder_id` (text): Hydrank reminder identifier.
  - `amount` (integer): water amount preserved for Drank actions.
  - `scheduled_for` (timestamptz): delivery time.
  - `day` (date): local reminder day used for the daily pause rule.
  - `status` (text): scheduled, sent, cancelled, or acted.
  - `action` (text): drank, skipped, or snoozed when acted.
  - `snooze_count` (integer): consecutive snoozes at scheduling time.

3. Modified Tables
- `hydromind_demo_state`
  - Adds `consecutive_snooze_count` for the persistent three-snooze rule.
  - Adds `reminders_paused_today` for the daily pause flag.
  - Adds `reminder_day` so the next day can reset the daily fields.

4. Security
- RLS is enabled on both new tables.
- Authenticated users can manage only their own push subscriptions.
- Authenticated users can read only their own notification queue rows.
- Notification queue writes and action mutations are performed by the server notification functions using the service role, not by the browser.

5. Important Notes
- The browser still needs notification permission and a registered service worker.
- Push delivery requires the deployed notification sender to have the VAPID keys configured.
- The existing hydration state remains the source of truth for personalized reminders; these tables only deliver and track those reminders.
*/

ALTER TABLE hydromind_demo_state
  ADD COLUMN IF NOT EXISTS consecutive_snooze_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminders_paused_today boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_day date NOT NULL DEFAULT CURRENT_DATE;

CREATE TABLE IF NOT EXISTS hydrank_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS hydrank_notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  scheduled_for timestamptz NOT NULL,
  day date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'acted')),
  action text CHECK (action IS NULL OR action IN ('drank', 'skipped', 'snoozed')),
  snooze_count integer NOT NULL DEFAULT 0 CHECK (snooze_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  acted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS hydrank_notification_queue_unique_schedule
  ON hydrank_notification_queue (user_id, reminder_id, scheduled_for)
  WHERE status IN ('scheduled', 'sent');

CREATE INDEX IF NOT EXISTS hydrank_notification_queue_due_idx
  ON hydrank_notification_queue (scheduled_for, status);

ALTER TABLE hydrank_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydrank_notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_push_subscriptions" ON hydrank_push_subscriptions;
CREATE POLICY "select_own_push_subscriptions" ON hydrank_push_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_push_subscriptions" ON hydrank_push_subscriptions;
CREATE POLICY "insert_own_push_subscriptions" ON hydrank_push_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_push_subscriptions" ON hydrank_push_subscriptions;
CREATE POLICY "update_own_push_subscriptions" ON hydrank_push_subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_push_subscriptions" ON hydrank_push_subscriptions;
CREATE POLICY "delete_own_push_subscriptions" ON hydrank_push_subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_notification_queue" ON hydrank_notification_queue;
CREATE POLICY "select_own_notification_queue" ON hydrank_notification_queue FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notification_queue" ON hydrank_notification_queue;
CREATE POLICY "insert_own_notification_queue" ON hydrank_notification_queue FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notification_queue" ON hydrank_notification_queue;
CREATE POLICY "update_own_notification_queue" ON hydrank_notification_queue FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notification_queue" ON hydrank_notification_queue;
CREATE POLICY "delete_own_notification_queue" ON hydrank_notification_queue FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
