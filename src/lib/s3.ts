import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'manuorder-files'

export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'private', // Files are private by default
  })

  try {
    await s3Client.send(command)
    return key
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw new Error('Failed to upload file')
  }
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
    return signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  try {
    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    throw new Error('Failed to delete file')
  }
}

export function getFileUrlFromKey(key: string): string {
  // For private files, we'll use signed URLs
  // For public files, you could return the direct S3 URL
  return `/api/files/${encodeURIComponent(key)}`
}
