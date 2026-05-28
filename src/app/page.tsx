'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const MapView = dynamic(() => import('@/app/components/map/MapView'), { ssr: false })

interface Report {
  id: string
  latitude: number
  longitude: number
  category: string
  severity: string
  status: string
  displayName: string
  tier: string
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    fetch('/api/reports?sw_lat=-90&ne_lat=90&sw_lng=-180&ne_lng=180')
      .then(r => r.json())
      .then(data => setReports(data.reports || []))
  }, [])

  return (
    <main className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between bg-white">
        <h1 className="text-xl font-bold">HazardPin</h1>
        <div className="flex gap-2">
          <Link href="/submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded">Submit</Link>
          <Link href="/leaderboard" className="px-3 py-1.5 bg-slate-800 text-white rounded">Leaderboard</Link>
        </div>
      </header>
      <div className="flex-1">
        <MapView reports={reports} />
      </div>
    </main>
  )
}
