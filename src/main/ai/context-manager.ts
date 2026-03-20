import { v4 as uuid } from 'uuid'
import { getAppDb } from '../db/app-db'
import type { AiConnectionContext } from '@shared/types/ai'

const MAX_CONTEXT_TOKENS = 8000 // Rough token budget for context

export function getConnectionContext(connectionId: string): AiConnectionContext[] {
  const db = getAppDb()
  return db
    .prepare('SELECT * FROM ai_connection_context WHERE connection_id = ? ORDER BY created_at ASC')
    .all(connectionId) as AiConnectionContext[]
}

export function getCachedSchema(connectionId: string): string | null {
  const db = getAppDb()
  const row = db
    .prepare('SELECT schema_json FROM schema_cache WHERE connection_id = ?')
    .get(connectionId) as { schema_json: string } | undefined
  return row?.schema_json || null
}

export function buildContextString(contexts: AiConnectionContext[]): string {
  if (contexts.length === 0) return ''

  const sections: Record<string, string[]> = {}
  for (const ctx of contexts) {
    if (!sections[ctx.contextType]) sections[ctx.contextType] = []
    sections[ctx.contextType].push(ctx.content)
  }

  const lines: string[] = []
  const labels: Record<string, string> = {
    schema_summary: 'Schema Summary',
    business_rule: 'Business Rules',
    naming_convention: 'Naming Conventions',
    relationship_note: 'Relationship Notes',
    user_correction: 'User Corrections',
    custom: 'Additional Context'
  }

  for (const [type, items] of Object.entries(sections)) {
    lines.push(`### ${labels[type] || type}`)
    for (const item of items) {
      lines.push(`- ${item}`)
    }
    lines.push('')
  }

  // Rough token estimation (4 chars per token)
  const text = lines.join('\n')
  if (text.length / 4 > MAX_CONTEXT_TOKENS) {
    return text.slice(0, MAX_CONTEXT_TOKENS * 4) + '\n... (context truncated)'
  }
  return text
}

export function parseContextUpdates(text: string): { type: string; content: string }[] {
  const updates: { type: string; content: string }[] = []
  const regex = /<context_update type="([^"]+)">([\s\S]*?)<\/context_update>/g
  let match
  while ((match = regex.exec(text)) !== null) {
    updates.push({ type: match[1], content: match[2].trim() })
  }
  return updates
}

export function saveContextUpdate(
  connectionId: string,
  contextType: string,
  content: string,
  source: string,
  metadata?: string
): void {
  const db = getAppDb()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO ai_connection_context (id, connection_id, context_type, content, source, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uuid(), connectionId, contextType, content, source, metadata ?? null, now, now)
}

export function hasWizardContext(connectionId: string): boolean {
  const db = getAppDb()
  const row = db
    .prepare('SELECT ai_wizard_completed FROM connections WHERE id = ?')
    .get(connectionId) as { ai_wizard_completed: number } | undefined
  return row?.ai_wizard_completed === 1
}
