export type Status = 'Pendente' | 'Em Andamento' | 'Concluído'
export type Phase = 'Estoque' | 'Documentação' | 'Processos' | 'Automações'

export type ChecklistItem = {
  label: string
  done: boolean
}

export type Task = {
  id: number
  title: string
  phase: Phase
  status: Status
  due: string
  createdAt: string
  responsible: string
  gravidade: number
  urgencia: number
  tendencia: number
  scoreGut: number
  tag: string
  checklist: ChecklistItem[]
  promptIa: string
  observacoes: string
}

export type Activity = {
  id: number
  actor: string
  tone: 'teal' | 'amber' | 'coral'
  message: string
  taskTitle: string
  time: string
}

export type DeadlineFilter = 'Todos' | 'Em aberto' | 'Concluídas'
export type GutFilter = 'Todos' | 'Críticas (80+)' | 'Altas (50-79)' | 'Baixas (até 49)'
