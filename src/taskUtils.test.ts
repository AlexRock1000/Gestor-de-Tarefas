import { describe, expect, it } from 'vitest'
import { computeScore, getDueState } from './taskUtils'

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
