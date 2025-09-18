import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
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

    // Check usage limits using new system
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        plan_id,
        subscription_plans (
          max_total_document_scans
        )
      `)
      .eq('user_id', user.id)
      .single()

    // Get current usage from usage_tracking
    const currentDate = new Date()
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('total_document_scans_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .single()

    const maxDocumentScans = (subscription?.subscription_plans as { max_total_document_scans: number }[] | null)?.[0]?.max_total_document_scans || 3
    const currentDocumentScans = usage?.total_document_scans_used || 0

    if (currentDocumentScans >= maxDocumentScans) {
      return NextResponse.json({ 
        error: `LIMIT_REACHED`,
        message: `Document scan limit exceeded. Your plan allows ${maxDocumentScans} document scans total, you currently have ${currentDocumentScans}.`,
        redirectTo: '/dashboard/subscription'
      }, { status: 403 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const processingOptions = formData.get('processingOptions') as string
    const collectionId = formData.get('collectionId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
    const maxSize = 15 * 1024 * 1024 // 15MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' 
      }, { status: 400 })
    }

    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 15MB limit.' 
      }, { status: 400 })
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()
    // Sanitize the file name to avoid issues with special characters
    const sanitizedFileName = encodeURIComponent(file.name).replace(/%/g, '')
    const fileName = `${user.id}/${Date.now()}_${sanitizedFileName}`
    const filePath = `documents/${fileName}`

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        duplex: 'half'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get the file URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Verify collection ownership if collectionId is provided
    if (collectionId) {
      const { data: collection, error: collectionError } = await supabaseAdmin
        .from('qna_collections')
        .select('id, user_id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single()

      if (collectionError || !collection) {
        return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 })
      }
    }

    // Create document record
    const { data: documentData, error: documentError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        status: 'pending',
        display_name: file.name,
        chunk_count: 0,
        file_path: filePath,
        collection_id: collectionId || null
      })
      .select()
      .single()

    if (documentError) {
      console.error('Document creation error:', documentError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    console.log('[Upload API] Document created successfully:', documentData.id, 'for user:', user.id)

    return NextResponse.json({
      success: true,
      documentId: documentData.id,
      message: 'File uploaded successfully. Processing will begin shortly.'
    })

  } catch (error) {
    console.error('Upload endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for upload URL generation (for direct client uploads)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')
    const fileType = searchParams.get('fileType')

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 })
    }

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

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' 
      }, { status: 400 })
    }

    // Generate unique file path
    // Sanitize the file name to avoid issues with special characters
    const sanitizedFileName = encodeURIComponent(fileName).replace(/%/g, '')
    const filePath = `documents/${user.id}/${Date.now()}_${sanitizedFileName}`

    // Create signed upload URL
    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUploadUrl(filePath)

    if (urlError) {
      console.error('Signed URL error:', urlError)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      uploadUrl: urlData.signedUrl,
      filePath: filePath,
      expiresIn: 3600 // 1 hour
    })

  } catch (error) {
    console.error('Upload URL endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}