import { llmChat, LLMMessage, LLMTool } from '../lib/llm'
import type { Message } from '@prisma/client'

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly, professional sales assistant for a software agency. 
Your goal is to learn about visitors and capture their contact details and project needs — naturally, through conversation.

Rules:
- Be warm and conversational, never robotic or form-like
- Ask ONE question at a time — never multiple questions at once
- Gather these fields naturally over the conversation:
    name, email, company, useCase (what they want to build/solve), budgetRange, timeline
- Once you have name + email + useCase, call the "save_lead_fields" tool to save progress
- Call "save_lead_fields" again whenever you collect additional fields
- When you have all 6 fields OR the user seems ready to wrap up, call "complete_conversation"
- Keep responses short (2-3 sentences max)
- If user asks about services or pricing, give a brief helpful answer then steer back to learning about them

Budget range options to suggest if asked: "Under $5k", "$5k–$20k", "$20k–$50k", "$50k+"
Timeline options: "ASAP", "1–3 months", "3–6 months", "6+ months"`

// ─── Tools definition ─────────────────────────────────────────────────────────

const TOOLS: LLMTool[] = [
  {
    name: 'save_lead_fields',
    description: 'Save any lead fields collected so far. Call this as soon as you have name + email + useCase, and again when you get more fields.',
    parameters: {
      type: 'object',
      properties: {
        name:        { type: 'string',  description: 'Full name of the lead' },
        email:       { type: 'string',  description: 'Email address' },
        company:     { type: 'string',  description: 'Company or organisation name' },
        useCase:     { type: 'string',  description: 'What they want to build or the problem they want to solve' },
        budgetRange: { type: 'string',  description: 'Budget range e.g. "$5k–$20k"' },
        timeline:    { type: 'string',  description: 'When they want to start/finish e.g. "1–3 months"' },
      },
      required: [],
    },
  },
  {
    name: 'complete_conversation',
    description: 'Mark the conversation as complete when you have enough info or the user is wrapping up.',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'One-sentence summary of what the lead needs' },
      },
      required: ['summary'],
    },
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentResult {
  reply:          string
  extractedData?: Record<string, string>
  shouldComplete: boolean
}

// ─── Main agent function ──────────────────────────────────────────────────────

export async function conversationAgent(
  history: Message[],
  newUserMessage: string,
): Promise<AgentResult> {

  // Build message history for LLM
  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    // Map DB messages to LLM format (skip SYSTEM role from DB)
    ...history
      .filter(m => m.role !== 'SYSTEM')
      .map(m => ({
        role:    m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
      })),
    { role: 'user', content: newUserMessage },
  ]

  const result = await llmChat(messages, TOOLS)

  // Tool call: save_lead_fields
  if (result.toolCall?.name === 'save_lead_fields') {
    const extracted = result.toolCall.args as Record<string, string>

    // After saving, get a follow-up reply from the agent
    const followUp = await llmChat([
      ...messages,
      {
        role: 'assistant',
        content: `[Saved fields: ${Object.keys(extracted).join(', ')}]`,
      },
      {
        role: 'user',
        content: 'Continue the conversation naturally. Ask for the next missing field.',
      },
    ])

    return {
      reply:          followUp.text,
      extractedData:  extracted,
      shouldComplete: false,
    }
  }

  // Tool call: complete_conversation
  if (result.toolCall?.name === 'complete_conversation') {
    return {
      reply:          `Thanks! We have everything we need. Our team will reach out to you shortly. ${result.toolCall.args.summary}`,
      shouldComplete: true,
    }
  }

  // Normal text reply
  return {
    reply:          result.text,
    shouldComplete: false,
  }
}
