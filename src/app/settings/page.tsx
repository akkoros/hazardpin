'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const [userId, setUserId] = useState<string>('')
  const [showMyReports, setShowMyReports] = useState(true)
  const [gpsEnabled, setGpsEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const storedId = localStorage.getItem('hazardpin_user_id') || ''
    setUserId(storedId)
    setShowMyReports(localStorage.getItem('hazardpin_show_my_reports') !== 'false')
    setGpsEnabled(localStorage.getItem('hazardpin_gps_enabled') !== 'false')
  }, [])

  const copyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = userId
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [userId])

  const generateNewIdentity = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/anonymous', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create user')
      const data = await res.json()
      const newId = data.userId as string
      localStorage.setItem('hazardpin_user_id', newId)
      setUserId(newId)
      setConfirmReset(false)
    } catch {
      // Local fallback
      const newId = crypto.randomUUID()
      localStorage.setItem('hazardpin_user_id', newId)
      setUserId(newId)
      setConfirmReset(false)
    }
  }, [])

  const toggleShowMyReports = useCallback((val: boolean) => {
    setShowMyReports(val)
    localStorage.setItem('hazardpin_show_my_reports', val ? 'true' : 'false')
  }, [])

  const toggleGps = useCallback((val: boolean) => {
    setGpsEnabled(val)
    localStorage.setItem('hazardpin_gps_enabled', val ? 'true' : 'false')
  }, [])

  const exportData = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/reports?reporterId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hazardpin-export-${userId.slice(0, 8)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to export data. Please try again.')
    }
  }, [userId])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto px-6 py-10 pb-24">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Settings</h1>

        {/* Anonymous ID */}
        <div className="bg-white border rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-slate-800 mb-2">Anonymous ID</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-100 rounded px-3 py-2 text-sm text-slate-700 truncate">
              {userId || 'Not assigned'}
            </code>
            <button
              onClick={copyId}
              className="px-3 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">This ID is stored locally and identifies your reports.</p>
        </div>

        {/* Generate New Identity */}
        <div className="bg-white border rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-slate-800 mb-2">Reset Identity</h2>
          <p className="text-sm text-slate-600 mb-3">
            Generate a new anonymous ID. Your old reports will remain under your previous ID.
          </p>
          {confirmReset ? (
            <div className="flex gap-2">
              <button
                onClick={generateNewIdentity}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Confirm — Generate New ID
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300 transition-colors"
            >
              Generate New Identity
            </button>
          )}
        </div>

        {/* Toggles */}
        <div className="bg-white border rounded-lg p-4 mb-4 space-y-4">
          {/* Show My Reports */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">Show my reports on the map</h3>
              <p className="text-xs text-slate-500">Highlight your own hazard pins.</p>
            </div>
            <button
              onClick={() => toggleShowMyReports(!showMyReports)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                showMyReports ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              aria-pressed={showMyReports}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  showMyReports ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* GPS Tracking */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-800">Enable GPS tracking</h3>
              <p className="text-xs text-slate-500">Use GPS for map centering and reports.</p>
            </div>
            <button
              onClick={() => toggleGps(!gpsEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                gpsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              aria-pressed={gpsEnabled}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  gpsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Actions */}
        <div className="bg-white border rounded-lg p-4 mb-4 space-y-3">
          <h2 className="font-semibold text-slate-800 mb-2">Your Data</h2>
          <button
            onClick={exportData}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Export my data (JSON)
          </button>
          <button
            className="w-full px-4 py-2 bg-slate-200 text-slate-400 rounded text-sm font-medium cursor-not-allowed"
            disabled
          >
            Delete my data — Coming soon
          </button>
        </div>

        {/* Links */}
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <Link href="/about" className="block text-emerald-600 hover:underline text-sm font-medium">
            About HazardPin
          </Link>
          <Link href="/terms" className="block text-emerald-600 hover:underline text-sm font-medium">
            Terms of Service
          </Link>
          <Link href="/privacy" className="block text-emerald-600 hover:underline text-sm font-medium">
            Privacy Policy
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}