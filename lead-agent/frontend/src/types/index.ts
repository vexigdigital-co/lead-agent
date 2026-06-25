export type LeadScore = 'HOT' | 'WARM' | 'COLD' | 'UNKNOWN'
export type ConvStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface Message {
  id: string
  createdAt: string
  conversationId: string
  role: MessageRole
  content: string
  extractedData?: Record<string, string> | null
}

export interface Conversation {
  id: string
  createdAt: string
  sessionId: string
  status: ConvStatus
  leadId: string | null
  messages: Message[]
}

export interface Lead {
  id: string
  createdAt: string
  updatedAt: string
  name: string | null
  email: string | null
  company: string | null
  useCase: string | null
  budgetRange: string | null
  timeline: string | null
  score: LeadScore
  scoreReason: string | null
  industry: string | null
  companySize: string | null
  companyWebsite: string | null
  notionPageId: string | null
  crmSyncedAt: string | null
  conversations: Conversation[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: { page: number; limit: number; total: number }
}

export interface LeadFilters {
  score?: LeadScore
  search?: string
  page?: number
  limit?: number
}
