import { describe, expect, it } from 'vitest'
import { computeScore, getDueState, getPriorityBand, getPriorityLabel, resolveDueForStatus } from './taskUtils'

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
