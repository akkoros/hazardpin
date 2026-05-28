import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/app/lib/cloudflare'
import { AwsV4Signer } from 'aws4fetch'
import { nanoid } from 'nanoid'

export const runtime = 'edge'

export async function POST(req: Request) {
  const env = getCloudflareEnv()
  const body = await req.json()
  const { reportId, index = 0, contentType = 'image/jpeg', contentLength = 10485760 } = body
  if (!reportId) {
    return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })
  }

  const key = `reports/${reportId}/${index}.jpg`
  const now = new Date()
  const credentialScope = `${now.toISOString().slice(0,10).replace(/-/g,'')}/auto/s3/aws4_request`
  const region = 'auto'

  const url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`)
  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
  url.searchParams.set('X-Amz-Credential', `${env.R2_ACCESS_KEY_ID}/${credentialScope}`)
  url.searchParams.set('X-Amz-Date', now.toISOString().replace(/[-:]/g,'').slice(0,15) + 'Z')
  url.searchParams.set('X-Amz-Expires', '300')
  url.searchParams.set('X-Amz-SignedHeaders', 'host')

  // Use aws4fetch signer for presign
  try {
    const signer = new AwsV4Signer({
      url: url.toString().replace('?X-Amz-Algorithm',''),
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(contentLength),
      },
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      service: 's3',
      region,
      datetime: now.toISOString().replace(/[-:]/g,'').slice(0,15) + 'Z',
    })
    const signed = await signer.sign()
    const presignedUrl = signed.url
    return NextResponse.json({ presignedUrl, key, reportId, index })
  } catch (e: any) {
    console.error('Presign error:', e)
    return NextResponse.json({ error: 'Presign failed', detail: e.message }, { status: 500 })
  }
}
