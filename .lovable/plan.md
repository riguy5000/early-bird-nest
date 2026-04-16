
Goal: make Login, Take-In, Dashboard, Inventory, Customers, Payouts, Analytics, and Settings share one identical continuous background, with no route-specific variation.

What I found
- The approved gradient is already defined in `src/index.css`:
  `linear-gradient(to right, #FFF3FF, #F5EBFF, #E8E6FF, #C8DCFF)`
- But the app currently paints background in multiple places:
  - `src/index.css` on `html, body`
  - `components/AuthenticationFlow.tsx` via `page-gradient`
  - `components/store/TakeInPage.tsx` via `page-gradient`
  - `src/App.tsx` wraps auth/app/loading states with `bg-background`
- That means some pages use a full-viewport gradient, some use a nested element gradient, and some are sitting on a solid token background. Even if the colors match, nested gradients restart from the container bounds, so they do not visually line up as one continuous page background.

Implementation plan
1. Establish one single source of truth for the app background
- Keep the approved 4-stop gradient in one place only.
- Best implementation: render one fixed full-viewport background layer at the top app shell in `src/App.tsx`, behind everything.

2. Remove competing page-level backgrounds
- Remove `page-gradient` from:
  - `components/AuthenticationFlow.tsx`
  - `components/store/TakeInPage.tsx`
- Those containers should become transparent layout shells only.

3. Remove solid wrappers that can flatten or alter the look
- Replace app-level `bg-background` wrappers in `src/App.tsx` with transparent wrappers for:
  - loading state
  - unauthenticated auth shell
  - authenticated app shell
- This ensures the same background is visible everywhere.

4. Normalize the background token usage
- Update `src/index.css` so `.page-gradient` and the fixed app background use the exact same gradient token/value, or retire `.page-gradient` entirely if it is no longer needed.
- Prevent any future drift by centralizing the gradient as a named CSS variable.

5. Verify every route against the same source
- Confirm the exact same background shows through on:
  - Login
  - Take-In
  - Dashboard
  - Inventory
  - Customers
  - Payouts
  - Analytics
  - Settings
- Also check seams at the header edge and behind right-side drawers/sheets so the glass surfaces sit on the same backdrop everywhere.

Technical notes
- Root runtime entry is `src/App.tsx` via `src/main.tsx`; the top-level `App.tsx` file appears to be an older duplicate and should not be treated as the live shell unless imports are changed.
- The core bug is not the hex values themselves; it is multiple layers painting the background in different coordinate spaces.
- If needed, I will use this structure in `src/App.tsx`:

```text
App shell
└── fixed inset-0 approved-gradient
└── relative z-10
    ├── auth flow
    └── CRM app
```

Result after implementation
- One background
- One gradient
- Same visual match on Login, Take-In, and every CRM page
- No more “close but different” gradient behavior between modules
