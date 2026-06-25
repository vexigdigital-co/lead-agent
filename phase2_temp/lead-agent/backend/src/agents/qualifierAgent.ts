import { llmChat } from '../lib/llm'
import type { Lead } from '@prisma/client'

export type QualificationResult = {
  score:       'HOT' | 'WARM' | 'COLD'
  scoreReason: string
}

export async function qualifierAgent(lead: Partial<Lead>): Promise<QualificationResult> {
  const leadSummary = `
Name:        ${lead.name        || 'Unknown'}
Email:       ${lead.email       || 'Unknown'}
Company:     ${lead.company     || 'Unknown'}
Use case:    ${lead.useCase     || 'Unknown'}
Budget:      ${lead.budgetRange || 'Unknown'}
Timeline:    ${lead.timeline    || 'Unknown'}
  `.trim()

  const result = await llmChat([
    {
      role: 'system',
      content: `You are a lead qualification expert. Score leads as HOT, WARM, or COLD.

Scoring criteria:
HOT  — Has budget ($20k+), clear use case, short timeline (ASAP or 1-3 months), provided email
WARM — Has most info, moderate budget, reasonable timeline, or missing 1-2 key fields
COLD — Vague use case, no budget mentioned, very long timeline, or minimal info provided

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON:
{"score": "HOT" | "WARM" | "COLD", "reason": "one sentence explaining the score"}`,
    },
    {
      role: 'user',
      content: `Score this lead:\n\n${leadSummary}`,
    },
  ])

  try {
    const parsed = JSON.parse(result.text.trim())
    return {
      score:       parsed.score  as 'HOT' | 'WARM' | 'COLD',
      scoreReason: parsed.reason as string,
    }
  } catch {
    // Fallback if JSON parse fails
    const text = result.text.toUpperCase()
    const score = text.includes('HOT') ? 'HOT' : text.includes('WARM') ? 'WARM' : 'COLD'
    return { score, scoreReason: result.text.slice(0, 200) }
  }
}
