'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const body = {
      reporterId: 'demo-user',
      category: fd.get('category'),
      severity: fd.get('severity'),
      description: fd.get('description'),
      latitude: parseFloat(fd.get('latitude') as string),
      longitude: parseFloat(fd.get('longitude') as string),
      address: fd.get('address'),
    }
    const res = await fetch('/api/reports', { method: 'POST', body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)
    if (res.ok) router.push(`/reports/${data.id}`)
    else alert(data.error || 'Failed')
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
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </main>
  )
}
