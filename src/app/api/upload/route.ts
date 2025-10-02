import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFileToS3, getFileUrlFromKey } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/dwg',
      'application/step',
      'application/stp',
      'application/iges',
      'application/igs',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(dwg|step|stp|iges|igs)$/i)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Upload to S3
      const s3Key = await uploadFileToS3(buffer, file.name, file.type)
      const fileUrl = getFileUrlFromKey(s3Key)

      return NextResponse.json({
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        s3Key // Store this in the database for future reference
      })
    } catch (uploadError) {
      console.error('S3 upload failed, falling back to local storage:', uploadError)
      
      // Fallback to local storage if S3 fails
      const { writeFile } = await import('fs/promises')
      const { join } = await import('path')
      
      const timestamp = Date.now()
      const filename = `${timestamp}-${file.name}`
      const path = join(process.cwd(), 'public/uploads', filename)

      await writeFile(path, buffer)
      const fileUrl = `/uploads/${filename}`

      return NextResponse.json({
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size
      })
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
