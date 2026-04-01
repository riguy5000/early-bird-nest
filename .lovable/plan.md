

# Remove Save Toggle, Rename "Details" to "Item Specs", Add Clear/Save Buttons

## Changes (all in `components/store/TakeInBalanced.tsx`)

### 1. Remove the Save toggle
Delete the `Switch` and "Save" label (lines 368-373) from each item row. The toggle is non-functional and confusing.

### 2. Rename "Details" to "Item Specs"
Change the collapsible trigger text from "Details" to "Item Specs" (line 377). This makes it clear the section is for adding specifications about the item (brand, condition, size, notes, photos).

### 3. Add Clear and Save buttons inside the expanded "Item Specs" section
At the bottom of the collapsible content area (around line 557, after the Notes/Photos grid), add a row with two buttons:
- **Clear** — resets the expanded fields (brand, condition, size, notes) back to empty for that item. Ghost/outline style.
- **Save** — closes the collapsible section (collapses it) and shows a toast confirming specs were saved. Primary style, solid blue pill.

Both buttons will be right-aligned, pill-shaped, and consistent with the existing design language.

