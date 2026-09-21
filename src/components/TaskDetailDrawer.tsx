import { Check, Clipboard, X } from 'lucide-react'
import { getPriorityBand, getPriorityLabel } from '../taskUtils'
import type { Status, Task } from '../types'

type TaskDetailDrawerProps = {
  task: Task
  copiedTaskId: number | null
  statusOrder: Status[]
  onClose: () => void
  onStatusChange: (status: Status) => void
  onUpdateTask: (field: keyof Task, value: string | number | boolean) => void
  onToggleChecklist: (itemIndex: number) => void
  onAddChecklistItem: () => void
  onRemoveChecklistItem: (itemIndex: number) => void
  onUpdateChecklistLabel: (itemIndex: number, label: string) => void
  onDeleteTask: () => void
  onCopyPrompt: (task: Task) => void
  onEditTask: () => void
}

export function TaskDetailDrawer({
  task,
  copiedTaskId,
  statusOrder,
  onClose,
  onStatusChange,
  onUpdateTask,
  onToggleChecklist,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onUpdateChecklistLabel,
  onDeleteTask,
  onCopyPrompt,
  onEditTask,
}: TaskDetailDrawerProps) {
  return (
    <aside className="detail-drawer">
      <div className="drawer-top">
        <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>
        <button className="icon-button" onClick={onClose}><X size={18} /></button>
      </div>

      <h2>{task.title}</h2>
      <p className="drawer-description">
        {task.observacoes || 'Organize os próximos passos e acompanhe o avanço desta frente operacional.'}
      </p>

      <div className="drawer-status">
        <span>Status</span>
        <select value={task.status} onChange={(event) => onStatusChange(event.target.value as Status)}>
          {statusOrder.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="drawer-meta-grid">
        <div className="drawer-meta-card">
          <span>Responsável</span>
          <strong>{task.responsible}</strong>
        </div>
        <div className="drawer-meta-card">
          <span>Criada em</span>
          <strong>{task.createdAt}</strong>
        </div>
      </div>

      <div className="drawer-section gut-panel">
        <div className="drawer-section-head">
          <h3>Matriz GUT</h3>
          <span>{task.scoreGut}</span>
        </div>

        <div className="gut-grid">
          {(['gravidade', 'urgencia', 'tendencia'] as const).map((field) => (
            <label key={field} className="gut-field">
              <span>{field}</span>
              <input
                type="number"
                min={1}
                max={5}
                value={task[field]}
                onChange={(event) => {
                  const nextValue = Number(event.target.value)
                  const safeValue = Number.isNaN(nextValue) ? 1 : Math.min(5, Math.max(1, nextValue))
                  onUpdateTask(field, safeValue)
                }}
              />
            </label>
          ))}
        </div>

        <div className="gut-box">
          <div>
            <span>Prioridade GUT</span>
            <strong>{task.scoreGut}<small> / 125</small></strong>
          </div>
          <span className={`priority-label ${getPriorityBand(task.scoreGut)}`}>
            {getPriorityLabel(task.scoreGut)}
          </span>
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-head">
          <h3>Checklist</h3>
          <span>{task.checklist.filter((item) => item.done).length}/{task.checklist.length}</span>
        </div>

        <button className="secondary-button add-item-button" onClick={onAddChecklistItem}>
          + Adicionar item
        </button>

        {task.checklist.map((item, index) => (
          <div className="check-item-row" key={`${task.id}-${item.label}-${index}`}>
            <label className="check-item">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggleChecklist(index)}
              />
              <input
                value={item.label}
                onChange={(event) => onUpdateChecklistLabel(index, event.target.value)}
                className="check-item-input"
              />
            </label>
            <button className="remove-item-button" onClick={() => onRemoveChecklistItem(index)} aria-label="Remover item">
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
          value={task.observacoes}
          onChange={(event) => onUpdateTask('observacoes', event.target.value)}
          rows={4}
        />
      </div>

      <div className="drawer-actions">
        <button className="secondary-button" onClick={onEditTask}>
          Editar tarefa
        </button>
        <button className="danger-button" onClick={onDeleteTask}>
          Excluir tarefa
        </button>
        <button className="prompt-button large" onClick={() => onCopyPrompt(task)}>
          {copiedTaskId === task.id ? <><Check size={15} /> Prompt copiado</> : <><Clipboard size={15} /> Copiar prompt de IA</>}
        </button>
      </div>
    </aside>
  )
}
