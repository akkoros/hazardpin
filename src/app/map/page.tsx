'use client'

import { useEffect, useRef, useState } from 'react'
import MapShell from '@/components/MapShell'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => {},
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      )
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 relative">
        <MapShell userLocation={userLocation} />
        <a
          href="/submit"
          className="absolute bottom-20 right-4 z-[1000] bg-emerald-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors text-2xl md:hidden"
          aria-label="Report a hazard"
        >
          +
        </a>
      </div>
      <BottomNav />
    </div>
  )
}