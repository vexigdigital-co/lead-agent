import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  LeadFiltersSchema,
  ApiResponse,
} from '../types'

const router = Router()

// GET /api/leads — list with filters + pagination
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { score, search, page, limit } = LeadFiltersSchema.parse(req.query)
  const skip = (page - 1) * limit

  const where = {
    ...(score  && { score }),
    ...(search && {
      OR: [
        { name:    { contains: search, mode: 'insensitive' as const } },
        { email:   { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        conversations: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.lead.count({ where }),
  ])

  const response: ApiResponse = {
    success: true,
    data: leads,
    meta: { page, limit, total },
  }
  res.json(response)
}))

// GET /api/leads/:id — single lead with full conversation history
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: {
      conversations: {
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!lead) throw new AppError(404, 'Lead not found')

  res.json({ success: true, data: lead } as ApiResponse)
}))

// POST /api/leads — create lead manually
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = CreateLeadSchema.parse(req.body)

  const existing = await prisma.lead.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError(409, 'A lead with this email already exists')

  const lead = await prisma.lead.create({ data })
  res.status(201).json({ success: true, data: lead } as ApiResponse)
}))

// PATCH /api/leads/:id — update lead / score
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateLeadSchema.parse(req.body)

  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data,
  })

  res.json({ success: true, data: lead } as ApiResponse)
}))

// DELETE /api/leads/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.lead.delete({ where: { id: req.params.id } })
  res.json({ success: true, data: { deleted: true } } as ApiResponse)
}))

export default router
