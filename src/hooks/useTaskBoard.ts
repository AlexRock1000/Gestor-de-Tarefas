import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  computeScore,
  getDueState,
  getPriorityBand,
  getPriorityLabel,
  resolveDueForStatus,
  type DueState,
} from '../taskUtils'
import type {
  Activity,
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
  if (due === 'Hoje') {
    return new Date().toISOString().slice(0, 10)
  }

  const match = due.toLowerCase().match(/^(\d{1,2})\s+([a-zç]+)$/)
  if (!match) return ''
  const month = monthLabels.indexOf(match[2].slice(0, 3))
  if (month < 0) return ''
  return `${new Date().getFullYear()}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

export const inputValueToDue = (value: string) => {
  if (!value) return 'Sem prazo'
  const selected = new Date(`${value}T00:00:00`)
  const today = new Date()
  if (selected.toDateString() === today.toDateString()) return 'Hoje'
  return `${selected.getDate()} ${monthLabels[selected.getMonth()]}`
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
    due: 'Hoje',
    createdAt: '12 set',
    responsible: 'Daniel Rocha',
    gravidade: 5,
    urgencia: 4,
    tendencia: 5,
    scoreGut: 100,
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
    due: '18 set',
    createdAt: '14 set',
    responsible: 'Ana Maria',
    gravidade: 4,
    urgencia: 3,
    tendencia: 5,
    scoreGut: 60,
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
    due: '20 set',
    createdAt: '10 set',
    responsible: 'Lucas Costa',
    gravidade: 4,
    urgencia: 4,
    tendencia: 4,
    scoreGut: 64,
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
    gravidade: 3,
    urgencia: 2,
    tendencia: 5,
    scoreGut: 30,
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
    due: '24 set',
    createdAt: '16 set',
    responsible: 'Bruno Souza',
    gravidade: 5,
    urgencia: 4,
    tendencia: 5,
    scoreGut: 100,
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
    due: '26 set',
    createdAt: '15 set',
    responsible: 'Miguel Nunes',
    gravidade: 5,
    urgencia: 4,
    tendencia: 3,
    scoreGut: 60,
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
      const parsed = JSON.parse(stored) as Task[]
      return Array.isArray(parsed) && parsed.length ? parsed : initialTasks
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
  const [activeView, setActiveView] = useState('Visão geral')
  const [search, setSearch] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(() => {
    if (typeof window === 'undefined') {
      return initialTasks[0].id
    }

    const stored = window.localStorage.getItem(`${storageKey}-selected`)
    return stored ? Number(stored) || initialTasks[0].id : initialTasks[0].id
  })
  const [copiedTaskId, setCopiedTaskId] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null)
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
    if (selectedTaskId !== null && typeof window !== 'undefined') {
      window.localStorage.setItem(`${storageKey}-selected`, String(selectedTaskId))
    }
  }, [selectedTaskId])

  useEffect(() => {
    if (selectedTaskId !== null && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0]?.id ?? null)
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
        (gutFilter === 'Críticas (80+)' && task.scoreGut >= 80) ||
        (gutFilter === 'Altas (50-79)' && task.scoreGut >= 50 && task.scoreGut < 80) ||
        (gutFilter === 'Baixas (até 49)' && task.scoreGut < 50)
      const quickMatches =
        quickFilter === 'Todos' ||
        (quickFilter === 'Hoje' && (dueState === 'today' || dueState === 'overdue')) ||
        (quickFilter === 'Urgentes' && (task.scoreGut >= 80 || dueState === 'today' || dueState === 'overdue')) ||
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

  const updateTask = (taskId: number, updates: Partial<Task>) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const nextGravidade = updates.gravidade ?? task.gravidade
        const nextUrgencia = updates.urgencia ?? task.urgencia
        const nextTendencia = updates.tendencia ?? task.tendencia

        return {
          ...task,
          ...updates,
          scoreGut: computeScore(nextGravidade, nextUrgencia, nextTendencia),
        }
      }),
    )
  }

  const updateStatus = (id: number, status: Status) => {
    const task = tasks.find((item) => item.id === id)
    if (!task) {
      return
    }

    const nextDue = resolveDueForStatus(status, task.due)
    updateTask(id, { status, due: nextDue })

    if (task.status !== status) {
      setActivities((current) => [
        {
          id: Date.now(),
          actor: 'Daniel',
          tone: (status === 'Concluído' ? 'teal' : 'amber') as Activity['tone'],
          message: 'moveu para',
          taskTitle: task.title,
          time: 'Agora',
        },
        ...current,
      ].slice(0, 12))
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
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          checklist: task.checklist.map((item, index) =>
            index === itemIndex ? { ...item, done: !item.done } : item,
          ),
        }
      }),
    )
    if (task) {
      setActivities((current) => [
        { id: Date.now(), actor: 'Daniel', tone: 'coral' as const, message: 'atualizou o checklist de', taskTitle: task.title, time: 'Agora' },
        ...current,
      ].slice(0, 12))
    }
  }

  const addTask = () => {
    const nextPhase = activePhase === 'Todas' ? 'Processos' : activePhase
    const createdAt = formatCreatedAt(new Date())
    const newTask: Task = {
      id: Date.now(),
      title: 'Nova tarefa operacional',
      phase: nextPhase,
      status: 'Pendente',
      due: '30 set',
      createdAt,
      responsible: 'Não atribuída',
      gravidade: 3,
      urgencia: 3,
      tendencia: 3,
      scoreGut: 27,
      tag: 'Nova',
      checklist: [{ label: 'Definir próximo passo', done: false }],
      promptIa: 'Estruture os próximos três passos práticos para esta tarefa, considerando prioridade, risco e tempo de execução.',
      observacoes: 'Atribuir responsável e cronograma inicial para acompanhamento.',
    }

    setSelectedTaskId(null)
    setIsCreatingTask(true)
    setEditingTask(newTask)
  }

  const deleteTask = (taskId: number) => {
    setTasks((current) => {
      const nextTasks = current.filter((task) => task.id !== taskId)
      if (selectedTaskId === taskId) {
        setSelectedTaskId(nextTasks[0]?.id ?? null)
      }
      return nextTasks
    })
    const task = tasks.find((item) => item.id === taskId)
    if (task) {
      setActivities((current) => [
        { id: Date.now(), actor: 'Daniel', tone: 'coral' as const, message: 'removeu', taskTitle: task.title, time: 'Agora' },
        ...current,
      ].slice(0, 12))
    }
  }

  const addChecklistItem = (taskId: number) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          checklist: [...task.checklist, { label: `Novo item ${task.checklist.length + 1}`, done: false }],
        }
      }),
    )
  }

  const removeChecklistItem = (taskId: number, itemIndex: number) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          checklist: task.checklist.filter((_, index) => index !== itemIndex),
        }
      }),
    )
  }

  const updateChecklistLabel = (taskId: number, itemIndex: number, label: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          checklist: task.checklist.map((item, index) =>
            index === itemIndex ? { ...item, label } : item,
          ),
        }
      }),
    )
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
    const headers = ['Tarefa', 'Fase', 'Status', 'Responsável', 'Prazo', 'Prioridade GUT', 'Estado do prazo']
    const rows = visibleTasks.map((task) => [
      task.title,
      task.phase,
      task.status,
      task.responsible,
      task.due,
      task.scoreGut,
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

  const importTasks = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const content = await file.text()
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return

    const parseRow = (line: string) => line.split(';').map((value) => value.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
    const importedTasks = lines.slice(1).map((line, index) => {
      const [title, phaseValue, statusValue, responsible, due, gutValue] = parseRow(line)
      const phase = phases.some((item) => item.name === phaseValue) ? phaseValue as Phase : 'Processos'
      const status = statusOrder.includes(statusValue as Status) ? statusValue as Status : 'Pendente'
      const scoreGut = Number(gutValue) || 27
      return {
        id: Date.now() + index,
        title: title || 'Tarefa importada',
        phase,
        status,
        due: due || 'Sem prazo',
        createdAt: 'Importada',
        responsible: responsible || 'Não atribuída',
        gravidade: 3,
        urgencia: 3,
        tendencia: 3,
        scoreGut,
        tag: 'Importada',
        checklist: [{ label: 'Definir próximo passo', done: false }],
        promptIa: 'Estruture os próximos passos práticos para esta tarefa, considerando prioridade, risco e prazo.',
        observacoes: 'Tarefa importada via CSV.',
      } satisfies Task
    }).filter((task) => task.title.trim())

    if (!importedTasks.length) return
    setTasks((current) => [...current, ...importedTasks])
    setActivities((current) => [
      { id: Date.now(), actor: 'Daniel', tone: 'teal' as const, message: 'importou', taskTitle: `${importedTasks.length} tarefas via CSV`, time: 'Agora' },
      ...current,
    ].slice(0, 12))
  }

  const saveEditedTask = () => {
    if (!editingTask) {
      return
    }

    const normalizedTask = {
      ...editingTask,
      due: resolveDueForStatus(editingTask.status, editingTask.due),
      scoreGut: computeScore(
        editingTask.gravidade,
        editingTask.urgencia,
        editingTask.tendencia,
      ),
    }

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
    setEditingTask(null)
    setIsCreatingTask(false)
    setActivities((current) => [
      {
        id: Date.now(),
        actor: 'Daniel',
        tone: isCreatingTask ? 'teal' as const : 'amber' as const,
        message: isCreatingTask ? 'criou' : 'editou',
        taskTitle: normalizedTask.title,
        time: 'Agora',
      },
      ...current,
    ].slice(0, 12))
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
  const highPriorityCount = tasks.filter((task) => task.scoreGut >= 80 && task.status !== 'Concluído').length
  const alertTasks = tasks
    .filter((task) => task.status !== 'Concluído')
    .filter((task) => getDueState(task.due, task.status) === 'overdue' || getDueState(task.due, task.status) === 'today' || task.scoreGut >= 80)
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

  const saveTaskChanges = (task: Task) => {
    updateTask(task.id, task)
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
  }
}
