'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onLocationChange: (lat: number, lng: number) => void
  gpsStatus: 'loading' | 'ok' | 'error'
}

// Custom pin icon using SVG — no image dependency, always visible
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:36px;height:46px;">
    <svg viewBox="0 0 36 46" width="36" height="46" style="filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.4))">
      <path d="M18 0C8 0 0 8 0 18c0 14 18 28 18 28s18-14 18-28C36 8 28 0 18 0z" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="7" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [36, 46],
  iconAnchor: [18, 46], // bottom center of pin
})

export default function LocationPicker({ lat, lng, onLocationChange, gpsStatus }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)

  const movePin = useCallback((newLat: number, newLng: number) => {
    if (!mapInstance.current) return
    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng])
    } else {
      markerRef.current = L.marker([newLat, newLng], {
        icon: pinIcon,
        draggable: true,
        autoPan: true,
      }).addTo(mapInstance.current)

      markerRef.current.bindPopup('Drag me to the hazard location')

      // Update coordinates on drag end
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })
    }
  }, [onLocationChange])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Default to center of US if no location yet
    const defaultCenter: [number, number] = [39.8283, -98.5795]
    const defaultZoom = lat !== null && lng !== null ? 16 : 4

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(
      lat !== null && lng !== null ? [lat, lng] : defaultCenter,
      defaultZoom
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    // Place marker if we have a location
    if (lat !== null && lng !== null) {
      movePin(lat, lng)
    }

    // Tap on map to place/move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      movePin(e.latlng.lat, e.latlng.lng)
      onLocationChange(e.latlng.lat, e.latlng.lng)
    })

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
      accuracyCircleRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When GPS gives us a new location, center map and move pin
  useEffect(() => {
    if (!mapInstance.current || lat === null || lng === null) return
    movePin(lat, lng)
    mapInstance.current.setView([lat, lng], 16)
    markerRef.current?.openPopup()

    // Show accuracy circle around user's GPS location (blue, semi-transparent)
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove()
    }
    accuracyCircleRef.current = L.circle([lat, lng], {
      radius: 50, // ~50m accuracy radius
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      color: '#3b82f6',
      weight: 1,
      opacity: 0.4,
    }).addTo(mapInstance.current)
  }, [lat, lng, movePin])

  if (gpsStatus === 'loading' && lat === null) {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 text-sm">
        📍 Getting your location...
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-48 md:h-64 rounded-lg overflow-hidden" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-slate-600 z-[1000] shadow-sm">
        {lat !== null ? '📍 Drag pin or tap map to set hazard location' : '📍 Tap map to place pin'}
      </div>
    </div>
  )
}