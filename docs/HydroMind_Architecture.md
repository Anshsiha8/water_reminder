# HydroMind Architecture

**Document status:** Pre-prototype architecture baseline  
**Product:** HydroMind — Adaptive Hydration Assistant  
**Author:** Manus AI  
**Last updated:** 20 August 2026

## 1. Purpose and architectural intent

HydroMind is a mobile-first hydration assistant whose primary distinction is **context-aware schedule adaptation**. Rather than issuing a rigid reminder at a fixed interval, the system generates a schedule within the user’s waking hours and adjusts it for sleep, naps, exercise, sports, outings, and temporary changes to the day.[1]

This document defines the technical shape of the SIH prototype before implementation begins. The architecture prioritizes predictable behavior, fast demonstration flows, explainable recommendations, and a clean path to future personalization. The first version should use a deterministic rule-based recommendation engine instead of an external AI service, because the prototype needs repeatable outputs that can be inspected and demonstrated reliably.[2]

> **Architectural principle:** The schedule is a derived, explainable plan. The user’s profile, daily events, and logged actions are the source data; the recommendation engine recalculates the plan whenever those inputs materially change.

## 2. Architectural decisions

| Area | Prototype decision | Rationale | Future evolution |
|---|---|---|---|
| Client | React with Vite | Matches the supplied technology direction and supports a responsive, fast-loading interface.[2] | Add a native shell or installable PWA if notification requirements expand. |
| Styling | Tailwind CSS with a tokenized dark-glass theme | Matches the supplied UI direction and keeps visual changes centralized.[2][3] | Extract tokens into a shared design package. |
| Backend platform | Supabase as the reference implementation, behind a small data-access boundary | Provides authentication, a relational database, and server-side functions without requiring a separate server for the prototype. The source documentation permits either Supabase or Firebase.[2] | A Firebase adapter may be substituted if project constraints require it. |
| Database | PostgreSQL through Supabase | Relational entities and date-based schedule queries are natural fits for the product’s data model. | Add analytical storage or event streaming only when usage justifies it. |
| Recommendation logic | Versioned, deterministic rule-based engine | Makes goal calculation, schedule generation, activity adjustment, snooze behavior, skip control, and streak rules explainable.[1][2] | Introduce richer personalization only behind the same engine interface. |
| Notifications | In-app reminder surface first; browser notification layer where supported | Keeps the SIH demo dependable while preserving the intended notification experience.[1][2] | Add native push notifications and background delivery. |
| Deployment | Vercel for the frontend, managed Supabase services for backend and database | Matches the supplied deployment direction.[2] | Add preview environments, observability, and staged releases. |

The source documents leave the exact hydration-goal formula open. Therefore, the prototype must treat the formula as a **versioned product rule**, not as a hard-coded medical claim. The formula and any activity multipliers should be configurable, documented, and reviewed before public use. The interface should describe the result as a personalized suggestion and should not present it as diagnosis or medical treatment.

## 3. System context

The system consists of six logical areas: the user interface, application service boundary, adaptive hydration engine, persistence layer, notification layer, and authentication/security boundary. The user interacts with the interface; the interface submits profile changes, temporary events, and reminder actions; the application layer validates the request and invokes the appropriate engine operation; the database stores both source inputs and derived outputs; and the notification layer exposes the next actionable reminder.

```text
+-------------------+       +------------------------+
| User              |       | Browser notification   |
| profile + actions |       | / in-app reminder      |
+---------+---------+       +-----------+------------+
          |                             ^
          v                             |
+---------+-------------------------------------------+
| React + Vite client with Tailwind UI                |
| onboarding | dashboard | schedule | history | modal |
+---------------------+-------------------------------+
                      |
                      v
+-----------------------------------------------------+
| Application service boundary                        |
| auth guard | input validation | command handlers    |
+---------------------+-------------------------------+
                      |
          +-----------+------------+
          |                        |
          v                        v
+---------+----------+   +---------+------------------+
| Supabase Auth      |   | Adaptive hydration engine |
| session + identity |   | goal | schedule | rules  |
+--------------------+   +---------+------------------+
                                    |
                                    v
                         +----------+----------------+
                         | Supabase PostgreSQL       |
                         | profiles | events | plan |
                         | logs | progress | audit  |
                         +---------------------------+
```

The client should not contain service-role credentials or bypass the application boundary for privileged operations. Public client configuration may identify the backend project, but secrets must remain in environment variables and server-side execution contexts.[2]

## 4. Major modules

### 4.1 Authentication and session module

The authentication module supports sign-in, sign-up, sign-out, and session restoration. The supplied UI concept includes Google, Apple, and email/password entry points.[3] The prototype may initially implement the provider set supported by the chosen backend configuration, but the screen contract should keep provider buttons replaceable.

Every protected query and mutation must be scoped to the authenticated user. Row-level access policies or equivalent backend rules must prevent one user from reading or modifying another user’s profile, events, schedules, logs, and progress.[2]

### 4.2 Profile and onboarding module

The onboarding module collects age, gender, weight, wake-up time, sleep time, and regular activities. It then requests the hydration-goal calculation and default schedule generation. The module should preserve a clear progression from identity to profile to schedule, matching the supplied flow: login/sign-up, profile setup, wake/sleep timings, regular activities, hydration goal, default schedule, and home dashboard.[1]

### 4.3 Daily changes module

The daily changes module accepts temporary events for the current date. The initial event types are `nap`, `gym`, `sports`, and `outing`, with start time, end time, intensity where relevant, and optional notes. The UI should distinguish recurring profile activities from temporary daily changes.

Creating, editing, or deleting a daily event is a schedule-affecting command. The service must validate that the event is within a coherent date/time range, persist it, and trigger a recalculation of the remaining schedule.

### 4.4 Adaptive hydration engine

The engine exposes pure or mostly pure functions so that the highest-risk product behavior can be unit-tested independently of the UI and database. The core responsibilities are as follows:

| Engine responsibility | Input | Output |
|---|---|---|
| Calculate base goal | Profile and goal-rule version | Daily target in milliliters |
| Generate default schedule | Target, wake time, sleep time, schedule policy | Ordered reminder slots |
| Apply nap pause | Existing slots and nap interval | Paused or redistributed slots |
| Apply activity increase | Existing slots and activity intensity/type | Adjusted target and activity impact metadata |
| Shift around outing | Existing slots and busy interval | Shifted slots without stacked reminders |
| Apply reminder action | Reminder, action, current progress | Updated reminder and progress state |
| Apply anti-spam rule | Consecutive ignored/skipped reminders | Follow-up or skipped amount decision |
| Evaluate streak | Daily progress and skip state | Current streak state and next-day behavior |

The engine must preserve traceability. Each derived schedule entry should carry enough metadata to explain whether it is normal, paused, shifted, or boosted. This supports the schedule timeline and makes the SIH demonstration understandable.

### 4.5 Reminder and action module

A reminder has three primary user actions: **Drank**, **Snooze 15m**, and **Skip**.[1] Drank records intake and increments consumed water. Snooze moves the reminder 15 minutes later while preserving the planned amount. Skip records the decision and invokes the anti-spam sequence.

The source behavior specifies one additional reminder after an ignored reminder. If the follow-up is also ignored, the scheduled amount is skipped and the system continues with the later schedule. After three consecutive skips, the daily streak breaks and reminders stop for the rest of the day; the next day resumes automatically.[1][2]

The action handler must be idempotent. Repeating the same request due to a network retry must not double-count water, create duplicate logs, or apply the same streak transition twice. A client-generated action key or server-side idempotency record should be used for mutations.

### 4.6 Progress, streak, history, and premium modules

Daily progress is derived from the target water, consumed water, skipped amount, and streak state. The dashboard needs the current goal, consumed amount, remaining amount, next reminder, and streak indicator.[1] History needs basic daily or weekly intake, skipped amounts, and streak tracking. The supplied future screen is a preview for weight-loss plans, weight-gain plans, diet suggestions, and weekly analytics; these are not part of the functional MVP.[1][3]

## 5. Data model

The following schema keeps source data separate from derived schedule and aggregate views. Identifiers are shown conceptually; the implementation may use UUIDs.

### 5.1 `profiles`

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | Authenticated user identifier and primary key. |
| `name` | Text | Display name. |
| `age` | Integer | User-provided age. |
| `gender` | Enum/Text | User-selected gender value. |
| `weight_kg` | Numeric | User-provided body weight. |
| `wake_time` | Time | Normal start of waking window. |
| `sleep_time` | Time | Normal end of waking window. |
| `regular_activities` | JSONB | Recurring activities selected during onboarding. |
| `daily_goal_ml` | Integer | Current derived target under the active goal-rule version. |
| `goal_rule_version` | Text | Version of the rule used to calculate the target. |
| `created_at`, `updated_at` | Timestamp | Audit timestamps. |

### 5.2 `daily_activities`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Event identifier. |
| `user_id` | UUID | Owning user. |
| `activity_date` | Date | Local calendar date. |
| `activity_type` | Enum/Text | `nap`, `gym`, `sports`, or `outing`. |
| `start_time`, `end_time` | Timestamp | Event interval in the user’s timezone. |
| `intensity` | Enum/Text | Optional intensity such as low, medium, or high. |
| `source` | Enum/Text | `recurring_profile` or `temporary_change`. |
| `created_at`, `updated_at` | Timestamp | Audit timestamps. |

### 5.3 `hydration_schedules`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Schedule entry identifier. |
| `user_id` | UUID | Owning user. |
| `schedule_date` | Date | Local calendar date. |
| `reminder_time` | Timestamp | Planned reminder time. |
| `water_amount_ml` | Integer | Planned amount. |
| `status` | Enum/Text | `pending`, `drank`, `snoozed`, `skipped`, or `paused`. |
| `state_reason` | Enum/Text | `normal`, `nap_pause`, `activity_boost`, `outing_shift`, or `anti_spam`. |
| `activity_impact` | JSONB | Explainable adjustment metadata. |
| `sequence_index` | Integer | Stable order within the day. |
| `engine_version` | Text | Schedule policy version. |
| `created_at`, `updated_at` | Timestamp | Audit timestamps. |

### 5.4 `water_logs`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Log identifier. |
| `user_id` | UUID | Owning user. |
| `schedule_id` | UUID, nullable | Related reminder when applicable. |
| `logged_at` | Timestamp | Time of action. |
| `amount_ml` | Integer | Consumed or skipped amount. |
| `action` | Enum/Text | `drank`, `snoozed`, `skipped`, or `ignored`. |
| `idempotency_key` | Text | Prevents duplicate action processing. |
| `metadata` | JSONB | Optional source and rule metadata. |

### 5.5 `daily_progress`

| Field | Type | Description |
|---|---|---|
| `user_id`, `progress_date` | UUID, Date | Composite identity. |
| `target_water_ml` | Integer | Daily target snapshot. |
| `consumed_water_ml` | Integer | Confirmed intake. |
| `skipped_water_ml` | Integer | Amount skipped or expired. |
| `consecutive_skips` | Integer | Current daily skip run. |
| `streak_status` | Enum/Text | `active`, `broken`, or `completed`. |
| `reminders_paused_for_day` | Boolean | True after the three-skip rule triggers. |
| `updated_at` | Timestamp | Last aggregate update. |

## 6. Schedule lifecycle

A schedule is generated for a local calendar date using the user’s timezone, profile, recurring activities, and temporary events. Recalculation must preserve completed actions while regenerating only future or affected pending entries. A recalculation should never silently erase a confirmed intake log.

```text
Profile or event change
        |
        v
Validate request and normalize local times
        |
        v
Load profile + recurring activities + daily events
        |
        v
Calculate target and create waking-hours baseline
        |
        v
Apply naps, activity boosts, and outing shifts
        |
        v
Redistribute affected amounts without stacking reminders
        |
        v
Persist schedule version and explainability metadata
        |
        v
Expose next reminder and timeline to the client
```

The engine should be deterministic for the same input snapshot and policy version. Schedule records should include the engine version so that later rule changes do not make historical behavior impossible to explain.

## 7. Command and read flows

| User action | Command path | Required result |
|---|---|---|
| Complete onboarding | Save profile -> calculate goal -> generate schedule | Profile, target, and first schedule become available on dashboard. |
| Add nap | Save daily activity -> recalculate future schedule | Reminders pause during the nap and affected hydration is redistributed. |
| Add gym/sports | Save activity -> recalculate target/schedule | Activity impact is visible and hydration suggestions increase around the session. |
| Add outing | Save busy interval -> recalculate future schedule | Reminders shift around the interval rather than stacking. |
| Tap Drank | Validate action -> write log -> update progress -> advance schedule | Consumed and remaining amounts update immediately. |
| Tap Snooze 15m | Validate action -> update reminder time | The amount is preserved and the reminder moves by 15 minutes. |
| Tap Skip or ignore | Write action -> evaluate anti-spam state | One follow-up only; then amount is skipped; after three consecutive skips, stop for day. |
| Open history | Read progress and logs | Basic intake, skipped amounts, and streak information are shown. |

## 8. Security, privacy, and reliability baseline

The prototype handles personal profile data and health-adjacent behavior. It should collect only the fields needed for the MVP, use authenticated access for all personal data, and provide a clear account deletion path before production use. Backend access policies must be tested with both authorized and unauthorized user contexts.

Credentials, service-role keys, and private configuration must be stored in environment variables and must never be hard-coded into the frontend bundle.[2] The client should validate inputs for sensible ranges and display understandable errors without leaking backend details.

The most important reliability property is **state consistency**. A reminder action must update the schedule, progress, history, and streak view from one authoritative mutation. Optimistic UI may be used for responsiveness, but it must reconcile with the server response and roll back on failure.

## 9. Observability and test seams

The engine should emit structured diagnostic metadata for schedule recalculations, including the input event set, rule version, affected entries, and reasons for pause, shift, boost, or skip. In the SIH prototype, this can be visible in development logs rather than a full observability platform.

The test suite should cover goal calculation boundaries, waking-window generation, overlapping events, nap pauses, activity boosts, outing shifts, redistribution, snooze, duplicate actions, ignored reminders, three consecutive skips, next-day reset, and timezone/date rollover. UI tests should verify that the dashboard, schedule timeline, reminder actions, and streak state reflect the same backend result.

## 10. Deployment topology

The frontend is deployed to Vercel. Supabase provides authentication, database access, and server-side functions or edge functions for protected schedule operations. Environment-specific configuration is injected at deploy time. Development, preview, and production data should be separated even if the SIH demonstration uses a lightweight environment.

```text
Developer / CI
      |
      +--> Vercel preview or production deployment
      |       |
      |       +--> React/Vite client
      |       +--> server-side command handlers where needed
      |
      +--> Supabase project
              +--> Auth
              +--> PostgreSQL
              +--> protected functions / policies
```

## 11. Future extensibility

Future premium capabilities should extend the goal-policy and insight layers rather than rewrite the core flow. Weight-loss and weight-gain plans, diet suggestions, weekly analytics, richer activity inputs, and more advanced personalization can be represented as additional policy versions and read models.[1][2] The MVP should not prematurely introduce machine learning or a complex event-driven architecture.

## References

[1]: file:///home/ubuntu/upload/HydroMind_SIH_Prototype_Specification.pdf "HydroMind SIH Prototype Specification"

[2]: file:///home/ubuntu/upload/HydroMind_Tech_Stack_Documentation.pdf "HydroMind Technology Stack & Technical Architecture"

[3]: file:///home/ubuntu/upload/HydroMind_UI_Screens.pdf "HydroMind UI Screens — Dark Glass System"
