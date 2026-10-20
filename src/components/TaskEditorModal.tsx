import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { formatDateForDisplay, getImportanceCategory, getImportanceValue, getUrgencyCategory, getUrgencyValue } from '../taskUtils'
import type { Phase, Task } from '../types'
import { BrazilianDateInput } from './BrazilianDateInput'

type TaskEditorModalProps = {
  editingTask: Task
  phases: { name: Phase; tone: string; accent: string }[]
  onClose: () => void
  onFieldChange: <K extends keyof Task>(field: K, value: Task[K]) => void
  onSave: () => void
  isCreatingTask: boolean
}

export function TaskEditorModal({
  editingTask,
  phases,
  onClose,
  onFieldChange,
  onSave,
  isCreatingTask,
}: TaskEditorModalProps) {
  const titleInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    titleInputRef.current?.focus()
    titleInputRef.current?.select()
  }, [editingTask.id, isCreatingTask])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }

      if ((event.key === 'Enter' || event.key === 'NumpadEnter') && !(titleInputRef.current === document.activeElement && event.shiftKey)) {
        if (!document.body.contains(document.activeElement) || document.activeElement instanceof HTMLElement && document.activeElement.tagName !== 'TEXTAREA') {
          onSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onSave])

  const titleError = !editingTask.title.trim()
  const responsibleError = !editingTask.responsible.trim()
  const saveDisabled = titleError || responsibleError

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-editor-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isCreatingTask ? 'NOVA TAREFA' : 'EDIÇÃO DE TAREFA'}</p>
            <h3 id="task-editor-title">{isCreatingTask ? 'Configurar tarefa' : 'Detalhes da operação'}</h3>
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

          <label className="field">
            <span>Fase</span>
            <select value={editingTask.phase} onChange={(event) => onFieldChange('phase', event.target.value as Phase)}>
              {phases.map((phase) => (
                <option key={phase.name} value={phase.name}>{phase.name}</option>
              ))}
            </select>
          </label>

          <div className="modal-grid">
            <label className="field">
              <span>Prazo</span>
              <BrazilianDateInput value={editingTask.due} onChange={(value) => onFieldChange('due', value)} />
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
              <input value={formatDateForDisplay(editingTask.createdAt)} readOnly aria-readonly="true" />
            </label>

            <label className="field">
              <span>Tag</span>
              <input value={editingTask.tag} onChange={(event) => onFieldChange('tag', event.target.value)} />
            </label>
          </div>

          <div className="gut-grid">
            <label className="gut-field">
              <span>Importância</span>
              <select
                value={getImportanceCategory(editingTask.importancia)}
                onChange={(event) => onFieldChange('importancia', getImportanceValue(event.target.value as 'Baixa' | 'Alta' | 'Extrema'))}
              >
                <option value="Extrema">Extrema</option>
                <option value="Alta">Alta</option>
                <option value="Baixa">Baixa</option>
              </select>
            </label>
            <label className="gut-field">
              <span>Urgência</span>
              <select
                value={getUrgencyCategory(editingTask.urgencia)}
                onChange={(event) => onFieldChange('urgencia', getUrgencyValue(event.target.value as 'Pouca' | 'Media' | 'Muita'))}
              >
                <option value="Muita">Muita</option>
                <option value="Media">Media</option>
                <option value="Pouca">Pouca</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Anotações</span>
            <textarea className="annotation-input" rows={8} value={editingTask.observacoes} onChange={(event) => onFieldChange('observacoes', event.target.value)} />
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
