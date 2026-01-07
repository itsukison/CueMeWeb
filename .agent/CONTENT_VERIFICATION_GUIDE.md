# Document Content Verification Guide

**Date:** January 7, 2026
**Purpose:** Verify that uploaded documents are correctly indexed in Google File Search and queryable for RAG

---

## Table of Contents

1. [How Document Indexing Works](#how-document-indexing-works)
2. [Verification Methods](#verification-methods)
3. [Quick Browser Console Test](#quick-browser-console-test)
4. [API Endpoint Usage](#api-endpoint-usage)
5. [Understanding the Response](#understanding-the-response)
6. [Troubleshooting](#troubleshooting)

---

## How Document Indexing Works

### Storage Architecture

**Metadata** (Supabase):
```
user_file_search_files table
├── id (UUID)
├── user_id
├── collection_id
├── file_search_file_name (Google reference)
├── display_name
├── status (indexing/completed/failed)
└── created_at
```

**Content** (Google File Search):
```
Google File Search Store
├── Store per user: cueme_user_{userId}
├── Files uploaded to store
├── Automatic chunking
├── Automatic embedding generation
├── Automatic indexing
└── RAG-ready when state = 'ACTIVE'
```

### The Indexing Flow

```
1. Upload Document
   ↓
2. Create Google File Search store (if first upload)
   ↓
3. Upload file to Google via REST API
   ↓
4. Google processes file:
   - Extracts text
   - Chunks content
   - Generates embeddings (Google's internal)
   - Indexes for retrieval
   ↓
5. File state changes: PROCESSING → ACTIVE
   ↓
6. Our backend polls and updates status to 'completed'
   ↓
7. Content is now queryable via RAG
```

---

## Verification Methods

### Method 1: Existence Check ✅

**What it checks:** File exists in Google's infrastructure

**Endpoint:** `GET /api/documents/verify-filesearch?documentId={uuid}`

**What it tells you:**
- ✅ File uploaded successfully
- ✅ File state is ACTIVE
- ❌ **Does NOT test if content is queryable**

### Method 2: Content Query Test ✅✅✅ (RECOMMENDED)

**What it checks:** Content is actually indexed and retrievable

**Endpoint:** `POST /api/documents/test-content`

**What it tells you:**
- ✅ File exists
- ✅ File is ACTIVE
- ✅ Content can be queried
- ✅ RAG returns results with citations
- ✅ **Proves content is indexed and usable**

---

## Quick Browser Console Test

### Step 1: Get Your Document ID

**Option A: From UI**
- Go to your collection page
- Upload a document
- Copy the document ID from the URL or inspect the element

**Option B: From Database**
```javascript
// In browser console (logged in to CueMeWeb)
const { data, error } = await supabase
  .from('user_file_search_files')
  .select('id, display_name, status')
  .order('created_at', { ascending: false })
  .limit(5)

console.table(data)
// Copy the 'id' of the document you want to test
```

### Step 2: Run Content Test

**Paste this in browser console:**

```javascript
// === CONTENT VERIFICATION TEST ===

// 1. Configuration
const documentId = 'YOUR_DOCUMENT_ID_HERE'  // ← Replace with your document ID
const testQuery = 'このドキュメントには何が書かれていますか？'  // Optional custom query

// 2. Get auth token
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  console.error('❌ Not logged in')
} else {
  console.log('🔍 Testing document content indexing...')

  // 3. Test content
  const response = await fetch('/api/documents/test-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      documentId,
      testQuery
    })
  })

  const result = await response.json()

  // 4. Display results
  console.log('\n📊 === VERIFICATION RESULT ===\n')
  console.log(`Document: ${result.document?.displayName}`)
  console.log(`Status: ${result.document?.status}`)
  console.log(`File Search State: ${result.fileSearch?.state}`)
  console.log('\n🔎 Query Test:')
  console.log(`  Query: "${result.testQuery?.query}"`)
  console.log(`  Success: ${result.testQuery?.success ? '✅' : '❌'}`)
  console.log(`  Answer Length: ${result.testQuery?.answerLength} characters`)
  console.log(`  Has Citations: ${result.testQuery?.hasCitations ? '✅' : '❌'}`)
  console.log(`  Citation Count: ${result.testQuery?.citationCount}`)
  console.log(`  Grounding Chunks: ${result.testQuery?.groundingChunkCount}`)

  if (result.testQuery?.answerPreview) {
    console.log('\n📝 Answer Preview:')
    console.log(result.testQuery.answerPreview)
  }

  if (result.citations && result.citations.length > 0) {
    console.log('\n📚 Citations:')
    console.table(result.citations)
  }

  if (result.groundingChunks && result.groundingChunks.length > 0) {
    console.log('\n🔗 Grounding Chunks:')
    result.groundingChunks.forEach((chunk, i) => {
      console.log(`\n  [${i + 1}] Score: ${chunk.relevanceScore}`)
      console.log(`  Content: ${chunk.content}`)
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log(result.recommendation)
  console.log('='.repeat(50) + '\n')

  if (result.contentIndexed) {
    console.log('🎉 SUCCESS: Document is indexed and queryable!')
  } else {
    console.log('⚠️ WARNING: Content verification failed')
    console.log('Error:', result.testQuery?.error || result.error)
  }
}
```

### Expected Output (Success):

```
🔍 Testing document content indexing...

📊 === VERIFICATION RESULT ===

Document: my-resume.pdf
Status: completed
File Search State: ACTIVE

🔎 Query Test:
  Query: "このドキュメントには何が書かれていますか？"
  Success: ✅
  Answer Length: 456 characters
  Has Citations: ✅
  Citation Count: 3
  Grounding Chunks: 3

📝 Answer Preview:
このドキュメントには、ソフトウェアエンジニアとしての経歴が記載されています。
主なスキルとしてReact、TypeScript、Node.jsが挙げられており、
過去3年間で複数のWebアプリケーションを開発した経験があります...

📚 Citations:
┌─────────┬───────────────────────┬────────────┬──────────┐
│ (index) │ source                │ startIndex │ endIndex │
├─────────┼───────────────────────┼────────────┼──────────┤
│    0    │ 'my-resume.pdf'       │     120    │    450   │
│    1    │ 'my-resume.pdf'       │     780    │   1200   │
└─────────┴───────────────────────┴────────────┴──────────┘

🔗 Grounding Chunks:

  [1] Score: 0.95
  Content: ソフトウェアエンジニア | 2021年〜現在
  主な技術スタック: React, TypeScript, Node.js, PostgreSQL
  担当プロジェクト: Eコマースプラットフォーム開発、...

==================================================
✅ ドキュメントは正常にインデックスされており、RAGクエリで使用できます
==================================================

🎉 SUCCESS: Document is indexed and queryable!
```

---

## API Endpoint Usage

### Endpoint: Content Test

**URL:** `POST /api/documents/test-content`

**Headers:**
```
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "documentId": "uuid-of-document",
  "testQuery": "このドキュメントには何が書かれていますか？"  // Optional
}
```

**Response (Success):**
```json
{
  "contentIndexed": true,
  "verified": true,
  "document": {
    "id": "...",
    "displayName": "my-document.pdf",
    "fileName": "fileSearchStores/.../files/...",
    "status": "completed",
    "fileSize": 524288,
    "createdAt": "2026-01-07T10:00:00Z"
  },
  "fileSearch": {
    "state": "ACTIVE",
    "sizeBytes": "524288",
    "mimeType": "application/pdf"
  },
  "testQuery": {
    "query": "このドキュメントには何が書かれていますか？",
    "success": true,
    "error": null,
    "answerLength": 456,
    "answerPreview": "このドキュメントには...",
    "hasCitations": true,
    "hasGrounding": true,
    "citationCount": 3,
    "groundingChunkCount": 3
  },
  "citations": [
    {
      "source": "my-document.pdf",
      "startIndex": 120,
      "endIndex": 450,
      "uri": "fileSearchStores/.../files/..."
    }
  ],
  "groundingChunks": [
    {
      "content": "Document content excerpt...",
      "relevanceScore": 0.95
    }
  ],
  "recommendation": "✅ ドキュメントは正常にインデックスされており、RAGクエリで使用できます"
}
```

---

## Understanding the Response

### Key Fields to Check

#### 1. `contentIndexed` (boolean)
**Most important field!**
- `true` = Content is indexed and queryable ✅
- `false` = Content cannot be retrieved ❌

#### 2. `testQuery.hasCitations` (boolean)
- `true` = RAG found relevant content and cited sources ✅
- `false` = RAG responded but without citations ⚠️

**Note:** If hasCitations is false but answer exists, it might mean:
- Document was queried successfully
- But no specific passages were cited (rare)

#### 3. `testQuery.hasGrounding` (boolean)
- `true` = Response includes grounding chunks with relevance scores ✅
- Shows which parts of document were used

#### 4. `citations` array
**Proof that content is accessible!**

Each citation shows:
```json
{
  "source": "document-name.pdf",
  "startIndex": 120,    // Character position in source
  "endIndex": 450,      // Character position in source
  "uri": "fileSearchStores/.../files/..."
}
```

**What this proves:**
- ✅ Document content is indexed
- ✅ Specific passages can be retrieved
- ✅ RAG system can cite sources

#### 5. `groundingChunks` array
**Shows actual content excerpts!**

Each chunk includes:
```json
{
  "content": "Actual text from document...",
  "relevanceScore": 0.95  // How relevant (0-1)
}
```

**What this proves:**
- ✅ Content is extracted correctly
- ✅ Chunks are semantically indexed
- ✅ Retrieval system works

---

## Verification Checklist

### ✅ Full Verification (All checks pass)

```
✓ document.status === "completed"
✓ fileSearch.state === "ACTIVE"
✓ testQuery.success === true
✓ testQuery.hasCitations === true
✓ citations.length > 0
✓ groundingChunks.length > 0
```

**Result:** Document is **fully indexed and RAG-ready** for CueMeFinal app!

### ⚠️ Partial Verification (Some checks fail)

```
✓ document.status === "completed"
✓ fileSearch.state === "ACTIVE"
✓ testQuery.success === true
✗ testQuery.hasCitations === false
✗ citations.length === 0
```

**Possible reasons:**
- Document has little text content
- Query didn't match document content
- Try different test query

**Action:** Try querying with specific content from the document

### ❌ Failed Verification

```
✗ document.status === "indexing" or "failed"
✗ fileSearch.state !== "ACTIVE"
✗ testQuery.success === false
```

**Action:** Wait for indexing to complete or re-upload document

---

## Troubleshooting

### Problem: `contentIndexed: false` but file exists

**Check:**
1. Document status in database
2. File state in Google File Search
3. Error message in response

**Common causes:**

| Status | File State | Cause | Solution |
|--------|-----------|-------|----------|
| indexing | PROCESSING | Still processing | Wait 1-2 minutes, retry |
| completed | PROCESSING | Status mismatch | Wait for background poll to update |
| completed | FAILED | Indexing failed | Re-upload document |
| completed | NOT_FOUND | File deleted from Google | Re-upload document |
| failed | FAILED | Upload failed | Re-upload document |

### Problem: Query succeeds but no citations

**Possible causes:**
1. **Generic query**: Try more specific question about document content
2. **Empty document**: Document has no extractable text
3. **Different collection**: Documents might be in different collection

**Solution:**
```javascript
// Try specific query based on document content
const testQuery = 'What is the main topic discussed in the introduction?'
```

### Problem: `error: "Query failed"`

**Check testQuery.error field for details**

**Common errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid authentication" | Token expired | Refresh page, retry |
| "Collection not found" | Collection deleted | Re-upload to new collection |
| "GEMINI_API_KEY not configured" | Server config issue | Contact admin |
| "Rate limit exceeded" | Too many queries | Wait 1 minute, retry |

---

## Using in CueMeFinal App

### Confidence Levels

Based on verification results, you can show confidence to users:

**High Confidence** ✅
```
contentIndexed: true
hasCitations: true
citationCount: >= 2
groundingChunkCount: >= 2
```
→ Show: "ドキュメントは準備完了"

**Medium Confidence** ⚠️
```
contentIndexed: true
hasCitations: false
answerLength: > 0
```
→ Show: "ドキュメントは利用可能（引用なし）"

**Low Confidence** ❌
```
contentIndexed: false
```
→ Show: "ドキュメント処理中またはエラー"

### Integration Example

```typescript
// Before showing document in CueMeFinal app
const verifyDocument = async (documentId: string) => {
  const response = await fetch('/api/documents/test-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ documentId })
  })

  const result = await response.json()

  if (result.contentIndexed && result.testQuery.hasCitations) {
    return 'ready'  // Show green badge
  } else if (result.contentIndexed) {
    return 'partial'  // Show yellow badge
  } else {
    return 'not_ready'  // Show red badge
  }
}
```

---

## Best Practices

### 1. Wait for Completion

Always check `status === 'completed'` before testing content:

```javascript
if (document.status !== 'completed') {
  console.log('⏳ Document still indexing, please wait...')
  return
}
```

### 2. Use Specific Test Queries

Generic queries may not trigger citations:

**❌ Bad:**
```javascript
testQuery: "Tell me about this document"
```

**✅ Good:**
```javascript
testQuery: "What are the main technical skills mentioned?"
```

### 3. Test After Upload

Immediately after upload completes, run content test to catch issues early.

### 4. Monitor Citation Count

Documents with 0 citations might have:
- No extractable text (images-only PDF)
- Encoding issues
- Very short content

---

## Summary

### Two-Step Verification Process

**Step 1: Existence Check**
- Endpoint: `GET /api/documents/verify-filesearch`
- Checks: File exists in Google
- Fast: ~200ms

**Step 2: Content Test** (RECOMMENDED)
- Endpoint: `POST /api/documents/test-content`
- Checks: Content is queryable via RAG
- Slower: ~2-5 seconds (runs actual query)

### What Proves Content is Indexed?

1. ✅ `contentIndexed: true`
2. ✅ `testQuery.hasCitations: true`
3. ✅ `citations.length > 0`
4. ✅ `groundingChunks` contain actual document excerpts

**If all 4 are true → Content is 100% indexed and RAG-ready!**

---

**Document Version:** 1.0
**Last Updated:** January 7, 2026
