import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

// export const runtime = 'edge' // enabled for Cloudflare deployment

export async function POST(req: Request) {
  const env = await getCloudflareEnv()
  const contentType = req.headers.get('content-type') || ''

  // Must be multipart form data
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  // Generate key: reports/<nanoid>.<ext>
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const key = `reports/${nanoid()}.${safeExt}`

  // Upload to R2 via binding
  const arrayBuffer = await file.arrayBuffer()
  await env.IMAGES.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  })

  // Construct public URL from env var
  const publicBase = env.R2_PUBLIC_URL || env.NEXT_PUBLIC_R2_PUBLIC_URL || ''

  const url = publicBase ? `${publicBase.replace(/\/+$/, '')}/${key}` : key

  return NextResponse.json({ key, url }, { status: 201 })
}