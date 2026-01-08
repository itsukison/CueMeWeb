/**
 * Document Upload API (Supabase pgvector Version)
 * 
 * Handles document uploads using local processing and Supabase pgvector.
 * Flow: File → Extract Text → Chunk → Generate Embeddings → Store in Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { processDocument, isSupported } from '@/lib/document-processor';
import { generateEmbeddings } from '@/lib/embedding-service';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    console.log(`[DocumentUpload] Processing upload for user ${user.id}`);

    // 2. Check usage limits
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        plan_id,
        subscription_plans (
          max_total_document_scans
        )
      `)
      .eq('user_id', user.id)
      .single();

    const currentDate = new Date();
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('total_document_scans_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single();

    const maxDocumentScans = (subscription?.subscription_plans as { max_total_document_scans: number }[] | null)?.[0]?.max_total_document_scans || 3;
    const currentDocumentScans = usage?.total_document_scans_used || 0;

    if (currentDocumentScans >= maxDocumentScans) {
      return NextResponse.json({
        error: `LIMIT_REACHED`,
        message: `Document scan limit exceeded. Your plan allows ${maxDocumentScans} document scans total, you currently have ${currentDocumentScans}.`,
        redirectTo: '/dashboard/subscription'
      }, { status: 403 });
    }

    // 3. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const collectionId = formData.get('collectionId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 4. Validate file type
    if (!isSupported(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Supported: PDF, TXT, MD'
      }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024; // 50MB limit
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File size exceeds 50MB limit.'
      }, { status: 400 });
    }

    // 5. Verify collection ownership if provided
    if (collectionId) {
      const { data: collection, error: collectionError } = await supabaseAdmin
        .from('qna_collections')
        .select('id, user_id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single();

      if (collectionError || !collection) {
        return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
      }
    }

    // 6. Create document record (status: processing)
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        collection_id: collectionId,
        user_id: user.id,
        display_name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        original_file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        status: 'processing'
      })
      .select()
      .single();

    if (docError || !doc) {
      console.error('[DocumentUpload] Failed to create document record:', docError);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    console.log(`[DocumentUpload] Created document record: ${doc.id}`);

    // 7. Process document (extract text, chunk)
    let processedDoc;
    try {
      console.log(`[DocumentUpload] Starting document processing for ${file.name} (${file.type}, ${file.size} bytes)`);
      const startTime = Date.now();
      
      processedDoc = await processDocument(fileBuffer, file.type);
      
      const processingTime = Date.now() - startTime;
      console.log(`[DocumentUpload] Successfully processed document in ${processingTime}ms: ${processedDoc.totalChunks} chunks, ${processedDoc.fullText.length} characters`);
    } catch (processError) {
      console.error('[DocumentUpload] Document processing failed:', {
        error: processError,
        message: processError instanceof Error ? processError.message : 'Unknown error',
        stack: processError instanceof Error ? processError.stack : undefined,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentId: doc.id
      });
      
      // Update document status to failed
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'failed',
          error_message: processError instanceof Error ? processError.message : 'Processing failed'
        })
        .eq('id', doc.id);

      return NextResponse.json({
        error: 'Failed to process document',
        details: processError instanceof Error ? processError.message : 'Unknown error'
      }, { status: 500 });
    }

    // 8. Generate embeddings for all chunks
    let embeddings;
    try {
      console.log(`[DocumentUpload] Starting embedding generation for ${processedDoc.chunks.length} chunks`);
      const startTime = Date.now();
      
      const chunkTexts = processedDoc.chunks.map(c => c.content);
      embeddings = await generateEmbeddings(chunkTexts);
      
      const embeddingTime = Date.now() - startTime;
      console.log(`[DocumentUpload] Generated ${embeddings.length} embeddings in ${embeddingTime}ms`);
      
      // Validate embeddings
      if (embeddings.length !== processedDoc.chunks.length) {
        throw new Error(`Embedding count mismatch: expected ${processedDoc.chunks.length}, got ${embeddings.length}`);
      }
    } catch (embedError) {
      console.error('[DocumentUpload] Embedding generation failed:', {
        error: embedError,
        message: embedError instanceof Error ? embedError.message : 'Unknown error',
        stack: embedError instanceof Error ? embedError.stack : undefined,
        chunkCount: processedDoc.chunks.length,
        documentId: doc.id
      });
      
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'failed',
          error_message: embedError instanceof Error ? embedError.message : 'Embedding generation failed'
        })
        .eq('id', doc.id);

      return NextResponse.json({
        error: 'Failed to generate embeddings',
        details: embedError instanceof Error ? embedError.message : 'Unknown error'
      }, { status: 500 });
    }

    // 9. Store chunks with embeddings
    const chunksToInsert = processedDoc.chunks.map((chunk, index) => ({
      document_id: doc.id,
      collection_id: collectionId,
      user_id: user.id,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[index],
      char_start: chunk.charStart,
      char_end: chunk.charEnd,
    }));

    const { error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunksToInsert);

    if (chunksError) {
      console.error('[DocumentUpload] Failed to insert chunks:', {
        error: chunksError,
        message: chunksError.message,
        details: chunksError.details,
        hint: chunksError.hint,
        code: chunksError.code,
        chunkCount: chunksToInsert.length,
        documentId: doc.id
      });
      
      await supabaseAdmin
        .from('documents')
        .update({ 
          status: 'failed', 
          error_message: `Failed to store chunks: ${chunksError.message}` 
        })
        .eq('id', doc.id);

      return NextResponse.json({ 
        error: 'Failed to store document chunks',
        details: chunksError.message 
      }, { status: 500 });
    }

    // 10. Update document status to completed
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'completed',
        chunk_count: processedDoc.totalChunks,
        full_text: processedDoc.fullText.substring(0, 10000) // Store first 10k chars
      })
      .eq('id', doc.id);

    console.log(`[DocumentUpload] Document upload completed: ${doc.id}`);

    // 11. Increment usage tracking
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('id, total_document_scans_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single();

    if (existingUsage) {
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          total_document_scans_used: (existingUsage.total_document_scans_used || 0) + 1
        })
        .eq('id', existingUsage.id);
    } else {
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          month_year: monthYear,
          total_document_scans_used: 1
        });
    }

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      chunkCount: processedDoc.totalChunks,
      message: 'Document uploaded and indexed successfully'
    });

  } catch (error) {
    console.error('[DocumentUpload] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}