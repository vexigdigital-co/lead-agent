import OpenAI from 'openai'

export type LLMMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type LLMTool = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type LLMResponse = {
  text: string
  toolCall?: {
    name: string
    args: Record<string, unknown>
  }
}

// ─── Provider config ──────────────────────────────────────────────────────────

function getClient(): { client: OpenAI; model: string } {
  const provider = process.env.AI_PROVIDER || 'grok'

  switch (provider) {
    case 'grok':
      return {
        client: new OpenAI({
          apiKey:  process.env.GROK_API_KEY!,
          baseURL: 'https://api.x.ai/v1',
        }),
        model: process.env.GROK_MODEL || 'grok-3-mini',
      }

    case 'groq':
      return {
        client: new OpenAI({
          apiKey:  process.env.GROQ_API_KEY!,
          baseURL: 'https://api.groq.com/openai/v1',
        }),
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      }

    case 'openai':
      return {
        client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }),
        model:  process.env.OPENAI_MODEL || 'gpt-4o-mini',
      }

    case 'ollama':
      return {
        client: new OpenAI({
          apiKey:  'ollama', // required but unused
          baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
        }),
        model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      }

    case 'anthropic':
      // Anthropic via openai-compatible wrapper
      return {
        client: new OpenAI({
          apiKey:  process.env.ANTHROPIC_API_KEY!,
          baseURL: 'https://api.anthropic.com/v1',
          defaultHeaders: { 'anthropic-version': '2023-06-01' },
        }),
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
      }

    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`)
  }
}

// ─── Core chat function ───────────────────────────────────────────────────────

export async function llmChat(
  messages: LLMMessage[],
  tools?: LLMTool[],
): Promise<LLMResponse> {
  const { client, model } = getClient()

  const response = await client.chat.completions.create({
    model,
    messages,
    ...(tools && tools.length > 0 && {
      tools: tools.map(t => ({
        type: 'function' as const,
        function: {
          name:        t.name,
          description: t.description,
          parameters:  t.parameters,
        },
      })),
      tool_choice: 'auto',
    }),
    temperature: 0.4,
    max_tokens:  800,
  })

  const choice = response.choices[0]

  // Tool call response
  if (choice.message.tool_calls?.[0]) {
    const tc = choice.message.tool_calls[0]
    if (tc.type === 'function') {
      return {
        text: choice.message.content || '',
        toolCall: {
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments),
        },
      }
    }
  }

  // Text response
  return { text: choice.message.content || '' }
}
