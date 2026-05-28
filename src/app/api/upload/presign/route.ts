import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'
import { nanoid } from 'nanoid'

export const runtime = 'edge'

async function hmacSHA256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

async function getSignatureKey(secret: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> {
  let kDate = await hmacSHA256(new TextEncoder().encode('AWS4' + secret), dateStamp)
  let kRegion = await hmacSHA256(kDate, regionName)
  let kService = await hmacSHA256(kRegion, serviceName)
  let kSigning = await hmacSHA256(kService, 'aws4_request')
  return kSigning
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: Request) {
  const env = getCloudflareEnv()
  const body = await req.json() as any
  const { reportId, index = 0, contentType = 'image/jpeg' } = body
  if (!reportId) {
    return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })
  }

  const key = `reports/${reportId}/${index}.jpg`

  const accountId = env.R2_ACCOUNT_ID as string | undefined
  const accessKey = env.R2_ACCESS_KEY_ID as string | undefined
  const secret = env.R2_SECRET_ACCESS_KEY as string | undefined
  if (!accountId || !accessKey || !secret) {
    return NextResponse.json({ error: 'R2 credentials not configured' }, { status: 500 })
  }

  const region = 'auto'
  const service = 's3'
  const host = `${accountId}.r2.cloudflarestorage.com`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`

  const url = new URL(`https://${host}/${key}`)
  url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
  url.searchParams.set('X-Amz-Credential', `${accessKey}/${credentialScope}`)
  url.searchParams.set('X-Amz-Date', amzDate)
  url.searchParams.set('X-Amz-Expires', '300')
  url.searchParams.set('X-Amz-SignedHeaders', 'host')

  // canonical headers
  const canonicalHeaders = `host:${host}\n`
  const signedHeaders = 'host'

  // We are presigning a PUT, so use PUT in the canonical request
  const canonicalRequest = `PUT\n/${encodeURIComponent(key).replace(/%2F/g, '/')}\n${url.searchParams.toString()}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`

  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)).then(b => toHex(b))}`

  const signingKey = await getSignatureKey(secret, dateStamp, region, service)
  const signature = toHex(await hmacSHA256(signingKey, stringToSign))

  url.searchParams.set('X-Amz-Signature', signature)

  return NextResponse.json({ presignedUrl: url.toString(), key, reportId, index })
}
