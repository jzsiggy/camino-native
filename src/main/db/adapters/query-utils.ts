/**
 * Appends LIMIT maxRows+1 to SELECT statements that don't already have a LIMIT clause.
 * The +1 allows detecting whether results were truncated.
 */
export function addLimitIfNeeded(
  sql: string,
  maxRows?: number
): { sql: string; limitApplied: boolean } {
  if (!maxRows) return { sql, limitApplied: false }

  const trimmed = sql.trim()
  const upper = trimmed.toUpperCase()

  // Only apply to SELECT/WITH statements
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return { sql, limitApplied: false }
  }

  // Don't add LIMIT if one already exists (simple check against the outermost query)
  // Look for LIMIT that's not inside parentheses (subqueries)
  let depth = 0
  let hasOuterLimit = false
  const tokens = upper.split(/(\s+|\(|\))/)
  for (const token of tokens) {
    if (token === '(') depth++
    else if (token === ')') depth--
    else if (token === 'LIMIT' && depth === 0) {
      hasOuterLimit = true
      break
    }
  }

  if (hasOuterLimit) return { sql, limitApplied: false }

  // Strip trailing semicolon before appending LIMIT
  const cleaned = trimmed.replace(/;\s*$/, '')
  return { sql: `${cleaned} LIMIT ${maxRows + 1}`, limitApplied: true }
}
