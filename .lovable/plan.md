

## Root Cause: Auth Token Refresh Triggers Full App Re-mount

The flickering is caused by **Supabase auth token refresh events** in `src/App.tsx`.

### The Problem

The `onAuthStateChange` listener (line 117) only handles two events:
- `SIGNED_IN` → calls `resolveProfile()` (re-fetches user data, sets loading state)
- `SIGNED_OUT` → clears user

But Supabase fires **other events** periodically:
- `TOKEN_REFRESHED` — every ~55 minutes when the JWT is renewed
- `INITIAL_SESSION` — on first load

When `TOKEN_REFRESHED` fires:
1. The session is valid, so it doesn't hit the `SIGNED_OUT` branch
2. It's not `SIGNED_IN`, so nothing happens — BUT the real issue is actually the **race between `getSession()` and `onAuthStateChange`**

More importantly, `SIGNED_IN` fires **every time** the auth listener is set up if a session already exists. This calls `resolveProfile()` again, which **doesn't set `isLoading = true`** but does call `setUser()` and `setIsAuthenticated()` with new object references, causing the entire app tree (`JewelryPawnApp`, `TakeInPage`, modals) to **re-render and reset local state** — closing any open modals like AI Assist.

### The Fix

**File: `src/App.tsx`**

1. **Ignore redundant auth events** — Only call `resolveProfile` if the user isn't already authenticated. Handle `TOKEN_REFRESHED` as a no-op (the session is still valid, no need to re-fetch the profile).

2. **Guard against duplicate profile resolution** — Add a ref flag (`isResolvingRef`) to prevent concurrent `resolveProfile` calls from racing.

3. **Handle all auth events properly**:
   - `SIGNED_IN` → resolve profile only if not already authenticated
   - `TOKEN_REFRESHED` → do nothing (session is still valid)
   - `SIGNED_OUT` → clear user
   - `INITIAL_SESSION` → resolve profile only if not already authenticated

The key change (conceptual):

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    // clear state
    return;
  }
  // Only resolve profile on first sign-in, not on token refresh
  if (event === 'TOKEN_REFRESHED') return;
  if (isAuthenticated) return; // already resolved
  resolveProfile(session);
});
```

This single change prevents the entire component tree from re-mounting when the token refreshes, which is what causes open modals (like AI Assist) to disappear.

### Technical Details

- No database changes needed
- No new files needed
- Only `src/App.tsx` needs to be modified
- The fix adds ~5 lines of guard logic to the existing auth listener

