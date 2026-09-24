import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Download,
  FileText,
  LayoutDashboard,
  ListTodo,
  ListChecks,
  MoonStar,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
  Target,
  Upload,
} from 'lucide-react'
import { getDueState, getPriorityBand } from './taskUtils'
import type { DeadlineFilter, GutFilter } from './types'
import { TaskCard } from './components/TaskCard'
import { TaskDetailDrawer } from './components/TaskDetailDrawer'
import { TaskEditorModal } from './components/TaskEditorModal'
import {
  dueStateLabels,
  dueToInputValue,
  inputValueToDue,
  phases,
  statusOrder,
  useTaskBoard,
} from './hooks/useTaskBoard'

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const {
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
    editingTask,
    setEditingTask,
    isCreatingTask,
    setIsCreatingTask,
    draggedTaskId,
    setDraggedTaskId,
    dragOverStatus,
    setDragOverStatus,
    activities,
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
    saveTaskChanges,
    updateStatus,
    handleKanbanDrop,
    addTask,
    deleteTask,
    copyPrompt,
    exportTasks,
    importTasks,
    saveEditedTask,
    tasks,
    getDueState,
  } = useTaskBoard()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey
      if (isModifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if (event.key === 'Escape') {
        if (notificationsOpen) {
          setNotificationsOpen(false)
        }
        if (editingTask) {
          setEditingTask(null)
          setIsCreatingTask(false)
        }
        if (selectedTaskId) {
          setSelectedTaskId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingTask, notificationsOpen, selectedTaskId, setSelectedTaskId])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeView])

  const showToast = (message: string) => setToast(message)
  const selectTaskFilter = (filter: 'Todos' | 'Hoje' | 'Urgentes' | 'Concluídas') => {
    clearFilters()
    setQuickFilter(filter)
    handleNavClick('Minhas tarefas')
  }

  const renderOverview = () => (
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
  )

  const renderHistoryView = () => (
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
  )

  const documentCards = [
    {
      title: 'Documentação UX',
      description: 'Visão geral das experiências, requisitos e decisões de interface do gestor de tarefas.',
      status: 'Atualizado',
    },
    {
      title: 'Especificações iniciais',
      description: 'Requisitos iniciais do projeto, regras de negócio e critérios de priorização da operação.',
      status: 'Base do produto',
    },
    {
      title: 'Checklist de implementação',
      description: 'Pendências e próximos passos para evoluir o produto com mais estabilidade e UX.',
      status: 'Em andamento',
    },
  ]

  const renderDocumentsView = () => (
    <section className="history-view">
      <div className="history-header">
        <div>
          <p className="eyebrow">CENTRO DE CONHECIMENTO</p>
          <h1>Documentos</h1>
          <p>Arquivos e referências do projeto organizados em um único ponto de entrada.</p>
        </div>
        <span className="history-count">{documentCards.length} registros</span>
      </div>

      <div className="report-grid">
        {documentCards.map((document) => (
          <article className="report-card" key={document.title}>
            <div className="report-card-heading">
              <div>
                <h2>{document.title}</h2>
                <p>{document.description}</p>
              </div>
              <span>{document.status}</span>
            </div>
            <div className="filter-summary">
              <span>Contexto operacional</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )

  const renderKanbanView = () => (
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
            className={`kanban-column ${column.status === 'Concluído' ? 'done' : ''}`}
            key={column.status}
            onDragOver={(event) => {
              event.preventDefault()
            }}
            onDrop={() => handleKanbanDrop(column.status)}
          >
            <div className="kanban-column-header">
              <span>{column.status}</span>
              <strong>{column.tasks.length}</strong>
            </div>

            <div className="kanban-column-body">
              {!column.tasks.length && <div className="kanban-empty">Sem tarefas</div>}

              {column.tasks.map((task) => (
                <article
                  className="kanban-card"
                  key={task.id}
                  draggable
                  onDragStart={() => setSelectedTaskId(task.id)}
                  onDragEnd={() => setSelectedTaskId(task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="kanban-card-top">
                    <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>
                    <span className={`priority-label ${getPriorityBand(task.scoreGut)}`}>GUT {task.scoreGut}</span>
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
  )

  const renderTaskWorkspace = () => (
    <div className="workspace-grid">
      <section className="tasks-panel">
        <div className="panel-header">
          <div className="tasks-heading-row">
            <div>
              <p className="eyebrow">SEU ESPAÇO DE TRABALHO</p>
              <h2>Minhas tarefas</h2>
              <p>Escolha uma tarefa e avance no seu ritmo.</p>
            </div>
            <button className="primary-button" onClick={addTask}><Plus size={17} /> Nova tarefa</button>
          </div>

          <div className="filter-group">
            <div className="quick-actions-row">
              {[
                { label: 'Todos', value: 'Todos' },
                { label: 'Hoje', value: 'Hoje' },
                { label: 'Urgentes', value: 'Urgentes' },
                { label: 'Concluídas', value: 'Concluídas' },
              ].map((item) => (
                <button
                  key={item.value}
                  className={quickFilter === item.value ? 'quick-action active' : 'quick-action'}
                  onClick={() => setQuickFilter(item.value as 'Todos' | 'Hoje' | 'Urgentes' | 'Concluídas')}
                >
                  <span>{item.label}</span>
                  {item.value === 'Hoje' && <strong>{tasks.filter((task) => getDueState(task.due, task.status) === 'today' || getDueState(task.due, task.status) === 'overdue').length}</strong>}
                  {item.value === 'Urgentes' && <strong>{tasks.filter((task) => task.scoreGut >= 80 || getDueState(task.due, task.status) === 'today' || getDueState(task.due, task.status) === 'overdue').length}</strong>}
                  {item.value === 'Concluídas' && <strong>{tasks.filter((task) => task.status === 'Concluído').length}</strong>}
                </button>
              ))}
              <button
                className={`quick-action filter-toggle ${filtersExpanded ? 'active' : ''}`}
                onClick={() => setFiltersExpanded((current) => !current)}
                aria-expanded={filtersExpanded}
              >
                <SlidersHorizontal size={14} />
                Mais filtros
              </button>
            </div>

            {filtersExpanded && <div className="filters-expanded">
              <div className="filter-tabs">
                <button className={activePhase === 'Todas' ? 'selected' : ''} onClick={() => setActivePhase('Todas')}>Todas as fases</button>
                {phases.map((phase) => (
                  <button className={activePhase === phase.name ? 'selected' : ''} key={phase.name} onClick={() => setActivePhase(phase.name)}>{phase.name}</button>
                ))}
              </div>

              <div className="status-tabs">
                <button className={statusFilter === 'Todos' ? 'selected' : ''} onClick={() => setStatusFilter('Todos')}>Todos os status</button>
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
                <select value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value as any)}>
                  <option value="Todos">Todos</option>
                  <option value="Em aberto">Em aberto</option>
                  <option value="Concluídas">Concluídas</option>
                </select>
              </label>
              <label>
                Prioridade
                <select value={gutFilter} onChange={(event) => setGutFilter(event.target.value as any)}>
                  <option value="Todos">Todas</option>
                  <option value="Críticas (80+)">Críticas</option>
                  <option value="Altas (50-79)">Altas</option>
                  <option value="Baixas (até 49)">Baixas</option>
                </select>
              </label>
              </div>
            </div>}

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
            <TaskCard
              key={task.id}
              task={task}
              selectedTaskId={selectedTaskId}
              copiedTaskId={copiedTaskId}
              onSelect={setSelectedTaskId}
              onToggleStatus={(taskId) => {
                const nextStatus = visibleTasks.find((item) => item.id === taskId)?.status === 'Concluído' ? 'Pendente' : 'Concluído'
                updateStatus(taskId, nextStatus)
              }}
              onEdit={setEditingTask}
              onCopyPrompt={copyPrompt}
            />
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
  )

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ListChecks size={18} /></div>
          <span>Orbit</span>
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
          <p className="nav-label">Menu</p>
          <button className={activeView === 'Visão geral' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Visão geral')}><LayoutDashboard size={17} /> Visão geral</button>
          <button className={activeView === 'Quadro' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Quadro')}><Target size={17} /> Quadro Kanban <span className="nav-count">{tasks.length}</span></button>
          <button className={activeView === 'Documentos' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Documentos')}><FileText size={17} /> Documentos</button>
          <button className={activeView === 'Histórico' ? 'nav-item active' : 'nav-item'} onClick={() => handleNavClick('Histórico')}><Clock3 size={17} /> Histórico</button>

          <div className="library-heading">
            <p className="nav-label second">Sua biblioteca</p>
            <button className="library-add" onClick={addTask} aria-label="Criar tarefa"><Plus size={17} /></button>
          </div>
          <button className={activeView === 'Minhas tarefas' && quickFilter === 'Todos' ? 'nav-item active' : 'nav-item'} onClick={() => selectTaskFilter('Todos')}><ListTodo size={17} /> Todas as tarefas <span className="nav-count">{tasks.length}</span></button>
          <button className={activeView === 'Minhas tarefas' && quickFilter === 'Hoje' ? 'nav-item active' : 'nav-item'} onClick={() => selectTaskFilter('Hoje')}><CalendarDays size={17} /> Para hoje</button>
          <button className={activeView === 'Minhas tarefas' && quickFilter === 'Urgentes' ? 'nav-item active' : 'nav-item'} onClick={() => selectTaskFilter('Urgentes')}><Bell size={17} /> Prioritárias <span className="nav-count">{tasks.filter((task) => task.scoreGut >= 80 || getDueState(task.due, task.status) === 'today' || getDueState(task.due, task.status) === 'overdue').length}</span></button>
          <button className={activeView === 'Minhas tarefas' && quickFilter === 'Concluídas' ? 'nav-item active' : 'nav-item'} onClick={() => selectTaskFilter('Concluídas')}><CheckCircle2 size={17} /> Concluídas</button>
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
            <button className="top-home" onClick={() => handleNavClick('Visão geral')} aria-label="Ir para visão geral"><LayoutDashboard size={17} /></button>
            <strong>{activeView === 'Minhas tarefas' ? 'Sua biblioteca' : activeView}</strong>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={16} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="O que você precisa fazer?"
              />
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
          {isOverview && renderOverview()}
          {activeView === 'Histórico' ? renderHistoryView() : activeView === 'Quadro' ? renderKanbanView() : activeView === 'Documentos' ? renderDocumentsView() : renderTaskWorkspace()}
        </div>

        {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
      </main>

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          copiedTaskId={copiedTaskId}
          statusOrder={statusOrder}
          onClose={() => setSelectedTaskId(null)}
          onDeleteTask={() => deleteTask(selectedTask.id)}
          onCopyPrompt={(task) => void copyPrompt(task)}
          onEditTask={() => {
            setIsCreatingTask(false)
            setEditingTask({ ...selectedTask })
          }}
          onConfirmChanges={(task) => {
            saveTaskChanges(task)
            showToast('Alterações confirmadas')
            setSelectedTaskId(null)
          }}
        />
      )}

      {editingTask && (
        <TaskEditorModal
          editingTask={editingTask}
          isCreatingTask={isCreatingTask}
          phases={phases}
          statusOrder={statusOrder}
          onClose={() => {
            setEditingTask(null)
            setIsCreatingTask(false)
          }}
          onFieldChange={(field, value) => setEditingTask({ ...editingTask, [field]: value })}
          onSave={saveEditedTask}
          dueToInputValue={dueToInputValue}
          inputValueToDue={inputValueToDue}
        />
      )}
    </div>
  )
}

export default App
