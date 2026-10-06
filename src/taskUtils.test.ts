import { describe, expect, it } from 'vitest'
import {
  computeScore,
  describeRequestError,
  formatDueDate,
  getDueState,
  getPriorityBand,
  getPriorityLabel,
  normalizeDueDate,
  parseCsv,
  resolveDueForStatus,
} from './taskUtils'

describe('computeScore', () => {
  it('multiplica gravidade, urgência e tendência', () => {
    expect(computeScore(5, 4, 5)).toBe(100)
    expect(computeScore(3, 3, 3)).toBe(27)
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
  it('classifica corretamente a faixa de prioridade do score GUT', () => {
    expect(getPriorityBand(100)).toBe('critical')
    expect(getPriorityBand(70)).toBe('high')
    expect(getPriorityBand(30)).toBe('low')
  })
})

describe('getPriorityLabel', () => {
  it('atribui o nome correto da prioridade', () => {
    expect(getPriorityLabel(100)).toBe('Alta prioridade')
    expect(getPriorityLabel(70)).toBe('Média')
    expect(getPriorityLabel(30)).toBe('Baixa')
  })
})

describe('describeRequestError', () => {
  it('expõe uma mensagem útil para falha de rede e para erro do backend', () => {
    expect(describeRequestError(new Error('Failed to fetch'))).toBe('Não foi possível conectar ao servidor. Verifique a rede e tente novamente.')
    expect(describeRequestError(new Error('Request failed: 500'))).toBe('O servidor respondeu com erro. Tente novamente em instantes.')
  })
})
