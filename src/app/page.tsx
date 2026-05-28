'use client'

import { useEffect, useRef, useState } from 'react'
import MapShell from '@/components/MapShell'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [showMap, setShowMap] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const watchIdRef = useRef<number | null>(null)

  // GPS tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          // GPS denied — map defaults to center of US
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      )
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Lazy-load map: either after 1s delay or when scrolled into view
  useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 1000)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowMap(true)
          observer.disconnect()
          clearTimeout(timer)
        }
      },
      { threshold: 0.1 }
    )

    if (mapRef.current) {
      observer.observe(mapRef.current)
    }

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Pin it. Verify it. Fix it.
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-xl mx-auto">
            Community-powered road hazard reporting. Spot dangers, pin them on the map, and let your neighbors verify — together we make streets safer.
          </p>
          <a
            href="/submit"
            className="inline-block bg-white text-emerald-700 font-bold px-8 py-3 rounded-lg text-lg hover:bg-emerald-50 transition-colors shadow-lg"
          >
            Report a Hazard
          </a>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-10">
          How it works
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
              👀
            </div>
            <h3 className="font-bold text-slate-800 mb-1">1. Spot a hazard</h3>
            <p className="text-sm text-slate-600">
              See a pothole, debris, flooding, or any road danger? Open HazardPin and report it.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
              📍
            </div>
            <h3 className="font-bold text-slate-800 mb-1">2. Pin it on the map</h3>
            <p className="text-sm text-slate-600">
              Drop a pin at the hazard location. Add photos, description, and severity to help others understand the risk.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
              ✅
            </div>
            <h3 className="font-bold text-slate-800 mb-1">3. Community verifies</h3>
            <p className="text-sm text-slate-600">
              Neighbors upvote or confirm your report. Verified hazards get prioritized for repair.
            </p>
          </div>
        </div>
      </section>

      {/* Community-Powered Section */}
      <section className="bg-slate-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            Community-powered verification
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Every report can be verified by other users in the area. The more confirmations a hazard gets, the higher its priority. Active reporters earn reputation and climb the leaderboard — making real impact on road safety.
          </p>
        </div>
      </section>

      {/* Live Map Section */}
      <section ref={mapRef} className="relative" style={{ minHeight: '400px' }}>
        <div className="max-w-3xl mx-auto px-6 pt-8 pb-2 md:pt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-2">
            Live Hazard Map
          </h2>
          <p className="text-slate-500 text-center text-sm mb-4">
            Hazards near you right now
          </p>
        </div>
        <div className="h-[50vh] md:h-[60vh]">
          {showMap ? (
            <MapShell userLocation={userLocation} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50">
              Loading map…
            </div>
          )}
        </div>
      </section>

      {/* Mobile FAB */}
      <a
        href="/submit"
        className="fixed bottom-20 right-4 z-[1000] bg-emerald-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors text-2xl md:hidden"
        aria-label="Report a hazard"
      >
        +
      </a>

      <BottomNav />
    </div>
  )
}