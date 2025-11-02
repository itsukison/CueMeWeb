# Public Pages Improvements Task

**Status**: ✅ COMPLETED

## Requirements

### 1. Make Subscription & Tutorial Pages Public
- Move `/dashboard/subscription` and `/dashboard/tutorial` to be accessible without login
- Update navigation links in landing page:
  - "料金" button → `/subscription` (public)
  - "デモを見る" button → `/tutorial` (public)

### 2. Conditional Subscription Page Display
- Check if user is logged in
- **Logged in**: Show current plan + upgrade/downgrade options (existing behavior)
- **Not logged in**: Show only the 3 plan cards without user-specific data

### 3. Tutorial Page Enhancements
- Add demo.mp4 video at the top of the page
- Apply styling from `CueMeFinal/.agent/styling.MD`:
  - Remove emojis
  - Use consistent color palette (#F3F2F1, #FEFEFE, #D8F9B8, #2B2D2D)
  - Apply 12-16px border radius
  - Use minimal shadows with layering approach

### 4. First-Time User Redirect
- Redirect new signups to `/tutorial` instead of `/dashboard`
- Update auth callback logic to detect first-time users
- Preserve existing redirect behavior for returning users

## Implementation Plan

### Phase 1: Move Pages to Public Routes (30 min)
1. Create `/src/app/subscription/page.tsx` (copy from dashboard)
2. Create `/src/app/tutorial/page.tsx` (copy from dashboard)
3. Update landing page navigation links
4. Keep dashboard versions for backward compatibility (optional)

### Phase 2: Conditional Subscription Display (20 min)
1. Add auth check in subscription page
2. Create two render modes:
   - Authenticated: Full user dashboard
   - Unauthenticated: Plan comparison only
3. Hide user-specific elements when not logged in

### Phase 3: Tutorial Page Styling (45 min)
1. Add video player at top with demo.mp4
2. Remove all emoji usage
3. Apply color system from styling.MD:
   - Background: #F3F2F1
   - Cards: #FEFEFE
   - Accent: #D8F9B8
   - Text: #2B2D2D
4. Update border radius to 12-16px
5. Replace heavy shadows with subtle layering

### Phase 4: First-Time User Flow (30 min)
1. Add user metadata check in auth callback
2. Detect if user is signing up for first time
3. Redirect to `/tutorial` for new users
4. Redirect to `/dashboard` for returning users
5. Update signup flow to set first-time flag

## Files to Modify

### New Files
- `CueMeWeb/src/app/subscription/page.tsx`
- `CueMeWeb/src/app/tutorial/page.tsx`

### Modified Files
- `CueMeWeb/src/components/landing-page.tsx` (navigation links)
- `CueMeWeb/src/app/auth/callback/page.tsx` (first-time redirect)
- `CueMeWeb/src/app/(auth)/signup/page.tsx` (optional: set metadata)

## Estimated Time
Total: ~2 hours

## Implementation Summary

### Completed Changes

**Phase 1: Public Routes Created ✅**
- Created `/src/app/subscription/page.tsx` - Public subscription page with conditional rendering
- Created `/src/app/tutorial/page.tsx` - Public tutorial page with demo video
- Updated landing page navigation:
  - "料金" button → `/subscription`
  - "デモを見る" button → `/tutorial`

**Phase 2: Conditional Subscription Display ✅**
- Added `isAuthenticated` state check
- Unauthenticated users see:
  - All 3 plan cards
  - "無料で始める" / "プランを選択" buttons that redirect to login
  - No user-specific data or billing portal
- Authenticated users see:
  - Current plan badge
  - Upgrade/downgrade options
  - Billing portal access
  - Pending downgrade notices

**Phase 3: Tutorial Page Styling ✅**
- Added demo video player at top with `/demo.mp4`
- Applied consistent color system:
  - Background: #F3F2F1 (bg-app-bg)
  - Cards: #FEFEFE (bg-card-light)
  - Accent: #D8F9B8 (bg-accent-lime)
  - Text: #2B2D2D (text-text-primary)
- Removed all emojis
- Applied 12-16px border radius (rounded-container, rounded-xl)
- Used minimal shadows with layering approach
- Maintained all existing content and functionality

**Phase 4: First-Time User Redirect ✅**
- Updated auth callback to detect new users:
  - Checks `user_metadata.is_new_user` flag
  - Falls back to checking if account created within last minute
- New users redirect to `/tutorial`
- Returning users redirect to `/dashboard` (or custom redirect_to)
- Updated signup to set `is_new_user` metadata flag

### Files Modified
- ✅ `CueMeWeb/src/app/subscription/page.tsx` (new)
- ✅ `CueMeWeb/src/app/tutorial/page.tsx` (new)
- ✅ `CueMeWeb/src/components/landing-page.tsx` (navigation links)
- ✅ `CueMeWeb/src/app/auth/callback/page.tsx` (first-time redirect logic)
- ✅ `CueMeWeb/src/app/(auth)/signup/page.tsx` (metadata flag)

### Testing Checklist
- [ ] Visit `/subscription` without login - should show 3 plans with login CTAs
- [ ] Visit `/subscription` with login - should show current plan and management options
- [ ] Visit `/tutorial` - should show demo video and styled content
- [ ] Click "料金" in navbar - should go to `/subscription`
- [ ] Click "デモを見る" in hero - should go to `/tutorial`
- [ ] Sign up new account - should redirect to `/tutorial` after email confirmation
- [ ] Login existing account - should redirect to `/dashboard`

## Notes
- No domain changes needed - all routing is handled by Next.js
- Keep dashboard versions as fallback/legacy routes
- Video file location: `/public/demo.mp4`
- Styling reference: `CueMeFinal/.agent/styling.MD`
