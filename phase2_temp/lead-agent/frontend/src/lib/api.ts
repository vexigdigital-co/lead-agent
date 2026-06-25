import axios from 'axios'
import type { Lead, Conversation, ApiResponse, LeadFilters } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error || err.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export const leadsApi = {
  list: async (filters?: LeadFilters) => {
    const { data } = await api.get<ApiResponse<Lead[]>>('/leads', { params: filters })
    return data
  },
  get: async (id: string) => {
    const { data } = await api.get<ApiResponse<Lead>>(`/leads/${id}`)
    return data.data!
  },
  update: async (id: string, payload: Partial<Lead>) => {
    const { data } = await api.patch<ApiResponse<Lead>>(`/leads/${id}`, payload)
    return data.data!
  },
  delete: async (id: string) => {
    await api.delete(`/leads/${id}`)
  },
}

export const chatApi = {
  start: async () => {
    const { data } = await api.post<ApiResponse<Conversation>>('/chat/start')
    return data.data!
  },
  send: async (sessionId: string, message: string) => {
    const { data } = await api.post<ApiResponse<{
      message: { id: string; createdAt: string; conversationId: string; role: 'ASSISTANT'; content: string }
      extractedData?: Record<string, string>
      isComplete: boolean
    }>>('/chat/message', { sessionId, message })
    return data.data!
  },
  get: async (sessionId: string) => {
    const { data } = await api.get<ApiResponse<Conversation>>(`/chat/${sessionId}`)
    return data.data!
  },
  end: async (sessionId: string) => {
    await api.patch(`/chat/${sessionId}/end`)
  },
}

export default api
