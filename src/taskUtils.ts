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

export const computeScore = (gravidade: number, urgencia: number, tendencia: number) =>
  gravidade * urgencia * tendencia

export const getDueState = (due: string, status: string, referenceDate = new Date()): DueState => {
  if (status === 'Concluído' || due === 'Concluída') return 'completed'
  if (due === 'Hoje') return 'today'

  const match = due.toLowerCase().match(/^(\d{1,2})\s+([a-zç]+)$/)
  if (!match) return 'undated'

  const month = monthIndexes[match[2].slice(0, 3)]
  if (month === undefined) return 'undated'

  const dueDate = new Date(referenceDate.getFullYear(), month, Number(match[1]))
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
