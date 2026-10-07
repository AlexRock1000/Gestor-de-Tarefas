import { useEffect, useState } from 'react'
import { Check, Clipboard, X } from 'lucide-react'
import { computeScore, formatDateForDisplay, getImportanceCategory, getImportanceValue, getPriorityBand, getPriorityLabel, getUrgencyCategory, getUrgencyValue } from '../taskUtils'
import type { Phase, Task } from '../types'
import { BrazilianDateInput } from './BrazilianDateInput'

type TaskDetailDrawerProps = {
  task: Task
  phases: { name: Phase; tone: string; accent: string }[]
  copiedTaskId: number | null
  onClose: () => void
  onDeleteTask: () => void
  onCopyPrompt: (task: Task) => void
  onConfirmChanges: (task: Task) => void
}

export function TaskDetailDrawer({
  task,
  phases,
  copiedTaskId,
  onClose,
  onDeleteTask,
  onCopyPrompt,
  onConfirmChanges,
}: TaskDetailDrawerProps) {
  const [draftTask, setDraftTask] = useState(task)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setDraftTask(task)
  }, [task])

  const updateDraft = <K extends keyof Task>(field: K, value: Task[K]) => {
    setDraftTask((current) => {
      const nextTask = { ...current, [field]: value }
      if (field === 'importancia' || field === 'urgencia') {
        nextTask.scoreGut = computeScore(nextTask.importancia, nextTask.urgencia)
      }
      return nextTask
    })
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
          <div className="drawer-task-tags">
            {isEditing ? (
              <select className="drawer-phase-select" value={draftTask.phase} onChange={(event) => updateDraft('phase', event.target.value as Phase)} aria-label="Fase da tarefa">
                {phases.map((phase) => <option key={phase.name} value={phase.name}>{phase.name}</option>)}
              </select>
            ) : <span className={`tag ${task.phase.toLowerCase()}`}>{task.phase}</span>}
            {isEditing ? (
              <input className="drawer-tag-input" value={draftTask.tag} onChange={(event) => updateDraft('tag', event.target.value)} aria-label="Tag da tarefa" />
            ) : <span className="task-label">{task.tag}</span>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar detalhes"><X size={18} /></button>
        </div>

      {isEditing ? (
        <input
          id="task-detail-title"
          className="drawer-title-input"
          value={draftTask.title}
          onChange={(event) => updateDraft('title', event.target.value)}
          aria-label="Título da tarefa"
        />
      ) : <h2 id="task-detail-title">{task.title}</h2>}
      <p className="drawer-description">
        {task.observacoes || 'Organize os próximos passos e acompanhe o avanço desta frente operacional.'}
      </p>

      <div className="drawer-quick-fields">
        <div className="drawer-status">
          <span>Status</span>
          <strong>{draftTask.status}</strong>
        </div>
        <label className="drawer-status">
          <span>Prazo</span>
          <BrazilianDateInput value={draftTask.due} onChange={(value) => updateDraft('due', value)} readOnly={!isEditing} />
        </label>
      </div>

      <div className="drawer-meta-grid">
        <div className="drawer-meta-card">
          <span>Responsável</span>
          {isEditing ? (
            <input value={draftTask.responsible} onChange={(event) => updateDraft('responsible', event.target.value)} aria-label="Responsável" />
          ) : <strong>{draftTask.responsible}</strong>}
        </div>
        <div className="drawer-meta-card">
          <span>Criada em</span>
          <strong>{formatDateForDisplay(draftTask.createdAt)}</strong>
        </div>
      </div>

      <div className="drawer-section gut-panel">
        <div className="drawer-section-head">
          <h3>Matriz de prioridade</h3>
          <span>{draftTask.scoreGut}</span>
        </div>

        <div className="gut-grid">
          <label className="gut-field">
            <span>Importância</span>
            <select
              value={getImportanceCategory(draftTask.importancia)}
              onChange={(event) => updateDraft('importancia', getImportanceValue(event.target.value as 'Baixa' | 'Alta' | 'Extrema'))}
                disabled={!isEditing}
            >
              <option value="Extrema">Extrema</option>
              <option value="Alta">Alta</option>
              <option value="Baixa">Baixa</option>
            </select>
          </label>
          <label className="gut-field">
            <span>Urgência</span>
            <select
              value={getUrgencyCategory(draftTask.urgencia)}
              onChange={(event) => updateDraft('urgencia', getUrgencyValue(event.target.value as 'Pouca' | 'Media' | 'Muita'))}
                disabled={!isEditing}
            >
              <option value="Muita">Muita</option>
              <option value="Media">Media</option>
              <option value="Pouca">Pouca</option>
            </select>
          </label>
        </div>

        <div className="gut-box">
          <div>
            <span>Prioridade</span>
            <strong>{draftTask.scoreGut}<small> / 25</small></strong>
          </div>
          <span className={`priority-label ${getPriorityBand(draftTask.scoreGut)}`}>
            {getPriorityLabel(draftTask.scoreGut)}
          </span>
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-head">
          <h3>Checklist</h3>
          <span>{draftTask.checklist.filter((item) => item.done).length}/{draftTask.checklist.length}</span>
        </div>

        {isEditing && <button className="secondary-button add-item-button" onClick={() => setDraftTask((current) => ({
          ...current,
          checklist: [...current.checklist, { label: `Novo item ${current.checklist.length + 1}`, done: false }],
        }))}>
          + Adicionar item
        </button>}

        {draftTask.checklist.map((item, index) => (
          <div className="check-item-row" key={`${draftTask.id}-checklist-${index}`}>
            <label className="check-item">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleDraftChecklist(index)}
                disabled={!isEditing}
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
                readOnly={!isEditing}
              />
            </label>
            {isEditing && <button className="remove-item-button" onClick={() => setDraftTask((current) => ({
              ...current,
              checklist: current.checklist.filter((_, checkIndex) => checkIndex !== index),
            }))} aria-label="Remover item">
              ×
            </button>}
          </div>
        ))}
      </div>

      <div className="drawer-section notes-section">
        <div className="drawer-section-head">
          <h3>Anotações</h3>
        </div>
        <textarea
          className="annotation-input"
          value={draftTask.observacoes}
          onChange={(event) => updateDraft('observacoes', event.target.value)}
          rows={8}
          readOnly={!isEditing}
        />
      </div>

      <div className="drawer-actions">
        {isEditing ? (
          <>
            <button className="secondary-button" onClick={() => { setDraftTask(task); setIsEditing(false) }}>
              Cancelar edição
            </button>
            <button className="confirm-button" disabled={!draftTask.title.trim() || !draftTask.responsible.trim()} onClick={() => { onConfirmChanges(draftTask); setIsEditing(false) }}>
              <Check size={15} /> Salvar alterações
            </button>
          </>
        ) : (
          <button className="secondary-button" onClick={() => setIsEditing(true)}>
            Editar tarefa
          </button>
        )}
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
