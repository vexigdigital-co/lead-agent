import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { SendMessageSchema, ApiResponse } from '../types'
import { conversationAgent } from '../agents/conversationAgent'
import { qualifierAgent } from '../agents/qualifierAgent'
import { randomUUID } from 'crypto'

const router = Router()

// POST /api/chat/start
router.post('/start', asyncHandler(async (_req: Request, res: Response) => {
  const sessionId = randomUUID()

  const conversation = await prisma.conversation.create({
    data: {
      sessionId,
      status: 'ACTIVE',
      messages: {
        create: {
          role: 'ASSISTANT',
          content: "Hi! I'm here to learn about your needs and see how we can help. What's your name?",
        },
      },
    },
    include: { messages: true },
  })

  res.status(201).json({ success: true, data: conversation } as ApiResponse)
}))

// POST /api/chat/message
router.post('/message', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, message } = SendMessageSchema.parse(req.body)

  const conversation = await prisma.conversation.findUnique({
    where: { sessionId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      lead: true,
    },
  })

  if (!conversation)              throw new AppError(404, 'Conversation not found')
  if (conversation.status !== 'ACTIVE') throw new AppError(400, 'Conversation is no longer active')

  // Save user message
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'USER', content: message },
  })

  // ── Run conversation agent ─────────────────────────────────────────────────
  const agentResult = await conversationAgent(conversation.messages, message)

  // ── Merge extracted data with existing lead data ───────────────────────────
  const mergedData = {
    ...(conversation.lead ? {
      name:        conversation.lead.name        ?? undefined,
      email:       conversation.lead.email       ?? undefined,
      company:     conversation.lead.company     ?? undefined,
      useCase:     conversation.lead.useCase     ?? undefined,
      budgetRange: conversation.lead.budgetRange ?? undefined,
      timeline:    conversation.lead.timeline    ?? undefined,
    } : {}),
    ...(agentResult.extractedData ?? {}),
  }

  // ── Upsert lead if we have at least email ──────────────────────────────────
  let leadId = conversation.leadId
  if (mergedData.email) {
    const lead = await prisma.lead.upsert({
      where:  { email: mergedData.email },
      update: { ...mergedData },
      create: { ...mergedData },
    })
    leadId = lead.id

    // Link conversation to lead if not already
    if (!conversation.leadId) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data:  { leadId: lead.id },
      })
    }
  }

  // ── Save assistant message ─────────────────────────────────────────────────
  const assistantMsg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role:           'ASSISTANT',
      content:        agentResult.reply,
      extractedData:  agentResult.extractedData ?? undefined,
    },
  })

  // ── Complete conversation + run qualifier if needed ────────────────────────
  if (agentResult.shouldComplete && leadId) {
    // Mark complete
    await prisma.conversation.update({
      where: { id: conversation.id },
      data:  { status: 'COMPLETED' },
    })

    // Run qualifier agent async (don't block response)
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (lead) {
      qualifierAgent(lead)
        .then(({ score, scoreReason }) =>
          prisma.lead.update({ where: { id: leadId! }, data: { score, scoreReason } })
        )
        .catch(err => console.error('[qualifier]', err))
    }
  }

  res.json({
    success: true,
    data: {
      message:       assistantMsg,
      extractedData: agentResult.extractedData,
      isComplete:    agentResult.shouldComplete,
    },
  } as ApiResponse)
}))

// GET /api/chat/:sessionId
router.get('/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const conversation = await prisma.conversation.findUnique({
    where: { sessionId: req.params.sessionId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      lead: true,
    },
  })

  if (!conversation) throw new AppError(404, 'Conversation not found')
  res.json({ success: true, data: conversation } as ApiResponse)
}))

// PATCH /api/chat/:sessionId/end
router.patch('/:sessionId/end', asyncHandler(async (req: Request, res: Response) => {
  const conversation = await prisma.conversation.update({
    where: { sessionId: req.params.sessionId },
    data:  { status: 'COMPLETED' },
  })
  res.json({ success: true, data: conversation } as ApiResponse)
}))

export default router
