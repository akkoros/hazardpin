'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  onBoundsChange?: (bounds: { sw_lat: number; ne_lat: number; sw_lng: number; ne_lng: number }) => void
}

export default function MapShell({ userLocation, onBoundsChange }: MapShellProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [bounds, setBounds] = useState<{ sw_lat: number; ne_lat: number; sw_lng: number; ne_lng: number } | null>(null)
  const fetchedOnce = useRef(false)

  const fetchReports = useCallback(async (b: typeof bounds) => {
    if (!b) return
    try {
      const res = await fetch(`/api/reports?sw_lat=${b.sw_lat}&ne_lat=${b.ne_lat}&sw_lng=${b.sw_lng}&ne_lng=${b.ne_lng}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch {
      setReports([])
    }
  }, [])

  // Initial global fetch (fast load)
  useEffect(() => {
    if (fetchedOnce.current) return
    fetchedOnce.current = true
    fetchReports({ sw_lat: -90, ne_lat: 90, sw_lng: -180, ne_lng: 180 })
  }, [fetchReports])

  // Refetch when viewport bounds change
  useEffect(() => {
    if (bounds) fetchReports(bounds)
  }, [bounds, fetchReports])

  return <MapView reports={reports} userLocation={userLocation} onBoundsChange={setBounds} />
}