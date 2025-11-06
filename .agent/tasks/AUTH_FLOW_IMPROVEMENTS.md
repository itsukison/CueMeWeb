# Auth Flow Improvements

## Requirements

### Problem 1: Missing App Authentication Page for New Users
When users first create an account and receive the email, they should see the "アプリを認証ページ" (App Authentication Page) before being redirected to the tutorial page. Currently, they get redirected directly to the tutorial without the chance to open the app.

### Problem 2: Missing Google Sign-Up Option
The sign-up page (`/signup`) doesn't have a "Sign up with Google" option, while the login page (`/login`) does have "Sign in with Google". This creates an inconsistent user experience.

---

## Plan

### Task 1: Add App Authentication Page for New Electron Users
**File**: `CueMeWeb/src/app/auth/callback/page.tsx`

**Current Flow**:
1. User signs up via email → receives confirmation email
2. User clicks email link → redirected to `/auth/callback`
3. If new user + no redirect_to → redirected to `/tutorial`
4. If Electron callback → shows "アプリを開く" button

**Problem**: New Electron users skip the app authentication page and go straight to tutorial.

**Solution**:
- Modify the callback logic to detect new Electron users
- For new Electron users with `redirect_to` containing `electron-callback` or `cueme://`:
  - Show the "アプリを認証ページ" (App Authentication Page) with the "CueMeアプリを開く" button
  - After user clicks the button and app opens, THEN redirect to `/tutorial`
- For existing Electron users: Keep current behavior (show app button, redirect to dashboard)
- For web users: Keep current behavior (redirect to tutorial if new, dashboard if existing)

**Implementation**:
```typescript
// In handleAuthCallback function:
if (redirectTo && (redirectTo.includes('electron-callback') || redirectTo.startsWith('cueme://'))) {
  // Electron callback
  const isNewUser = data.session.user?.user_metadata?.is_new_user || 
                   (new Date(data.session.user?.created_at || '').getTime() > Date.now() - 60000)
  
  // Show app authentication page
  setIsElectronCallback(true)
  setCallbackUrl(electronCallbackUrl)
  setStatus('success')
  setMessage('認証が完了しました。下のボタンをクリックしてCueMeアプリに戻ってください。')
  
  // After app opens (in button onClick), redirect to tutorial if new user
  // Modify the button onClick to:
  window.location.href = callbackUrl
  setTimeout(() => {
    router.push(isNewUser ? '/tutorial' : '/dashboard')
  }, 2000)
}
```

---

### Task 2: Add Google Sign-Up to Sign-Up Page
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

1. **Task 2 first** (simpler, independent change)
   - Add Google sign-up button to signup page
   - Test with both web and Electron flows
   
2. **Task 1 second** (more complex logic)
   - Modify callback page to handle new Electron users
   - Test the flow: signup → email → callback → app button → tutorial
   - Ensure existing users still go to dashboard

---

## Testing Checklist

### Task 1: App Authentication Page
- [ ] New Electron user signs up → sees app button → clicks → app opens → redirects to tutorial
- [ ] Existing Electron user logs in → sees app button → clicks → app opens → redirects to dashboard
- [ ] New web user signs up → redirects directly to tutorial (no app button)
- [ ] Existing web user logs in → redirects directly to dashboard

### Task 2: Google Sign-Up
- [ ] Google sign-up button appears on signup page
- [ ] Clicking Google button initiates OAuth flow
- [ ] After OAuth, new users are marked as `is_new_user: true`
- [ ] Electron users with redirect_to parameter are handled correctly
- [ ] Web users are redirected to tutorial (new) or dashboard (existing)

---

## Files to Modify

1. `CueMeWeb/src/app/auth/callback/page.tsx` - Add new user detection for Electron flow
2. `CueMeWeb/src/app/(auth)/signup/page.tsx` - Add Google sign-up button

---

## Completion Status

- [x] Task 2: Google Sign-Up Button - Added Google OAuth button to signup page with proper styling and redirect handling
- [x] Task 1: App Authentication Page for New Electron Users - Modified callback to detect new users and redirect to tutorial after app opens
- [ ] Testing completed
- [ ] Documentation updated

## Implementation Notes

### Task 2: Google Sign-Up Button
- Added `handleGoogleSignUp` function to signup page
- Added divider and "Googleで登録" button after email/password form
- Handles both Electron and web redirects with `is_new_user` metadata
- Consistent styling with login page

### Task 1: App Authentication Page
- Modified callback page to detect new Electron users using `is_new_user` metadata and account creation time
- Stores `isNewUser` flag in window object for button click handler
- Button click now redirects to `/tutorial` for new users, `/dashboard` for existing users
- All users see the "アプリを認証ページ" before redirect
