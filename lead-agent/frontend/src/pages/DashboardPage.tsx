import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leadsApi } from '../lib/api'
import { ScoreBadge } from '../components/ScoreBadge'
import type { Lead } from '../types'

interface Stats {
  total: number
  hot: number
  warm: number
  cold: number
}

export function DashboardPage() {
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, hot: 0, warm: 0, cold: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [all, hot, warm, cold] = await Promise.all([
          leadsApi.list({ limit: 5 }),
          leadsApi.list({ score: 'HOT', limit: 1 }),
          leadsApi.list({ score: 'WARM', limit: 1 }),
          leadsApi.list({ score: 'COLD', limit: 1 }),
        ])
        if (!isMounted) return
        setRecentLeads(all.data ?? [])
        setStats({
          total: all.meta?.total ?? 0,
          hot:   hot.meta?.total  ?? 0,
          warm:  warm.meta?.total ?? 0,
          cold:  cold.meta?.total ?? 0,
        })
      } catch (e) {
        console.error(e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    load()
    const intervalId = setInterval(load, 3000)
    
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  const statCards = [
    { label: 'Total leads',  value: stats.total, color: 'text-white' },
    { label: 'Hot 🔥',       value: stats.hot,   color: 'text-red-400' },
    { label: 'Warm 🌤',      value: stats.warm,  color: 'text-amber-400' },
    { label: 'Cold 🧊',      value: stats.cold,  color: 'text-blue-400' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
        <p className="text-zinc-500 text-sm">Overview of your AI-captured leads</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-[#0d0d14] border border-white/5 rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-2">{label}</p>
            <p className={`text-3xl font-semibold ${color}`}>
              {loading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-[#0d0d14] border border-white/5 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">Recent leads</h2>
          <Link to="/leads" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-sm text-zinc-500">Loading...</div>
        ) : recentLeads.length === 0 ? (
          <div className="px-6 py-8 text-sm text-zinc-500">
            No leads yet.{' '}
            <Link to="/chat" className="text-violet-400 hover:underline">Try the chat demo →</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentLeads.map(lead => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs text-violet-300 font-medium">
                    {(lead.name ?? lead.email ?? '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white">{lead.name ?? 'Unknown'}</p>
                    <p className="text-xs text-zinc-500">{lead.email ?? '—'} · {lead.company ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreBadge score={lead.score} size="sm" />
                  <p className="text-xs text-zinc-600">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
