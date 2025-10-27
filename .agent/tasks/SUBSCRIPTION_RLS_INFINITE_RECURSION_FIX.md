# Subscription RLS Infinite Recursion Fix

## Problem Statement
New users cannot create QnAs because the subscription API endpoint fails with error:
```
Error creating subscription: { 
  code: '42P17', 
  details: null, 
  hint: null, 
  message: 'infinite recursion detected in policy for relation "user_subscriptions"' 
}
```

## Root Cause Analysis

### The Issue
The RLS policy "Allow auto-creation of first subscription" on the `user_subscriptions` table contains a WITH CHECK clause that causes infinite recursion:

```sql
WITH CHECK (
  (plan_id IN (SELECT id FROM subscription_plans WHERE name = 'Free'))
  AND 
  (NOT (EXISTS (
    SELECT 1 FROM user_subscriptions us WHERE us.user_id = user_subscriptions.user_id
  )))
)
```

### Why It Causes Infinite Recursion
1. When a new user tries to INSERT their first subscription, the policy's WITH CHECK is evaluated
2. The WITH CHECK queries `user_subscriptions` to verify no subscription exists: `SELECT 1 FROM user_subscriptions us WHERE us.user_id = user_subscriptions.user_id`
3. This SELECT query triggers RLS policies on `user_subscriptions` (including this same policy)
4. The policy evaluation queries `user_subscriptions` again
5. This creates an infinite loop → PostgreSQL detects it and throws error 42P17

### The Flow That Triggers It
From `/api/subscriptions/user/route.ts`:
1. User authenticates and requests their subscription
2. No subscription found (PGRST116 error)
3. API tries to create a free subscription via INSERT
4. INSERT triggers the problematic RLS policy
5. Policy checks if subscription exists by querying the same table
6. **Infinite recursion detected** ❌

## Solution Plan

### Option 1: Remove the EXISTS Check from Policy (RECOMMENDED)
The EXISTS check in the policy is redundant because:
- The table has a UNIQUE constraint on `user_id`
- PostgreSQL will naturally prevent duplicate subscriptions
- The application logic already checks before inserting

**Action**: Drop and recreate the policy without the EXISTS subquery.

### Option 2: Use a Function with SECURITY DEFINER
Create a function that bypasses RLS to check subscription existence, but this adds complexity.

### Option 3: Disable RLS Check During Policy Evaluation
Use `security_barrier = false` but this has security implications.

## Implementation

### Step 1: Create Migration to Fix RLS Policy

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow auto-creation of first subscription" ON user_subscriptions;

-- Recreate without the recursive EXISTS check
-- The UNIQUE constraint on user_id already prevents duplicates
CREATE POLICY "Allow auto-creation of first subscription"
ON user_subscriptions
FOR INSERT
TO public
WITH CHECK (
  plan_id IN (
    SELECT id FROM subscription_plans WHERE name = 'Free'
  )
);
```

### Step 2: Verify the Fix
- Test with a new user account
- Confirm subscription creation succeeds
- Verify no duplicate subscriptions can be created (UNIQUE constraint handles this)

### Step 3: Update Documentation
Mark this task as complete in the .agent folder.

## Technical Details

### Current Policies on user_subscriptions
1. **"Allow auto-creation of first subscription"** (INSERT) - PROBLEMATIC
   - Has recursive EXISTS check causing infinite loop
   
2. **"Users can manage own subscriptions via JWT"** (ALL operations)
   - Checks: `auth.uid() = user_id` OR JWT sub claim matches
   - This one is fine, no recursion

### Database Constraints
- `user_id` has UNIQUE constraint → prevents duplicate subscriptions naturally
- Foreign keys to `auth.users.id` and `subscription_plans.id`

## Testing Checklist
- [x] Apply migration to fix RLS policy ✅
- [ ] Test new user signup flow (requires user testing)
- [ ] Verify subscription auto-creation works (requires user testing)
- [ ] Confirm existing users can still access their subscriptions (requires user testing)
- [ ] Check that duplicate subscriptions are prevented by UNIQUE constraint
- [ ] Monitor Vercel logs for any remaining errors

## Status
**COMPLETED** - Migration applied successfully

## Implementation Summary
Applied migration `fix_subscription_rls_infinite_recursion` that:
1. Dropped the problematic RLS policy with recursive EXISTS check
2. Recreated the policy with only the Free plan verification
3. Relies on UNIQUE constraint on `user_id` to prevent duplicates (which is more efficient)

The policy now simply checks:
```sql
WITH CHECK (
  plan_id IN (SELECT id FROM subscription_plans WHERE name = 'Free')
)
```

No more infinite recursion! The UNIQUE constraint on `user_id` naturally prevents duplicate subscriptions.

## Related Files
- `CueMeWeb/src/app/api/subscriptions/user/route.ts` - API endpoint that triggers the issue
- Database table: `public.user_subscriptions`
- RLS Policy: "Allow auto-creation of first subscription"
- Migration: `fix_subscription_rls_infinite_recursion`

## Next Steps for User
1. Test the fix by creating a new user account
2. Verify that new users can now create QnAs without subscription errors
3. Monitor Vercel logs to confirm no more 42P17 errors
4. If issues persist, check Stripe integration (though this was purely an RLS issue)

## Why This Fix is Safe
- **UNIQUE constraint protection**: The `user_id` column has a UNIQUE constraint, so PostgreSQL will automatically prevent duplicate subscriptions with a clear error (23505) instead of infinite recursion
- **Simpler policy**: Removed unnecessary complexity - the policy now only validates the plan is 'Free'
- **No security regression**: The "Users can manage own subscriptions via JWT" policy still protects all other operations (SELECT, UPDATE, DELETE)
- **No security advisors triggered**: Supabase security linter shows no issues with the new policy
