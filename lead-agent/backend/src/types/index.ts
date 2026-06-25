import { z } from 'zod'

// ─── Lead schemas ────────────────────────────────────────────────────────────

export const LeadScoreEnum = z.enum(['HOT', 'WARM', 'COLD', 'UNKNOWN'])
export type LeadScore = z.infer<typeof LeadScoreEnum>

export const ConvStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED'])
export type ConvStatus = z.infer<typeof ConvStatusEnum>

export const MessageRoleEnum = z.enum(['USER', 'ASSISTANT', 'SYSTEM'])
export type MessageRole = z.infer<typeof MessageRoleEnum>

// Partial lead fields the AI extracts progressively
export const ExtractedLeadSchema = z.object({
  name:        z.string().optional(),
  email:       z.string().email().optional(),
  company:     z.string().optional(),
  useCase:     z.string().optional(),
  budgetRange: z.string().optional(),
  timeline:    z.string().optional(),
})
export type ExtractedLead = z.infer<typeof ExtractedLeadSchema>

// ─── API request/response schemas ────────────────────────────────────────────

export const SendMessageSchema = z.object({
  sessionId: z.string().min(1),
  message:   z.string().min(1).max(2000),
})
export type SendMessageInput = z.infer<typeof SendMessageSchema>

export const CreateLeadSchema = z.object({
  name:        z.string().min(1),
  email:       z.string().email(),
  company:     z.string().optional(),
  useCase:     z.string().optional(),
  budgetRange: z.string().optional(),
  timeline:    z.string().optional(),
})
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  score:       LeadScoreEnum.optional(),
  scoreReason: z.string().optional(),
})
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>

export const LeadFiltersSchema = z.object({
  score:  LeadScoreEnum.optional(),
  search: z.string().optional(),
  page:   z.coerce.number().min(1).default(1),
  limit:  z.coerce.number().min(1).max(100).default(20),
})
export type LeadFilters = z.infer<typeof LeadFiltersSchema>

// ─── API response wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?:   T
  error?:  string
  meta?:   { page: number; limit: number; total: number }
}
