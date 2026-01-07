/**
 * Document Upload API (File Search Version)
 *
 * Handles document uploads using Gemini File Search instead of manual processing.
 * This replaces the old pipeline: Supabase Storage → Background Processing → Embeddings
 * With: Direct upload to Gemini File Search → Automatic indexing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { fileSearchService } from '@/lib/gemini-file-search';

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

    console.log(`[UploadFileSearch] Processing upload for user ${user.id}`);

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

    // 4. Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
    ];
    const maxSize = 100 * 1024 * 1024; // 100MB (File Search limit)

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Supported: PDF, PNG, JPEG, TXT, DOCX, PPTX'
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File size exceeds 100MB limit.'
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

      // Mark collection as using File Search
      await supabaseAdmin
        .from('qna_collections')
        .update({ uses_file_search: true })
        .eq('id', collectionId);
    }

    // 6. Upload to Gemini File Search
    console.log(`[UploadFileSearch] Uploading to File Search: ${file.name} (${file.size} bytes)`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileSearchFileName = await fileSearchService.uploadDocument(
      user.id,
      collectionId,
      fileBuffer,
      file.name,
      file.type
    );

    console.log(`[UploadFileSearch] File uploaded successfully: ${fileSearchFileName}`);

    // 7. Increment usage tracking
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
      fileId: fileSearchFileName,
      message: 'File uploaded successfully. Indexing in progress...'
    });

  } catch (error) {
    console.error('[UploadFileSearch] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
