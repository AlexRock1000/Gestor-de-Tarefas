import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Phase, Status, Task } from '../types'

type TaskEditorModalProps = {
  editingTask: Task
  phases: { name: Phase; tone: string; accent: string }[]
  statusOrder: Status[]
  onClose: () => void
  onFieldChange: <K extends keyof Task>(field: K, value: Task[K]) => void
  onSave: () => void
  isCreatingTask: boolean
  dueToInputValue: (due: string) => string
  inputValueToDue: (value: string) => string
}

export function TaskEditorModal({
  editingTask,
  phases,
  statusOrder,
  onClose,
  onFieldChange,
  onSave,
  isCreatingTask,
  dueToInputValue,
  inputValueToDue,
}: TaskEditorModalProps) {
  const titleInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    titleInputRef.current?.focus()
    titleInputRef.current?.select()
  }, [editingTask.id, isCreatingTask])

  const titleError = !editingTask.title.trim()
  const responsibleError = !editingTask.responsible.trim()
  const saveDisabled = titleError || responsibleError

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isCreatingTask ? 'NOVA TAREFA' : 'EDIÇÃO DE TAREFA'}</p>
            <h3>{isCreatingTask ? 'Configurar tarefa' : 'Detalhes da operação'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span>Título</span>
            <input
              ref={titleInputRef}
              value={editingTask.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              aria-invalid={titleError}
            />
            {titleError && <small className="field-error">Informe um título para salvar a tarefa.</small>}
          </label>

          <div className="modal-grid">
            <label className="field">
              <span>Fase</span>
              <select value={editingTask.phase} onChange={(event) => onFieldChange('phase', event.target.value as Phase)}>
                {phases.map((phase) => (
                  <option key={phase.name} value={phase.name}>{phase.name}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select value={editingTask.status} onChange={(event) => onFieldChange('status', event.target.value as Status)}>
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
                onChange={(event) => onFieldChange('due', inputValueToDue(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Responsável</span>
              <input
                value={editingTask.responsible}
                onChange={(event) => onFieldChange('responsible', event.target.value)}
                aria-invalid={responsibleError}
              />
              {responsibleError && <small className="field-error">Informe quem será responsável pela tarefa.</small>}
            </label>
          </div>

          <div className="modal-grid">
            <label className="field">
              <span>Criada em</span>
              <input value={editingTask.createdAt} readOnly aria-readonly="true" />
            </label>

            <label className="field">
              <span>Tag</span>
              <input value={editingTask.tag} onChange={(event) => onFieldChange('tag', event.target.value)} />
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
                    onFieldChange(field, safeValue)
                  }}
                />
              </label>
            ))}
          </div>

          <label className="field">
            <span>Prompt de IA</span>
            <textarea rows={3} value={editingTask.promptIa} onChange={(event) => onFieldChange('promptIa', event.target.value)} />
          </label>

          <label className="field">
            <span>Anotações</span>
            <textarea rows={3} value={editingTask.observacoes} onChange={(event) => onFieldChange('observacoes', event.target.value)} />
          </label>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" onClick={onSave} disabled={saveDisabled} aria-disabled={saveDisabled}>
            {isCreatingTask ? 'Criar tarefa' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
