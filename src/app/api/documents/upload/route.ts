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

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const processingOptions = formData.get('processingOptions') as string

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
    const fileName = `${user.id}/${Date.now()}_${file.name}`
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

    // Create processing session record
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('document_processing_sessions')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: publicUrl,
        status: 'pending',
        progress: 0,
        processing_options: processingOptions ? JSON.parse(processingOptions) : {}
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: 'Failed to create processing session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionData.id,
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
    const filePath = `documents/${user.id}/${Date.now()}_${fileName}`

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