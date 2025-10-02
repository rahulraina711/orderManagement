import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSignedDownloadUrl } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const key = decodeURIComponent(params.key)

    try {
      // Generate signed URL for S3 file
      const signedUrl = await getSignedDownloadUrl(key)
      
      // Redirect to the signed URL
      return NextResponse.redirect(signedUrl)
    } catch (error) {
      console.error('Error generating signed URL:', error)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
