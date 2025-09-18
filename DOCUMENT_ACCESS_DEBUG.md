# Document Access Debug Guide

## Issue
Getting "Document not found or access denied" error when trying to process uploaded documents.

## Root Cause Analysis
The issue is likely related to Row Level Security (RLS) and authentication context:

1. **RLS Policy**: Documents table has RLS policy: `auth.uid() = user_id`
2. **Authentication Context**: The process API wasn't properly setting the authentication context for RLS queries

## Fix Applied

### 1. Fixed Authentication Context in Process API
**Before:**
```typescript
import { supabase } from '@/lib/supabase'
// ... 
const { data: { user }, error: userError } = await supabase.auth.getUser(token)
// This doesn't set the session context for subsequent queries
```

**After:**
```typescript
// Create supabase client with proper JWT context for RLS
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: authHeader
    }
  }
})
// Now all queries will have proper authentication context
```

### 2. Added Retry Logic
Added retry mechanism in case of timing issues between document creation and processing:

```typescript
// Add retry logic in case of timing issues
let document = null
let docError = null

for (let attempt = 0; attempt < 3; attempt++) {
  const result = await supabase
    .from('documents')
    .select('id, user_id, status')
    .eq('id', documentId)
    .single()
  
  document = result.data
  docError = result.error
  
  if (document) break
  
  // Wait a bit before retrying
  if (attempt < 2) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}
```

### 3. Enhanced Logging
Added detailed logging to help debug issues:

```typescript
console.log('[Process API] Processing document:', documentId, 'for user:', user.id)
console.log('[Upload API] Document created successfully:', documentData.id, 'for user:', user.id)
```

## Debug Endpoint
Created `/api/documents/debug?documentId=<id>` to test document access:

- Tests both RLS and admin access
- Shows user information
- Helps identify permission issues

## Testing Steps

### 1. Test Document Upload
1. Upload a document through the UI
2. Check browser console for upload success log
3. Note the document ID from the log

### 2. Test Document Access
1. Call the debug endpoint: `GET /api/documents/debug?documentId=<document-id>`
2. Include Authorization header with user token
3. Check if both RLS and admin queries return the document

### 3. Test Document Processing
1. Try processing the document through the UI
2. Check browser console and server logs for detailed error information

## Expected Results

### Successful Flow:
1. **Upload**: Document created with `status: 'pending'`
2. **Process**: Document found and status verified
3. **Processing**: Background processing starts
4. **Completion**: Document status updates to 'completed'

### Debug Output:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "documentId": "doc-uuid",
  "rls": {
    "document": { /* document data */ },
    "error": null
  },
  "admin": {
    "document": { /* same document data */ },
    "error": null
  }
}
```

## Common Issues

1. **RLS Context**: If RLS query fails but admin query succeeds, it's an authentication context issue
2. **Timing**: If both queries fail immediately after upload, it might be a timing issue
3. **Permissions**: If admin query fails, there's a fundamental data issue

## Next Steps
If the issue persists after this fix:
1. Use the debug endpoint to identify the specific problem
2. Check server logs for detailed error messages
3. Verify the document was created correctly during upload