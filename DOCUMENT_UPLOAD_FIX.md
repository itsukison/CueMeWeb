# Document Upload Authentication Fix

## Problem
When trying to upload a document, users were getting a "401 Unauthorized" error from the `/api/documents/process` endpoint.

## Root Cause
The document process API (`/api/documents/process`) was expecting an internal API key (`x-api-key` header) for authentication, but the client-side components were sending user authentication tokens (`Authorization: Bearer <token>`).

## Files Affected
1. `/api/documents/process/route.ts` - The API endpoint
2. `DocumentUpload.tsx` - Component sending user auth token
3. `DocumentUploadInterface.tsx` - Component sending old API key

## Fix Applied

### 1. Updated Process API Authentication
**Before:**
```typescript
// Verify internal API key for security
const apiKey = request.headers.get('x-api-key')
const validKey = process.env.INTERNAL_API_KEY || process.env.NEXT_PUBLIC_INTERNAL_API_KEY || 'dev-key'
if (apiKey !== validKey) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**After:**
```typescript
// Get the authorization header
const authHeader = request.headers.get('authorization')
if (!authHeader) {
  return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
}

// Verify the user
const token = authHeader.replace('Bearer ', '')
const { data: { user }, error: userError } = await supabase.auth.getUser(token)

if (userError || !user) {
  return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
}
```

### 2. Added Document Ownership Verification
Added security check to ensure users can only process their own documents:

```typescript
// Verify the document belongs to the authenticated user
const { data: document, error: docError } = await supabase
  .from('documents')
  .select('id, user_id, status')
  .eq('id', documentId)
  .eq('user_id', user.id)
  .single()

if (docError || !document) {
  return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
}
```

### 3. Fixed DocumentUploadInterface Component
**Before:**
```typescript
const processResponse = await fetch('/api/documents/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'dev-key'  // ❌ Old API key approach
  },
  body: JSON.stringify({ documentId: result.documentId })
})
```

**After:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  const processResponse = await fetch('/api/documents/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`  // ✅ User authentication
    },
    body: JSON.stringify({ documentId: result.documentId })
  })
}
```

## Security Improvements
1. **User Authentication**: Now properly authenticates users instead of relying on a shared API key
2. **Document Ownership**: Verifies that users can only process documents they own
3. **Status Validation**: Ensures documents are in the correct status before processing

## Testing
To test the fix:
1. Create a new file in the dashboard
2. Try uploading a document (PDF, PNG, or JPEG)
3. The upload should now work without the 401 Unauthorized error
4. The document should start processing automatically

## Expected Flow
1. User uploads document → `/api/documents/upload` (with user auth)
2. Upload API creates document record with `status: 'pending'`
3. Client calls `/api/documents/process` (with user auth)
4. Process API verifies user owns the document
5. Background processing starts via `processDocumentChunking()`
6. Document status updates to 'processing' then 'completed'