'use client'

import { useEffect, useRef, useState } from 'react'
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
  createdAt?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  POTHOLE: '#ef4444',
  DEBRIS: '#f97316',
  FLOODING: '#3b82f6',
  FALLEN_SIGNAGE: '#eab308',
  ROAD_CRACK: '#a855f7',
  OTHER: '#9ca3af',
}

const CATEGORY_LABELS: Record<string, string> = {
  POTHOLE: '🕳️ Pothole',
  DEBRIS: '🚧 Debris',
  FLOODING: '🌊 Flooding',
  FALLEN_SIGNAGE: '🪧 Fallen Signage',
  ROAD_CRACK: '💔 Road Crack',
  OTHER: '❓ Other',
}

// SVG pin icon — no image dependency, always works
const hazardPin = (color: string) => L.divIcon({
  className: '',
  html: `<div style="position:relative;width:28px;height:36px;">
    <svg viewBox="0 0 28 36" width="28" height="36" style="filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.3))">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 11 14 22 14 22s14-11 14-22C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
})

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

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

interface MapViewProps {
  reports: Report[]
  userLocation?: [number, number] | null
}

export default function MapView({ reports, userLocation }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersLayer = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.CircleMarker | null>(null)
  const legendRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (!mapInstance.current) {
      const startCenter: [number, number] = userLocation || [40.7128, -74.0060]
      const map = L.map(mapRef.current).setView(startCenter, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)
      markersLayer.current = L.layerGroup().addTo(map)
      mapInstance.current = map

      if (userLocation) {
        map.setView(userLocation, 14)
      }

      if (typeof window !== 'undefined' && 'geolocation' in navigator && !userLocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
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
        userMarkerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update user location marker
  useEffect(() => {
    if (!mapInstance.current) return
    // Remove existing user markers
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
    if (userLocation) {
      // Pulsing blue dot for "you are here"
      const blueDot = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;opacity:0.3;animation:pulse 2s infinite;"></div>
          <div style="position:absolute;inset:4px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
          <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(2);opacity:0}}</style>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const marker = L.marker(userLocation, { icon: blueDot })
      marker.bindPopup('📍 Your location')
      marker.addTo(mapInstance.current)
      userMarkerRef.current = marker
      // Center map on user
      mapInstance.current.setView(userLocation, 14)
    }
  }, [userLocation])

  // Update report markers
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return
    markersLayer.current.clearLayers()
    reports.forEach((r) => {
      const color = CATEGORY_COLORS[r.category] || CATEGORY_COLORS.OTHER
      const marker = L.marker([r.latitude, r.longitude], {
        icon: hazardPin(color),
      })
      const catLabel = CATEGORY_LABELS[r.category] || r.category
      const timeStr = formatRelativeTime(r.createdAt)
      const popupHtml = `
        <b>${catLabel}</b> – ${r.severity}<br/>
        Status: ${r.status}<br/>
        Reporter: ${r.displayName || 'Anonymous'} (${r.tier})<br/>
        ${r.description ? r.description + '<br/>' : ''}
        ${timeStr ? '<span style="color:#64748b;font-size:0.85em">' + timeStr + '</span><br/>' : ''}
        <a href='/reports/${r.id}'>View report →</a>
      `
      marker.bindPopup(popupHtml).addTo(markersLayer.current!)
    })
  }, [reports])

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {/* Legend */}
      <div ref={legendRef} className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2 text-xs">
        <div className="font-semibold mb-1 text-slate-700">Categories</div>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5 py-0.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-600">{CATEGORY_LABELS[cat] || cat}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 py-0.5 mt-0.5 pt-0.5 border-t">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
          <span className="text-slate-600">Your location</span>
        </div>
      </div>
    </div>
  )
}