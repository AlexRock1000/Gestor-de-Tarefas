import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  Download,
  FileText,
  LayoutDashboard,
  ListChecks,
  MoonStar,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  SunMedium,
  Target,
  Upload,
  X,
} from 'lucide-react'
import { computeScore, getDueState, type DueState } from './taskUtils'

type Status = 'Pendente' | 'Em Andamento' | 'Concluído'
type Phase = 'Estoque' | 'Documentação' | 'Processos' | 'Automações'

type ChecklistItem = {
  label: string
  done: boolean
}

type Task = {
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

type Activity = {
  id: number
  actor: string
  tone: 'teal' | 'amber' | 'coral'
  message: string
  taskTitle: string
  time: string
}

type DeadlineFilter = 'Todos' | 'Em aberto' | 'Concluídas'
type GutFilter = 'Todos' | 'Críticas (80+)' | 'Altas (50-79)' | 'Baixas (até 49)'

const phases: { name: Phase; tone: string; accent: string }[] = [
  { name: 'Estoque', tone: 'teal', accent: '#17847c' },
  { name: 'Documentação', tone: 'amber', accent: '#d18a29' },
  { name: 'Processos', tone: 'coral', accent: '#d45c4f' },
  { name: 'Automações', tone: 'lavender', accent: '#6257d6' },
]

const statusOrder: Status[] = ['Pendente', 'Em Andamento', 'Concluído']

const initialTasks: Task[] = [
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

const dueStateLabels: Record<DueState, string> = {
  overdue: 'Atrasada',
  today: 'Vence hoje',
  upcoming: 'No prazo',
  completed: 'Concluída',
  undated: 'Sem prazo',
}

const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const dueToInputValue = (due: string) => {
  if (due === 'Hoje') {
    return new Date().toISOString().slice(0, 10)
  }

  const match = due.toLowerCase().match(/^(\d{1,2})\s+([a-zç]+)$/)
  if (!match) return ''
  const month = monthLabels.indexOf(match[2].slice(0, 3))
  if (month < 0) return ''
  return `${new Date().getFullYear()}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

const inputValueToDue = (value: string) => {
  if (!value) return 'Sem prazo'
  const selected = new Date(`${value}T00:00:00`)
  const today = new Date()
  if (selected.toDateString() === today.toDateString()) return 'Hoje'
  return `${selected.getDate()} ${monthLabels[selected.getMonth()]}`
}

const initialActivities: Activity[] = [
  { id: 1, actor: 'Daniel', tone: 'teal', message: 'concluiu', taskTitle: 'Centralizar POPs', time: 'Há 24 min' },
  { id: 2, actor: 'Ana', tone: 'amber', message: 'atualizou a prioridade de', taskTitle: 'Revisar contratos', time: 'Há 1 h' },
  { id: 3, actor: 'Lucas', tone: 'coral', message: 'adicionou um item ao checklist', taskTitle: '', time: 'Há 2 h' },
]

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
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
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
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
    window.localStorage.setItem(storageKey, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    window.localStorage.setItem(activityStorageKey, JSON.stringify(activities))
  }, [activities])

  useEffect(() => {
    if (selectedTaskId !== null) {
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
      return phaseMatches && statusMatches && titleMatches && responsibleMatches && deadlineMatches && gutMatches
    })

    return [...filtered].sort((a, b) => b.scoreGut - a.scoreGut)
  }, [activePhase, deadlineFilter, gutFilter, responsibleFilter, search, statusFilter, tasks])

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
    updateTask(id, { status, due: status === 'Concluído' ? 'Concluída' : 'Em revisão' })
    if (task && task.status !== status) {
      setActivities((current) => [
        { id: Date.now(), actor: 'Daniel', tone: (status === 'Concluído' ? 'teal' : 'amber') as Activity['tone'], message: 'moveu para', taskTitle: task.title, time: 'Agora' },
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
    const newTask: Task = {
      id: Date.now(),
      title: 'Nova tarefa operacional',
      phase: nextPhase,
      status: 'Pendente',
      due: '30 set',
      createdAt: 'Hoje',
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

    setTasks((current) => [...current, newTask])
    setSelectedTaskId(newTask.id)
    setActivities((current) => [
      { id: Date.now(), actor: 'Daniel', tone: 'teal' as const, message: 'criou', taskTitle: newTask.title, time: 'Agora' },
      ...current,
    ].slice(0, 12))
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
    await navigator.clipboard.writeText(task.promptIa)
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

    setTasks((current) =>
      current.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              ...editingTask,
              scoreGut: computeScore(
                editingTask.gravidade,
                editingTask.urgencia,
                editingTask.tendencia,
              ),
            }
          : task,
      ),
    )
    setSelectedTaskId(editingTask.id)
    setEditingTask(null)
    setActivities((current) => [
      { id: Date.now(), actor: 'Daniel', tone: 'amber' as const, message: 'editou', taskTitle: editingTask.title, time: 'Agora' },
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
    responsibleFilter !== 'Todos' ||
    deadlineFilter !== 'Todos' ||
    gutFilter !== 'Todos',
  )

  const clearFilters = () => {
    setSearch('')
    setActivePhase('Todas')
    setStatusFilter('Todos')
    setResponsibleFilter('Todos')
    setDeadlineFilter('Todos')
    setGutFilter('Todos')
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={17} /></div>
          <span>orbit</span>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">OP</div>
          <div>
            <strong>Operação 2026</strong>
            <span>Workspace principal</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <nav className="main-nav">
          <p className="nav-label">Workspace</p>
          <button className={activeView === 'Visão geral' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Visão geral')}><LayoutDashboard size={17} /> Visão geral</button>
          <button className={activeView === 'Quadro' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Quadro')}><Target size={17} /> Quadro Kanban <span className="nav-count">{tasks.length}</span></button>
          <button className={activeView === 'Checklists' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Checklists')}><ListChecks size={17} /> Checklists</button>
          <button className={activeView === 'Prompts IA' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Prompts IA')}><Sparkles size={17} /> Prompts IA <span className="new-pill">novo</span></button>

          <p className="nav-label second">Organização</p>
          <button className="nav-item"><FileText size={17} /> Documentos</button>
          <button className={activeView === 'Histórico' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Histórico')}><Clock3 size={17} /> Histórico</button>
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-progress">
            <div>
              <span>Plano de ação</span>
              <b>{totalProgress}%</b>
            </div>
            <div className="progress-track"><span style={{ width: `${totalProgress}%` }} /></div>
            <small>Atualizado agora</small>
          </div>

          <div className="user-card">
            <div className="user-avatar">DR</div>
            <div>
              <strong>Daniel Rocha</strong>
              <span>Administrador</span>
            </div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activeView}</strong>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tarefa..." />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <SunMedium size={15} /> : <MoonStar size={15} />}
              <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
            <div className="notification-wrap">
              <button
                className="icon-button"
                aria-label="Notificações"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Bell size={18} />
                {alertCount > 0 && <i />}
              </button>

              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-heading">
                    <div>
                      <strong>Alertas operacionais</strong>
                      <span>{alertCount ? `${alertCount} tarefa${alertCount === 1 ? '' : 's'} requer atenção` : 'Tudo sob controle'}</span>
                    </div>
                    <Bell size={16} />
                  </div>

                  {alertTasks.length ? alertTasks.slice(0, 5).map((task) => (
                    <button
                      className="notification-item"
                      key={task.id}
                      onClick={() => {
                        setSelectedTaskId(task.id)
                        setNotificationsOpen(false)
                      }}
                    >
                      <span className={`notification-dot ${getDueState(task.due, task.status)}`} />
                      <span>
                        <strong>{task.title}</strong>
                        <small>{getDueState(task.due, task.status) === 'overdue' || getDueState(task.due, task.status) === 'today' ? dueStateLabels[getDueState(task.due, task.status)] : `GUT ${task.scoreGut}`}</small>
                      </span>
                    </button>
                  )) : (
                    <p className="notification-empty">Nenhuma tarefa crítica no momento.</p>
                  )}
                </div>
              )}
            </div>
            <button className="avatar-button">DR</button>
          </div>
        </header>

        <div className="content-wrap">
          {isOverview && (
            <>
              <section className="hero-row">
                <div>
                  <p className="eyebrow">QUINTA-FEIRA, 17 DE SETEMBRO</p>
                  <h1>Bom dia, Daniel <span>✦</span></h1>
                  <p className="hero-subtitle">Aqui está o pulso da sua operação hoje.</p>
                </div>
                <button className="primary-button" onClick={addTask}><Plus size={17} /> Nova tarefa</button>
              </section>

              <section className="metric-grid">
                <div className="metric-card dark">
                  <div className="metric-top"><span>Progresso geral</span><ArrowUpRight size={17} /></div>
                  <strong>{totalProgress}%</strong>
                  <div className="metric-foot">
                    <div className="progress-track light"><span style={{ width: `${totalProgress}%` }} /></div>
                    <span>+8,4% <small>esta semana</small></span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-top"><span>Tarefas ativas</span><Target size={17} /></div>
                  <strong>{activeTasksCount}</strong>
                  <div className="metric-caption">de {tasks.length} tarefas no plano</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top"><span>Alta prioridade</span><span className="priority-dot" /></div>
                  <strong>{highPriorityCount}</strong>
                  <div className="metric-caption">requerem atenção</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top"><span>Em dia</span><Check size={17} /></div>
                  <strong>{tasks.length ? Math.max(0, 100 - Math.round((highPriorityCount / tasks.length) * 100)) : 0}%</strong>
                  <div className="metric-caption">tarefas dentro do calendário</div>
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <h2>Progresso por fase</h2>
                  <p>Uma leitura rápida do avanço operacional.</p>
                </div>
                <div className="report-actions">
                  <label className="text-button" htmlFor="task-import"><Upload size={15} /> Importar CSV</label>
                  <input id="task-import" className="file-input" type="file" accept=".csv,text/csv" onChange={importTasks} />
                  <button className="text-button" onClick={exportTasks}>Exportar CSV <Download size={15} /></button>
                </div>
              </div>

              <section className="phase-grid">
                {phaseStats.map((phase) => (
                  <button className="phase-card" key={phase.name} onClick={() => setActivePhase(phase.name)}>
                    <div className="phase-card-head">
                      <span className={`phase-icon ${phase.tone}`}><Target size={18} /></span>
                      <span className="phase-arrow"><ArrowUpRight size={16} /></span>
                    </div>
                    <h3>{phase.name}</h3>
                    <div className="phase-meta">
                      <span>{phase.completed} de {phase.total} concluídas</span>
                      <b>{phase.percent}%</b>
                    </div>
                    <div className="progress-track"><span style={{ width: `${phase.percent}%`, background: phase.accent }} /></div>
                  </button>
                ))}
              </section>

              <section className="report-grid">
                <article className="report-card">
                  <div className="report-card-heading">
                    <div>
                      <h2>Status do plano</h2>
                      <p>Distribuição atual das tarefas.</p>
                    </div>
                    <span>{tasks.length} total</span>
                  </div>
                  <div className="report-bars">
                    {statusStats.map((item) => (
                      <div className="report-bar-row" key={item.status}>
                        <div className="report-bar-label"><span>{item.status}</span><strong>{item.total}</strong></div>
                        <div className="report-bar-track"><span className={`status-bar ${item.status.toLowerCase().replace(' ', '-')}`} style={{ width: `${(item.total / maxStatusTotal) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="report-card">
                  <div className="report-card-heading">
                    <div>
                      <h2>Carga por responsável</h2>
                      <p>Quem concentra mais frentes.</p>
                    </div>
                  </div>
                  <div className="report-bars">
                    {responsibleStats.map((item) => (
                      <div className="report-bar-row" key={item.responsible}>
                        <div className="report-bar-label"><span>{item.responsible}</span><strong>{item.total}</strong></div>
                        <div className="report-bar-track"><span className="responsible-bar" style={{ width: `${(item.total / maxResponsibleTotal) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

          {activeView === 'Histórico' ? (
            <section className="history-view">
              <div className="history-header">
                <div>
                  <p className="eyebrow">REGISTRO DE OPERAÇÕES</p>
                  <h1>Histórico</h1>
                  <p>Veja as últimas movimentações feitas no plano de ação.</p>
                </div>
                <span className="history-count">{activities.length} eventos</span>
              </div>

              <div className="history-list">
                {activities.map((activity) => (
                  <article className="history-item" key={activity.id}>
                    <div className={`activity-avatar ${activity.tone}`}>{activity.actor.slice(0, 2).toUpperCase()}</div>
                    <div className="history-item-copy">
                      <p><strong>{activity.actor}</strong> {activity.message} {activity.taskTitle && <b>{activity.taskTitle}</b>}</p>
                      <span>{activity.time}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : activeView === 'Quadro' ? (
            <section className="kanban-view">
              <div className="kanban-header">
                <div>
                  <h2>Quadro operacional</h2>
                  <p>Acompanhe o fluxo por etapa de execução.</p>
                </div>
              </div>

              <div className="kanban-board">
                {kanbanColumns.map((column) => (
                  <div
                    className={`kanban-column ${dragOverStatus === column.status ? 'drag-over' : ''}`}
                    key={column.status}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverStatus(column.status)
                    }}
                    onDragLeave={() => setDragOverStatus(null)}
                    onDrop={() => handleKanbanDrop(column.status)}
                  >
                    <div className="kanban-column-header">
                      <span>{column.status}</span>
                      <strong>{column.tasks.length}</strong>
                    </div>

                    <div className="kanban-column-body">
                      {!column.tasks.length && (
                        <div className="kanban-empty">Sem tarefas</div>
                      )}

                      {column.tasks.map((task) => (
                        <article
                          className={`kanban-card ${draggedTaskId === task.id ? 'dragging' : ''}`}
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null)
                            setDragOverStatus(null)
                          }}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <div className="kanban-card-top">
                            <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>
                            <span className={`priority-label ${task.scoreGut >= 80 ? 'critical' : task.scoreGut >= 50 ? 'high' : 'low'}`}>GUT {task.scoreGut}</span>
                          </div>

                          <strong>{task.title}</strong>

                          <div className="kanban-meta">
                            <span>{task.responsible}</span>
                            <span className={`kanban-due ${getDueState(task.due, task.status)}`}>{dueStateLabels[getDueState(task.due, task.status)]}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="workspace-grid">
              <section className="tasks-panel">
                <div className="panel-header">
                  <div>
                    <h2>Minhas tarefas</h2>
                    <p>Prioridades para manter o plano em movimento.</p>
                  </div>

                  <div className="filter-group">
                    <div className="filter-tabs">
                      <button className={activePhase === 'Todas' ? 'selected' : ''} onClick={() => setActivePhase('Todas')}>Todas</button>
                      {phases.map((phase) => (
                        <button className={activePhase === phase.name ? 'selected' : ''} key={phase.name} onClick={() => setActivePhase(phase.name)}>{phase.name}</button>
                      ))}
                    </div>

                    <div className="status-tabs">
                      <button className={statusFilter === 'Todos' ? 'selected' : ''} onClick={() => setStatusFilter('Todos')}>Todos</button>
                      {statusOrder.map((status) => (
                        <button className={statusFilter === status ? 'selected' : ''} key={status} onClick={() => setStatusFilter(status)}>{status}</button>
                      ))}
                    </div>

                    <div className="advanced-filters">
                      <label>
                        Responsável
                        <select value={responsibleFilter} onChange={(event) => setResponsibleFilter(event.target.value)}>
                          <option value="Todos">Todos</option>
                          {responsibleOptions.map((responsible) => (
                            <option key={responsible} value={responsible}>{responsible}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Prazo
                        <select value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value as DeadlineFilter)}>
                          <option value="Todos">Todos</option>
                          <option value="Em aberto">Em aberto</option>
                          <option value="Concluídas">Concluídas</option>
                        </select>
                      </label>
                      <label>
                        Prioridade
                        <select value={gutFilter} onChange={(event) => setGutFilter(event.target.value as GutFilter)}>
                          <option value="Todos">Todas</option>
                          <option value="Críticas (80+)">Críticas</option>
                          <option value="Altas (50-79)">Altas</option>
                          <option value="Baixas (até 49)">Baixas</option>
                        </select>
                      </label>
                    </div>

                    <div className="filter-summary">
                      <span>{visibleTasks.length} de {tasks.length} tarefas</span>
                      {hasActiveFilters && <button onClick={clearFilters}>Limpar filtros</button>}
                    </div>
                  </div>
                </div>

                <div className="task-list">
                  {!visibleTasks.length && (
                    <div className="empty-state">
                      <strong>Nenhuma tarefa encontrada</strong>
                      <span>Ajuste o filtro ou crie uma nova tarefa.</span>
                    </div>
                  )}

                  {visibleTasks.map((task) => (
                    <article className="task-row" key={task.id} onClick={() => setSelectedTaskId(task.id)}>
                      <div
                        className={`task-status ${task.status === 'Concluído' ? 'done' : task.status === 'Em Andamento' ? 'progress' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          const nextStatus = task.status === 'Concluído' ? 'Pendente' : 'Concluído'
                          updateStatus(task.id, nextStatus)
                        }}
                      >
                        {task.status === 'Concluído' && <Check size={13} />}
                      </div>

                      <div className="task-info">
                        <strong>{task.title}</strong>
                        <div>
                          <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>
                          <span className="task-label">{task.tag}</span>
                        </div>
                        <div className="task-meta">
                          <span>{task.responsible}</span>
                          <span>•</span>
                          <span>{task.createdAt}</span>
                        </div>
                      </div>

                      <div className="task-priority">
                        <span className={`priority-label ${task.scoreGut >= 80 ? 'critical' : task.scoreGut >= 50 ? 'high' : 'low'}`}>GUT {task.scoreGut}</span>
                        <span className={`due-date ${getDueState(task.due, task.status)}`}>
                          <span>{task.due}</span>
                          <small>{dueStateLabels[getDueState(task.due, task.status)]}</small>
                        </span>
                      </div>

                      <div className="task-actions">
                        <button
                          className="mini-action"
                          onClick={(event) => {
                            event.stopPropagation()
                            setEditingTask({ ...task })
                          }}
                          aria-label="Editar tarefa"
                        >
                          Editar
                        </button>
                        <button
                          className="mini-action"
                          onClick={(event) => {
                            event.stopPropagation()
                            void copyPrompt(task)
                          }}
                          aria-label="Copiar prompt"
                        >
                          {copiedTaskId === task.id ? <Check size={14} /> : <Clipboard size={14} />}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="stacked-panels">
                <section className="activity-card">
                  <div className="panel-header compact">
                    <div>
                      <h2>Atividade recente</h2>
                      <p>Últimas atualizações do time.</p>
                    </div>
                    <button className="icon-button"><MoreHorizontal size={17} /></button>
                  </div>

                  {activities.slice(0, 5).map((activity) => (
                    <div className="activity-item" key={activity.id}>
                      <div className={`activity-avatar ${activity.tone}`}>{activity.actor.slice(0, 2).toUpperCase()}</div>
                      <p>
                        <strong>{activity.actor}</strong> {activity.message}{' '}
                        {activity.taskTitle && <b>{activity.taskTitle}</b>}
                        <small>{activity.time}</small>
                      </p>
                    </div>
                  ))}
                </section>

                <section className="prompt-card">
                  <div className="prompt-orbit"><Sparkles size={19} /></div>
                  <div className="prompt-copy">
                    <span className="eyebrow">PROMPT HELPER</span>
                    <h2>Destrave o próximo passo.</h2>
                    <p>Use IA para transformar uma tarefa complexa em ações claras e rápidas.</p>
                    <button
                      className="prompt-button"
                      onClick={() => {
                        if (selectedTask) {
                          void copyPrompt(selectedTask)
                        }
                      }}
                    >
                      {copiedTaskId === selectedTask?.id ? <><Check size={15} /> Copiado</> : <><Clipboard size={15} /> Copiar prompt</>}
                    </button>
                  </div>
                </section>
              </div>
          </div>
          )}
        </div>
      </main>

      {selectedTask && (
        <aside className="detail-drawer">
          <div className="drawer-top">
            <span className={`tag ${selectedTask.phase.toLowerCase()}`}>{selectedTask.phase}</span>
            <button className="icon-button" onClick={() => setSelectedTaskId(null)}><X size={18} /></button>
          </div>

          <h2>{selectedTask.title}</h2>
          <p className="drawer-description">
            {selectedTask.observacoes || 'Organize os próximos passos e acompanhe o avanço desta frente operacional.'}
          </p>

          <div className="drawer-status">
            <span>Status</span>
            <select
              value={selectedTask.status}
              onChange={(event) => updateStatus(selectedTask.id, event.target.value as Status)}
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="drawer-meta-grid">
            <div className="drawer-meta-card">
              <span>Responsável</span>
              <strong>{selectedTask.responsible}</strong>
            </div>
            <div className="drawer-meta-card">
              <span>Criada em</span>
              <strong>{selectedTask.createdAt}</strong>
            </div>
          </div>

          <div className="drawer-section gut-panel">
            <div className="drawer-section-head">
              <h3>Matriz GUT</h3>
              <span>{selectedTask.scoreGut}</span>
            </div>

            <div className="gut-grid">
              {(['gravidade', 'urgencia', 'tendencia'] as const).map((field) => (
                <label key={field} className="gut-field">
                  <span>{field}</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={selectedTask[field]}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      const safeValue = Number.isNaN(nextValue) ? 1 : Math.min(5, Math.max(1, nextValue))
                      updateTask(selectedTask.id, { [field]: safeValue })
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="gut-box">
              <div>
                <span>Prioridade GUT</span>
                <strong>{selectedTask.scoreGut}<small> / 125</small></strong>
              </div>
              <span className={`priority-label ${selectedTask.scoreGut >= 80 ? 'critical' : selectedTask.scoreGut >= 50 ? 'high' : 'low'}`}>
                {selectedTask.scoreGut >= 80 ? 'Alta prioridade' : selectedTask.scoreGut >= 50 ? 'Média' : 'Baixa'}
              </span>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-head">
              <h3>Checklist</h3>
              <span>{selectedTask.checklist.filter((item) => item.done).length}/{selectedTask.checklist.length}</span>
            </div>

            <button className="secondary-button add-item-button" onClick={() => addChecklistItem(selectedTask.id)}>
              + Adicionar item
            </button>

            {selectedTask.checklist.map((item, index) => (
              <div className="check-item-row" key={`${selectedTask.id}-${item.label}-${index}`}>
                <label className="check-item">
                  <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(selectedTask.id, index)} />
                  <input
                    value={item.label}
                    onChange={(event) => updateChecklistLabel(selectedTask.id, index, event.target.value)}
                    className="check-item-input"
                  />
                </label>
                <button className="remove-item-button" onClick={() => removeChecklistItem(selectedTask.id, index)} aria-label="Remover item">
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="drawer-section notes-section">
            <div className="drawer-section-head">
              <h3>Anotações</h3>
            </div>
            <textarea
              value={selectedTask.observacoes}
              onChange={(event) => updateTask(selectedTask.id, { observacoes: event.target.value })}
              rows={4}
            />
          </div>

          <div className="drawer-actions">
            <button className="secondary-button" onClick={() => setEditingTask({ ...selectedTask })}>
              Editar tarefa
            </button>
            <button className="danger-button" onClick={() => deleteTask(selectedTask.id)}>
              Excluir tarefa
            </button>
            <button className="prompt-button large" onClick={() => void copyPrompt(selectedTask)}>
              {copiedTaskId === selectedTask.id ? <><Check size={15} /> Prompt copiado</> : <><Clipboard size={15} /> Copiar prompt de IA</>}
            </button>
          </div>
        </aside>
      )}

      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">EDIÇÃO DE TAREFA</p>
                <h3>Detalhes da operação</h3>
              </div>
              <button className="icon-button" onClick={() => setEditingTask(null)} aria-label="Fechar modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <label className="field">
                <span>Título</span>
                <input
                  value={editingTask.title}
                  onChange={(event) => setEditingTask({ ...editingTask, title: event.target.value })}
                />
              </label>

              <div className="modal-grid">
                <label className="field">
                  <span>Fase</span>
                  <select
                    value={editingTask.phase}
                    onChange={(event) => setEditingTask({ ...editingTask, phase: event.target.value as Phase })}
                  >
                    {phases.map((phase) => (
                      <option key={phase.name} value={phase.name}>{phase.name}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={editingTask.status}
                    onChange={(event) => setEditingTask({ ...editingTask, status: event.target.value as Status })}
                  >
                    {statusOrder.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="modal-grid">
                <label className="field">
                  <span>Prazo</span>
                  <input
                    type="date"
                    value={dueToInputValue(editingTask.due)}
                    onChange={(event) => setEditingTask({ ...editingTask, due: inputValueToDue(event.target.value) })}
                  />
                </label>

                <label className="field">
                  <span>Responsável</span>
                  <input
                    value={editingTask.responsible}
                    onChange={(event) => setEditingTask({ ...editingTask, responsible: event.target.value })}
                  />
                </label>
              </div>

              <div className="modal-grid">
                <label className="field">
                  <span>Criada em</span>
                  <input
                    value={editingTask.createdAt}
                    onChange={(event) => setEditingTask({ ...editingTask, createdAt: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span>Tag</span>
                  <input
                    value={editingTask.tag}
                    onChange={(event) => setEditingTask({ ...editingTask, tag: event.target.value })}
                  />
                </label>
              </div>

              <div className="gut-grid">
                {(['gravidade', 'urgencia', 'tendencia'] as const).map((field) => (
                  <label key={field} className="gut-field">
                    <span>{field}</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editingTask[field]}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value)
                        const safeValue = Number.isNaN(nextValue) ? 1 : Math.min(5, Math.max(1, nextValue))
                        setEditingTask({
                          ...editingTask,
                          [field]: safeValue,
                        })
                      }}
                    />
                  </label>
                ))}
              </div>

              <label className="field">
                <span>Prompt de IA</span>
                <textarea
                  rows={3}
                  value={editingTask.promptIa}
                  onChange={(event) => setEditingTask({ ...editingTask, promptIa: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Anotações</span>
                <textarea
                  rows={3}
                  value={editingTask.observacoes}
                  onChange={(event) => setEditingTask({ ...editingTask, observacoes: event.target.value })}
                />
              </label>
            </div>

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setEditingTask(null)}>Cancelar</button>
              <button className="primary-button" onClick={saveEditedTask}>Salvar alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
