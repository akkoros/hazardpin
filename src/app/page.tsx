import MapShell from '@/components/MapShell'

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between bg-white">
        <h1 className="text-xl font-bold">HazardPin</h1>
        <div className="flex gap-2">
          <a href="/submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded">Submit</a>
          <a href="/leaderboard" className="px-3 py-1.5 bg-slate-800 text-white rounded">Leaderboard</a>
        </div>
      </header>
      <MapShell />
    </main>
  )
}