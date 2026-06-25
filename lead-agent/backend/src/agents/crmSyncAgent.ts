import { Client } from '@notionhq/client'
import type { Lead } from '@prisma/client'
import { prisma } from '../lib/prisma'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

export async function crmSyncAgent(lead: Lead): Promise<void> {
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!process.env.NOTION_API_KEY || !databaseId) {
    console.log('[crm-sync] Skipping Notion sync: NOTION_API_KEY or NOTION_DATABASE_ID not set')
    return
  }

  try {
    const properties: Record<string, any> = {
      // Assuming a database with specific column names. 
      // The user will need to ensure these columns exist in their Notion DB.
      'Name': {
        title: [
          { text: { content: lead.name || 'Unknown Lead' } }
        ]
      },
      'Email': {
        email: lead.email || null
      },
      'Company': {
        rich_text: [
          { text: { content: lead.company || '' } }
        ]
      },
      'Score': {
        select: lead.score ? { name: lead.score } : null
      },
      'Status': {
        select: { name: 'New' }
      }
    }

    // Add optional enrichment fields if they exist
    if (lead.industry) {
      properties['Industry'] = {
        rich_text: [{ text: { content: lead.industry } }]
      }
    }
    if (lead.companySize) {
      properties['Company Size'] = {
        rich_text: [{ text: { content: lead.companySize } }]
      }
    }
    if (lead.companyWebsite) {
      properties['Website'] = {
        url: lead.companyWebsite.startsWith('http') ? lead.companyWebsite : `https://${lead.companyWebsite}`
      }
    }
    if (lead.useCase) {
      properties['Use Case'] = {
        rich_text: [{ text: { content: lead.useCase } }]
      }
    }

    if (lead.notionPageId) {
      // Update existing page
      await notion.pages.update({
        page_id: lead.notionPageId,
        properties
      })
      console.log(`[crm-sync] Updated Notion page ${lead.notionPageId} for lead ${lead.id}`)
    } else {
      // Create new page
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties
      })
      
      // Save notionPageId back to db
      await prisma.lead.update({
        where: { id: lead.id },
        data: { 
          notionPageId: response.id,
          crmSyncedAt: new Date()
        }
      })
      console.log(`[crm-sync] Created Notion page ${response.id} for lead ${lead.id}`)
    }
  } catch (err) {
    console.error(`[crm-sync] Failed to sync lead ${lead.id} to Notion`, err)
    throw err
  }
}
