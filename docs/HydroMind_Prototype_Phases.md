# HydroMind Prototype Phases

**Document status:** Pre-prototype execution roadmap  
**Product:** HydroMind — Adaptive Hydration Assistant  
**Author:** Manus AI  
**Last updated:** 20 August 2026

## 1. Roadmap purpose

This roadmap converts the supplied six-phase coding plan into an implementation sequence for the HydroMind SIH prototype.[1] The order is designed to reduce rework: establish the product contract and visual foundation first, build the user-facing flow, add persistence, implement the adaptive engine, integrate all state transitions, and then harden the result for demonstration.

The prototype is considered successful when a reviewer can start with a user profile, generate a schedule, add a nap, gym or sports session, and outing, see the plan adapt, act on reminders, and observe progress and streak behavior update in the dashboard and history.[1]

## 2. Phase overview

| Phase | Name | Primary outcome | Depends on |
|---:|---|---|---|
| 0 | Documentation and decision gate | Approved architecture, design, PRD, and execution contract | Source PDFs |
| 1 | Project setup | Running application shell with styling, environment, auth boundary, and deployment path | Phase 0 |
| 2 | Frontend experience | All MVP screens and local interaction states are navigable | Phase 1 |
| 3 | Backend and persistence | Authenticated storage for profiles, activities, schedules, logs, and progress | Phase 1; screen contracts from Phase 2 |
| 4 | Recommendation engine | Deterministic goal, scheduling, adaptation, skip, and streak rules | Phase 0; data model from Phase 3 |
| 5 | Integration and validation | Frontend, backend, engine, and reminder actions operate as one product flow | Phases 2–4 |
| 6 | SIH polish and demonstration | Responsive, visually consistent, reliable demo-ready prototype | Phase 5 |

Phase 0 is added as a formal gate because the user requested architecture, design, phases, and PRD files before the actual prototype. The supplied technical document begins with project setup, so Phase 0 represents the documentation and decision work required to make that setup unambiguous.[2]

## 3. Phase 0 — Documentation and decision gate

### Goal

Convert the supplied product specification, technical stack direction, and UI screen set into a single implementation contract.

### Scope

The team reviews and approves `architecture.md`, `design.md`, `phases.md`, and `prd.md`. The team also confirms the backend provider, goal-rule assumptions, supported notification behavior, sample data strategy, and the exact SIH demonstration path.

### Outputs

| Output | Definition of done |
|---|---|
| Architecture baseline | Modules, data model, data flow, security boundary, and engine seams are specified. |
| Design baseline | Visual tokens, screen behavior, states, responsive rules, and accessibility baseline are specified. |
| PRD baseline | MVP requirements, exclusions, user stories, and acceptance criteria are testable. |
| Implementation decision log | Supabase/Firebase choice, goal-rule version, notification scope, and deployment target are recorded. |
| Demo script | The sequence for nap, activity boost, outing shift, reminder actions, and streak protection is explicit. |

### Exit criteria

No coding phase should begin until the team agrees on the MVP boundary, the data fields, the schedule-state vocabulary, and the prototype fallback behavior for notifications. The hydration goal formula must be treated as a configurable product rule and not silently invented during implementation.

## 4. Phase 1 — Project setup

The supplied coding plan defines project setup as the first implementation phase: frontend, styling system, backend connection, environment variables, and deployment structure.[1] The purpose of this phase is to establish a small but real vertical foundation before building individual screens.

### Workstreams

| Workstream | Deliverable |
|---|---|
| Application shell | React/Vite project with route structure and error boundary. |
| Styling | Tailwind configuration, dark-glass tokens, typography, spacing, responsive container, and reusable surface primitives. |
| Backend connection | Supabase client or equivalent adapter with typed configuration. |
| Authentication boundary | Session provider, protected routes, initial sign-in/sign-up flow, and sign-out. |
| Environment setup | Documented local and deployment variables with no secrets committed to source control. |
| Deployment | Vercel preview deployment with a health check and a repeatable build command. |
| Seed strategy | Safe demo-user and realistic sample-data plan that can be reset. |

### Exit criteria

A reviewer can load the app, see the HydroMind visual system, reach an authentication screen, and open a protected shell in a preview deployment. A failed backend connection produces a readable error state rather than a blank page.

## 5. Phase 2 — Frontend experience

The source plan calls for Login, Profile Setup, Home Dashboard, Today’s Changes, Schedule, Reminder UI, and History screens, with a future premium screen.[1] This phase builds the complete navigation and interaction language using local or fixture data where backend behavior is not yet available.

### Screen sequence

1. Login / Sign Up establishes the entry point and product promise.
2. Profile Setup collects the inputs required by the goal and schedule engine.
3. Home Dashboard displays goal, consumed, remaining, streak, next reminder, and Today’s Changes.
4. Today’s Changes adds temporary nap, gym, sports, and outing events.
5. Daily Schedule renders the timeline with normal, paused, shifted, boosted, and current states.
6. Interactive Reminder presents Drank, Snooze 15m, and Skip.
7. History / Analytics shows basic intake, skipped amounts, and streak tracking.
8. Premium / Future previews locked capabilities without pretending that billing or recommendations exist.

### Exit criteria

The complete MVP flow is navigable on a mobile viewport and a wider viewport. Every screen has loading, empty, invalid, and recoverable error states. The Schedule and Reminder surfaces can be demonstrated with fixture data before the backend is connected.

## 6. Phase 3 — Backend and persistence

The backend phase implements authentication, users, activities, hydration schedules, water logs, and daily progress, matching the supplied backend structure.[1] The reference architecture uses Supabase, but the service boundary should make a Firebase substitution possible if needed.[2]

### Workstreams

| Workstream | Deliverable |
|---|---|
| Profiles | CRUD for the authenticated user’s profile and goal-rule snapshot. |
| Daily activities | CRUD for temporary events and read access to recurring activities. |
| Schedules | Persisted date-scoped schedule entries with state and explainability metadata. |
| Water logs | Append-only action records with reminder linkage and idempotency key. |
| Daily progress | Aggregate target, consumed, skipped, consecutive skips, and streak state. |
| Access control | User-scoped policies tested for both allowed and denied access. |
| Seed/reset | Repeatable demo data setup for the SIH narrative. |

### Exit criteria

A signed-in user can save a profile, load it again, create a daily event, read a date-scoped schedule, record an action, and reload the dashboard without losing state. A second user cannot read or mutate the first user’s data.

## 7. Phase 4 — Recommendation engine

The recommendation engine is the product’s differentiator. The source specification requires base goal calculation, default schedule generation, activity adjustments, nap pauses, reminder shifts, redistribution, reminder actions, anti-spam control, and streak rules.[1] The technical documentation explicitly recommends a predictable rule-based implementation.[2]

### Engine contract

The engine should expose versioned operations similar to the following conceptual interface:

```text
calculateGoal(profile, policyVersion) -> GoalResult
buildBaselineSchedule(goal, wakingWindow, policyVersion) -> Schedule
applyDailyChanges(schedule, activities, progress, policyVersion) -> Schedule
applyReminderAction(schedule, progress, reminderId, action) -> MutationResult
evaluateSkipState(progress, actionHistory) -> SkipDecision
evaluateStreak(progress, skipDecision) -> StreakResult
```

The exact goal formula must be selected and documented before production use. For the SIH prototype, the implementation should favor a transparent formula with named parameters, sensible validation, and a visible “suggested goal” label. The engine should never create reminders outside the waking window, should pause or shift affected slots, and should redistribute amounts without stacking the entire backlog into one moment.

### Rule acceptance criteria

| Rule | Acceptance test |
|---|---|
| Waking window | Baseline reminders occur between wake and sleep time only. |
| Nap | Reminders inside a nap interval are paused or redistributed after the interval. |
| Gym/sports | Activity impact is recorded and hydration suggestions increase around the activity according to the selected policy. |
| Outing | Reminders overlapping a busy interval shift without creating a burst of stacked notifications. |
| Drank | Intake is logged once and consumed/remaining values update. |
| Snooze | The selected reminder moves exactly 15 minutes while preserving amount. |
| Ignore | Exactly one follow-up is allowed before the amount is skipped. |
| Three skips | The streak breaks and reminders stop for the remainder of the day. |
| Next day | Reminders resume automatically with a new daily state. |
| Recalculation | Completed intake remains preserved while future schedule entries are recalculated. |

### Exit criteria

The engine passes unit tests for all rules, produces deterministic output for a fixed input snapshot, and provides enough reason metadata for the Schedule screen to explain each adjustment.

## 8. Phase 5 — Integration and validation

The source plan identifies integration as the point where frontend state, backend data, and recommendation logic are connected so reminder actions update progress immediately.[1] This phase should focus on state consistency rather than adding new features.

### Integration path

```text
Onboarding save
  -> profile persisted
  -> goal calculated
  -> schedule generated
  -> dashboard loaded

Today's Changes save
  -> event persisted
  -> future schedule recalculated
  -> timeline refreshed
  -> next reminder updated

Reminder action
  -> action validated
  -> water log written
  -> progress and streak updated
  -> schedule state advanced
  -> dashboard, schedule, and history reconciled
```

### Validation matrix

| Scenario | Expected visible result |
|---|---|
| New profile | Goal and baseline schedule appear inside waking hours. |
| Nap added | Schedule shows a paused window and adjusted later reminders. |
| Extra gym added | Activity chip appears and a boosted entry is visible in the schedule. |
| Outing added | Overlapping reminders shift rather than stack. |
| Drank | Progress increases and next reminder advances. |
| Snooze 15m | Reminder time moves and the amount remains unchanged. |
| One skip | Warning context appears and only one follow-up is scheduled. |
| Two ignored/skipped reminders | The scheduled amount is skipped and later schedule continues. |
| Three consecutive skips | Streak status becomes broken and reminders are paused for the day. |
| Reload | State remains consistent across dashboard, schedule, and history. |

### Exit criteria

The complete demonstration path works using persisted data, with no manual database edits between steps. Errors can be retried, duplicate action submissions do not double-count water, and the app remains usable if notification permission is unavailable.

## 9. Phase 6 — SIH polish and demonstration readiness

The final source phase is SIH polish: responsive layout, visual consistency, reliability, and realistic sample data.[1] The goal is not to expand scope; it is to remove distractions from the core story.

### Polish checklist

| Area | Completion standard |
|---|---|
| Visual consistency | Tokens are used consistently; no one-off colors or incompatible radii remain. |
| Responsive behavior | Core screens work at representative mobile and desktop widths. |
| Accessibility | Keyboard focus, labels, contrast, semantic structure, and reduced motion are reviewed. |
| Data quality | Demo data uses plausible, internally consistent times, amounts, and event labels. |
| Reliability | Loading, errors, empty states, retry behavior, and duplicate actions are covered. |
| Performance | No unnecessary blocking work occurs on the initial dashboard load. |
| Copy | Product language is calm, specific, and consistent with the design document. |
| Demo reset | The demonstration can return to a known starting state quickly. |
| Deployment | Preview URL, environment variables, and fallback mode are documented. |

### Final SIH demonstration script

The presenter should begin with a completed profile and show the generated daily schedule. Next, they should add a nap and point to the paused timeline interval. They should add a gym or sports session and show the boosted hydration suggestion. They should add an outing and show that reminders shifted rather than stacked. Finally, they should execute Drank, Snooze 15m, and Skip, then demonstrate the one-follow-up anti-spam rule and the three-skip streak break before returning to the dashboard to show updated consumption, remaining water, and streak status.[1]

## 10. Definition of prototype complete

HydroMind is prototype-complete when the MVP requirements in `prd.md` are implemented, the state transitions in `architecture.md` are testable, the screen behavior in `design.md` is recognizable in the running application, and the demonstration script can be completed from a clean reset without developer intervention.

The following items are explicitly outside the completion gate: weight-loss and weight-gain plans, diet suggestions, weekly analytics beyond basic history, advanced personalization, paid premium access, and a production-grade native notification infrastructure.[1]

## References

[1]: file:///home/ubuntu/upload/HydroMind_SIH_Prototype_Specification.pdf "HydroMind SIH Prototype Specification"

[2]: file:///home/ubuntu/upload/HydroMind_Tech_Stack_Documentation.pdf "HydroMind Technology Stack & Technical Architecture"

[3]: file:///home/ubuntu/upload/HydroMind_UI_Screens.pdf "HydroMind UI Screens — Dark Glass System"
