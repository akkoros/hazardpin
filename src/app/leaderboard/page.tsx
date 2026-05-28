'use client'

import { useEffect, useState } from 'react'

export default function LeaderboardPage() {
  const [data, setData] = useState<any>({ users: [] })

  useEffect(() => {
    fetch('/api/leaderboard?type=TOP_REPORTER&period=WEEK')
      .then(r => r.json())
      .then(setData)
  }, [])

  return (
    <main className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">#</th>
            <th className="text-left py-1">Name</th>
            <th className="text-right py-1">Score</th>
            <th className="text-right py-1">Tier</th>
          </tr>
        </thead>
        <tbody>
          {data.users?.map((u: any, i: number) => (
            <tr key={u.id} className="border-b">
              <td className="py-1">{i + 1}</td>
              <td className="py-1">{u.displayName || 'Anonymous'}</td>
              <td className="text-right py-1">{u.score}</td>
              <td className="text-right py-1">{u.tier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
