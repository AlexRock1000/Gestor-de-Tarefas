import { useEffect, useState } from 'react'
import { Check, Clipboard, X } from 'lucide-react'
import { computeScore, getPriorityBand, getPriorityLabel, resolveDueForStatus } from '../taskUtils'
import type { Status, Task } from '../types'

type TaskDetailDrawerProps = {
  task: Task
  copiedTaskId: number | null
  statusOrder: Status[]
  onClose: () => void
  onDeleteTask: () => void
  onCopyPrompt: (task: Task) => void
  onEditTask: () => void
  onConfirmChanges: (task: Task) => void
}

export function TaskDetailDrawer({
  task,
  copiedTaskId,
  statusOrder,
  onClose,
  onDeleteTask,
  onCopyPrompt,
  onEditTask,
  onConfirmChanges,
}: TaskDetailDrawerProps) {
  const [draftTask, setDraftTask] = useState(task)

  useEffect(() => {
    setDraftTask(task)
  }, [task])

  const updateDraft = <K extends keyof Task>(field: K, value: Task[K]) => {
    setDraftTask((current) => {
      const nextTask = { ...current, [field]: value }
      if (field === 'gravidade' || field === 'urgencia' || field === 'tendencia') {
        nextTask.scoreGut = computeScore(nextTask.gravidade, nextTask.urgencia, nextTask.tendencia)
      }
      return nextTask
    })
  }

  const updateDraftStatus = (status: Status) => {
    updateDraft('status', status)
    updateDraft('due', resolveDueForStatus(status, draftTask.due))
  }

  const toggleDraftChecklist = (itemIndex: number) => {
    setDraftTask((current) => ({
      ...current,
      checklist: current.checklist.map((item, index) =>
        index === itemIndex ? { ...item, done: !item.done } : item,
      ),
    }))
  }

  return (
    <div className="detail-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }}>
      <section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
        <div className="drawer-top">
          <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>
          <button className="icon-button" onClick={onClose} aria-label="Fechar detalhes"><X size={18} /></button>
        </div>

      <h2 id="task-detail-title">{task.title}</h2>
      <p className="drawer-description">
        {task.observacoes || 'Organize os próximos passos e acompanhe o avanço desta frente operacional.'}
      </p>

      <div className="drawer-status">
        <span>Status</span>
        <select value={draftTask.status} onChange={(event) => updateDraftStatus(event.target.value as Status)}>
          {statusOrder.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="drawer-meta-grid">
        <div className="drawer-meta-card">
          <span>Responsável</span>
          <strong>{draftTask.responsible}</strong>
        </div>
        <div className="drawer-meta-card">
          <span>Criada em</span>
          <strong>{draftTask.createdAt}</strong>
        </div>
      </div>

      <div className="drawer-section gut-panel">
        <div className="drawer-section-head">
          <h3>Matriz GUT</h3>
          <span>{draftTask.scoreGut}</span>
        </div>

        <div className="gut-grid">
          {(['gravidade', 'urgencia', 'tendencia'] as const).map((field) => (
            <label key={field} className="gut-field">
              <span>{field}</span>
              <input
                type="number"
                min={1}
                max={5}
                value={draftTask[field]}
                onChange={(event) => {
                  const nextValue = Number(event.target.value)
                  const safeValue = Number.isNaN(nextValue) ? 1 : Math.min(5, Math.max(1, nextValue))
                  updateDraft(field, safeValue)
                }}
              />
            </label>
          ))}
        </div>

        <div className="gut-box">
          <div>
            <span>Prioridade GUT</span>
            <strong>{draftTask.scoreGut}<small> / 125</small></strong>
          </div>
          <span className={`priority-label ${getPriorityBand(task.scoreGut)}`}>
            {getPriorityLabel(draftTask.scoreGut)}
          </span>
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-head">
          <h3>Checklist</h3>
          <span>{draftTask.checklist.filter((item) => item.done).length}/{draftTask.checklist.length}</span>
        </div>

        <button className="secondary-button add-item-button" onClick={() => setDraftTask((current) => ({
          ...current,
          checklist: [...current.checklist, { label: `Novo item ${current.checklist.length + 1}`, done: false }],
        }))}>
          + Adicionar item
        </button>

        {draftTask.checklist.map((item, index) => (
          <div className="check-item-row" key={`${draftTask.id}-${item.label}-${index}`}>
            <label className="check-item">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleDraftChecklist(index)}
              />
              <input
                value={item.label}
                onChange={(event) => setDraftTask((current) => ({
                  ...current,
                  checklist: current.checklist.map((checkItem, checkIndex) =>
                    checkIndex === index ? { ...checkItem, label: event.target.value } : checkItem,
                  ),
                }))}
                className="check-item-input"
              />
            </label>
            <button className="remove-item-button" onClick={() => setDraftTask((current) => ({
              ...current,
              checklist: current.checklist.filter((_, checkIndex) => checkIndex !== index),
            }))} aria-label="Remover item">
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
          value={draftTask.observacoes}
          onChange={(event) => updateDraft('observacoes', event.target.value)}
          rows={4}
        />
      </div>

      <div className="drawer-actions">
        <button className="secondary-button" onClick={onEditTask}>
          Editar tarefa
        </button>
          <button className="confirm-button" onClick={() => onConfirmChanges(draftTask)}>
            <Check size={15} /> Confirmar alterações
          </button>
        <button className="danger-button" onClick={onDeleteTask}>
          Excluir tarefa
        </button>
        <button className="prompt-button large" onClick={() => onCopyPrompt(task)}>
          {copiedTaskId === task.id ? <><Check size={15} /> Prompt copiado</> : <><Clipboard size={15} /> Copiar prompt de IA</>}
        </button>
      </div>
      </section>
    </div>
  )
}
