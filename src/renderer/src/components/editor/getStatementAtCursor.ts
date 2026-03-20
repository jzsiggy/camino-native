/**
 * Extracts the SQL statement at the cursor position.
 * Statements are delimited by semicolons or blank lines.
 */
export function getStatementAtCursor(editor: any): string {
  const position = editor.getPosition()
  if (!position) return ''

  const text: string = editor.getValue()
  const cursorLine = position.lineNumber // 1-based
  const lines = text.split('\n')

  // Find statement boundaries by walking through lines
  let statementStart = 0
  let statementEnd = lines.length - 1

  // Walk backwards from cursor to find statement start
  for (let i = cursorLine - 1; i >= 0; i--) {
    const line = lines[i]
    if (line.trim() === '') {
      statementStart = i + 1
      break
    }
    if (i < cursorLine - 1 && line.trimEnd().endsWith(';')) {
      statementStart = i + 1
      break
    }
    statementStart = i
  }

  // Walk forwards from cursor to find statement end
  for (let i = cursorLine - 1; i < lines.length; i++) {
    statementEnd = i
    const line = lines[i]
    if (line.trimEnd().endsWith(';')) {
      break
    }
    if (i > cursorLine - 1 && line.trim() === '') {
      statementEnd = i - 1
      break
    }
  }

  const statement = lines.slice(statementStart, statementEnd + 1).join('\n').trim()
  return statement
}
