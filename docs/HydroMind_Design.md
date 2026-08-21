# HydroMind Design

**Document status:** Pre-prototype design baseline  
**Product:** HydroMind — Adaptive Hydration Assistant  
**Author:** Manus AI  
**Last updated:** 20 August 2026

## 1. Design intent

HydroMind should feel like a calm, intelligent companion rather than a noisy alarm. The experience must make the system’s adaptation visible: a nap pauses reminders, a gym or sports session increases hydration suggestions, and an outing shifts reminders instead of stacking them.[1] The interface therefore treats the schedule as a living plan and gives users enough context to understand why the next sip changed.

The supplied screen set establishes a **dark-glass mobile visual language** with deep green-black surfaces, mint/cyan primary accents, soft luminous CTAs, rounded cards, subtle borders, and restrained secondary text.[3] The prototype should preserve that direction while ensuring that the most important actions remain readable and usable on small screens.

> **Experience principle:** Make the adaptive behavior legible in one glance, actionable in one tap, and forgiving when the user misses a reminder.

## 2. Design principles

### 2.1 Calm over urgency

Hydration reminders should be supportive, not punitive. A missed reminder produces one controlled follow-up rather than a notification loop. The interface should explain the current consequence without using shame-based language. The daily streak is motivating feedback, but it should never obscure the user’s current hydration state.

### 2.2 Context before quantity

The product’s key value is not simply displaying a water total. It is showing how today’s context changed the plan. Schedule entries should therefore display short reasons such as `nap pause`, `gym boost`, or `outing shift` where relevant.[1][3]

### 2.3 One primary action per surface

Each screen should have a clear next step. Onboarding uses Continue; the reminder uses Drank; Today's Changes uses Add; the schedule uses the current reminder as the visual anchor. Secondary actions remain available but visually quieter.

### 2.4 Progressive disclosure

The dashboard surfaces today’s goal, progress, remaining water, next reminder, and changes. Deeper schedule details, event editing, history, and future features live in dedicated destinations. This keeps the home surface useful without turning it into a settings panel.

### 2.5 Honest personalization

The interface should say **suggested**, **planned**, or **adjusted** rather than implying medical certainty. Goal and activity changes should be explainable through small labels or an expandable detail view.

### 2.6 Consistent state language

The same visual state must mean the same thing everywhere. A boosted schedule item, a paused item, a skipped reminder, and a locked premium item should each have a stable color, icon treatment, label, and interaction rule.

## 3. Visual foundation

### 3.1 Color tokens

The cover of the supplied UI deck annotates a palette built around mint, deep mint, blue, and an almost-black background.[3] The following tokens convert that direction into implementation-ready names. The values are a starting point and should be validated for contrast during implementation.

| Token | Suggested value | Usage |
|---|---:|---|
| `color.bg` | `#05010D` | Global page background and deepest app canvas. |
| `color.surface` | `rgba(16, 36, 34, 0.72)` | Primary glass cards and panels. |
| `color.surface-strong` | `rgba(25, 48, 45, 0.92)` | Modal surfaces and high-priority cards. |
| `color.border` | `rgba(174, 255, 235, 0.16)` | Subtle glass outline. |
| `color.mint` | `#4EFDD1` | Primary action, progress, active navigation, focus indicator. |
| `color.mint-deep` | `#0D9488` | Supporting gradient, progress depth, and selected-state shadow. |
| `color.blue` | `#5EC8F2` | Water semantics and informational accents. |
| `color.text-primary` | `#F5FFFC` | Main headings and high-priority values. |
| `color.text-secondary` | `#A7B9B5` | Supporting copy and metadata. |
| `color.text-muted` | `#70827E` | Disabled, inactive, or tertiary labels. |
| `color.warning` | `#FFB16D` | Streak risk, skip context, and activity boost emphasis. |
| `color.danger` | `#FF7C8C` | Destructive or broken-state feedback only. |
| `color.locked` | `#B58B5B` | Premium lock treatment. |

Primary CTAs should use a mint gradient or high-contrast mint fill against the dark surface. The surrounding glow must be restrained; the CTA should look luminous without becoming visually louder than the action itself.

### 3.2 Typography

Use a modern sans-serif typeface with strong legibility at mobile sizes. The hierarchy should use weight and spacing before decorative effects. Headings are bold and bright, while explanatory copy is compact and muted.

| Style | Weight | Approximate size | Usage |
|---|---:|---:|---|
| Display | 700–800 | 28–34 px | Welcome titles and major hero values. |
| Screen heading | 700 | 22–26 px | Page titles such as Home Dashboard and Daily Schedule. |
| Card heading | 650–700 | 15–18 px | Card titles and active reminder labels. |
| Body | 400–500 | 14–16 px | Explanations, field labels, and supporting copy. |
| Caption | 500–600 | 10–12 px | Metadata, state labels, timestamps, and step indicators. |
| Numeric emphasis | 700 | Context-dependent | Goal, consumed, remaining, streak, and water amount. |

Text should not rely on letter spacing or all caps alone to communicate meaning. Small uppercase labels may be used for metadata, but their contrast and size must remain readable.

### 3.3 Shape, depth, and atmosphere

Cards and controls use generous rounding, generally between 14 and 24 px depending on size. The phone mockups in the screen set use highly rounded outer frames, while internal cards use a smaller radius.[3] Use a single-pixel translucent border, a soft background gradient, and a low-opacity shadow to produce the glass effect.

The background may include oversized blurred teal shapes or radial gradients at the edges, as shown in the UI deck. These shapes are decorative only and must not reduce text contrast or compete with the progress visualization.

### 3.4 Spacing and layout

Use a 4 px base spacing unit with 8 px as the dominant rhythm. Mobile content should have a 20–24 px horizontal page inset. Cards should use 16–20 px internal padding. Touch targets should be at least 44 px high even when the visual control appears smaller.

## 4. Component system

| Component | Purpose | Required states |
|---|---|---|
| `GlassCard` | Shared surface for dashboard, event, history, and premium content. | Default, highlighted, disabled, locked. |
| `PrimaryButton` | Main CTA such as Continue, Sign In, Drank, or Notify me. | Default, pressed, loading, disabled, success. |
| `SecondaryButton` | Lower-priority action such as Snooze or Schedule. | Default, pressed, disabled. |
| `TextField` | Email, password, time, or numeric profile input. | Empty, focused, filled, invalid, disabled. |
| `ChoicePill` | Gender, activity, and filter selection. | Unselected, selected, pressed, disabled. |
| `StatusChip` | Temporary change, streak, schedule reason, or warning. | Normal, active, boosted, paused, warning. |
| `ProgressOrb` | Liquid-style dashboard visualization for consumed vs target water. | Empty, partial, complete, loading. |
| `MetricCard` | Remaining water, next sip, average intake, best streak, skipped amount. | Default, warning, empty, loading. |
| `TimelineItem` | Reminder slot in the daily schedule. | Upcoming, current, completed, snoozed, skipped, paused, boosted. |
| `BottomNavigation` | Home, Schedule, History, Profile destinations. | Active, inactive, disabled. |
| `ReminderSheet` | Focused interactive reminder with three actions. | Pending, snoozed, skipped warning, completed, error. |
| `LockedFeatureCard` | Premium/future feature preview. | Locked, waitlisted, unavailable. |
| `Toast` / `InlineNotice` | Confirmation and errors without disrupting the flow. | Success, info, warning, error. |

The component API should accept semantic variants rather than page-specific color values. For example, a schedule item should request `state="paused"`, and the theme should determine the treatment consistently.

## 5. Screen specifications

### 5.1 Login / Sign Up

The screen is the entry point and should establish the product promise immediately: hydration that moves with the user’s day rather than a fixed timer. The supplied screen includes Google and Apple sign-in, an email field, a password field, a primary Sign In button, and a Create account link.[1][3]

The primary CTA should be visually dominant. Social buttons should be secondary but clearly recognizable. Validation should be inline, concise, and placed near the field that needs attention. The screen should support both sign-in and sign-up without making the user search for the mode switch.

### 5.2 Profile Setup

Profile Setup is a guided form for age, weight, gender, wake-up time, sleep time, and regular activities.[1][3] The supplied layout uses a progress indicator and presents the user’s answers as compact cards and pills. Keep the page vertically scannable: identity inputs first, routine inputs second, activity choices third, and Continue last.

Time fields should use the user’s locale and clearly display AM/PM or 24-hour notation. Activity selection should support multiple values. If an input is optional, the screen must state that explicitly instead of silently accepting an empty value.

### 5.3 Home Dashboard

The dashboard is the daily control center. It should show the date, greeting, streak, liquid-style consumed/goal visualization, remaining amount, next reminder, Today's Changes entry point, quick actions, and bottom navigation.[1][3]

The progress orb is the visual anchor, but it must have an adjacent textual value so that the result is not communicated through shape or color alone. The next reminder card should show time and amount, with a clear indication when the reminder is currently due. Today's Changes should be a prominent shortcut because it is the primary adaptive behavior demonstrated in the prototype.

### 5.4 Today’s Changes

This screen manages temporary events for the current day: Nap, Extra Gym, Travel/Outing, and Sports.[1][3] Active events appear as chips near the top. The four event cards should explain the behavioral effect in one short sentence: naps pause reminders, extra gym boosts intake, outings shift reminders, and sports raises the target or adds an activity impact.

Adding an event should open a compact form with date context, start time, end time, and activity-specific details. Overlapping or invalid time ranges should be surfaced before submission. After save, show a confirmation that the schedule is being recalculated and return the user to a timeline or summary of the updated plan.

### 5.5 Daily Schedule

The schedule is a vertical timeline of planned amounts and reminder times. It should highlight the current or next reminder, visually dim completed or later items, and label paused or boosted sections directly.[3] The schedule should make it possible to answer three questions: what is next, what changed, and why.

A nap interval can be rendered as a contained paused block. An activity boost should use a warm accent and a short reason label, while an outing shift should retain the original event context without implying that the user missed anything.

### 5.6 Interactive Reminder

The reminder surface should be lightweight enough to operate without navigating through the app where platform support allows it. The supplied concept uses a modal card with a water icon, amount, reminder sequence context, and Drank, Snooze 15m, and Skip actions.[1][3]

Drank is the primary action. Snooze is a clear secondary action. Skip should remain available but visually quieter, and the surface should show the current anti-spam consequence such as “one more skip pauses reminders for today.” The wording must remain factual and non-judgmental.

### 5.7 History / Analytics

The MVP history surface should provide basic daily hydration history, skipped amounts, and streak tracking.[1] The supplied screen uses a weekly chart area, summary metrics, a streak calendar, and a skipped-amount list.[3]

The chart should have a useful empty state and should not suggest a trend when there is insufficient data. Summary cards should label units explicitly. The streak calendar should use shape, text, or accessible labels in addition to color so that users can distinguish completed, partial, skipped, and unavailable days.

### 5.8 Premium / Future

The premium screen is a preview, not an MVP feature. It may list weight-loss hydration plans, weight-gain hydration plans, diet suggestions, and weekly analytics as locked features, with a non-functional Notify me at launch CTA.[1][3] The screen should clearly communicate that these features are not available in the current prototype and should not imply a purchase flow unless billing is actually implemented.

## 6. Interaction and state model

HydroMind’s most important interaction is the transition from a planned reminder to a user action. The visual system must expose the state without requiring the user to infer it.

| State | Meaning | Visual treatment | User action |
|---|---|---|---|
| Upcoming | Planned future reminder. | Low-emphasis timeline node and muted text. | Open details or wait. |
| Current | Next actionable reminder. | Mint ring, brighter text, and prominent card. | Drank, Snooze 15m, or Skip. |
| Completed | User confirmed intake. | Mint check or filled node; retain amount. | View only. |
| Snoozed | Reminder moved by 15 minutes. | Clock label and updated time. | Wait or act when due. |
| Paused | Reminder suppressed during nap/sleep. | Dimmed block with pause reason. | View context or edit event. |
| Boosted | Amount or target adjusted for activity. | Warm accent and activity label. | View context. |
| Skipped | Planned amount was not consumed. | Muted or warning label with amount. | View history. |
| Streak risk | User is approaching the three-skip rule. | Amber inline notice; avoid full-screen alarm. | Drank, Snooze, or Skip knowingly. |
| Day paused | Three consecutive skips triggered stop for the day. | Clear banner and neutral explanation. | Review tomorrow’s restart or history. |
| Locked | Future feature is unavailable. | Muted card, lock icon, explicit label. | Optional notify/waitlist action. |

Every state transition should result in a visible confirmation. A successful Drank action can update the progress orb, remaining amount, next reminder, and timeline in one motion. A failed network action should preserve the previous state and show a retry path.

## 7. Responsive behavior

The primary composition is mobile-first. On narrow screens, cards stack vertically, the progress orb remains centered, and the bottom navigation stays fixed within the safe area. On larger screens, the app may use a centered content column with a wider schedule or a two-column dashboard, but the information hierarchy should not change.

The desktop or tablet layout must not simply stretch the phone mockup. Content should reflow into a readable max-width container, maintain comfortable line lengths, and keep the current reminder visible without forcing excessive scrolling.

## 8. Accessibility baseline

The prototype should use semantic headings, labels, buttons, and form controls. Focus states must be visible against the dark background, and keyboard users should be able to reach every action in a predictable order. Color must not be the only indicator of paused, boosted, skipped, completed, or locked states.

Motion should be subtle and optional. Liquid progress animation, glowing CTA transitions, and schedule recalculation feedback must respect reduced-motion preferences. Screen-reader labels should expose the numeric values behind the progress orb, the reason behind a schedule adjustment, and the consequence of an anti-spam state.

All time and quantity values should be readable in text. Use `250 ml` rather than relying on a visual icon, and provide accessible names for icons such as the water drop, nap, gym, sports, and outing symbols.

## 9. Content and tone

HydroMind copy should be concise, calm, and specific. The vocabulary should emphasize the user’s agency:

| Situation | Preferred copy | Avoid |
|---|---|---|
| Reminder due | “Time to hydrate” | “You failed to drink” |
| Nap applied | “Reminders paused during your nap” | “Hydration missed” |
| Outing applied | “We shifted reminders around your outing” | “Schedule disrupted” |
| Activity boost | “+300 ml around your gym session” | “You must drink more” |
| Skip warning | “One more skip pauses reminders for today” | “Do not skip again” |
| Day paused | “Reminders paused for today; your schedule resumes tomorrow” | “Streak destroyed” |
| Goal context | “Today’s suggested goal” | “Required medical amount” |

## 10. Design acceptance criteria

The design is ready for prototype implementation when every MVP screen has a defined primary action, every core schedule state has a visual treatment, and the main demonstration path can be understood without an external explanation. The dashboard must clearly connect to Today’s Changes and Daily Schedule; the schedule must visibly distinguish paused and boosted segments; the reminder must expose all three actions; and the history screen must make streak and skipped-volume information legible.

The final visual review should check contrast, touch target size, loading and empty states, invalid form states, error recovery, reduced motion, and responsive behavior at representative mobile and desktop widths.

## References

[1]: file:///home/ubuntu/upload/HydroMind_SIH_Prototype_Specification.pdf "HydroMind SIH Prototype Specification"

[2]: file:///home/ubuntu/upload/HydroMind_Tech_Stack_Documentation.pdf "HydroMind Technology Stack & Technical Architecture"

[3]: file:///home/ubuntu/upload/HydroMind_UI_Screens.pdf "HydroMind UI Screens — Dark Glass System"
