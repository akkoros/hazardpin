'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import Link from 'next/link'

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

const CATEGORY_COLORS: Record<string, string> = {
  POTHOLE: '#ef4444',
  DEBRIS: '#f97316',
  FLOODING: '#3b82f6',
  FALLEN_SIGNAGE: '#eab308',
  ROAD_CRACK: '#a855f7',
  OTHER: '#9ca3af',
}

function severityOpacity(sev: string): number {
  switch (sev) {
    case 'CRITICAL': return 1.0
    case 'HIGH': return 0.9
    case 'MEDIUM': return 0.75
    case 'LOW': return 0.6
    default: return 0.7
  }
}

function severityRadius(sev: string): number {
  switch (sev) {
    case 'CRITICAL': return 10
    case 'HIGH': return 8
    case 'MEDIUM': return 7
    case 'LOW': return 6
    default: return 7
  }
}

export default function MapView({ reports }: { reports: Report[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060])

  useEffect(() => {
    if (!mapRef.current) return
    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView(center, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)
      markersLayer.current = L.layerGroup().addTo(map)
      mapInstance.current = map

      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            setCenter([lat, lng])
            map.setView([lat, lng], 14)
          },
          () => {
            // fallback already in state
          }
        )
      }
    }
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        markersLayer.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return
    markersLayer.current.clearLayers()
    reports.forEach((r) => {
      const color = CATEGORY_COLORS[r.category] || CATEGORY_COLORS.OTHER
      const marker = L.circleMarker([r.latitude, r.longitude], {
        radius: severityRadius(r.severity),
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 1,
        fillOpacity: severityOpacity(r.severity),
      })
      const popupHtml = `
        <b>${r.category}</b> – ${r.severity}<br/>
        Status: ${r.status}<br/>
        Reporter: ${r.displayName || 'Anonymous'} (${r.tier})<br/>
        ${r.description ? r.description + '<br/>' : ''}
        <a href='/reports/${r.id}'>View report →</a>
      `
      marker.bindPopup(popupHtml).addTo(markersLayer.current!)
    })
  }, [reports])

  return <div ref={mapRef} className="w-full h-full" />
}
