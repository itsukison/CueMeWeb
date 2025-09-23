# Collection Page UI Improvements

## Changes Made

### 1. Updated Section Titles
- **Changed**: "アップロード済み文書" → "ドキュメント"
- **Added**: "Q&Aペア" title above the QnA items section (similar to documents section)

### 2. Added Document Deletion Functionality
- **Added**: Delete button for each document (appears on hover)
- **Features**:
  - Confirmation dialog before deletion
  - Loading state during deletion
  - Success/error feedback
  - Automatic UI update after deletion

### 3. Removed Chunk Count Display
- **Removed**: "3 チャンク" or chunk count display from document cards
- **Kept**: Document status and creation date

### 4. Improved Document Status Display
- **Status Mapping**:
  - `completed` → "処理完了" (with green checkmark)
  - `processing` → "処理中" (with blue pulsing clock)
  - `failed` → "処理失敗" (with red alert)
  - `pending` → "処理待ち" (with gray clock)

### 5. Enhanced Visual Structure
- **Added**: Consistent section headers with bottom borders
- **Improved**: Document cards now have hover effects and delete buttons
- **Enhanced**: Better spacing and organization of content sections

## UI Structure

```
Collection Page
├── Header (Collection name, edit button)
├── Stats (QnA count, document count, creation date)
├── Empty State (if no content)
└── Content Sections
    ├── Q&Aペア Section
    │   ├── Section title with border
    │   ├── Existing QnA items (editable, deletable)
    │   ├── New QnA item forms
    │   └── Add buttons
    ├── Document Upload Section (when active)
    └── ドキュメント Section
        ├── Section title with border
        └── Document cards (with delete buttons)
```

## Features

### Document Cards
- **Display**: File name, status icon, status text, creation date
- **Actions**: Delete button (hover to show)
- **States**: Loading state during deletion
- **Feedback**: Confirmation dialog and success/error messages

### QnA Items
- **Display**: Question, answer, creation date
- **Actions**: Edit, delete buttons
- **States**: Editing mode, saving state
- **Organization**: Grouped under "Q&Aペア" section

### Status Icons
- ✅ 処理完了 (Green checkmark)
- 🔄 処理中 (Blue pulsing clock)
- ❌ 処理失敗 (Red alert)
- ⏳ 処理待ち (Gray clock)

## API Integration
- **Document Deletion**: Uses `/api/documents` DELETE endpoint
- **Authentication**: Proper user authentication for all operations
- **Error Handling**: Comprehensive error handling with user feedback

## User Experience
- **Consistent Design**: Matching visual style between QnA and document sections
- **Clear Actions**: Obvious delete buttons with confirmation
- **Responsive**: Works on both desktop and mobile
- **Feedback**: Loading states and success/error messages
- **Safety**: Confirmation dialogs for destructive actions