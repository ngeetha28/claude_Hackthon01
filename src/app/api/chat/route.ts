import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getAllResources } from '@/lib/filterResources'
import type { ChatMessage, FounderProfile } from '@/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { messages, profile, filteredIds } = await req.json() as {
    messages: ChatMessage[]
    profile: FounderProfile
    filteredIds: string[]
  }

  const allResources = getAllResources()
  const relevantResources = filteredIds.length > 0
    ? allResources.filter(r => filteredIds.includes(r.id))
    : allResources

  const resourceContext = relevantResources
    .map(r => `- ${r.title}: ${r.description} (${r.link})`)
    .join('\n')

  const systemPrompt = `You are the Utah Founder's Navigator, an AI advisor helping entrepreneurs discover state resources.

Founder Profile:
- Business Stage: ${profile.stage}
- Industry: ${profile.industry}
- County: ${profile.county}
- Community: ${profile.community}

Available Utah state resources for this founder:
${resourceContext}

Guidelines:
- Only recommend resources from the list above
- Be concise and direct — founders are busy
- Ask follow-up questions to narrow down needs if helpful
- Format resource recommendations with name, what it does, and link
- If asked about something not covered by these resources, say so honestly
- Personalize advice to their specific stage, location, and community`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ message: text })
}
