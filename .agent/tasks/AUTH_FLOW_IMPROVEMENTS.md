# Auth Flow Improvements

## Requirements

### Problem 1: Existing Users Redirected to Tutorial Instead of Dashboard
**Current Issue**: Logged-in users who click the "アプリを開く" button get redirected to the tutorial page in non-logged-in form instead of the dashboard.
**Expected**: Existing users should be redirected to `/dashboard` after pressing "アプリを開く" button.

### Problem 2: New Users Don't Get Chance to Open App
**Current Issue**: When a new user signs up and clicks the verification email link, they see the "アプリを開く" page for only a second before diving to the tutorial page, without providing the opportunity to start the app.
**Expected**: New users should see the "アプリを開く" page and STAY there until they click the button. Only after clicking should they be redirected to `/tutorial` in logged-in form.

### Problem 3: Missing Google Sign-Up Option
The sign-up page (`/signup`) doesn't have a "Sign up with Google" option, while the login page (`/login`) does have "Sign in with Google". This creates an inconsistent user experience.

---

## Plan

### Task 1: Fix Electron Callback Flow for Both New and Existing Users
**File**: `CueMeWeb/src/app/auth/callback/page.tsx`

**Root Cause Analysis**:
1. **Existing users issue**: The `isNewUser` detection is too broad - it's marking existing users as new because of the 60-second window check
2. **New users issue**: The page is NOT staying on the "アプリを開く" screen - it's auto-redirecting somewhere

**Correct Flow Should Be**:

**For Existing Electron Users (Login)**:
1. User logs in → redirected to `/auth/callback?redirect_to=...electron-callback`
2. Page shows "アプリを開く" button and STAYS there (no auto-redirect)
3. User clicks button → app opens → page redirects to `/dashboard`

**For New Electron Users (First Signup)**:
1. User signs up → receives email → clicks verification link
2. Redirected to `/auth/callback?redirect_to=...electron-callback&is_new_user=true`
3. Page shows "アプリを開く" button and STAYS there (no auto-redirect)
4. User clicks button → app opens → page redirects to `/tutorial`

**For Web Users (No Electron)**:
1. New user: Auto-redirect to `/tutorial` (no button shown)
2. Existing user: Auto-redirect to `/dashboard` (no button shown)

**Solution**:
1. **Fix isNewUser detection**: Only use `is_new_user` query param and metadata, NOT the 60-second window (too unreliable)
2. **Remove auto-redirect for Electron users**: The page should ONLY redirect after button click, never automatically
3. **Keep auto-redirect for web users**: They don't need the button, so redirect immediately

---

### Task 2: Update Email Signup to Pass is_new_user Flag
**File**: `CueMeWeb/src/app/(auth)/signup/page.tsx`

**Current Issue**: Email signup doesn't pass `is_new_user=true` in the callback URL, so new users aren't detected properly.

**Solution**: Modify `handleSignUp` to include `is_new_user=true` in the `emailRedirectTo` URL for Electron users.

```typescript
emailRedirectTo: redirectTo.startsWith('cueme://') 
  ? `${redirectUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}&is_new_user=true`
  : `${redirectUrl}/auth/callback?is_new_user=true`
```

---

### Task 3: Add Google Sign-Up to Sign-Up Page
**File**: `CueMeWeb/src/app/(auth)/signup/page.tsx`

**Current State**: Only has email/password signup form

**Solution**: Add Google OAuth button similar to login page

**Implementation**:
1. Add `handleGoogleSignUp` function (similar to `handleGoogleLogin` in login page)
2. Add "または" divider after the email/password form
3. Add "Googleで登録" button with same styling as login page
4. Handle redirect_to parameter for Electron deep linking (same as login)

**Code to Add**:
```typescript
const handleGoogleSignUp = async () => {
  setLoading(true);
  
  const isDev = process.env.NODE_ENV === 'development';
  const redirectUrl = isDev ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.includes('electron-callback') 
        ? `${redirectUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`
        : `${redirectUrl}/auth/callback`,
      data: {
        is_new_user: true, // Mark as new user for first-time redirect
      }
    },
  });
  
  if (error) {
    setMessage(error.message);
    setLoading(false);
  }
};
```

**UI Changes**:
- Add divider after the "アカウント作成" button
- Add "Googleで登録" button with same styling as login page
- Ensure consistent spacing and layout

---

## Implementation Order

1. **Task 1**: Fix callback page logic (most critical)
   - Remove 60-second window check from isNewUser detection
   - Ensure Electron users STAY on button page (no auto-redirect)
   - Only redirect after button click
   
2. **Task 2**: Update email signup to pass is_new_user flag

3. **Task 3**: Add Google sign-up button (already done, just verify)

---

## Testing Checklist

### Critical Flows to Test:

**Existing Electron User (Login)**:
- [ ] User logs in with email/password or Google
- [ ] Redirected to callback page with "アプリを開く" button
- [ ] Page STAYS on button screen (no auto-redirect)
- [ ] Click button → app opens → redirects to `/dashboard` (logged in)

**New Electron User (First Signup)**:
- [ ] User signs up with email → receives verification email
- [ ] Clicks email link → redirected to callback page with "アプリを開く" button
- [ ] Page STAYS on button screen (no auto-redirect)
- [ ] Click button → app opens → redirects to `/tutorial` (logged in)

**New Electron User (Google Signup)**:
- [ ] User clicks "Googleで登録" → OAuth flow
- [ ] Redirected to callback page with "アプリを開く" button
- [ ] Page STAYS on button screen (no auto-redirect)
- [ ] Click button → app opens → redirects to `/tutorial` (logged in)

**Web Users (No Electron)**:
- [ ] New user signs up → auto-redirects to `/tutorial` (no button)
- [ ] Existing user logs in → auto-redirects to `/dashboard` (no button)

---

## Files to Modify

1. `CueMeWeb/src/app/auth/callback/page.tsx` - Add new user detection for Electron flow
2. `CueMeWeb/src/app/(auth)/signup/page.tsx` - Add Google sign-up button

---

## Completion Status

- [x] Task 1: Fix Electron callback flow - Removed 60-second window check, ensured no auto-redirect for Electron users
- [x] Task 2: Update email signup to pass is_new_user flag in callback URL
- [x] Task 3: Google Sign-Up Button - Already implemented
- [x] **CRITICAL FIX**: Removed is_new_user from user metadata (was persisting forever causing bugs)
- [x] **DATABASE FIX**: Cleared is_new_user flag from existing user "0f990634-95b0-4f01-8470-9081c5034cf4"
- [x] **ELECTRON FIX**: Added emailRedirectTo to Electron app signup with redirect_to parameter
- [ ] Testing completed
- [ ] Documentation updated

## Root Cause Analysis (Post-Implementation)

### Critical Bug Discovered: is_new_user Persisting in User Metadata

**Problem**: User "0f990634-95b0-4f01-8470-9081c5034cf4" was always redirected to tutorial even after multiple logins.

**Root Cause**: 
1. During signup, we stored `is_new_user: true` in user metadata via the `data` field
2. User metadata persists FOREVER in Supabase - it never gets cleared
3. The callback page checked BOTH query param AND metadata: `isNewUserParam === 'true' || data.session.user?.user_metadata?.is_new_user`
4. Since metadata always had `is_new_user: true`, the user was always considered "new"

**Solution**:
1. ✅ Removed `data: { is_new_user: true }` from signup - don't store in metadata at all
2. ✅ Changed callback logic to ONLY check query parameter: `isNewUserParam === 'true'`
3. ✅ Cleared the flag from existing affected user in database
4. ✅ Added comments to prevent future developers from making the same mistake

**Database Fix Applied**:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'is_new_user' 
WHERE id = '0f990634-95b0-4f01-8470-9081c5034cf4';
```

**Verification**: User metadata now correctly shows no `is_new_user` flag.

### Second Bug Discovered: Electron App Signup Missing emailRedirectTo

**Problem**: First-time users signing up from Electron app were getting redirected to tutorial immediately without seeing the "アプリを開く" button.

**Root Cause**:
1. The Electron app's `signUpWithEmail` method didn't pass `emailRedirectTo` option
2. Supabase used default redirect URL without `redirect_to` parameter
3. Verification email link was: `https://www.cueme.ink/auth/callback#access_token=...`
4. Callback page didn't detect `redirect_to=...electron-callback`, so it auto-redirected to tutorial

**Solution**:
✅ Added `emailRedirectTo` to Electron app's signup method:
```typescript
options: {
  emailRedirectTo: `${siteUrl}/auth/callback?redirect_to=${encodeURIComponent('cueme://auth-callback')}&is_new_user=true`
}
```

Now verification emails will include the `redirect_to` parameter, so the callback page will show the button and wait for user to click it.

---

## Implementation Summary

### Task 1: Callback Page Logic - COMPLETED
**Changes Made**:
- ✅ Removed 60-second window check from all `isNewUser` detection (3 locations)
- ✅ Now only checks `is_new_user` query param and user metadata
- ✅ Added comment to prevent auto-redirect for Electron users
- ✅ Electron users stay on button page until they click

**Code Changes**:
```typescript
// Before (WRONG - marks existing users as new):
const isNewUser = isNewUserParam === 'true' || 
                 data.session.user?.user_metadata?.is_new_user || 
                 (new Date(data.session.user?.created_at || '').getTime() > Date.now() - 60000)

// After (CORRECT - only checks explicit flags):
const isNewUser = isNewUserParam === 'true' || 
                 data.session.user?.user_metadata?.is_new_user
```

### Task 2: Email Signup - COMPLETED
**Changes Made**:
- ✅ Updated `emailRedirectTo` to include `is_new_user=true` query parameter
- ✅ Works for both Electron and web flows

**Code Changes**:
```typescript
// Before:
emailRedirectTo: redirectTo.startsWith('cueme://') 
  ? `${redirectUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`
  : `${redirectUrl}/auth/callback`

// After:
emailRedirectTo: redirectTo.startsWith('cueme://') 
  ? `${redirectUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}&is_new_user=true`
  : `${redirectUrl}/auth/callback?is_new_user=true`
```

### Task 3: Google Sign-Up - ALREADY COMPLETED
- ✅ Google OAuth button added to signup page
- ✅ Passes `is_new_user=true` in callback URL
