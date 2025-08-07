import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function DELETE(request: NextRequest) {
  try {
    const authKey = request.headers.get('x-auth-key')
    
    if (!authKey || authKey !== process.env.AUTH_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shortId = searchParams.get('shortId')

    if (!shortId) {
      return NextResponse.json({ error: 'Short ID is required' }, { status: 400 })
    }

    // First, list objects with the shortId prefix to find the exact file
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      Prefix: `${shortId}/`,
      MaxKeys: 10,
    })

    const listResponse = await s3Client.send(listCommand)
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete all objects with this prefix (should typically be just one file)
    const deletePromises = listResponse.Contents.map(async (object) => {
      if (object.Key) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: object.Key,
        })
        return s3Client.send(deleteCommand)
      }
    })

    await Promise.all(deletePromises.filter(Boolean))

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully',
      deletedCount: listResponse.Contents.length
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}