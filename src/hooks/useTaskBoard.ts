import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  computeScore,
  CRITICAL_PRIORITY_THRESHOLD,
  describeRequestError,
  formatLocalDate,
  getDueState,
  parseCsv,
  getPriorityBand,
  getPriorityLabel,
  HIGH_PRIORITY_THRESHOLD,
  normalizeDueDate,
  resolveDueForStatus,
  type DueState,
} from '../taskUtils'
import type {
  Activity,
  ChecklistItem,
  DeadlineFilter,
  GutFilter,
  Phase,
  Status,
  Task,
} from '../types'

export const phases: { name: Phase; tone: string; accent: string }[] = [
  { name: 'Estoque', tone: 'teal', accent: '#17847c' },
  { name: 'Documentação', tone: 'amber', accent: '#d18a29' },
  { name: 'Processos', tone: 'coral', accent: '#d45c4f' },
  { name: 'Automações', tone: 'lavender', accent: '#6257d6' },
]

export const statusOrder: Status[] = ['Pendente', 'Em Andamento', 'Concluído']

export const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const dueStateLabels: Record<DueState, string> = {
  overdue: 'Atrasada',
  today: 'Vence hoje',
  upcoming: 'No prazo',
  completed: 'Concluída',
  undated: 'Sem prazo',
}

export const dueToInputValue = (due: string) => {
  const normalized = normalizeDueDate(due)
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : ''
}

export const inputValueToDue = (value: string) => {
  if (!value) return 'Sem prazo'
  const selected = new Date(`${value}T00:00:00`)
  return Number.isNaN(selected.getTime()) ? 'Sem prazo' : formatLocalDate(selected)
}

const formatCreatedAt = (date: Date) => {
  const datePart = date.toLocaleDateString('pt-BR')
  const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} às ${timePart}`
}

export const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Mapear itens sem giro há 90 dias',
    phase: 'Estoque',
    status: 'Em Andamento',
    due: formatLocalDate(new Date()),
    createdAt: '12 set',
    responsible: 'Daniel Rocha',
    importancia: 5,
    urgencia: 4,
    scoreGut: 20,
    tag: 'Diagnóstico',
    checklist: [
      { label: 'Exportar relatório do ERP', done: true },
      { label: 'Classificar itens por curva ABC', done: true },
      { label: 'Validar lista com compras', done: false },
    ],
    promptIa: 'Analise os itens sem giro há 90 dias e proponha uma ação de redução de estoque com base em risco financeiro, espaço e demanda real.',
    observacoes: 'Aular itens duplicados no ERP e confirmar data de última movimentação antes da decisão final.',
  },
  {
    id: 2,
    title: 'Definir política de inventário cíclico',
    phase: 'Estoque',
    status: 'Pendente',
    due: '2026-09-18',
    createdAt: '14 set',
    responsible: 'Ana Maria',
    importancia: 4,
    urgencia: 3,
    scoreGut: 12,
    tag: 'Política',
    checklist: [
      { label: 'Levantar frequência atual', done: false },
      { label: 'Propor nova frequência', done: false },
      { label: 'Validar com área de compras', done: false },
    ],
    promptIa: 'Crie uma política de inventário cíclico para reduzir faltas e excesso, com critério por categoria e frequência de revisão.',
    observacoes: 'Precisa alinhar com a política fiscal e taxas de obsolescência da operação.',
  },
  {
    id: 3,
    title: 'Revisar contratos de fornecedores',
    phase: 'Documentação',
    status: 'Em Andamento',
    due: '2026-09-20',
    createdAt: '10 set',
    responsible: 'Lucas Costa',
    importancia: 4,
    urgencia: 4,
    scoreGut: 16,
    tag: 'Contratos',
    checklist: [
      { label: 'Consolidar contratos vigentes', done: true },
      { label: 'Sinalizar cláusulas críticas', done: false },
      { label: 'Agendar revisão jurídica', done: false },
    ],
    promptIa: 'Revise os contratos de fornecedores e destaque riscos jurídicos, prazos e cláusulas que exigem renegociação.',
    observacoes: 'Alguns contratos ainda possuem cláusulas de penalidade sem data de revisão.',
  },
  {
    id: 4,
    title: 'Centralizar POPs da operação',
    phase: 'Documentação',
    status: 'Concluído',
    due: 'Concluída',
    createdAt: '08 set',
    responsible: 'Fernanda Silva',
    importancia: 3,
    urgencia: 2,
    scoreGut: 6,
    tag: 'Organização',
    checklist: [
      { label: 'Criar estrutura de pastas', done: true },
      { label: 'Migrar documentos aprovados', done: true },
      { label: 'Validar acesso por área', done: true },
    ],
    promptIa: 'Organize os POPs da operação em uma estrutura centralizada com critérios de padronização e rastreabilidade.',
    observacoes: 'Documento-base já validado; agora é só manter a revisão quinzenal.',
  },
  {
    id: 5,
    title: 'Desenhar fluxo de aprovação',
    phase: 'Processos',
    status: 'Pendente',
    due: '2026-09-24',
    createdAt: '16 set',
    responsible: 'Bruno Souza',
    importancia: 5,
    urgencia: 4,
    scoreGut: 20,
    tag: 'Fluxo',
    checklist: [
      { label: 'Entrevistar responsáveis', done: false },
      { label: 'Desenhar fluxo atual', done: false },
      { label: 'Validar pontos de controle', done: false },
    ],
    promptIa: 'Desenhe um fluxo de aprovação enxuto, com responsáveis, critérios e pontos de controle para reduzir retrabalho.',
    observacoes: 'Há demora no alinhamento de approvers; precisa reduzir etapas sem perder controle.',
  },
  {
    id: 6,
    title: 'Automatizar rotina de conferência',
    phase: 'Automações',
    status: 'Em Andamento',
    due: '2026-09-26',
    createdAt: '15 set',
    responsible: 'Miguel Nunes',
    importancia: 5,
    urgencia: 4,
    scoreGut: 20,
    tag: 'IA & Automação',
    checklist: [
      { label: 'Mapear rotina manual atual', done: true },
      { label: 'Definir gatilhos e regras', done: false },
      { label: 'Validar com operação', done: false },
    ],
    promptIa: 'Sugira uma automação para a rotina de conferência, incluindo gatilhos, validações e indicadores de erro.',
    observacoes: 'A automatização deve reduzir revisão manual sem aumentar risco de divergência.',
  },
]

const storageKey = 'gestor-de-tarefas-v1'
const activityStorageKey = `${storageKey}-activity`
const API_BASE_URL = '/api'

const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

const normalizeTask = (value: unknown): Task => {
  const task = value as Record<string, unknown>
  const importancia = Number(task.importancia ?? task.gravidade ?? 3)
  const urgencia = Number(task.urgencia ?? 3)
  const normalizedFields = Object.fromEntries(
    Object.entries(task).filter(([key]) => key !== 'gravidade' && key !== 'tendencia'),
  )

  return {
    ...normalizedFields,
    importancia,
    urgencia,
    scoreGut: computeScore(importancia, urgencia),
    due: normalizeDueDate(String(task.due ?? 'Sem prazo')),
  } as Task
}

const initialActivities: Activity[] = [
  { id: 1, actor: 'Daniel', tone: 'teal', message: 'concluiu', taskTitle: 'Centralizar POPs', time: 'Há 24 min' },
  { id: 2, actor: 'Ana', tone: 'amber', message: 'atualizou a prioridade de', taskTitle: 'Revisar contratos', time: 'Há 1 h' },
  { id: 3, actor: 'Lucas', tone: 'coral', message: 'adicionou um item ao checklist', taskTitle: '', time: 'Há 2 h' },
]

export function useTaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') {
      return initialTasks
    }

    const stored = window.localStorage.getItem(storageKey)

    if (!stored) {
      return initialTasks
    }

    try {
      const parsed = JSON.parse(stored) as unknown[]
      return Array.isArray(parsed) && parsed.length
        ? parsed.map(normalizeTask)
        : initialTasks
    } catch {
      return initialTasks
    }
  })

  const [activePhase, setActivePhase] = useState<'Todas' | Phase>('Todas')
  const [statusFilter, setStatusFilter] = useState<'Todos' | Status>('Todos')
  const [quickFilter, setQuickFilter] = useState<'Todos' | 'Hoje' | 'Urgentes' | 'Concluídas'>('Todos')
  const [responsibleFilter, setResponsibleFilter] = useState('Todos')
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('Todos')
  const [gutFilter, setGutFilter] = useState<GutFilter>('Todos')
  const [activeView, setActiveView] = useState('Minhas tarefas')
  const [search, setSearch] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>(() => {
    if (typeof window === 'undefined') return initialActivities
    const stored = window.localStorage.getItem(activityStorageKey)
    if (!stored) return initialActivities
    try {
      const parsed = JSON.parse(stored) as Activity[]
      return Array.isArray(parsed) && parsed.length ? parsed : initialActivities
    } catch {
      return initialActivities
    }
  })

  const syncFromServer = async () => {
    setSyncError(null)
    setIsLoadingTasks(true)
    setIsLoadingActivities(true)

    try {
      const [savedTasks, savedActivities] = await Promise.all([
        apiRequest<Task[]>('/tasks'),
        apiRequest<Activity[]>('/activities'),
      ])

      setTasks(savedTasks.map(normalizeTask))
      setActivities(savedActivities)
    } catch (error) {
      setSyncError(describeRequestError(error))
    } finally {
      setIsLoadingTasks(false)
      setIsLoadingActivities(false)
    }
  }

  useEffect(() => {
    void syncFromServer()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(tasks))
    }
  }, [tasks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(activityStorageKey, JSON.stringify(activities))
    }
  }, [activities])

  useEffect(() => {
    if (selectedTaskId !== null && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null)
    }
  }, [selectedTaskId, tasks])

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  const responsibleOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.responsible))].sort((a, b) => a.localeCompare(b)),
    [tasks],
  )

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const dueState = getDueState(task.due, task.status)
      const phaseMatches = activePhase === 'Todas' || task.phase === activePhase
      const statusMatches = statusFilter === 'Todos' || task.status === statusFilter
      const titleMatches = task.title.toLowerCase().includes(search.toLowerCase())
      const responsibleMatches = responsibleFilter === 'Todos' || task.responsible === responsibleFilter
      const deadlineMatches =
        deadlineFilter === 'Todos' ||
        (deadlineFilter === 'Concluídas' && task.status === 'Concluído') ||
        (deadlineFilter === 'Em aberto' && task.status !== 'Concluído')
      const gutMatches =
        gutFilter === 'Todos' ||
        (gutFilter === 'Críticas (20+)' && task.scoreGut >= CRITICAL_PRIORITY_THRESHOLD) ||
        (gutFilter === 'Altas (12-19)' && task.scoreGut >= HIGH_PRIORITY_THRESHOLD && task.scoreGut < CRITICAL_PRIORITY_THRESHOLD) ||
        (gutFilter === 'Baixas (até 11)' && task.scoreGut < HIGH_PRIORITY_THRESHOLD)
      const quickMatches =
        quickFilter === 'Todos' ||
        (quickFilter === 'Hoje' && (dueState === 'today' || dueState === 'overdue')) ||
        (quickFilter === 'Urgentes' && (task.scoreGut >= CRITICAL_PRIORITY_THRESHOLD || dueState === 'today' || dueState === 'overdue')) ||
        (quickFilter === 'Concluídas' && task.status === 'Concluído')

      return phaseMatches && statusMatches && titleMatches && responsibleMatches && deadlineMatches && gutMatches && quickMatches
    })

    return [...filtered].sort((a, b) => b.scoreGut - a.scoreGut)
  }, [activePhase, deadlineFilter, gutFilter, quickFilter, responsibleFilter, search, statusFilter, tasks])

  const totalProgress = tasks.length
    ? Math.round(
        tasks.reduce((sum, task) => {
          if (task.status === 'Concluído') return sum + 100
          const completed = task.checklist.filter((item) => item.done).length
          const percent = task.checklist.length ? (completed / task.checklist.length) * 100 : 0
          return sum + percent
        }, 0) / tasks.length,
      )
    : 0

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    const currentTask = tasks.find((task) => task.id === taskId)
    if (!currentTask) {
      return
    }

    const nextImportancia = updates.importancia ?? currentTask.importancia
    const nextUrgencia = updates.urgencia ?? currentTask.urgencia
    const nextTask = {
      ...currentTask,
      ...updates,
      scoreGut: computeScore(nextImportancia, nextUrgencia),
    }

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? nextTask : task)),
    )

    try {
      await apiRequest<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(nextTask),
      })
    } catch (error) {
      setSyncError(describeRequestError(error))
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(tasks.map((task) => (task.id === taskId ? nextTask : task))))
      }
    }
  }

  const recordActivity = async (activity: Omit<Activity, 'id'>) => {
    try {
      const savedActivity = await apiRequest<Activity>('/activities', {
        method: 'POST',
        body: JSON.stringify(activity),
      })
      setActivities((current) => [savedActivity, ...current].slice(0, 12))
    } catch (error) {
      setSyncError(describeRequestError(error))
      setActivities((current) => [{ ...activity, id: Date.now() }, ...current].slice(0, 12))
    }
  }

  const updateStatus = async (id: number, status: Status) => {
    const task = tasks.find((item) => item.id === id)
    if (!task) {
      return
    }

    const nextDue = resolveDueForStatus(status, task.due)
    const nextTask = { ...task, status, due: nextDue }
    setTasks((current) => current.map((item) => (item.id === id ? nextTask : item)))

    try {
      await apiRequest<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(nextTask),
      })
    } catch (error) {
      setSyncError(describeRequestError(error))
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(tasks.map((item) => (item.id === id ? nextTask : item))))
      }
    }

    if (task.status !== status) {
      void recordActivity({
        actor: 'Daniel',
        tone: status === 'Concluído' ? 'teal' : 'amber',
        message: 'moveu para',
        taskTitle: task.title,
        time: 'Agora',
      })
    }
  }

  const handleKanbanDrop = (status: Status) => {
    if (draggedTaskId !== null) {
      updateStatus(draggedTaskId, status)
    }
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }

  const toggleChecklist = (taskId: number, itemIndex: number) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || !task.checklist[itemIndex]) return

    const checklist = task.checklist.map((item, index) =>
      index === itemIndex ? { ...item, done: !item.done } : item,
    )
    const wasChecklistComplete = task.checklist.length > 0 && task.checklist.every((item) => item.done)
    const isChecklistComplete = checklist.length > 0 && checklist.every((item) => item.done)
    const completesTask = isChecklistComplete && task.status !== 'Concluído'
    const reopensTask = wasChecklistComplete && !isChecklistComplete && task.status === 'Concluído'
    const status: Status = completesTask ? 'Concluído' : reopensTask ? 'Pendente' : task.status
    const due = completesTask || reopensTask ? resolveDueForStatus(status, task.due) : task.due

    void updateTask(taskId, { checklist, status, due })
    void recordActivity({
      actor: 'Daniel',
      tone: completesTask ? 'teal' : 'coral',
      message: completesTask ? 'concluiu ao finalizar o checklist de' : reopensTask ? 'reabriu ao desmarcar o checklist de' : 'atualizou o checklist de',
      taskTitle: task.title,
      time: 'Agora',
    })
  }

  const addTask = () => {
    const nextPhase = activePhase === 'Todas' ? 'Processos' : activePhase
    const createdAt = formatCreatedAt(new Date())
    const newTask: Task = {
      id: Date.now(),
      title: 'Nova tarefa operacional',
      phase: nextPhase,
      status: 'Pendente',
      due: 'Sem prazo',
      createdAt,
      responsible: 'Não atribuída',
      importancia: 3,
      urgencia: 3,
      scoreGut: 9,
      tag: 'Nova',
      checklist: [{ label: 'Definir próximo passo', done: false }],
      promptIa: 'Estruture os próximos três passos práticos para esta tarefa, considerando prioridade, risco e tempo de execução.',
      observacoes: 'Atribuir responsável e cronograma inicial para acompanhamento.',
    }

    setSelectedTaskId(null)
    setIsCreatingTask(true)
    setEditingTask(newTask)
  }

  const deleteTask = async (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId)
    setTasks((current) => {
      const nextTasks = current.filter((taskItem) => taskItem.id !== taskId)
      if (selectedTaskId === taskId) {
        setSelectedTaskId(nextTasks[0]?.id ?? null)
      }
      return nextTasks
    })

    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' })
    } catch (error) {
      setSyncError(describeRequestError(error))
      if (typeof window !== 'undefined') {
        const nextTasks = tasks.filter((taskItem) => taskItem.id !== taskId)
        window.localStorage.setItem(storageKey, JSON.stringify(nextTasks))
      }
    }

    if (task) void recordActivity({ actor: 'Daniel', tone: 'coral', message: 'removeu', taskTitle: task.title, time: 'Agora' })
  }

  const addChecklistItem = (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    void updateTask(taskId, {
      checklist: [...task.checklist, { label: `Novo item ${task.checklist.length + 1}`, done: false }],
    })
  }

  const removeChecklistItem = (taskId: number, itemIndex: number) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    void updateTask(taskId, { checklist: task.checklist.filter((_, index) => index !== itemIndex) })
  }

  const updateChecklistLabel = (taskId: number, itemIndex: number, label: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task || !task.checklist[itemIndex]) return
    const checklist = task.checklist.map((item, index) => index === itemIndex ? { ...item, label } : item)
    void updateTask(taskId, { checklist })
  }

  const copyPrompt = async (task: Task) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(task.promptIa)
    }
    setCopiedTaskId(task.id)
    window.setTimeout(() => setCopiedTaskId(null), 1800)
  }

  const exportTasks = () => {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const headers = [
      'Tarefa',
      'Fase',
      'Status',
      'Responsável',
      'Prazo',
      'Importância',
      'Urgência',
      'Prioridade',
      'Tag',
      'Checklist',
      'Prompt de IA',
      'Anotações',
      'Estado do prazo',
    ]
    const rows = visibleTasks.map((task) => [
      task.title,
      task.phase,
      task.status,
      task.responsible,
      task.due,
      task.importancia,
      task.urgencia,
      task.scoreGut,
      task.tag,
      JSON.stringify(task.checklist),
      task.promptIa,
      task.observacoes,
      dueStateLabels[getDueState(task.due, task.status)],
    ])
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orbit-tarefas-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importTasks = async (event: ChangeEvent<HTMLInputElement>): Promise<number> => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return 0

    const content = await file.text()
    const rows = parseCsv(content)
    if (rows.length < 2) throw new Error('O arquivo precisa conter cabeçalho e ao menos uma tarefa.')

    const normalizeHeader = (header: string) =>
      header.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const headers = rows[0].map(normalizeHeader)
    const column = (name: string) => headers.indexOf(normalizeHeader(name))
    const titleColumn = column('Tarefa')
    if (titleColumn < 0) throw new Error('Não encontrei a coluna "Tarefa" no cabeçalho.')

    const valueAt = (row: string[], name: string) => {
      const index = column(name)
      return index < 0 ? '' : row[index] ?? ''
    }
    const priorityFactorsFromScore = (score: number) => {
      for (let importancia = 1; importancia <= 5; importancia += 1) {
        for (let urgencia = 1; urgencia <= 5; urgencia += 1) {
          if (computeScore(importancia, urgencia) === score) {
            return { importancia, urgencia }
          }
        }
      }
      return null
    }

    const importedTasks = rows.slice(1).map((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(`A linha ${index + 2} tem quantidade de colunas diferente do cabeçalho.`)
      }
      const title = row[titleColumn].trim()
      if (!title) throw new Error(`A linha ${index + 2} está sem título de tarefa.`)

      const phaseValue = valueAt(row, 'Fase')
      const statusValue = valueAt(row, 'Status')
      const phase = phases.find((item) => item.name === phaseValue)?.name ?? 'Processos'
      const status = statusOrder.includes(statusValue as Status) ? statusValue as Status : 'Pendente'
      const importanceColumn = column('Importância') >= 0 ? column('Importância') : column('Gravidade')
      const urgencyColumn = column('Urgência')
      let priority: { importancia: number; urgencia: number }
      if (importanceColumn >= 0 && urgencyColumn >= 0) {
        const values = [Number(row[importanceColumn]), Number(row[urgencyColumn])]
        if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 5)) {
          throw new Error(`A linha ${index + 2} tem valores de prioridade fora do intervalo de 1 a 5.`)
        }
        priority = { importancia: values[0], urgencia: values[1] }
      } else {
        const score = Number(valueAt(row, 'Prioridade') || valueAt(row, 'Prioridade GUT'))
        const reconstructedPriority = Number.isInteger(score) ? priorityFactorsFromScore(score) : null
        if (!reconstructedPriority) {
          throw new Error(`A linha ${index + 2} não tem fatores válidos para reconstruir a prioridade.`)
        }
        priority = reconstructedPriority
      }

      let checklist: ChecklistItem[] = [{ label: 'Definir próximo passo', done: false }]
      const checklistValue = valueAt(row, 'Checklist')
      if (checklistValue) {
        let parsedChecklist: unknown
        try {
          parsedChecklist = JSON.parse(checklistValue)
        } catch {
          throw new Error(`O checklist da linha ${index + 2} não contém JSON válido.`)
        }
        if (
          !Array.isArray(parsedChecklist) ||
          !parsedChecklist.every((item) =>
            typeof item === 'object' &&
            item !== null &&
            'label' in item &&
            typeof item.label === 'string' &&
            'done' in item &&
            typeof item.done === 'boolean',
          )
        ) {
          throw new Error(`O checklist da linha ${index + 2} tem formato inválido.`)
        }
        checklist = parsedChecklist as ChecklistItem[]
      }

      const due = valueAt(row, 'Prazo').trim() || 'Sem prazo'
      return {
        id: Date.now() + index,
        title,
        phase,
        status,
        due: normalizeDueDate(due),
        createdAt: 'Importada',
        responsible: valueAt(row, 'Responsável').trim() || 'Não atribuída',
        ...priority,
        scoreGut: computeScore(priority.importancia, priority.urgencia),
        tag: valueAt(row, 'Tag').trim() || 'Importada',
        checklist,
        promptIa: valueAt(row, 'Prompt de IA') || 'Estruture os próximos passos práticos para esta tarefa, considerando prioridade, risco e prazo.',
        observacoes: valueAt(row, 'Anotações') || 'Tarefa importada via CSV.',
      } satisfies Task
    })

    const savedTasks = await apiRequest<Task[]>('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks: importedTasks }),
    })
    setTasks((current) => [...current, ...savedTasks])
    setSyncError(null)
    void recordActivity({ actor: 'Daniel', tone: 'teal', message: 'importou', taskTitle: `${savedTasks.length} tarefas via CSV`, time: 'Agora' })
    return savedTasks.length
  }

  const saveEditedTask = async () => {
    if (!editingTask) {
      return
    }

    const trimmedTitle = editingTask.title.trim()
    const trimmedResponsible = editingTask.responsible.trim()
    const trimmedTag = editingTask.tag.trim()

    if (!trimmedTitle || !trimmedResponsible) {
      return
    }

    const status = isCreatingTask ? 'Pendente' : editingTask.status
    const normalizedTask = {
      ...editingTask,
      status,
      title: trimmedTitle,
      responsible: trimmedResponsible,
      tag: trimmedTag || 'Geral',
      due: resolveDueForStatus(status, editingTask.due),
      scoreGut: computeScore(editingTask.importancia, editingTask.urgencia),
    }

    try {
      if (isCreatingTask) {
        const createdTask = await apiRequest<Task>('/tasks', {
          method: 'POST',
          body: JSON.stringify(normalizedTask),
        })
        setTasks((current) => [...current, createdTask])
        setSelectedTaskId(createdTask.id)
      } else {
        const updatedTask = await apiRequest<Task>(`/tasks/${normalizedTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(normalizedTask),
        })
        setTasks((current) =>
          current.map((task) =>
            task.id === updatedTask.id
              ? { ...task, ...updatedTask }
              : task,
          ),
        )
        setSelectedTaskId(updatedTask.id)
      }
      setSyncError(null)
    } catch (error) {
      setSyncError(describeRequestError(error))
      if (isCreatingTask) {
        setTasks((current) => [...current, normalizedTask])
      } else {
        setTasks((current) =>
          current.map((task) =>
            task.id === normalizedTask.id
              ? { ...task, ...normalizedTask }
              : task,
          ),
        )
      }
      setSelectedTaskId(normalizedTask.id)
    }

    setEditingTask(null)
    setIsCreatingTask(false)
    void recordActivity({
      actor: 'Daniel',
      tone: isCreatingTask ? 'teal' : 'amber',
      message: isCreatingTask ? 'criou' : 'editou',
      taskTitle: normalizedTask.title,
      time: 'Agora',
    })
  }

  const phaseStats = phases.map((phase) => {
    const phaseTasks = tasks.filter((task) => task.phase === phase.name)
    const completed = phaseTasks.filter((task) => task.status === 'Concluído').length
    const percent = phaseTasks.length ? Math.round((completed / phaseTasks.length) * 100) : 0

    return { ...phase, percent, completed, total: phaseTasks.length }
  })

  const statusStats = statusOrder.map((status) => ({
    status,
    total: tasks.filter((task) => task.status === status).length,
  }))
  const maxStatusTotal = Math.max(...statusStats.map((item) => item.total), 1)
  const responsibleStats = [...new Set(tasks.map((task) => task.responsible))]
    .map((responsible) => ({
      responsible,
      total: tasks.filter((task) => task.responsible === responsible).length,
    }))
    .sort((a, b) => b.total - a.total || a.responsible.localeCompare(b.responsible))
    .slice(0, 4)
  const maxResponsibleTotal = Math.max(...responsibleStats.map((item) => item.total), 1)

  const kanbanColumns = statusOrder.map((status) => ({
    status,
    tasks: visibleTasks.filter((task) => task.status === status),
  }))

  const handleNavClick = (view: string) => {
    setActiveView(view)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isOverview = activeView === 'Visão geral'

  const activeTasksCount = tasks.filter((task) => task.status !== 'Concluído').length
  const highPriorityCount = tasks.filter((task) => task.scoreGut >= CRITICAL_PRIORITY_THRESHOLD && task.status !== 'Concluído').length
  const alertTasks = tasks
    .filter((task) => task.status !== 'Concluído')
    .filter((task) => getDueState(task.due, task.status) === 'overdue' || getDueState(task.due, task.status) === 'today' || task.scoreGut >= CRITICAL_PRIORITY_THRESHOLD)
    .sort((a, b) => {
      const stateWeight = (state: DueState) => state === 'overdue' ? 3 : state === 'today' ? 2 : 1
      return stateWeight(getDueState(b.due, b.status)) - stateWeight(getDueState(a.due, a.status)) || b.scoreGut - a.scoreGut
    })
  const alertCount = alertTasks.length
  const hasActiveFilters = Boolean(
    search ||
    activePhase !== 'Todas' ||
    statusFilter !== 'Todos' ||
    quickFilter !== 'Todos' ||
    responsibleFilter !== 'Todos' ||
    deadlineFilter !== 'Todos' ||
    gutFilter !== 'Todos',
  )

  const clearFilters = () => {
    setSearch('')
    setActivePhase('Todas')
    setStatusFilter('Todos')
    setQuickFilter('Todos')
    setResponsibleFilter('Todos')
    setDeadlineFilter('Todos')
    setGutFilter('Todos')
  }

  const handleTaskFieldUpdate = (taskId: number, field: keyof Task, value: string | number | boolean) => {
    updateTask(taskId, { [field]: value } as Partial<Task>)
  }

  const saveTaskChanges = async (task: Task) => {
    await updateTask(task.id, task)
  }

  return {
    tasks,
    setTasks,
    activePhase,
    setActivePhase,
    statusFilter,
    setStatusFilter,
    quickFilter,
    setQuickFilter,
    responsibleFilter,
    setResponsibleFilter,
    deadlineFilter,
    setDeadlineFilter,
    gutFilter,
    setGutFilter,
    activeView,
    setActiveView,
    search,
    setSearch,
    selectedTaskId,
    setSelectedTaskId,
    copiedTaskId,
    setCopiedTaskId,
    editingTask,
    setEditingTask,
    isCreatingTask,
    setIsCreatingTask,
    draggedTaskId,
    setDraggedTaskId,
    dragOverStatus,
    setDragOverStatus,
    activities,
    setActivities,
    selectedTask,
    responsibleOptions,
    visibleTasks,
    totalProgress,
    phaseStats,
    statusStats,
    maxStatusTotal,
    responsibleStats,
    maxResponsibleTotal,
    kanbanColumns,
    handleNavClick,
    isOverview,
    activeTasksCount,
    highPriorityCount,
    alertTasks,
    alertCount,
    hasActiveFilters,
    clearFilters,
    handleTaskFieldUpdate,
    saveTaskChanges,
    updateStatus,
    handleKanbanDrop,
    toggleChecklist,
    addTask,
    deleteTask,
    addChecklistItem,
    removeChecklistItem,
    updateChecklistLabel,
    copyPrompt,
    exportTasks,
    importTasks,
    saveEditedTask,
    dueStateLabels,
    getDueState,
    getPriorityBand,
    getPriorityLabel,
    phases,
    statusOrder,
    dueToInputValue,
    inputValueToDue,
    isLoadingTasks,
    isLoadingActivities,
    syncError,
    syncFromServer,
  }
}
