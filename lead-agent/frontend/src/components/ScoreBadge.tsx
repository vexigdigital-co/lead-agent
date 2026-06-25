import type { LeadScore } from '../types'

interface Props {
  score: LeadScore
  size?: 'sm' | 'md'
}

const config: Record<LeadScore, { label: string; classes: string; dot: string }> = {
  HOT:     { label: 'Hot',     classes: 'bg-red-500/10 text-red-400 border-red-500/20',     dot: 'bg-red-400' },
  WARM:    { label: 'Warm',    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  COLD:    { label: 'Cold',    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   dot: 'bg-blue-400' },
  UNKNOWN: { label: 'Unknown', classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',   dot: 'bg-zinc-500' },
}

export function ScoreBadge({ score, size = 'md' }: Props) {
  const { label, classes, dot } = config[score]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${classes} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
