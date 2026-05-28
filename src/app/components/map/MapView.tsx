'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
}

export default function MapView({ reports }: { reports: Report[] }) {
  useEffect(() => {
    const map = L.map('map').setView([40.7128, -74.0060], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    reports.forEach((r) => {
      L.marker([r.latitude, r.longitude])
        .addTo(map)
        .bindPopup(`<b>${r.category}</b><br/>${r.description ?? ''}<br/>Status: ${r.status}`)
    })

    return () => { map.remove() }
  }, [reports])

  return <div id="map" className="w-full h-full" />
}
