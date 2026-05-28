'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500 text-sm">
      Loading map...
    </div>
  ),
})

const CATEGORIES = [
  { value: 'POTHOLE', label: 'Pothole', emoji: '🕳️' },
  { value: 'DEBRIS', label: 'Debris', emoji: '🚧' },
  { value: 'FLOODING', label: 'Flooding', emoji: '🌊' },
  { value: 'FALLEN_SIGNAGE', label: 'Signage', emoji: '🪧' },
  { value: 'ROAD_CRACK', label: 'Crack', emoji: '💔' },
  { value: 'OTHER', label: 'Other', emoji: '❓' },
] as const

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-400', ring: 'ring-yellow-400' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-500', ring: 'ring-orange-500' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-600', ring: 'ring-red-600' },
] as const

function stripExif(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const MAX = 1600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height / width) * MAX)
          width = MAX
        } else {
          width = Math.round((width / height) * MAX)
          height = MAX
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const stripped = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(stripped)
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

function reverseGeocode(lat: number, lng: number): Promise<string> {
  return fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`)
    .then(r => r.json())
    .then((data: any) => data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    .catch(() => `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
}

function geocodeAddress(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
  return fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
    .then(r => r.json())
    .then((data: any[]) => {
      if (data.length === 0) return null
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name }
    })
    .catch(() => null)
}

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')

  // GPS state — using watchPosition for continuous accuracy refinement
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [showManualLocation, setShowManualLocation] = useState(false)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [addressSearch, setAddressSearch] = useState('')
  const [addressSearching, setAddressSearching] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  // Camera state
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start GPS watch on mount
  useEffect(() => {
    startGpsWatch()
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startGpsWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error')
      setShowManualLocation(true)
      return
    }
    setGpsStatus('loading')
    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude
        const newLng = pos.coords.longitude
        setLat(newLat)
        setLng(newLng)
        setGpsStatus('ok')
        setShowManualLocation(false)
        reverseGeocode(newLat, newLng).then(setAddress)
      },
      () => {
        setGpsStatus('error')
        setShowManualLocation(true)
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )
  }, [])

  const handleAddressSearch = useCallback(async () => {
    if (!addressSearch.trim()) return
    setAddressSearching(true)
    const result = await geocodeAddress(addressSearch)
    setAddressSearching(false)
    if (result) {
      setLat(result.lat)
      setLng(result.lng)
      setAddress(result.display)
      setGpsStatus('ok')
      setShowManualLocation(false)
    } else {
      setError('Address not found. Try a more specific address.')
    }
  }, [addressSearch])

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      setError('Could not access camera. Try choosing a photo instead.')
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    stopCamera()
    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
        const stripped = await stripExif(file)
        addPhotos([stripped])
      },
      'image/jpeg',
      0.85
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const addPhotos = useCallback(async (newFiles: File[]) => {
    const remaining = 5 - files.length
    if (remaining <= 0) {
      setError('Max 5 photos allowed')
      return
    }
    const toAdd = newFiles.slice(0, remaining)
    const stripped = await Promise.all(toAdd.map(f => stripExif(f)))
    setFiles(prev => [...prev, ...stripped])
    stripped.forEach(f => {
      const url = URL.createObjectURL(f)
      setThumbnails(prev => [...prev, url])
    })
    setError('')
  }, [files.length])

  const removePhoto = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setThumbnails(prev => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    addPhotos(selected)
    e.target.value = ''
  }, [addPhotos])

  async function uploadPhotos(reportId: string): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < files.length; i++) {
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reportId, index: i }),
      })
      if (!res.ok) throw new Error(`Presign failed for file ${i + 1}`)
      const { presignedUrl, key } = await res.json() as { presignedUrl: string; key: string }
      const up = await fetch(presignedUrl, {
        method: 'PUT',
        body: files[i],
        headers: { 'Content-Type': files[i].type || 'image/jpeg' },
      })
      if (!up.ok) throw new Error(`Upload failed for file ${i + 1}`)
      keys.push(key)
      setUploadProgress(`Uploaded ${i + 1} of ${files.length}`)
    }
    return keys
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!category) { setError('Please select a category'); return }
    if (!severity) { setError('Please select a severity'); return }

    const finalLat = lat ?? (manualLat ? parseFloat(manualLat) : null)
    const finalLng = lng ?? (manualLng ? parseFloat(manualLng) : null)
    if (finalLat === null || finalLng === null) {
      setError('Location is required. Use GPS, search an address, or tap the map.')
      return
    }

    setLoading(true)
    setError('')
    setUploadProgress('')

    try {
      const body = {
        reporterId: 'demo-user',
        category,
        severity,
        description,
        latitude: finalLat,
        longitude: finalLng,
        address,
        imageKeys: [] as string[],
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { id?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create report')
      }
      const reportId = data.id!

      if (files.length > 0) {
        setUploadProgress('Uploading photos...')
        const imageKeys = await uploadPhotos(reportId)
        if (imageKeys.length > 0) {
          await fetch(`/api/reports/${reportId}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ imageKeys }),
          })
        }
      }

      router.push(`/reports/${reportId}`)
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = category && severity && lat !== null && lng !== null && !loading

  const handleMapLocationChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    setGpsStatus('ok')
    setShowManualLocation(false)
    reverseGeocode(newLat, newLng).then(setAddress)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold">Report Hazard</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {/* Camera Section */}
        <div className="p-4 border-b bg-slate-50">
          {cameraActive ? (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" style={{ maxHeight: '40vh' }} />
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={capturePhoto} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold text-lg">
                  📸 Capture
                </button>
                <button type="button" onClick={stopCamera} className="px-4 py-3 bg-slate-300 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {thumbnails.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {thumbnails.map((url, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-20 w-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={startCamera} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold text-lg">
                  📸 Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-slate-200 py-3 rounded-lg font-medium"
                >
                  📁 Choose Photo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-1">{files.length}/5 photos • EXIF data auto-stripped</p>
            </>
          )}
        </div>

        {/* Location Section */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-700">📍 Location</h2>
            <button type="button" onClick={startGpsWatch} className="text-sm text-emerald-600 font-medium">
              📍 Use my GPS
            </button>
          </div>

          {/* Address search */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search address or place name..."
              value={addressSearch}
              onChange={e => setAddressSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddressSearch() } }}
              className="flex-1 border rounded-lg p-2 text-sm"
            />
            <button
              type="button"
              onClick={handleAddressSearch}
              disabled={addressSearching}
              className="bg-emerald-600 text-white px-4 rounded-lg text-sm font-medium disabled:bg-slate-300"
            >
              {addressSearching ? '...' : '🔍'}
            </button>
          </div>

          {/* Draggable map pin */}
          {lat !== null && lng !== null && (
            <LocationPicker
              lat={lat}
              lng={lng}
              onLocationChange={handleMapLocationChange}
              gpsStatus={gpsStatus === 'idle' ? 'loading' : gpsStatus}
            />
          )}
          {lat !== null && lng !== null && (
            <p className="text-sm text-emerald-700 mt-2">
              ✓ {address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </p>
          )}
          {gpsStatus === 'loading' && lat === null && (
            <p className="text-sm text-slate-500">📍 Getting your GPS location (this can take 10-30 seconds)...</p>
          )}
          {gpsStatus === 'error' && lat === null && (
            <div className="text-sm text-red-500">
              <p>Could not get GPS. Search an address above or tap the map.</p>
              <button type="button" onClick={() => setShowManualLocation(true)} className="text-emerald-600 underline mt-1">
                Enter coordinates manually
              </button>
            </div>
          )}
          {showManualLocation && (
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={manualLat}
                onChange={e => { setManualLat(e.target.value); setLat(parseFloat(e.target.value) || null) }}
                className="flex-1 border rounded p-2 text-sm"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={manualLng}
                onChange={e => { setManualLng(e.target.value); setLng(parseFloat(e.target.value) || null) }}
                className="flex-1 border rounded p-2 text-sm"
              />
            </div>
          )}
          <input type="hidden" name="latitude" value={lat ?? ''} />
          <input type="hidden" name="longitude" value={lng ?? ''} />
        </div>

        {/* Category */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-slate-700 mb-2">What did you see?</h2>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  category === cat.value
                    ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-2xl">{cat.emoji}</div>
                <div className="text-xs font-medium mt-1">{cat.label}</div>
              </button>
            ))}
          </div>
          <input type="hidden" name="category" value={category} />
        </div>

        {/* Severity */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-slate-700 mb-2">How bad is it?</h2>
          <div className="flex gap-2">
            {SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                type="button"
                onClick={() => setSeverity(sev.value)}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm text-white transition-all ${
                  severity === sev.value
                    ? `${sev.color} ring-2 ${sev.ring} ring-offset-2 shadow-md`
                    : `${sev.color} opacity-40 hover:opacity-70`
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="severity" value={severity} />
        </div>

        {/* Description */}
        <div className="p-4 border-b">
          <textarea
            name="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the hazard (optional)"
            className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none"
            rows={3}
          />
          <input type="hidden" name="address" value={address} />
        </div>

        {/* Error / Progress */}
        {uploadProgress && <p className="px-4 py-2 text-sm text-emerald-700">{uploadProgress}</p>}
        {error && <p className="px-4 py-2 text-sm text-red-600">{error}</p>}
      </form>

      {/* Sticky bottom submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 z-10 md:relative md:mt-4 md:mb-0">
        <button
          type="submit"
          formAction={undefined}
          onClick={handleSubmit as any}
          disabled={!canSubmit}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold text-lg disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}