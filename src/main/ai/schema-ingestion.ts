import type { DatabaseSchema } from '@shared/types/schema'
import { buildSchemaText } from './prompt-templates'

export function schemaToSummary(schema: DatabaseSchema): string {
  return buildSchemaText(schema as Parameters<typeof buildSchemaText>[0])
}

export function schemaToCompact(schema: DatabaseSchema): string {
  const lines: string[] = []
  for (const s of schema.schemas) {
    for (const t of s.tables) {
      const cols = t.columns.map((c) => {
        let desc = c.name
        if (c.isPrimaryKey) desc += '*'
        if (c.isForeignKey) desc += `→${c.referencesTable}`
        return desc
      })
      lines.push(`${s.name}.${t.name}(${cols.join(', ')})`)
    }
  }
  return lines.join('\n')
}
