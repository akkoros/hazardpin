'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')

  async function uploadPhotos(reportId: string): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < files.length; i++) {
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reportId, index: i }),
      })
      if (!res.ok) throw new Error(`Presign failed for file ${i + 1}`)
      const { presignedUrl, key } = await res.json() as { presignedUrl: string; key: string }
      const up = await fetch(presignedUrl, {
        method: 'PUT',
        body: files[i],
        headers: { 'Content-Type': files[i].type || 'image/jpeg' },
      })
      if (!up.ok) throw new Error(`Upload failed for file ${i + 1}`)
      keys.push(key)
      setUploadProgress(`Uploaded ${i + 1} of ${files.length}`)
    }
    return keys
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadProgress('')

    try {
      const fd = new FormData(e.currentTarget)
      const body: any = {
        reporterId: 'demo-user',
        category: fd.get('category'),
        severity: fd.get('severity'),
        description: fd.get('description'),
        latitude: parseFloat(fd.get('latitude') as string),
        longitude: parseFloat(fd.get('longitude') as string),
        address: fd.get('address'),
        imageKeys: [] as string[],
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create report')
      }
      const reportId = data.id!

      if (files.length > 0) {
        setUploadProgress('Uploading photos...')
        const imageKeys = await uploadPhotos(reportId)
        if (imageKeys.length > 0) {
          await fetch(`/api/reports/${reportId}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ imageKeys }),
          })
        }
      }

      router.push(`/reports/${reportId}`)
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 5) {
      setError('Max 5 photos allowed')
      return
    }
    setFiles(selected)
    setError('')
  }

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Report a Hazard</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select name="category" className="w-full border rounded p-2">
          <option>POTHOLE</option>
          <option>DEBRIS</option>
          <option>FLOODING</option>
          <option>FALLEN_SIGNAGE</option>
          <option>ROAD_CRACK</option>
          <option>OTHER</option>
        </select>
        <select name="severity" className="w-full border rounded p-2">
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <textarea name="description" placeholder="Description" className="w-full border rounded p-2" />
        <input name="latitude" type="number" step="any" placeholder="Latitude" className="w-full border rounded p-2" />
        <input name="longitude" type="number" step="any" placeholder="Longitude" className="w-full border rounded p-2" />
        <input name="address" placeholder="Address (optional)" className="w-full border rounded p-2" />
        <div>
          <label className="block text-sm font-medium mb-1">Photos (max 5)</label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full" />
          {files.length > 0 && <p className="text-xs text-slate-600 mt-1">{files.length} file(s) selected</p>}
        </div>
        {uploadProgress && <p className="text-sm text-emerald-700">{uploadProgress}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </main>
  )
}
