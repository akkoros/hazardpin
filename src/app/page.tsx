'use client'

import { useEffect, useState } from 'react'
import MapShell from '@/components/MapShell'
import BottomNav from '@/components/BottomNav'

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          // GPS denied — map defaults to NYC
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }
  }, [])

  return (
    <main className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between bg-white shrink-0">
        <h1 className="text-xl font-bold">HazardPin</h1>
        <div className="flex gap-2">
          <a href="/submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium">
            + Report
          </a>
          <a href="/leaderboard" className="hidden sm:inline-block px-3 py-1.5 bg-slate-800 text-white rounded text-sm">
            Leaderboard
          </a>
        </div>
      </header>
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
    </main>
  )
}