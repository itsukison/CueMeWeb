# File Upload Progress & Verification Improvements

**Date:** January 7, 2026
**Status:** ✅ Implemented

---

## Overview

This document describes improvements made to the file upload and indexing progress display, including:
1. **Progressive loading bar** - Shows real-time progress instead of static 50%
2. **Japanese time estimates** - Shows estimated time remaining in Japanese
3. **Verification endpoint** - Verifies documents are saved in Google File Search

---

## Problem Statement

### Before
- Upload progress was stuck at **50%** during indexing
- No indication of how long users need to wait
- No way to verify if documents were correctly saved in Google's infrastructure

### After
- **Progressive loading bar** that increases from 30% → 95% over ~60 seconds
- **Estimated time remaining** displayed in Japanese (e.g., "残り約30秒")
- **Verification endpoint** to check Google File Search status

---

## Changes Made

### 1. Backend: Progressive Progress Calculation

**File:** `src/app/api/documents/status/[documentId]/route.ts`

**What changed:**
- Replaced hardcoded 50% progress with time-based calculation
- Progress increases smoothly from 30% → 95% over 60 seconds
- Adds `estimated_time_remaining` field (in seconds)

**Progress curve:**
```
Time (s)    Progress (%)
0           30%
15          46%
30          63%
45          79%
60          95%
Complete    100%
```

**Algorithm:**
```typescript
const elapsedSeconds = (now - createdAt) / 1000
if (elapsedSeconds < 60) {
  progress = Math.min(95, 30 + (elapsedSeconds / 60) * 65)
} else {
  progress = 95 // Stay at 95% until confirmed complete
}
```

**Why this approach:**
- Google doesn't provide real-time progress from their File Search API
- Simulated progress gives users feedback that something is happening
- Stays at 95% to avoid showing 100% before actual completion
- Prevents user confusion and premature navigation away

---

### 2. Frontend: Time Estimation Display

**File:** `src/components/DocumentProcessingProgress.tsx`

**What changed:**
- Added `estimated_time_remaining` field to status interface
- Created `formatTimeRemaining()` helper function
- Displays time estimate in Japanese below progress description

**Japanese time formatting:**
```typescript
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `残り約${seconds}秒`  // "About X seconds remaining"
  } else {
    const minutes = Math.ceil(seconds / 60)
    return `残り約${minutes}分`  // "About X minutes remaining"
  }
}
```

**UI Layout:**
```
┌────────────────────────────────────────────┐
│ [Database Icon]  Gemini インデックス作成中  │  45%
│                  Gemini AIがドキュメントを    │
│                  学習しています                │
│                  残り約30秒                   │
│                                            │
│ [========== Progress Bar (45%) ========]   │
└────────────────────────────────────────────┘
```

---

### 3. Verification Endpoint

**File:** `src/app/api/documents/verify-filesearch/route.ts` (NEW)

**Endpoint:** `GET /api/documents/verify-filesearch?documentId=<uuid>`

**Purpose:** Verify that uploaded documents are correctly saved in Google File Search

**Authentication:** Requires Bearer token in Authorization header

**Response Format:**
```json
{
  "verified": true,
  "database": {
    "id": "uuid",
    "fileName": "fileSearchStores/abc123/files/xyz789",
    "displayName": "my-document.pdf",
    "status": "completed",
    "createdAt": "2026-01-07T10:00:00Z",
    "updatedAt": "2026-01-07T10:01:15Z",
    "errorMessage": null
  },
  "gemini": {
    "name": "fileSearchStores/abc123/files/xyz789",
    "displayName": "my-document.pdf",
    "state": "ACTIVE",
    "sizeBytes": "524288",
    "mimeType": "application/pdf",
    "createTime": "2026-01-07T10:00:30Z",
    "updateTime": "2026-01-07T10:01:15Z",
    "expirationTime": "2026-01-09T10:00:30Z"
  },
  "geminiError": null,
  "recommendation": "ドキュメントは正常にGoogle File Searchに保存されています"
}
```

**Verification Logic:**
1. Fetch document metadata from Supabase
2. Query Google File Search API for live status
3. Check if file state is `ACTIVE`
4. Return detailed verification result

**Possible States:**
- `ACTIVE` ✅ - Document ready for RAG queries
- `PROCESSING` ⏳ - Still indexing, wait longer
- `FAILED` ❌ - Indexing failed, re-upload needed
- Not found 🔍 - Document missing from Google, re-upload needed

---

## How to Use the Verification Feature

### Method 1: API Request (Manual Testing)

**Step 1:** Get your document ID from the database or UI

**Step 2:** Get your auth token
```bash
# In browser console (while logged in):
const { data: { session } } = await supabase.auth.getSession()
console.log(session.access_token)
```

**Step 3:** Make verification request
```bash
curl -X GET \
  'https://your-domain.com/api/documents/verify-filesearch?documentId=YOUR_DOCUMENT_ID' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Expected Response (if verified):**
```json
{
  "verified": true,
  "recommendation": "ドキュメントは正常にGoogle File Searchに保存されています"
}
```

---

### Method 2: Browser Console (Quick Check)

**Paste this in browser console while logged in:**
```javascript
// Replace with your actual document ID
const documentId = 'YOUR_DOCUMENT_ID_HERE'

const { data: { session } } = await supabase.auth.getSession()

const response = await fetch(
  `/api/documents/verify-filesearch?documentId=${documentId}`,
  {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  }
)

const result = await response.json()
console.log('Verification Result:', result)

if (result.verified) {
  console.log('✅ Document is saved and ready!')
} else {
  console.log('❌ Issue detected:', result.recommendation)
}
```

---

### Method 3: Add UI Button (Future Enhancement)

**You can add a verification button to your UI:**

```typescript
// In your collection page component
const verifyDocument = async (documentId: string) => {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `/api/documents/verify-filesearch?documentId=${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    }
  )

  const result = await response.json()

  if (result.verified) {
    alert('✅ ' + result.recommendation)
  } else {
    alert('⚠️ ' + result.recommendation)
  }
}
```

---

## Testing the Improvements

### Test 1: Upload a Document and Watch Progress

1. Navigate to a collection
2. Upload a new document (PDF, TXT, or DOCX)
3. Observe the progress bar:
   - Should start at ~30%
   - Should increase progressively
   - Should show "残り約X秒" (time remaining)
   - Should reach 95% within 60 seconds
   - Should jump to 100% when indexing completes

**Expected Timeline:**
```
0s    → Upload complete → 30% "残り約75秒"
15s   → Indexing       → 46% "残り約60秒"
30s   → Indexing       → 63% "残り約45秒"
45s   → Indexing       → 79% "残り約30秒"
60s   → Indexing       → 95% "残り約15秒"
~75s  → Complete       → 100% "処理が完了しました"
```

---

### Test 2: Verify Document is in Google File Search

**Step 1:** Upload a document and note its ID

**Step 2:** Use the verification endpoint (see Method 2 above)

**Step 3:** Check the response:
- `verified: true` → Document is saved ✅
- `gemini.state: "ACTIVE"` → Ready for RAG ✅
- `gemini.sizeBytes` → File size matches ✅

**What to look for:**
```json
{
  "verified": true,
  "gemini": {
    "state": "ACTIVE",  // ← Most important field
    "sizeBytes": "524288",
    "mimeType": "application/pdf"
  }
}
```

---

### Test 3: Check Failed Documents

**If a document shows `status: "failed"` in the UI:**

1. Run verification endpoint
2. Check `gemini.state`:
   - `"FAILED"` → Re-upload needed
   - `null` (not found) → Re-upload needed
   - `"PROCESSING"` → Wait longer, not actually failed
3. Check `geminiError` field for details

---

## Troubleshooting

### Progress Bar Stuck at 30%

**Possible causes:**
- Backend polling may have stopped
- Network issue preventing status updates
- Document failed to upload to Google

**How to diagnose:**
1. Open browser DevTools → Network tab
2. Look for requests to `/api/documents/status/<id>`
3. Check if status endpoint returns errors
4. Run verification endpoint to check Google File Search

**Solution:**
```bash
# Check backend logs for upload errors
# Verify GEMINI_API_KEY is set correctly
# Try re-uploading the document
```

---

### Progress Shows 95% for Too Long

**This is normal behavior:**
- Progress intentionally stops at 95% to avoid showing 100% prematurely
- Actual completion depends on Google's indexing speed
- Large documents may take 2-3 minutes

**When to worry:**
- If stuck at 95% for >5 minutes → Run verification
- If verification shows `FAILED` → Re-upload needed

---

### Verification Returns `verified: false`

**Check the `recommendation` field for guidance:**

| Recommendation (Japanese) | Meaning | Action |
|--------------------------|---------|--------|
| "ドキュメントは正常にGoogle File Searchに保存されています" | Verified successfully | None needed |
| "ドキュメントは処理中です。しばらくお待ちください" | Still processing | Wait 1-2 minutes, re-check |
| "ドキュメントの処理に失敗しました。再アップロードをお試しください" | Indexing failed | Re-upload document |
| "ドキュメントが見つかりませんでした。再アップロードが必要な可能性があります" | Not found in Google | Re-upload document |

---

## Technical Details

### Why Simulated Progress?

**Google File Search API limitations:**
- No real-time progress events
- Only provides state: `PROCESSING` → `ACTIVE`/`FAILED`
- No percentage or ETA from Google

**Our approach:**
- Estimate based on average indexing time (~60-90 seconds)
- Show progressive feedback to reduce user anxiety
- Stop at 95% to avoid false completion signal

**Alternatives considered:**
1. ❌ Show spinner with no percentage → Too vague
2. ❌ Show only "indexing..." → No sense of progress
3. ✅ **Simulated progressive bar** → Best UX

---

### Progress Calculation Algorithm

**Input:** Document creation timestamp
**Output:** Progress percentage (0-100)

**Formula:**
```
elapsedSeconds = now - createdAt
if elapsedSeconds < 60:
  progress = min(95, 30 + (elapsedSeconds / 60) * 65)
else:
  progress = 95

estimatedRemaining = max(0, 75 - elapsedSeconds)
```

**Why start at 30%?**
- Gives immediate feedback that upload succeeded
- Avoids starting at 0% which feels like nothing happened

**Why cap at 95%?**
- Prevents premature 100% before confirmation
- Reserves 95%→100% jump for actual completion event

---

### Polling Behavior

**Frontend polling interval:** 3 seconds

**Backend polling (in gemini-file-search.ts):**
- Max attempts: 30
- Interval: 2 seconds
- Max duration: 60 seconds
- Timeout behavior: Mark as completed

**Efficiency consideration:**
- Frontend polls Supabase (fast, cached)
- Backend polls Google (slower, asynchronous)
- Users get responsive UI without hammering Google API

---

## API Reference

### Status Endpoint (Enhanced)

**Endpoint:** `GET /api/documents/status/{documentId}`

**New Response Fields:**
```typescript
{
  // ... existing fields ...
  processing_progress: number        // Now progressive (30-95%)
  estimated_time_remaining: number | null  // Seconds remaining
}
```

---

### Verification Endpoint (New)

**Endpoint:** `GET /api/documents/verify-filesearch?documentId={uuid}`

**Headers:**
```
Authorization: Bearer {supabase_access_token}
```

**Response:**
```typescript
{
  verified: boolean
  database: {
    id: string
    fileName: string
    displayName: string
    status: 'indexing' | 'completed' | 'failed'
    createdAt: string
    updatedAt: string
    errorMessage: string | null
  }
  gemini: {
    name: string
    displayName: string
    state: 'PROCESSING' | 'ACTIVE' | 'FAILED'
    sizeBytes: string
    mimeType: string
    createTime: string
    updateTime: string
    expirationTime: string
  } | null
  geminiError: string | null
  recommendation: string  // Japanese recommendation message
}
```

---

## Future Enhancements

### Short-term
1. **Add verification UI button** in collection page
2. **Show verification status badge** next to documents
3. **Auto-verify on completion** and show confirmation toast

### Medium-term
1. **Real-time progress** via webhooks (if Google adds support)
2. **Progress notifications** via push/email
3. **Bulk verification** for multiple documents

### Long-term
1. **Advanced diagnostics** dashboard
2. **Automatic retry** on failed indexing
3. **Storage quota** monitoring and alerts

---

## Summary

✅ **Progressive loading bar** - Shows 30% → 95% → 100% instead of stuck at 50%
✅ **Japanese time estimates** - Shows "残り約30秒" to inform users
✅ **Verification endpoint** - Check if documents are in Google File Search
✅ **Better UX** - Users know what's happening and how long to wait

**Key Benefits:**
- Users see progress instead of static "indexing"
- Clear expectation of wait time
- Ability to verify successful uploads
- All in Japanese for native speakers

---

**Document Version:** 1.0
**Last Updated:** January 7, 2026
