# Full Backend Implementation — Phased Plan

## Why Phases?
This touches every layer: DB schema, auth, edge functions, RLS, UI, and runtime enforcement. Doing it all at once risks breaking the app entirely. Each phase delivers working, testable functionality.

---

## Phase 1: Database Schema + Real Auth Login
**Goal:** Replace mock localStorage auth with real Supabase Auth. Create normalized tables.

### Database Changes
- Create `stores` table (id, name, type, address, phone, email, timezone, logo_url, owner_auth_user_id)
- Create `employee_profiles` table (id, auth_user_id, store_id, first_name, last_name, email, phone, role, is_active, avatar_url, invited_by, invite_status, last_login_at)
- Create `employee_permissions` table (id, employee_profile_id, all permission booleans)
- Create `employee_visibility_overrides` table (id, employee_profile_id, all visibility booleans)
- Add proper foreign keys and RLS policies
- Keep existing `store_settings` table but stop using its `employees` JSON blob for auth

### Auth Changes
- Replace localStorage/sessionStorage login with `supabase.auth.signInWithEmailAndPassword()`
- After login: resolve employee_profile → store_id → role → permissions → visibility
- Block inactive employees
- Route to correct UI based on role
- Update `last_login_at` on successful login

### Deliverable: Users can log in with real Supabase Auth, and the app resolves their store/role/permissions from the database.

---

## Phase 2: Employee Creation + Invite Flow
**Goal:** Store Admin can create employees (Method A: manual) and invite them (Method B: email link).

### Manual Creation (Method A)
- Edge function `create-employee` that:
  - Creates Supabase Auth user (using service role)
  - Creates employee_profile row
  - Creates employee_permissions row with role defaults
  - Creates employee_visibility_overrides row with store defaults
- Wire the Store Settings → Employees tab to use this

### Email Invite (Method B)
- Edge function `invite-employee` that:
  - Creates a pending employee_profile with invite_status = 'pending'
  - Generates a secure invite token
  - Sends invite email
- Invite acceptance page where employee completes profile + sets password
- Updates invite_status to 'accepted'

### Password Reset
- Wire Supabase Auth password reset for employees
- Store Admin can trigger reset from employee list

### Deliverable: Full employee lifecycle — create, invite, accept, login, reset password.

---

## Phase 3: Permissions + Visibility Enforcement
**Goal:** All permissions and visibility settings actually control the UI.

### Navigation Enforcement
- Hide sidebar modules based on employee permissions (can_access_take_in, can_access_inventory, etc.)
- Block direct route access for unauthorized modules

### Take-In Page Enforcement
- Hide profit/payout%/market value based on resolved visibility
- Disable rate editing if !can_edit_rates
- Hide Save For Later if disabled in store settings
- Hide batch photos if disabled
- Block Complete Purchase if customer info required but missing
- Block completion if payout info required but missing
- Enforce default payout method
- Enforce split payout setting

### Other Module Enforcement
- can_print_labels, can_print_receipts → hide print buttons
- can_delete_items → hide delete actions
- can_complete_purchase → hide/disable Complete Purchase
- can_reopen_transactions → hide reopen action

### Deliverable: Every permission toggle and visibility toggle actually controls the UI.

---

## Phase 4: Settings Enforcement (Intake, Payout, Compliance, Print, etc.)
**Goal:** All remaining store settings drive actual runtime behavior.

### Intake Defaults
- Default fast entry mode, default category, auto-focus, card layout
- AI Assist enable/disable

### Payout Defaults
- Default payout method preselection
- Split payout enable/disable
- Require payout info before completion

### Rate Defaults
- Default payout percentages prefill new items
- Rate edit permissions enforced

### Compliance
- Hold period, threshold warnings, manager approval
- Required fields enforcement (ID, phone, email, address, DOB, gender)
- Signature requirement
- Employee name attached to transaction

### Print Settings
- Auto-print behaviors
- Label content toggles
- Hide payout % on printed docs

### Notifications (if implemented in UI)
- Wire notification triggers

### Appearance
- Theme, compact mode, accent color

### Advanced
- Archive, draft save, duplicate detection, keyboard shortcuts, lock transactions

### Deliverable: Every setting in Store Settings actually affects app behavior.

---

## Phase 5: RLS Hardening + Cleanup
**Goal:** Secure the database and remove all mock/placeholder code.

- Replace open RLS policies with proper scoped policies
- Store admins can only manage their own store
- Employees can only read their own store's data
- Remove all hardcoded store1/emp1 references
- Remove localStorage auth remnants
- Remove window.location.reload() hacks
- Final security audit

### Deliverable: Production-ready security and no placeholder code.

---

## Estimated Scope
Each phase is a significant implementation. I recommend we go phase by phase, testing each before moving to the next.

**Shall I start with Phase 1?**
