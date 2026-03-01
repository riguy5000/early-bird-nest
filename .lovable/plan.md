

# Take-In Page Fixes and License Scanning Feature

## Issues to Fix

### 1. Duplicate Metal Price Ticker
`TakeInBalanced.tsx` renders its own `MetalPriceTicker` at line 239, while the parent `TakeInPage.tsx` already renders one at line 315. The one inside `TakeInBalanced` will be removed.

### 2. Duplicate Category Quick-Add Buttons
`TakeInPage.tsx` renders category chips (Jewelry, Watch, Bullion, etc.) with item count and +/- controls at lines 319-397. Then `TakeInBalanced.tsx` renders nearly identical category buttons with Plus icons at lines 248-276. The duplicate inside `TakeInBalanced` will be removed since the parent already handles this.

### 3. Customer Drawer - Slide from Right
Currently `CustomerDrawer.tsx` uses `side="bottom"`. This will be changed to `side="right"` with proper width for a clean right-side slide-in panel.

### 4. Customer Drawer UI/UX Cleanup
- Improve the drawer layout for better mobile/desktop compatibility
- Clean up spacing and visual hierarchy
- Make the drawer properly scrollable

### 5. AI-Powered License Scanning
Replace the mock "Scan License" with real AI-powered OCR using the Lovable AI Gateway.

**Flow:**
1. User clicks "Scan Customer ID" or "Scan License"
2. Two photo capture steps appear: **Front of License** and **Back of License**
3. Both images are sent to a new `scan-license` edge function
4. The AI (Gemini 2.5 Flash with vision) extracts: Full Name, Date of Birth, Address, Gender, License Number, and attempts to find email/phone if visible
5. The AI also checks if the front image is clear/not hazy and warns the user if it's blurry
6. Extracted data auto-fills the form fields

## Technical Details

### New Edge Function: `supabase/functions/scan-license/index.ts`
- Accepts `front_image_base64` and `back_image_base64`
- Uses Lovable AI Gateway with `google/gemini-2.5-flash` (vision model)
- Uses tool calling to return structured data: `{ name, dateOfBirth, address, gender, licenseNumber, email, phone, image_quality }`
- Handles rate limit (429) and credit (402) errors

### Updated `supabase/config.toml`
- Register `scan-license` function with `verify_jwt = false`

### Updated `components/store/CustomerDrawer.tsx`
- Change `side="bottom"` to `side="right"` with `className="w-full sm:w-[440px]"`
- Replace mock `handleLicenseScan` with two-step photo capture (front + back)
- Add loading state during AI analysis
- Auto-populate fields from AI results
- Show image quality warning if the photo is blurry
- Merge "Scan License" and "Photo OCR" into a single unified flow

### Updated `components/store/TakeInBalanced.tsx`
- Remove the `MetalPriceTicker` import and rendering (line 31, lines 238-241)
- Remove the "Category Quick Actions" section (lines 247-276) since parent handles it
- Remove the duplicate top navigation bar (lines 205-236) that conflicts with parent's header

### Updated `components/store/TakeInPage.tsx`
- No changes needed (already has the metal ticker and category controls)

