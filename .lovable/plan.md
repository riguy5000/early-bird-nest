# Auto-fill Stone Details from Description (Loose Stones)

## Goal

In the Loose Stones tab, when the user types into the item description (e.g. "round red diamond"), the **Stone Details** section should auto-populate:

- **Stone Type** (e.g. Diamond)
- **Shape** (e.g. Round)
- **Color** (e.g. Red)

This mirrors the behavior that already exists for `subType` chips, but extends it to the three Stone Details fields shown directly below the description.

## Scope

- File: `components/store/TakeInBalanced.tsx`
- Category: **Stones** only — no other category is touched
- UI/styling/layout: unchanged
- Persistence: uses the existing `updateSpec` / `onItemUpdate` path so values persist on save like any other spec

## Behavior rules

1. Trigger: runs in the same `useEffect` keyed on description (`item.itemType`) for Stones items.
2. Matching: case-insensitive, whole-word (same `phraseMatches` helper already in the file). "Ruby" matches "ruby" but not "rubylike".
3. Source lists:
   - Stone Type → existing `STONE_TYPE_OPTIONS` constant
   - Shape → existing `STONE_SHAPE_OPTIONS` constant
   - Color → new small list of common color keywords: Red, Blue, Green, Yellow, Pink, Purple, White, Black, Brown, Orange, Champagne, Colorless (free-text field stays free-text — the auto-fill just writes the matched word)
4. Respect manual input — only auto-fill a field if it is currently empty. If the user has typed/selected a value for Stone Type, Shape, or Color, do not overwrite it. (Same philosophy used for subType, but stricter: no replacement on later keyword changes for these fields.)
5. If multiple keywords from the same list match, pick the longest (same tie-break used for subType).
6. Single batched update per item via `onItemUpdate(item.id, { specs: { ...current.specs, ... } })` to avoid the race condition pattern already documented in this file.

## Technical sketch

In the existing description-watching `useEffect` (around line 364), add a second pass for `item.category === 'Stones'`:

```ts
if (item.category === 'Stones') {
  const text = (item.itemType || '').trim();
  const specs = item.specs || {};
  const patch: Record<string, string> = {};

  const pickBest = (list: string[]) => {
    let best = ''; let len = 0;
    for (const w of list) {
      if (phraseMatches(w, text) && w.length > len) { best = w; len = w.length; }
    }
    return best;
  };

  if (!specs.stoneType) {
    const m = pickBest(STONE_TYPE_OPTIONS);
    if (m) patch.stoneType = m;
  }
  if (!specs.shape) {
    const m = pickBest(STONE_SHAPE_OPTIONS);
    if (m) patch.shape = m;
  }
  if (!specs.color) {
    const m = pickBest(COLOR_KEYWORDS);
    if (m) patch.color = m;
  }

  if (Object.keys(patch).length) {
    onItemUpdate(item.id, { specs: { ...specs, ...patch } });
  }
}
```

Add a module-level constant near the existing stone option lists:

```ts
const COLOR_KEYWORDS = ['Red','Blue','Green','Yellow','Pink','Purple','White','Black','Brown','Orange','Champagne','Colorless'];
```

## Verification

1. Add a Loose Stones item, type "round red diamond" in the description → Stone Type = Diamond, Shape = Round, Color = Red.
2. Clear description, type "oval sapphire" → Stone Type = Sapphire, Shape = Oval (Color stays whatever it was, since not empty).
3. Manually select Stone Type = Ruby, then type "diamond" in description → Stone Type stays Ruby (no overwrite).
4. Confirm subType chips still behave as before (unchanged code path).
5. Save the item, reopen — populated values persist.
6. Confirm no visual/layout changes anywhere.
