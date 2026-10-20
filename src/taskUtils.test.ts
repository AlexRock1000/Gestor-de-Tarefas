import { describe, expect, it } from 'vitest'
import {
  computeScore,
  describeRequestError,
  formatDueDate,
  formatDateForDisplay,
  formatDateForInput,
  getDueState,
  getImportanceCategory,
  getImportanceValue,
  getUrgencyCategory,
  getUrgencyValue,
  getPriorityBand,
  getPriorityLabel,
  normalizeDueDate,
  parseCsv,
  parseBrazilianDate,
  resolveDueForStatus,
} from './taskUtils'

describe('computeScore', () => {
  it('multiplica importância e urgência', () => {
    expect(computeScore(5, 4)).toBe(20)
    expect(computeScore(5, 5)).toBe(25)
    expect(computeScore(3, 3)).toBe(9)
  })
})

describe('importance categories', () => {
  it('groups importance scores into low, high and extreme categories', () => {
    expect(getImportanceCategory(1)).toBe('Baixa')
    expect(getImportanceCategory(2)).toBe('Baixa')
    expect(getImportanceCategory(3)).toBe('Alta')
    expect(getImportanceCategory(4)).toBe('Alta')
    expect(getImportanceCategory(5)).toBe('Extrema')
  })

  it('maps each category to a representative score', () => {
    expect(getImportanceValue('Baixa')).toBe(2)
    expect(getImportanceValue('Alta')).toBe(4)
    expect(getImportanceValue('Extrema')).toBe(5)
  })
})

describe('urgency categories', () => {
  it('groups urgency scores into little, medium and much categories', () => {
    expect(getUrgencyCategory(1)).toBe('Pouca')
    expect(getUrgencyCategory(2)).toBe('Pouca')
    expect(getUrgencyCategory(3)).toBe('Media')
    expect(getUrgencyCategory(4)).toBe('Media')
    expect(getUrgencyCategory(5)).toBe('Muita')
  })

  it('maps each category to a representative score', () => {
    expect(getUrgencyValue('Pouca')).toBe(2)
    expect(getUrgencyValue('Media')).toBe(4)
    expect(getUrgencyValue('Muita')).toBe(5)
  })
})

describe('getDueState', () => {
  const referenceDate = new Date(2026, 8, 17)

  it('classifica tarefas concluídas antes de avaliar a data', () => {
    expect(getDueState('16 set', 'Concluído', referenceDate)).toBe('completed')
  })

  it('identifica hoje, atrasadas, futuras e sem prazo', () => {
    expect(getDueState('Hoje', 'Pendente', referenceDate)).toBe('today')
    expect(getDueState('16 set', 'Pendente', referenceDate)).toBe('overdue')
    expect(getDueState('24 set', 'Pendente', referenceDate)).toBe('upcoming')
    expect(getDueState('Sem prazo', 'Pendente', referenceDate)).toBe('undated')
  })

  it('respeita o ano da data e valida datas ISO', () => {
    expect(getDueState('2027-09-16', 'Pendente', referenceDate)).toBe('upcoming')
    expect(getDueState('2025-09-16', 'Pendente', referenceDate)).toBe('overdue')
    expect(getDueState('2026-02-30', 'Pendente', referenceDate)).toBe('undated')
  })

  it('normaliza datas antigas com o ano de referência e exibe o ano', () => {
    expect(normalizeDueDate('24 set', referenceDate)).toBe('2026-09-24')
    expect(formatDueDate('2027-09-24', referenceDate)).toBe('24 set 2027')
  })
})

describe('Brazilian date formatting', () => {
  it('formats dates as dd/mm/yyyy for display and input', () => {
    expect(formatDateForDisplay('2026-09-14')).toBe('14/09/2026')
    expect(formatDateForInput('2026-09-14')).toBe('14/09/2026')
  })

  it('parses valid Brazilian dates and rejects impossible dates', () => {
    expect(parseBrazilianDate('14/09/2026')).toBe('2026-09-14')
    expect(parseBrazilianDate('31/02/2026')).toBeNull()
  })
})

describe('parseCsv', () => {
  it('handles quoted delimiters, escaped quotes and multiline fields', () => {
    expect(parseCsv('Tarefa;Anotações\r\n"Conferir; revisar";"Disse ""ok""\nequipe"')).toEqual([
      ['Tarefa', 'Anotações'],
      ['Conferir; revisar', 'Disse "ok"\nequipe'],
    ])
  })

  it('rejects unclosed quoted fields', () => {
    expect(() => parseCsv('Tarefa;Notas\n"Sem fechamento;valor')).toThrow('aspas sem fechamento')
  })
})

describe('resolveDueForStatus', () => {
  it('mantém prazo válido para tarefas ativas e marca concluídas corretamente', () => {
    expect(resolveDueForStatus('Concluído', '24 set')).toBe('Concluída')
    expect(resolveDueForStatus('Pendente', '24 set')).toBe('24 set')
    expect(resolveDueForStatus('Pendente', 'Concluída')).toBe('Sem prazo')
  })
})

describe('getPriorityBand', () => {
  it('classifica corretamente a faixa de prioridade', () => {
    expect(getPriorityBand(20)).toBe('critical')
    expect(getPriorityBand(12)).toBe('high')
    expect(getPriorityBand(9)).toBe('low')
  })
})

describe('getPriorityLabel', () => {
  it('atribui o nome correto da prioridade', () => {
    expect(getPriorityLabel(20)).toBe('Alta prioridade')
    expect(getPriorityLabel(12)).toBe('Média')
    expect(getPriorityLabel(9)).toBe('Baixa')
  })
})

describe('describeRequestError', () => {
  it('expõe uma mensagem útil para falha de rede e para erro do backend', () => {
    expect(describeRequestError(new Error('Failed to fetch'))).toBe('Não foi possível conectar ao servidor. Verifique a rede e tente novamente.')
    expect(describeRequestError(new Error('Request failed: 500'))).toBe('O servidor respondeu com erro. Tente novamente em instantes.')
  })
})
