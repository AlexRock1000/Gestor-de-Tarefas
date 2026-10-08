import { useState } from 'react'
import { Check, Clipboard } from 'lucide-react'
import { formatDateForDisplay, formatDueDate, getDueState, getPriorityBand } from '../taskUtils'
import type { Task } from '../types'

type TaskCardProps = {
  task: Task
  selectedTaskId: number | null
  copiedTaskId: number | null
  onToggleStatus: (taskId: number) => void
  onToggleChecklist: (taskId: number, itemIndex: number) => void
  onEdit: (task: Task) => void
  onCopyPrompt: (task: Task) => void
}

export function TaskCard({
  task,
  selectedTaskId,
  copiedTaskId,
  onToggleStatus,
  onToggleChecklist,
  onEdit,
  onCopyPrompt,
}: TaskCardProps) {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false)
  const dueState = getDueState(task.due, task.status)

  return (
    <article
      className={`task-row task-row-expandable ${isChecklistExpanded ? 'expanded' : ''} ${selectedTaskId === task.id ? 'selected' : ''}`}
      key={task.id}
      onClick={() => setIsChecklistExpanded((expanded) => !expanded)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setIsChecklistExpanded((expanded) => !expanded)
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={isChecklistExpanded}
      aria-label={`${isChecklistExpanded ? 'Recolher' : 'Expandir'} checklist da tarefa ${task.title}`}
    >
      <button
        type="button"
        className={`task-status ${task.status === 'Concluído' ? 'done' : task.status === 'Em Andamento' ? 'progress' : ''}`}
        aria-label={task.status === 'Concluído' ? `Reabrir tarefa ${task.title}` : `Marcar tarefa ${task.title} como feita`}
        title={task.status === 'Concluído' ? 'Reabrir tarefa' : 'Feita'}
        onClick={(event) => {
          event.stopPropagation()
          onToggleStatus(task.id)
        }}
      >
        {task.status === 'Concluído' && <Check size={13} />}
      </button>

      <div className="task-info">
        <strong>{task.title}</strong>
        <div>
          <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>
          <span className="task-label">{task.tag}</span>
        </div>
        <div className="task-meta">
          <span>{task.responsible}</span>
          <span>•</span>
          <span>{formatDateForDisplay(task.createdAt)}</span>
        </div>
      </div>

      <div className="task-priority">
        <span className={`priority-label ${getPriorityBand(task.scoreGut)}`}>Prioridade {task.scoreGut}</span>
        <span className={`due-date ${dueState}`}>
          <span>{formatDueDate(task.due)}</span>
          <small>{dueState === 'overdue' ? 'Atrasada' : dueState === 'today' ? 'Vence hoje' : dueState === 'upcoming' ? 'No prazo' : dueState === 'completed' ? 'Concluída' : 'Sem prazo'}</small>
        </span>
      </div>

      <div className="task-actions">
        <button
          className="mini-action"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(task)
          }}
          aria-label="Editar tarefa"
        >
          Editar
        </button>
        <button
          className="mini-action"
          onClick={(event) => {
            event.stopPropagation()
            onCopyPrompt(task)
          }}
          aria-label="Copiar prompt"
        >
          {copiedTaskId === task.id ? <Check size={14} /> : <Clipboard size={14} />}
        </button>
      </div>

      <div className={`task-checklist-expand ${isChecklistExpanded ? 'open' : ''}`} aria-hidden={!isChecklistExpanded}>
        <div className="task-checklist-content">
          <div className="task-checklist-heading">
            <strong>Checklist</strong>
            <span>{task.checklist.filter((item) => item.done).length}/{task.checklist.length} concluídos</span>
          </div>
          {task.checklist.length ? (
            <ul className="task-checklist-list">
              {task.checklist.map((item, index) => (
                <li className={item.done ? 'completed' : ''} key={`${task.id}-check-${index}`}>
                  <input
                    className="task-checklist-checkbox"
                    type="checkbox"
                    checked={item.done}
                    aria-label={`${item.done ? 'Desmarcar' : 'Marcar'} ${item.label}`}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    onChange={() => onToggleChecklist(task.id, index)}
                  />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          ) : <p className="task-checklist-empty">Esta tarefa ainda não tem itens no checklist.</p>}
        </div>
      </div>
    </article>
  )
}
