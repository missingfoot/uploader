import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      Prefix: `${shortId}/`,
      MaxKeys: 1,
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileKey = response.Contents[0].Key!
    
    const r2PublicUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`
    
    return NextResponse.redirect(r2PublicUrl)
  } catch (error) {
    console.error('File retrieval error:', error)
    return NextResponse.json({ error: 'File retrieval failed' }, { status: 500 })
  }
}