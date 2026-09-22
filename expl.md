# TokenSeva — Patient Web App: Code Explainer

A front-end-only, phone-view prototype of a doctor-appointment booking app. No backend — everything
lives in React state/Context and resets on page reload. This document explains what's in the codebase,
how the screens connect, and what each function does.

---

## 1. Tech stack

| Piece | Choice | Notes |
|---|---|---|
| Build tool | **Vite** | `npm run dev`, `npm run build`, `npm run preview` |
| UI library | **React 19** | function components + hooks only, no class components |
| Styling | **Tailwind CSS v4** | via `@tailwindcss/vite` plugin, design tokens declared in `src/index.css` using `@theme` |
| Routing | **react-router-dom v7** | `BrowserRouter` + `Routes`/`Route`, client-side only |
| Icons | **lucide-react** | outline icon set, matches the design system's icon spec |
| Linting | **oxlint** | `npm run lint` |

No backend, no database, no auth server — "login" just stores whatever you typed in React state.

---

## 2. Project structure

```
src/
  main.jsx                 # React root, mounts <App/>
  App.jsx                  # Router setup, desktop/mobile gate, auth guard
  index.css                # Tailwind import + design tokens (@theme) + global resets

  context/
    AppContext.jsx          # The single global state store (auth, doctors, appointments, profile)

  data/
    doctors.js               # Static list of 8 doctors + getDoctorById()
    appointments.js          # Seed/starter appointments (upcoming + past)
    prescriptions.js         # Static per-doctor visit notes + getPrescriptions()
    user.js                   # Default patient profile

  lib/
    date.js                   # Small date-formatting helpers (no external date library)

  hooks/
    useIsMobileViewport.js    # Tracks window width to switch between app / desktop placeholder

  components/                # Reusable, presentation-focused building blocks (see §5)
  pages/                      # One file per screen, wired to routes (see §6)
```

---

## 3. Design tokens (`src/index.css`)

Tailwind v4's `@theme` block declares CSS custom properties that are then used everywhere via
`var(--color-*)` (in inline `style={{ }}` objects, not Tailwind color utility classes — this was done to
exactly match the hex values from the source design file):

```
--color-lime / --color-lime-pressed        → primary CTA button fill (#E0FF35 / #C9E82F)
--color-ink / --color-ink-pressed          → black structural/selected-state color (#242522 / #000000)
--color-bg                                  → app background (#F8F7F4, Home/Appointments-style screens)
--color-surface                             → white surface (#FFFFFF, cards, Login/Detail-style screens)
--color-surface-subtle                      → light grey fill (#F5F5F5, chips/inputs/subtle containers)
--color-border / --color-border-icon        → hairline border colors
--color-text-primary/secondary/muted/faint  → the 4-step text color ramp
--color-status-upcoming/completed/cancelled/pending (+ *-bg) → status badge colors
```

Font is **Inter** (400/500/600), loaded via Google Fonts `<link>` tags in `index.html`.

---

## 4. Routing map (`src/App.jsx`)

```
/                                   LoginPage            (public)
/home                               HomePage              (auth required)
/doctor/:doctorId                   DoctorDetailPage       (auth required)
/book/:doctorId                     BookingPage            (auth required)
/confirmation                       ConfirmationPage       (auth required)
/appointments                       AppointmentsPage       (auth required)
/appointments/:appointmentId/cancel CancelAppointmentPage   (auth required)
/prescriptions/:doctorId            PrescriptionPage        (auth required)
/profile                            ProfilePage             (auth required)
*                                   redirects to "/"
```

Key pieces in `App.jsx`:

- **`useIsMobileViewport()`** (from `hooks/useIsMobileViewport.js`) — if `window.innerWidth >= 640`,
  `App()` renders `<DesktopPlaceholder/>` instead of the router at all. That component is the centered
  "Go to mobile screen" message required by the spec. Below 640px, the real app renders inside a
  `max-width: 430px`, horizontally centered column (`mx-auto`).
- **`RequireAuth({ children })`** — a small wrapper component. Reads `isLoggedIn` from `useApp()`; if
  false, `<Navigate to="/" replace />`. Every route except `/` is wrapped in this.
- **`AppRoutes()`** — just the `<Routes>` tree above.
- **`DesktopPlaceholder()`** — static centered card with a phone icon + explanatory text, no logic.

---

## 5. Global state — `src/context/AppContext.jsx`

One React Context (`AppContext`) + provider (`AppProvider`) wraps the whole app (mounted in `App.jsx`).
Consumed anywhere via the `useApp()` hook. All state is plain `useState` — no reducer, no external state
library (not needed at this scale).

### State held
| State | Type | Purpose |
|---|---|---|
| `isLoggedIn` | boolean | Gates every route via `RequireAuth` |
| `profile` | `{name, phone, age, place}` | The signed-in patient's editable details, seeded from `data/user.js` |
| `appointments` | array | All appointments (seeded from `data/appointments.js`, then grows/mutates as you book/cancel) |
| `lastConfirmed` | `{appointment, doctor} \| null` | Set right after a successful booking; read by `ConfirmationPage` |

### Functions exposed by `useApp()`
- **`login(fields)`** — merges `fields` into `profile` and sets `isLoggedIn = true`. Uses
  `withoutUndefined()` (see below) so logging in with just a phone number doesn't wipe the default
  name/age/place.
- **`logout()`** — sets `isLoggedIn = false`.
- **`updateProfile(fields)`** — same merge-with-`withoutUndefined` used by the Profile screen's
  "Save changes".
- **`doctors`** / **`getDoctorById(id)`** — re-exported straight from `data/doctors.js`.
- **`confirmBooking(doctorId, date, time)`** — the core booking function. Looks up the doctor, generates
  a token via `nextToken()`, builds an `appointment` object (`status: "upcoming"`), prepends it to
  `appointments`, stores `{appointment, doctor}` in `lastConfirmed`, and returns the new appointment (or
  `null` if any argument is missing).
- **`cancelAppointment(id)`** — maps over `appointments`, flips the matching one's `status` to
  `"cancelled"`.
- **`getAppointmentById(id)`** — `appointments.find(...)`.

### Module-level helpers (not exported)
- **`nextToken(doctorId)`** — `let tokenCounter = 22` closured counter; returns
  `"<FirstLetterOfDoctorId>-<counter>"`, e.g. `"A-23"`. Simple, session-only, not persisted.
- **`withoutUndefined(fields)`** — `Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))`.
  **This was a real bug fix**: spreading `{...prev, ...fields}` in JS overwrites a key even if the new
  value is `undefined`. `LoginPage`'s simple "Log in" mode sends `{name: undefined, age: undefined, place: undefined}`
  (it only collects a phone number), and without this filter that call used to null out the profile's
  name, which then crashed `ProfilePage` (`profile.name.split(" ")` on `undefined`) and blanked the whole
  app. `login()`/`updateProfile()` both run every merge through this filter now.

---

## 6. Data files (`src/data/`)

- **`doctors.js`** — array of 8 doctors (`id, name, initials, specialty, clinic, location, fee,
  qualification, workingDays, bio, availability[], timeSlots[]`). `availability` is a list of
  `{days, hours, closed?}` rows shown on the Availability tab. `getDoctorById(id)` does a linear find.
- **`appointments.js`** — `initialAppointments`, 6 seeded rows spanning `upcoming`, `pending`,
  `completed`, `cancelled` statuses across 3 doctors, with real (computed) weekday labels relative to the
  app's "current" date.
- **`prescriptions.js`** — `prescriptions` object keyed by `doctorId → [{date, note}]`, plus
  `getPrescriptions(doctorId)` (returns `[]` if the doctor has no notes, which drives the empty state).
- **`user.js`** — `defaultProfile` (`Anjali Menon`, phone, age, place) used to seed `AppContext`'s
  `profile` state before a real login happens.

---

## 7. Shared components (`src/components/`)

Small, single-purpose, mostly styling wrappers — no business logic, all driven by props.

| Component | Props | What it renders |
|---|---|---|
| `Screen` | `header, footer, children, overlay, bg, bodyPadding` | The standard screen skeleton: fixed-height (`100dvh`) flex column with a `flex:none` header, a `flex:1 overflow-y:auto` scrollable body (padding shrinks automatically when there's no `footer`), an optional pinned `footer`, and an optional `overlay` rendered as a sibling (so it isn't clipped by the scrollable body — used for the calendar sheet). |
| `ScreenHeader` | `onBack, title, subtitle, avatarInitials, showAccount, onAccount` | The reusable back-button + title (+ optional avatar/subtitle for Prescription View) + account-icon header row used on Doctor Detail, Booking, Cancel, Prescription, Profile. |
| `CtaFooter` | `children` | The pinned-to-bottom `padding + 34px safe-area spacer` wrapper for primary action buttons. |
| `PrimaryButton` | `children, onClick, shadow, disabled` | The lime 52px/24px-radius CTA button. `shadow` is turned off on Home's doctor cards per the design spec. |
| `IconButton` | `icon, onClick, label, size, strokeColor, filled` | The circular 40×40 (or custom size) icon-only button with hover state, used for back/account/location/close icons everywhere. |
| `SelectableTile` | `selected, onClick, children, disabled` | Generic pill/tile used for date-strip days and time slots — black fill when selected, grey otherwise. |
| `StatusBadge` | `status, label` | Colored pill for appointment status (`upcoming/pending/completed/cancelled`), colors from the `TONES` map matching the design system's status palette. |
| `PillTabs` | `tabs, active, onChange` | The rounded-track "Upcoming / Past" tab switcher (Appointments screen). |
| `UnderlineTabs` | `tabs, active, onChange` | The underline-style "About / Availability / Reviews" tab switcher (Doctor Detail). |
| `Collapse` | `open, children` | CSS-only accordion using the `grid-template-rows: 0fr → 1fr` trick — powers the Login screen's hero image and form-section expand/collapse animation. |
| `DoctorCard` | `doctor, onBook` | The white card on Home's doctor list (name, specialty, clinic/fee, Book button). |
| `DoctorRow` | `doctor, size` | Compact initials-circle + name + specialty row, reused inside ticket cards (Booking, Confirmation, Cancel). |
| `InfoGrid` | `items: [{label, value}]` | 2-column label/value grid (Clinic/Location/Date/Time rows on ticket cards). |
| `TicketDivider` | `lineColor, notchColor` | The dashed-line-with-circular-notch-cutouts divider used on ticket cards — a `1.5px dashed` top border plus two small circles absolutely positioned to fake the "torn ticket" notches. |
| `TokenBlock` | `label, value` | Centered "YOUR TOKEN NUMBER / A-23" block. |
| `EmptyState` | `icon, title, description, dashed` | Generic empty-state card (used for "No reviews yet", "No notes yet", "No upcoming appointments", etc.). |
| `BottomNav` | *(none — reads route via `useLocation`)* | The floating pill tab bar (Doctors / Appointments) shown on Home and Appointments; highlights the active tab based on the current pathname and navigates with `useNavigate()`. |
| `CalendarSheet` | `month, selectedIso, onSelect, onClose` | The bottom-sheet full calendar overlay used by Booking's "Full calendar" button; renders a month grid via `lib/date.js`'s `monthGrid()`, disables past dates. |
| `PinInput` | `value, onChange, length, autoFocus` | The 6-box segmented PIN entry used in Login's phone→PIN step (see §8 for the auto-focus detail). |

---

## 8. Screens (`src/pages/`)

### `LoginPage.jsx`
- Local state: `expanded` (false = plain "Log in" flow; true = "Create account" flow with
  name/phone/age/place), `pinStep` (only meaningful when `!expanded` — has the phone-only step advanced to
  the PIN step yet?), `pin`, plus one `useState` per form field.
- **`awaitingPin`** — derived (`!expanded && pinStep`), the single flag that drives every bit of PIN-step
  UI: greeting copy, which section is expanded, the button label, and the submit-enabled check.
- The plain login flow is now **two steps**, both on the same screen/component (no route change):
  1. **Phone step** (`!expanded && !pinStep`) — just the phone number field. Button reads **"Continue"**,
     enabled once the phone field is non-empty.
  2. **PIN step** (`awaitingPin`) — the phone field stays visible (still editable), and a
     `<PinInput>` (see below) expands in below it via `<Collapse open={awaitingPin}>`. Button label
     switches to **"Log in"**, enabled only once all 6 digits are entered. Greeting text also switches to
     "Enter your PIN" / "We've sent a 6-digit PIN to +91 &lt;phone&gt;." (no real SMS is sent — it's a demo
     gate, a helper line under the PIN boxes says so).
- **`handlePrimaryAction()`** — the single handler behind that one button, since its job changes with the
  step: if in the phone step, it just calls `setPinStep(true)` (advances, doesn't log in yet); otherwise
  (PIN step, or the single-step signup flow) it calls `login({...})` from `useApp()` — passing `undefined`
  for any field not shown/filled, which is safe because of `withoutUndefined()` (see §5) — then
  `navigate("/home")`.
- **`handleToggleMode()`** — the "New here? Sign up." / "Already have an account? Log in." link handler;
  flips `expanded` and also resets `pinStep`/`pin`, so switching flows never leaves stale PIN-step state
  behind.
- No password/email — matches the actual source design (phone-number based login), not the more generic
  original brief. The signup ("Create account") flow is still single-step; the two-step phone→PIN flow only
  applies to plain login.

### `components/PinInput.jsx`
A 6-box segmented PIN/OTP input, styled to match the app's existing input language (grey
`surface-subtle` fill, no border by default) but with a distinct filled-state treatment appropriate for a
security code: each box gets a `1.5px solid var(--color-ink)` border once it has a digit, `56px` tall,
`20px/600` centered digit.
- Props: `value` (the full PIN string so far), `onChange(next)`, `length` (default 6), `autoFocus`.
- **`setDigitAt(index, digit)`** — immutably updates one character of the value string.
- **`handleChange(index, e)`** — strips non-digits, keeps only the last character typed (so pasting/fast
  typing into one box can't leave stale characters), writes it via `setDigitAt`, and auto-advances focus to
  the next box.
- **`handleKeyDown(index, e)`** — Backspace on an empty box moves focus back to the previous box (standard
  OTP-input UX).
- **`handlePaste(e)`** — lets you paste a full 6-digit code at once instead of typing digit-by-digit.
- The tricky bit: `autoFocus` is normally a mount-only HTML attribute, but `PinInput` stays mounted the
  whole time (its parent only toggles visibility via the `Collapse` grid-rows trick, never
  unmounts/remounts it) — so a plain `autoFocus` prop would only ever fire once, on the very first render,
  long before the PIN step is reached. Fixed with a `useEffect(() => { if (autoFocus) inputRefs.current[0]?.focus(); }, [autoFocus])`
  so focus jumps to the first box exactly when the PIN step actually opens.

### `HomePage.jsx`
- Local state: `query` (search text).
- `filtered` — `useMemo` filtering `doctors` by name/specialty/clinic against `query`.
- Renders the search bar, filter button (visual only, not wired), doctor count line, the `DoctorCard` list,
  and `<BottomNav/>`. Tapping a card's "Book appointment" calls `navigate(`/doctor/${id}`)` (i.e. goes to
  the doctor's profile first, matching the required flow, not straight to booking).
- Account icon (top right) → `navigate("/profile")`.

### `DoctorDetailPage.jsx`
- Reads `doctorId` from the route, looks it up via `getDoctorById`.
- Local state: `tab` (`"about" | "avail" | "rev"`), driving `<UnderlineTabs>` and which content block
  renders below it.
- Renders the initials avatar, name/specialty/clinic line, the black 3-stat strip (Qualification —
  truncated to just the first degree via `doctor.qualification.split(",")[0].trim()`, so "MBBS, MD" shows
  as "MBBS" here — / Working days / Consultation fee), the tabs, and a `CtaFooter` with "Book appointment"
  → `navigate(`/book/${doctor.id}`)`.
- **About tab** shows the *full* qualification string (not truncated) plus specialization and clinic, from
  `doctor.bio`/`doctor.qualification`/etc.
- **Availability tab** lists `doctor.availability` rows.
- **Reviews tab** is always the `EmptyState` "No reviews yet" — intentional; the source design has no
  review data model at all.

### `BookingPage.jsx`
- **`BookingPage()`** (the exported default) is a thin wrapper: reads `doctorId` from `useParams()` and
  renders `<BookingScreen key={doctorId} doctorId={doctorId} />`. The `key` forces React to fully remount
  the inner component whenever the doctor changes, so date/time selection state can never leak from one
  doctor's booking flow into another's.
- **`BookingScreen({ doctorId })`** holds the real logic:
  - Local state: `booking` (false = date/time-selection view, true = review/ticket view — both are the
    *same* screen/component, matching the spec), `calendarOpen`, `selectedDate`, `selectedTime`.
  - `dateStrip = nextDays(7)` (from `lib/date.js`) — the horizontal 7-day quick-pick strip.
  - **`handleSelectDate(date)`** — sets `selectedDate`, closes the calendar sheet.
  - **`handleContinue()`** — guards on both date and time being picked, then sets `booking = true`
    (switches to the review/ticket state).
  - **`handleConfirm()`** — calls `confirmBooking(doctor.id, selectedDate, selectedTime)` from
    `AppContext`; on success, `navigate("/confirmation")`.
  - Always-visible summary/ticket card (Booking-for / Self pill / doctor row / Clinic-Location-Date-Time
    grid / dashed divider) sits above the selector; when `!booking`, the date-strip + `CalendarSheet`
    trigger + time-slot chips render below it; when `booking`, only the ticket card shows, centered.
  - Footer button label swaps between "Continue" (disabled until both selections are made) and "Confirm".

### `ConfirmationPage.jsx`
- Reads `lastConfirmed` from `useApp()`. If it's `null` (e.g. the user navigated here directly without
  booking anything), a `useEffect` redirects to `/home` immediately.
- Renders the success checkmark, "Appointment confirmed" heading, and a ticket card built from the *real*
  `appointment`/`doctor` objects just confirmed (doctor row → Clinic/Date/Location/Time grid → "Get
  directions" button (visual only) → token number). Footer: "Go back to home" → `navigate("/home")`.

### `AppointmentsPage.jsx`
- Local state: `tab` (`"upcoming" | "past"`).
- `filtered` — `useMemo` splitting `appointments` by status (`upcoming`/`pending` → Upcoming tab;
  `completed`/`cancelled` → Past tab).
- **`groupByDoctor(list)`** (module-level helper) — groups the filtered appointments by `doctorId`,
  preserving first-seen order, so the UI can render one doctor header + a stack of that doctor's
  appointment cards.
- Each appointment card shows date/time + `StatusBadge`, then "Prescription" (→
  `/prescriptions/:doctorId`), "Invoice" (visual only, no target screen in scope), and — only for
  `upcoming`/`pending` cards — "Cancel" (→ `/appointments/:id/cancel`).
- Page background is white (`var(--color-surface)`); appointment cards themselves use the light-grey
  `surface-subtle` fill so they still stand out. `<BottomNav/>` at the bottom.

### `CancelAppointmentPage.jsx`
- Reads `appointmentId` from the route, resolves both the `appointment` and its `doctor`.
- **`handleCancel()`** — calls `cancelAppointment(appointment.id)`, then `navigate("/appointments")`.
- Same ticket-card layout as Confirmation (minus the "Get directions" button, minus the "Your" in "Token
  number"), with a destructive red confirm button in the footer instead of the lime CTA.

### `PrescriptionPage.jsx`
- Reads `doctorId` from the route; `notes = getPrescriptions(doctor.id)`.
- Header uses `ScreenHeader`'s `avatarInitials` variant (initials + doctor name + "Notes from your visits"
  subtitle).
- If `notes.length === 0`, shows the `EmptyState` "No notes yet"; otherwise renders one card per note
  (`date` + `note` paragraph).

### `ProfilePage.jsx`
- Local state: `name`, `age`, `place` (form fields, initialized from `profile`).
- **`initials`** — derived inline from `profile.name` (`.split(" ").map(p => p[0]).join("").slice(0,2)`).
- **`handleSave()`** — `updateProfile({name, age, place})`.
- **`handleLogout()`** — `logout()` then `navigate("/")`.
- Phone number is shown but **not editable** (locked pill with a lock icon) — matches the design.
- **`NavRow`** (local helper component) — the "My appointments" / "Prescriptions" link rows, each just a
  styled button that calls `navigate(...)`.
- Header has no account icon (`showAccount={false}` — you're already on the account screen); back arrow
  returns to `/home`.

---

## 9. Small utility modules

### `src/lib/date.js`
Pure functions, no dependencies:
- `toIso(date)` → `"YYYY-MM-DD"`.
- `describeDate(date)` → `{iso, dayAbbr ("MON"), dayNum, label ("Mon 23 Sep")}` — the shape used
  everywhere a "selected date" is passed around.
- `nextDays(count, from = new Date())` → array of `describeDate()` results for the next `count` days,
  starting today (powers Booking's date strip).
- `monthLabel(date)` → `"September 2026"`.
- `monthGrid(date)` → array of `Date | null` cells (padded with `null` for the blank days before the 1st)
  for rendering a calendar month grid.

### `src/hooks/useIsMobileViewport.js`
- `useIsMobileViewport()` → boolean, `true` when `window.innerWidth < 640`. Listens to the `resize` event
  and updates on the fly, so resizing a browser window live-toggles between the app and the desktop
  placeholder.

---

## 10. End-to-end user flow (as implemented)

1. **Login** (`/`) → type a phone number → "Continue" → screen expands to show a 6-digit `PinInput` →
   enter any 6 digits → "Log in" → `AppContext.login()` → `/home`.
   *(Optional: tap "New here? Sign up." — before or after the phone step — to switch to the single-step
   "Create account" flow that also collects name/age/place.)*
2. **Home** (`/home`) → search/browse doctor cards → tap a card's "Book appointment" → `/doctor/:id`.
3. **Doctor Detail** (`/doctor/:id`) → review About/Availability/Reviews → tap "Book appointment" →
   `/book/:id`.
4. **Booking** (`/book/:id`), selection state → pick a date (strip or full calendar sheet) and a time
   slot → "Continue" → same screen flips to the review/ticket state → "Confirm" →
   `AppContext.confirmBooking()` creates the appointment + token, stores it as `lastConfirmed` → `/confirmation`.
5. **Confirmation** (`/confirmation`) → shows the real doctor/date/time/token just booked → "Go back to
   home" → `/home`.
6. From **Home**'s account icon (or any screen's header account icon) → `/profile`.
7. **Profile** → "My appointments" → `/appointments` → tap "Prescription" on a card → `/prescriptions/:doctorId`,
   or tap "Cancel" on an upcoming/pending card → `/appointments/:id/cancel` → confirm → status flips to
   `cancelled` → back to `/appointments`.
8. "Log out" on Profile → `AppContext.logout()` → `/` (Login).

All of this is purely client-side state — refreshing the browser resets `AppContext` back to its seeded
defaults (`data/*.js`).

---

## 11. Known deliberate simplifications

- **No payment step.** The source design's Booking screen had a "Pay at clinic" secondary action tied to
  a payment flow; since there's no backend/payment here, Booking just goes Continue → Confirm.
- **No ratings/reviews data.** The Reviews tab is always the empty state — this matches the actual source
  design file, which never designed a populated reviews UI.
- **"Invoice" button is visual only** — no Invoice screen was in the required 9-screen scope.
- **Desktop breakpoint is 640px** (Tailwind's `sm`) — below it you get the real 430px-max-width app,
  centered; at/above it, the "Go to mobile screen" placeholder.
