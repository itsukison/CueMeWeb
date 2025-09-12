# Document Q&A System Integration Testing Guide

## Overview
This guide covers testing the complete document Q&A workflow from file upload to final collection creation.

## Prerequisites
Before testing, ensure you have:

1. **Environment Variables Set Up:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   INTERNAL_API_KEY=your_internal_api_key
   NEXT_PUBLIC_INTERNAL_API_KEY=your_internal_api_key
   ```

2. **Dependencies Installed:**
   ```bash
   npm install @google/generative-ai
   # All other dependencies should already be in package.json
   ```

3. **Database Migrations Applied:**
   - All migration scripts should have been executed via Supabase
   - Verify tables exist: `document_processing_sessions`, updated `qna_collections`, `qna_items`
   - Storage bucket `documents` should be created with proper policies

## Testing Workflow

### 1. Upload Flow Testing

#### Test Case 1.1: File Upload Validation
**Steps:**
1. Navigate to `/dashboard/documents`
2. Try uploading invalid files:
   - File larger than 15MB
   - Unsupported file type (.txt, .docx)
   - Empty file
3. Verify appropriate error messages appear

**Expected Results:**
- Error messages for invalid files
- No processing session created for invalid uploads

#### Test Case 1.2: Valid File Upload
**Steps:**
1. Navigate to `/dashboard/documents`
2. Upload a valid PDF/PNG/JPEG file (< 15MB)
3. Configure processing options
4. Click "Start Processing"

**Expected Results:**
- File uploads successfully
- Processing session created in database
- Redirected to processing status view

### 2. Document Processing Testing

#### Test Case 2.1: PDF Document Processing
**Test File:** Upload a PDF with text content

**Steps:**
1. Upload PDF file
2. Monitor processing status
3. Verify each processing step completes

**Expected Results:**
- Status updates in real-time
- Progress bar advances
- Processing completes without errors
- Q&A items generated and stored

#### Test Case 2.2: Image Document Processing
**Test File:** Upload PNG/JPEG with text (screenshot, document photo)

**Steps:**
1. Upload image file
2. Monitor processing status
3. Verify OCR text extraction works

**Expected Results:**
- Text extracted from image
- Q&A pairs generated from extracted text
- Quality scores assigned

### 3. Review Interface Testing

#### Test Case 3.1: Q&A Review Functionality
**Steps:**
1. Complete document processing
2. Navigate to review interface
3. Test all review features:
   - Select/deselect items
   - Edit questions and answers
   - Use bulk selection tools
   - Search and filter items
   - Sort by different criteria

**Expected Results:**
- All UI controls work correctly
- Edits are saved properly
- Search and filters work

#### Test Case 3.2: Collection Creation
**Steps:**
1. Complete Q&A review
2. Set collection name
3. Select approved items
4. Click "Create Collection"

**Expected Results:**
- Collection created successfully
- Approved items added to collection
- Rejected items not included
- Embeddings generated for search
- User redirected to collection view

### 4. Integration Testing

#### Test Case 4.1: End-to-End Workflow
**Steps:**
1. Start with fresh user account
2. Upload document → Process → Review → Create collection
3. Verify collection appears in dashboard
4. Test collection functionality (search, edit, etc.)

**Expected Results:**
- Complete workflow works without errors
- Collection integrates with existing system
- Vector search works on generated items

#### Test Case 4.2: Concurrent Processing
**Steps:**
1. Upload multiple documents simultaneously
2. Monitor processing of multiple sessions
3. Verify no interference between sessions

**Expected Results:**
- Multiple documents process independently
- No database conflicts
- All sessions complete successfully

### 5. Error Handling Testing

#### Test Case 5.1: Processing Failures
**Steps:**
1. Upload corrupted/unreadable files
2. Simulate API failures (disconnect internet during processing)
3. Test cancellation functionality

**Expected Results:**
- Graceful error handling
- Clear error messages
- Failed sessions marked appropriately
- Cleanup of partial data

#### Test Case 5.2: Authentication Edge Cases
**Steps:**
1. Test with expired tokens
2. Test with insufficient permissions
3. Test concurrent sessions from same user

**Expected Results:**
- Proper authentication errors
- No data leakage between users
- Session isolation maintained

## Performance Testing

### Test Case 6.1: Large Document Processing
**Test Files:**
- 15MB PDF with many pages
- High-resolution images
- Documents with complex layouts

**Metrics to Monitor:**
- Processing time
- Memory usage
- Database query performance
- Storage usage

### Test Case 6.2: Concurrent User Load
**Scenario:**
- Multiple users uploading simultaneously
- Peak usage simulation

**Metrics to Monitor:**
- Response times
- Error rates
- Database connection limits
- Storage throughput

## Database Verification

### Verification Checklist:
1. **document_processing_sessions table:**
   ```sql
   SELECT * FROM document_processing_sessions ORDER BY created_at DESC LIMIT 5;
   ```

2. **qna_collections with document metadata:**
   ```sql
   SELECT c.*, dps.file_name, dps.file_type 
   FROM qna_collections c 
   LEFT JOIN document_processing_sessions dps ON c.source_document_id = dps.id;
   ```

3. **qna_items with document fields:**
   ```sql
   SELECT id, question, quality_score, question_type, review_status 
   FROM qna_items 
   WHERE source_segment IS NOT NULL;
   ```

## Security Testing

### Test Case 7.1: File Upload Security
**Steps:**
1. Attempt to upload malicious files
2. Test file size limits
3. Verify file type restrictions
4. Test path traversal attempts

### Test Case 7.2: API Security
**Steps:**
1. Test API endpoints without authentication
2. Attempt cross-user data access
3. Verify internal API key protection
4. Test SQL injection on search parameters

## Troubleshooting Common Issues

### Issue 1: Processing Stuck
**Symptoms:** Processing status doesn't update
**Solutions:**
- Check Gemini API key and quota
- Verify network connectivity
- Check database connection
- Review processing logs

### Issue 2: Poor Q&A Quality
**Symptoms:** Generated questions are irrelevant
**Solutions:**
- Adjust quality threshold
- Modify processing options
- Check document text extraction
- Review Gemini prompt configuration

### Issue 3: Upload Failures
**Symptoms:** Files fail to upload
**Solutions:**
- Check Supabase storage configuration
- Verify bucket policies
- Check file size and type limits
- Review network connectivity

## Success Criteria

The system is considered fully functional when:

1. ✅ All file types process successfully
2. ✅ Q&A generation produces relevant questions
3. ✅ Review interface is intuitive and functional
4. ✅ Collections integrate seamlessly with existing system
5. ✅ Error handling is robust and user-friendly
6. ✅ Performance meets acceptable standards
7. ✅ Security requirements are satisfied

## Next Steps After Testing

1. **Production Deployment:**
   - Set up production environment variables
   - Configure domain and SSL
   - Set up monitoring and logging
   - Configure backup procedures

2. **User Training:**
   - Create user documentation
   - Provide training on document preparation
   - Establish support procedures

3. **Monitoring and Maintenance:**
   - Set up error tracking
   - Monitor API usage and quotas
   - Regular database maintenance
   - Performance optimization

## Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Gemini API Documentation:** https://ai.google.dev/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Project Repository:** (Your Git repository URL)

For issues or questions, refer to the individual component documentation in the codebase comments.