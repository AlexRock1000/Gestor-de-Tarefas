export type DueState = 'overdue' | 'today' | 'upcoming' | 'completed' | 'undated'

const monthIndexes: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
}

const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const parseDueDate = (due: string, referenceDate: Date) => {
  const isoMatch = due.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
      ? date
      : null
  }

  const legacyMatch = due.toLowerCase().match(/^(\d{1,2})\s+([a-zç]+)$/)
  if (!legacyMatch) return null

  const month = monthIndexes[legacyMatch[2].slice(0, 3)]
  if (month === undefined) return null

  const day = Number(legacyMatch[1])
  const date = new Date(referenceDate.getFullYear(), month, day)
  return date.getMonth() === month && date.getDate() === day ? date : null
}

export const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const normalizeDueDate = (due: string, referenceDate = new Date()) => {
  if (due === 'Hoje') return formatLocalDate(referenceDate)
  const parsedDate = parseDueDate(due, referenceDate)
  return parsedDate ? formatLocalDate(parsedDate) : due
}

export const formatDueDate = (due: string, referenceDate = new Date()) => {
  if (due === 'Sem prazo' || due === 'Concluída') return due
  if (due === 'Hoje') return due

  const parsedDate = parseDueDate(due, referenceDate)
  if (!parsedDate) return due

  return `${parsedDate.getDate()} ${monthLabels[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`
}

export const parseCsv = (content: string): string[][] => {
  const text = content.replace(/^\uFEFF/, '')
  let delimiter = ';'
  let quoteOpen = false
  let semicolons = 0
  let commas = 0

  for (const character of text) {
    if (character === '"') {
      quoteOpen = !quoteOpen
    } else if (!quoteOpen && (character === '\n' || character === '\r')) {
      break
    } else if (!quoteOpen && character === ';') {
      semicolons += 1
    } else if (!quoteOpen && character === ',') {
      commas += 1
    }
  }
  if (commas > semicolons) delimiter = ','

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (!inQuotes && character === delimiter) {
      row.push(field)
      field = ''
    } else if (!inQuotes && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (inQuotes) throw new Error('Há aspas sem fechamento no arquivo.')
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

export const computeScore = (gravidade: number, urgencia: number, tendencia: number) =>
  gravidade * urgencia * tendencia

export const getDueState = (due: string, status: string, referenceDate = new Date()): DueState => {
  if (status === 'Concluído' || due === 'Concluída') return 'completed'
  if (due === 'Hoje') return 'today'

  const dueDate = parseDueDate(due, referenceDate)
  if (!dueDate) return 'undated'

  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today ? 'overdue' : 'upcoming'
}

export const resolveDueForStatus = (status: string, currentDue: string) => {
  if (status === 'Concluído') {
    return 'Concluída'
  }

  if (currentDue === 'Concluída') {
    return 'Sem prazo'
  }

  if (!currentDue || currentDue === 'Sem prazo') {
    return 'Sem prazo'
  }

  return currentDue
}

export const getPriorityBand = (score: number) => {
  if (score >= 80) return 'critical'
  if (score >= 50) return 'high'
  return 'low'
}

export const getPriorityLabel = (score: number) => {
  if (score >= 80) return 'Alta prioridade'
  if (score >= 50) return 'Média'
  return 'Baixa'
}
