'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-slate-400">
      Loading map...
    </div>
  ),
})

interface Report {
  id: string
  latitude: number
  longitude: number
  category: string
  severity: string
  status: string
  displayName: string
  tier: string
  description?: string
  createdAt?: string
}

interface MapShellProps {
  userLocation?: [number, number] | null
}

export default function MapShell({ userLocation }: MapShellProps) {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    fetch('/api/reports?sw_lat=-90&ne_lat=90&sw_lng=-180&ne_lng=180')
      .then(r => r.json() as any)
      .then((data: any) => setReports(data.reports || []))
      .catch(() => setReports([]))
  }, [])

  return <MapView reports={reports} userLocation={userLocation} />
}