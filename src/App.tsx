import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  FileText,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react'

type Status = 'A fazer' | 'Em andamento' | 'Bloqueada' | 'Concluída'
type Phase = 'Estoque' | 'Documentação' | 'Processos'

type Task = {
  id: number
  title: string
  phase: Phase
  status: Status
  due: string
  gut: number
  tag: string
  checklist: { label: string; done: boolean }[]
}

const phases: { name: Phase; tone: string; accent: string }[] = [
  { name: 'Estoque', tone: 'teal', accent: '#17847c' },
  { name: 'Documentação', tone: 'amber', accent: '#d18a29' },
  { name: 'Processos', tone: 'coral', accent: '#d45c4f' },
]

const initialTasks: Task[] = [
  { id: 1, title: 'Mapear itens sem giro há 90 dias', phase: 'Estoque', status: 'Em andamento', due: 'Hoje', gut: 100, tag: 'Diagnóstico', checklist: [{ label: 'Exportar relatório do ERP', done: true }, { label: 'Classificar itens por curva ABC', done: true }, { label: 'Validar lista com compras', done: false }] },
  { id: 2, title: 'Definir política de inventário cíclico', phase: 'Estoque', status: 'A fazer', due: '18 set', gut: 64, tag: 'Política', checklist: [{ label: 'Levantar frequência atual', done: false }, { label: 'Propor nova frequência', done: false }] },
  { id: 3, title: 'Revisar contratos de fornecedores', phase: 'Documentação', status: 'Em andamento', due: '20 set', gut: 75, tag: 'Contratos', checklist: [{ label: 'Consolidar contratos vigentes', done: true }, { label: 'Sinalizar cláusulas críticas', done: false }, { label: 'Agendar revisão jurídica', done: false }] },
  { id: 4, title: 'Centralizar POPs da operação', phase: 'Documentação', status: 'Concluída', due: 'Concluída', gut: 36, tag: 'Organização', checklist: [{ label: 'Criar estrutura de pastas', done: true }, { label: 'Migrar documentos aprovados', done: true }] },
  { id: 5, title: 'Desenhar fluxo de aprovação', phase: 'Processos', status: 'A fazer', due: '24 set', gut: 90, tag: 'Fluxo', checklist: [{ label: 'Entrevistar responsáveis', done: false }, { label: 'Desenhar fluxo atual', done: false }, { label: 'Validar pontos de controle', done: false }] },
  { id: 6, title: 'Criar rotina de reunião semanal', phase: 'Processos', status: 'Concluída', due: 'Concluída', gut: 48, tag: 'Ritual', checklist: [{ label: 'Definir pauta fixa', done: true }, { label: 'Publicar calendário', done: true }] },
]

const statusOrder: Status[] = ['A fazer', 'Em andamento', 'Bloqueada', 'Concluída']

function App() {
  const [tasks, setTasks] = useState(initialTasks)
  const [activePhase, setActivePhase] = useState<'Todas' | Phase>('Todas')
  const [activeView, setActiveView] = useState('Visão geral')
  const [search, setSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(initialTasks[0])
  const [promptCopied, setPromptCopied] = useState(false)

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const phaseMatches = activePhase === 'Todas' || task.phase === activePhase
    return phaseMatches && task.title.toLowerCase().includes(search.toLowerCase())
  }), [activePhase, search, tasks])

  const totalProgress = Math.round(tasks.reduce((sum, task) => sum + (task.status === 'Concluída' ? 100 : task.checklist.filter((item) => item.done).length / task.checklist.length * 100), 0) / tasks.length)
  const updateStatus = (id: number, status: Status) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status, due: status === 'Concluída' ? 'Concluída' : task.due } : task))
    setSelectedTask((current) => current?.id === id ? { ...current, status, due: status === 'Concluída' ? 'Concluída' : current.due } : current)
  }
  const toggleChecklist = (taskId: number, itemIndex: number) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, checklist: task.checklist.map((item, index) => index === itemIndex ? { ...item, done: !item.done } : item) } : task))
    setSelectedTask((current) => current?.id === taskId ? { ...current, checklist: current.checklist.map((item, index) => index === itemIndex ? { ...item, done: !item.done } : item) } : current)
  }
  const addTask = () => {
    const newTask: Task = { id: Date.now(), title: 'Nova tarefa operacional', phase: activePhase === 'Todas' ? 'Processos' : activePhase, status: 'A fazer', due: '30 set', gut: 25, tag: 'Nova', checklist: [{ label: 'Definir próximo passo', done: false }] }
    setTasks((current) => [...current, newTask])
    setSelectedTask(newTask)
  }
  const copyPrompt = async () => {
    await navigator.clipboard?.writeText('Analise a tarefa {{tarefa}} e proponha os próximos três passos práticos, considerando a prioridade GUT e os bloqueios atuais.')
    setPromptCopied(true)
    window.setTimeout(() => setPromptCopied(false), 2200)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><span>orbit</span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">OP</div><div><strong>Operação 2026</strong><span>Workspace principal</span></div><ChevronDown size={15} /></div>
        <nav className="main-nav">
          <p className="nav-label">Workspace</p>
          <button className={activeView === 'Visão geral' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Visão geral')}><LayoutDashboard size={17} /> Visão geral</button>
          <button className={activeView === 'Quadro' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Quadro')}><Target size={17} /> Quadro Kanban <span className="nav-count">6</span></button>
          <button className={activeView === 'Checklists' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Checklists')}><ListChecks size={17} /> Checklists</button>
          <button className={activeView === 'Prompts IA' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('Prompts IA')}><Sparkles size={17} /> Prompts IA <span className="new-pill">novo</span></button>
          <p className="nav-label second">Organização</p>
          <button className="nav-item"><FileText size={17} /> Documentos</button>
          <button className="nav-item"><Clock3 size={17} /> Histórico</button>
        </nav>
        <div className="sidebar-bottom"><div className="mini-progress"><div><span>Plano de ação</span><b>{totalProgress}%</b></div><div className="progress-track"><span style={{ width: `${totalProgress}%` }} /></div><small>Atualizado agora</small></div><div className="user-card"><div className="user-avatar">DR</div><div><strong>Daniel Rocha</strong><span>Administrador</span></div><MoreHorizontal size={16} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeView}</strong></div><div className="top-actions"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tarefa..." /><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Notificações"><Bell size={18} /><i /></button><button className="avatar-button">DR</button></div></header>
        <div className="content-wrap">
          <section className="hero-row"><div><p className="eyebrow">QUINTA-FEIRA, 17 DE SETEMBRO</p><h1>Bom dia, Daniel <span>✦</span></h1><p className="hero-subtitle">Aqui está o pulso da sua operação hoje.</p></div><button className="primary-button" onClick={addTask}><Plus size={17} /> Nova tarefa</button></section>
          <section className="metric-grid"><div className="metric-card dark"><div className="metric-top"><span>Progresso geral</span><ArrowUpRight size={17} /></div><strong>{totalProgress}%</strong><div className="metric-foot"><div className="progress-track light"><span style={{ width: `${totalProgress}%` }} /></div><span>+8,4% <small>esta semana</small></span></div></div><div className="metric-card"><div className="metric-top"><span>Tarefas ativas</span><Target size={17} /></div><strong>{tasks.filter((task) => task.status !== 'Concluída').length}</strong><div className="metric-caption">de {tasks.length} tarefas no plano</div></div><div className="metric-card"><div className="metric-top"><span>Alta prioridade</span><span className="priority-dot" /></div><strong>{tasks.filter((task) => task.gut >= 80 && task.status !== 'Concluída').length}</strong><div className="metric-caption">requerem atenção</div></div><div className="metric-card"><div className="metric-top"><span>Em dia</span><Check size={17} /></div><strong>92%</strong><div className="metric-caption">tarefas dentro do prazo</div></div></section>

          <div className="section-heading"><div><h2>Progresso por fase</h2><p>Uma leitura rápida do avanço operacional.</p></div><button className="text-button">Ver relatório <ArrowUpRight size={15} /></button></div>
          <section className="phase-grid">{phases.map((phase) => { const phaseTasks = tasks.filter((task) => task.phase === phase.name); const done = phaseTasks.filter((task) => task.status === 'Concluída').length; const percent = Math.round(done / phaseTasks.length * 100); return <button className="phase-card" key={phase.name} onClick={() => setActivePhase(phase.name)}><div className="phase-card-head"><span className={`phase-icon ${phase.tone}`}><Target size={18} /></span><span className="phase-arrow"><ArrowUpRight size={16} /></span></div><h3>{phase.name}</h3><div className="phase-meta"><span>{done} de {phaseTasks.length} concluídas</span><b>{percent}%</b></div><div className="progress-track"><span style={{ width: `${percent}%`, background: phase.accent }} /></div></button> })}</section>

          <div className="workspace-grid"><section className="tasks-panel"><div className="panel-header"><div><h2>Minhas tarefas</h2><p>Prioridades para manter o plano em movimento.</p></div><div className="filter-tabs"><button className={activePhase === 'Todas' ? 'selected' : ''} onClick={() => setActivePhase('Todas')}>Todas</button>{phases.map((phase) => <button className={activePhase === phase.name ? 'selected' : ''} key={phase.name} onClick={() => setActivePhase(phase.name)}>{phase.name}</button>)}</div></div><div className="task-list">{visibleTasks.map((task) => <article className="task-row" key={task.id} onClick={() => setSelectedTask(task)}><div className={`task-status ${task.status === 'Concluída' ? 'done' : ''}`} onClick={(event) => { event.stopPropagation(); updateStatus(task.id, task.status === 'Concluída' ? 'A fazer' : 'Concluída') }}>{task.status === 'Concluída' && <Check size={13} />}</div><div className="task-info"><strong>{task.title}</strong><div><span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span><span className="task-label">{task.tag}</span></div></div><div className="task-priority"><span className={`priority-label ${task.gut >= 80 ? 'critical' : task.gut >= 50 ? 'high' : 'low'}`}>GUT {task.gut}</span><span className="due-date">{task.due}</span></div><MoreHorizontal size={17} className="row-menu" /></article>)}</div></section>
            <aside className="side-column"><section className="prompt-card"><div className="prompt-orbit"><Sparkles size={19} /></div><div className="prompt-copy"><span className="eyebrow">PROMPT HELPER</span><h2>Destrave o próximo passo.</h2><p>Use IA para transformar uma tarefa complexa em ações claras.</p><button className="prompt-button" onClick={copyPrompt}>{promptCopied ? <><Check size={15} /> Copiado</> : <><Clipboard size={15} /> Copiar prompt sugerido</>}</button></div></section><section className="activity-card"><div className="panel-header compact"><div><h2>Atividade recente</h2><p>Últimas atualizações do time.</p></div><button className="icon-button"><MoreHorizontal size={17} /></button></div><div className="activity-item"><div className="activity-avatar teal">DR</div><p><strong>Daniel</strong> concluiu <b>Centralizar POPs</b><small>Há 24 min</small></p></div><div className="activity-item"><div className="activity-avatar amber">AM</div><p><strong>Ana</strong> atualizou a prioridade de <b>Revisar contratos</b><small>Há 1 h</small></p></div><div className="activity-item"><div className="activity-avatar coral">LC</div><p><strong>Lucas</strong> adicionou um item ao checklist<small>Há 2 h</small></p></div></section></aside>
          </div>
        </div>
      </main>

      {selectedTask && <aside className="detail-drawer"><div className="drawer-top"><span className={`tag ${selectedTask.phase.toLowerCase()}`}>{selectedTask.phase}</span><button className="icon-button" onClick={() => setSelectedTask(null)}><X size={18} /></button></div><h2>{selectedTask.title}</h2><p className="drawer-description">Organize os próximos passos e acompanhe o avanço desta frente operacional.</p><div className="drawer-status"><span>Status</span><select value={selectedTask.status} onChange={(event) => updateStatus(selectedTask.id, event.target.value as Status)}>{statusOrder.map((status) => <option key={status}>{status}</option>)}</select></div><div className="drawer-section"><div className="drawer-section-head"><h3>Checklist</h3><span>{selectedTask.checklist.filter((item) => item.done).length}/{selectedTask.checklist.length}</span></div>{selectedTask.checklist.map((item, index) => <label className="check-item" key={item.label}><input type="checkbox" checked={item.done} onChange={() => toggleChecklist(selectedTask.id, index)} /><span>{item.label}</span></label>)}</div><div className="gut-box"><div><span>Prioridade GUT</span><strong>{selectedTask.gut} <small>/ 125</small></strong></div><span className="priority-label critical">Alta prioridade</span></div></aside>}
    </div>
  )
}

export default App
