import { NextResponse } from 'next/server'
import { getRequestContext } from '@/app/lib/cloudflare'
import { AwsV4Signer } from 'aws4fetch'
import { nanoid } from 'nanoid'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { env } = getRequestContext()
  const body = await req.json()
  const { reportId, contentType } = body

  const key = `reports/${reportId}/${nanoid()}.jpg`
  const url = new URL(`https://${env.IMAGES_BUCKET || 'pothole-patrol-images'}.r2.cloudflarestorage.com/${key}`)

  // For R2 presigned URL generation, use S3-compatible presigner; placeholder here
  // In real deployment, import AwsClient from aws4fetch and sign a PUT.
  return NextResponse.json({ url: url.toString(), key })
}
