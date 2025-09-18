# Dashboard Unified File System Update

## Changes Made

### 1. Collection Page - Moved Action Buttons
- **Moved**: Add QnA and Upload Document buttons from above QnA section to below Documents section
- **Improved Flow**: Users now see all content first, then action buttons at the bottom
- **Better UX**: More logical placement for adding new content after viewing existing content

### 2. Dashboard Page - Unified File Display
- **Removed**: Separate document display (documents are now part of collections)
- **Simplified**: Only shows collections (files) which can contain both QnA pairs and documents
- **Updated**: Content grid now displays unified files instead of mixed content types

## Detailed Changes

### Collection Page (`/dashboard/collections/[id]/page.tsx`)
```
Structure Before:
├── QnA Items Section
├── Add Buttons (QnA + Upload)
├── Document Upload Section
└── Documents Section

Structure After:
├── QnA Items Section
├── Documents Section
├── Document Upload Section
└── Add Buttons (QnA + Upload)
```

### Dashboard Page (`/dashboard/page.tsx`)
**Removed**:
- `Document` interface
- `CombinedItem` interface
- `fetchDocuments()` function
- Document handling in `handleDelete()`
- Combined items logic

**Updated**:
- Only fetches and displays collections
- Simplified delete functionality (collections only)
- Updated header text: "コンテンツライブラリ" → "ファイルライブラリ"
- Updated description: "質問回答コレクションと処理済み文書を管理" → "Q&Aペアと文書を含むファイルを管理"

## Benefits

### 1. Cleaner Dashboard
- **Single File Type**: Only shows files (collections) that can contain both content types
- **No Duplication**: Documents are no longer shown separately since they're part of files
- **Simplified UI**: Easier to understand and navigate

### 2. Better Collection Page Flow
- **Logical Order**: View existing content first, then add new content
- **Consistent Actions**: Both add buttons are together at the bottom
- **Clear Sections**: QnA and Documents sections are clearly separated

### 3. Unified File System
- **True Unification**: Dashboard reflects the unified file system where each file can contain both QnA pairs and documents
- **Consistent Experience**: Users work with files that can contain mixed content types
- **Simplified Mental Model**: One file type instead of separate collections and documents

## User Experience

### Dashboard Flow
1. User sees their files (collections)
2. Each file shows total items (QnA pairs + documents combined)
3. Click on file to manage its contents
4. Create new files that can contain both content types

### Collection Flow
1. View existing QnA pairs in organized section
2. View existing documents in organized section
3. Add new content using buttons at bottom
4. All content is part of the same unified file

## Technical Benefits
- **Reduced Complexity**: Fewer data types and API calls
- **Better Performance**: Single data fetch instead of multiple
- **Cleaner Code**: Removed duplicate logic for handling different content types
- **Consistent State**: Single source of truth for file management