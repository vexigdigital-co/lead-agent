import { prisma } from '../lib/prisma'
import { qualifierAgent } from './qualifierAgent'
import { enrichmentAgent } from './enrichmentAgent'
import { crmSyncAgent } from './crmSyncAgent'

export async function runLeadPipeline(leadId: string): Promise<void> {
  console.log(`[pipeline] Starting for lead: ${leadId}`)

  try {
    let lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversations: {
          include: { messages: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!lead) {
      console.warn(`[pipeline] Lead ${leadId} not found.`)
      return
    }

    // Step 1: Qualification (only if not already scored or if it needs rescoring)
    if (lead.score === 'UNKNOWN') {
      console.log(`[pipeline] Step 1: Qualifying lead ${leadId}...`)
      try {
        const { score, scoreReason } = await qualifierAgent(lead)
        lead = await prisma.lead.update({
          where: { id: lead.id },
          data: { score, scoreReason },
          include: {
            conversations: {
              include: { messages: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })
        console.log(`[pipeline] Step 1 complete. Score: ${score}`)
      } catch (err) {
        console.error(`[pipeline] Step 1 (Qualify) failed for lead ${leadId}`, err)
      }
    } else {
      console.log(`[pipeline] Step 1 skipped (Lead already scored: ${lead.score})`)
    }

    // Step 2: Enrichment
    console.log(`[pipeline] Step 2: Enriching lead ${leadId}...`)
    try {
      const enrichmentData = await enrichmentAgent(lead)
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: enrichmentData,
        include: {
          conversations: {
            include: { messages: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
      console.log(`[pipeline] Step 2 complete. Enrichment data:`, enrichmentData)
    } catch (err) {
      console.error(`[pipeline] Step 2 (Enrich) failed for lead ${leadId}`, err)
    }

    // Step 3: CRM Sync
    console.log(`[pipeline] Step 3: Syncing lead ${leadId} to CRM...`)
    try {
      await crmSyncAgent(lead)
      console.log(`[pipeline] Step 3 complete.`)
    } catch (err) {
      console.error(`[pipeline] Step 3 (CRM Sync) failed for lead ${leadId}`, err)
    }

    console.log(`[pipeline] Finished for lead: ${leadId}`)
  } catch (err) {
    console.error(`[pipeline] Fatal error in pipeline for lead ${leadId}`, err)
  }
}
