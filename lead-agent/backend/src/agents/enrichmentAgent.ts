import { llmChat } from '../lib/llm'
import type { Lead } from '@prisma/client'

export type EnrichmentResult = {
  industry:       string | null
  companySize:    string | null
  companyWebsite: string | null
}

export async function enrichmentAgent(lead: Partial<Lead>): Promise<EnrichmentResult> {
  const companyName = lead.company || 'Unknown'
  const emailDomain = lead.email ? lead.email.split('@')[1] : null
  const useCase     = lead.useCase || 'Unknown'

  // If we don't even have a company or email, we can't enrich
  if (!lead.company && !emailDomain) {
    return { industry: null, companySize: null, companyWebsite: null }
  }

  const prompt = `
You are a B2B data enrichment agent.
Based on the following lead information, infer the most likely industry, company size, and company website domain.
If you are unsure, provide your best educated guess based on the company name and use case.

Lead Data:
- Company Name: ${companyName}
- Email Domain: ${emailDomain || 'Unknown'}
- Use Case:     ${useCase}

Respond ONLY with valid JSON, no markdown:
{
  "industry": "e.g., SaaS, Healthcare, Fintech, E-commerce, Unknown",
  "companySize": "e.g., 1-10, 11-50, 51-200, 201-500, 500+, Unknown",
  "companyWebsite": "e.g., acme.com (guess the domain based on name/email)"
}`

  let result: EnrichmentResult = { industry: null, companySize: null, companyWebsite: null }

  try {
    const response = await llmChat([{ role: 'system', content: prompt }])
    const parsed = JSON.parse(response.text.trim())

    result = {
      industry:       parsed.industry       === 'Unknown' ? null : parsed.industry,
      companySize:    parsed.companySize    === 'Unknown' ? null : parsed.companySize,
      companyWebsite: parsed.companyWebsite === 'Unknown' ? null : parsed.companyWebsite,
    }

    // Free validation: check if the domain has a logo via Clearbit
    if (result.companyWebsite) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      try {
        const logoRes = await fetch(`https://logo.clearbit.com/${result.companyWebsite}`, {
          method: 'HEAD',
          signal: controller.signal
        })
        if (!logoRes.ok) {
          // If clearbit returns 404, our guessed domain might be wrong, but we'll keep it anyway
          console.warn(`[enrichment] Could not validate domain ${result.companyWebsite} with Clearbit`)
        }
      } catch {
        // Network error / timeout, ignore
      } finally {
        clearTimeout(timeoutId)
      }
    }

    return result
  } catch (err) {
    console.error('[enrichment] Failed to run enrichment agent', err)
    return result
  }
}
