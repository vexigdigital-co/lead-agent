import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { leadsApi } from '../lib/api'
import { ScoreBadge } from '../components/ScoreBadge'
import type { Lead, LeadScore, LeadFilters } from '../types'

const SCORE_OPTIONS: { value: LeadScore | ''; label: string }[] = [
  { value: '',        label: 'All scores' },
  { value: 'HOT',     label: '🔥 Hot' },
  { value: 'WARM',    label: '🌤 Warm' },
  { value: 'COLD',    label: '🧊 Cold' },
  { value: 'UNKNOWN', label: 'Unknown' },
]

export function LeadsPage() {
  const [leads, setLeads]   = useState<Lead[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const [filters, setFilters] = useState<LeadFilters>({ page: 1, limit: 20 })
  const [search, setSearch]   = useState('')
  const [score, setScore]     = useState<LeadScore | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await leadsApi.list({
        ...filters,
        ...(search && { search }),
        ...(score  && { score }),
      })
      setLeads(res.data ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filters, search, score])

  useEffect(() => { load() }, [load])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, page: 1 })), 400)
    return () => clearTimeout(t)
  }, [search, score])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this lead?')) return
    await leadsApi.delete(id)
    load()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Leads</h1>
          <p className="text-zinc-500 text-sm">{total} total leads captured</p>
        </div>
        <Link
          to="/chat"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
        >
          + New chat
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search name, email, company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[#0d0d14] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
        />
        <select
          value={score}
          onChange={e => setScore(e.target.value as LeadScore | '')}
          className="bg-[#0d0d14] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50"
        >
          {SCORE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d0d14] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
              <th className="text-left px-6 py-3 font-medium">Lead</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Score</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-zinc-500 text-center">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="px-6 py-8 text-red-400 text-center">{error}</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-zinc-500 text-center">No leads found</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <Link to={`/leads/${lead.id}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs text-violet-300 font-medium shrink-0">
                      {(lead.name ?? lead.email ?? '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-zinc-200 font-medium">{lead.name ?? 'Unknown'}</p>
                      <p className="text-zinc-500 text-xs">{lead.email ?? '—'}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4 text-zinc-400">{lead.company ?? '—'}</td>
                <td className="px-4 py-4"><ScoreBadge score={lead.score} size="sm" /></td>
                <td className="px-4 py-4 text-zinc-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={e => handleDelete(lead.id, e)}
                    className="text-xs text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > (filters.limit ?? 20) && (
        <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
          <span>Page {filters.page} of {Math.ceil(total / (filters.limit ?? 20))}</span>
          <div className="flex gap-2">
            <button
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
              className="px-3 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={(filters.page ?? 1) >= Math.ceil(total / (filters.limit ?? 20))}
              onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
              className="px-3 py-1 rounded border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
