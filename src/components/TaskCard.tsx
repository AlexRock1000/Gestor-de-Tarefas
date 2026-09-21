import { Check, Clipboard } from 'lucide-react'
import { getDueState, getPriorityBand } from '../taskUtils'
import type { Task } from '../types'

type TaskCardProps = {
  task: Task
  selectedTaskId: number | null
  copiedTaskId: number | null
  onSelect: (taskId: number) => void
  onToggleStatus: (taskId: number) => void
  onEdit: (task: Task) => void
  onCopyPrompt: (task: Task) => void
}

export function TaskCard({
  task,
  selectedTaskId,
  copiedTaskId,
  onSelect,
  onToggleStatus,
  onEdit,
  onCopyPrompt,
}: TaskCardProps) {
  const dueState = getDueState(task.due, task.status)

  return (
    <article
      className={`task-row ${selectedTaskId === task.id ? 'selected' : ''}`}
      key={task.id}
      onClick={() => onSelect(task.id)}
    >
      <div
        className={`task-status ${task.status === 'Concluído' ? 'done' : task.status === 'Em Andamento' ? 'progress' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          onToggleStatus(task.id)
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
        <span className={`priority-label ${getPriorityBand(task.scoreGut)}`}>GUT {task.scoreGut}</span>
        <span className={`due-date ${dueState}`}>
          <span>{task.due}</span>
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
    </article>
  )
}
