'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  lat: number
  lng: number
  onLocationChange: (lat: number, lng: number) => void
  gpsStatus: 'loading' | 'ok' | 'error'
}

export default function LocationPicker({ lat, lng, onLocationChange, gpsStatus }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const center: [number, number] = (lat && lng) ? [lat, lng] : [40.7128, -74.006]
    const zoom = (lat && lng) ? 16 : 12

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    // Create draggable marker
    const marker = L.marker(center, {
      draggable: true,
      autoPan: true,
    }).addTo(map)

    // Add pulsing blue circle for "your location" if we have GPS
    if (lat && lng) {
      L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map)
    }

    marker.bindPopup('Drag me to the hazard location')

    // On drag end, update coordinates
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onLocationChange(pos.lat, pos.lng)
    })

    markerRef.current = marker
    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When GPS provides initial location, center map and move marker
  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return
    if (lat && lng) {
      mapInstance.current.setView([lat, lng], 16)
      markerRef.current.setLatLng([lat, lng])
      markerRef.current.openPopup()
    }
  }, [lat, lng])

  if (gpsStatus === 'loading') {
    return (
      <div className="h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 text-sm">
        📍 Getting your location...
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-48 md:h-64 rounded-lg overflow-hidden" />
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-slate-600 z-[1000]">
        📍 Drag pin to hazard location
      </div>
    </div>
  )
}