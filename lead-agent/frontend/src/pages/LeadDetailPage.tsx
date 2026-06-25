import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Lead } from '../types'
import { ScoreBadge } from '../components/ScoreBadge'

export function LeadDetailPage() {
  const { id } = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/leads/${id}`)
        const data = await res.json()
        if (data.success) {
          setLead(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch lead:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLead()
    // Poll to see if enrichment/CRM sync completes
    const interval = setInterval(fetchLead, 3000)
    return () => clearInterval(interval)
  }, [id])

  if (loading && !lead) return <div className="p-8 text-zinc-500">Loading...</div>
  if (!lead) return <div className="p-8 text-zinc-500">Lead not found</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">{lead.name || 'Unknown Lead'}</h1>
        <Link to="/leads" className="text-violet-400 hover:underline text-sm transition-colors">
          &larr; Back to Leads
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-[#0d0d14] border border-white/5 p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-medium text-white border-b border-white/5 pb-2">Contact Info</h2>
          <div>
            <span className="text-zinc-500 block text-xs mb-1">Email</span>
            <span className="text-zinc-200 text-sm">{lead.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-xs mb-1">Company</span>
            <span className="text-zinc-200 text-sm">{lead.company || 'N/A'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-xs mb-2">Score</span>
            <ScoreBadge score={lead.score} size="sm" />
          </div>
          {lead.scoreReason && (
            <div>
              <span className="text-zinc-500 block text-xs mb-1">Reasoning</span>
              <p className="text-zinc-300 text-sm">{lead.scoreReason}</p>
            </div>
          )}
        </div>

        {/* Enrichment Info */}
        <div className="bg-[#0d0d14] border border-violet-500/20 p-6 rounded-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-1 rounded-bl border-b border-l border-violet-500/20 uppercase tracking-wider">
            Enriched
          </div>
          <h2 className="text-lg font-medium text-white border-b border-white/5 pb-2">Company Insights</h2>
          <div>
            <span className="text-zinc-500 block text-xs mb-1">Industry</span>
            <span className="text-zinc-200 text-sm">{lead.industry || <span className="text-zinc-600 italic">Pending...</span>}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-xs mb-1">Company Size</span>
            <span className="text-zinc-200 text-sm">{lead.companySize || <span className="text-zinc-600 italic">Pending...</span>}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-xs mb-1">Website</span>
            {lead.companyWebsite ? (
              <a href={`https://${lead.companyWebsite}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline text-sm">
                {lead.companyWebsite}
              </a>
            ) : (
              <span className="text-zinc-600 italic text-sm">Pending...</span>
            )}
          </div>
          {lead.companyWebsite && (
            <div className="pt-2">
              <img 
                src={`https://logo.clearbit.com/${lead.companyWebsite}`} 
                alt={`${lead.companyWebsite} logo`}
                className="h-10 w-10 object-contain rounded border border-white/10 bg-white/5"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>

        {/* Needs / Context */}
        <div className="bg-[#0d0d14] border border-white/5 p-6 rounded-xl space-y-4 md:col-span-2">
          <h2 className="text-lg font-medium text-white border-b border-white/5 pb-2">Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-zinc-500 block text-xs mb-1">Use Case</span>
              <span className="text-zinc-200 text-sm">{lead.useCase || 'N/A'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs mb-1">Budget Range</span>
              <span className="text-zinc-200 text-sm">{lead.budgetRange || 'N/A'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs mb-1">Timeline</span>
              <span className="text-zinc-200 text-sm">{lead.timeline || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Sync Status */}
      <div className="bg-[#0d0d14] border border-white/5 p-4 rounded-xl flex items-center justify-between text-sm">
        <div>
          <span className="font-medium text-zinc-400 mr-2">CRM Sync: </span>
          {lead.notionPageId ? (
            <span className="text-emerald-400 font-medium">Synced to Notion</span>
          ) : (
            <span className="text-zinc-600">Not synced (No Notion configuration)</span>
          )}
        </div>
        {lead.crmSyncedAt && (
          <div className="text-zinc-500 text-xs">
            Last synced: {new Date(lead.crmSyncedAt).toLocaleString()}
          </div>
        )}
      </div>

    </div>
  )
}
