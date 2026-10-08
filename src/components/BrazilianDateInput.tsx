import { useEffect, useState } from 'react'
import { formatDateForDisplay, formatDateForInput, parseBrazilianDate } from '../taskUtils'

type BrazilianDateInputProps = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

const maskDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function BrazilianDateInput({ value, onChange, readOnly = false }: BrazilianDateInputProps) {
  const [inputValue, setInputValue] = useState(() => formatDateForInput(value))

  useEffect(() => {
    setInputValue(formatDateForInput(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      aria-label="Prazo (dd/mm/aaaa)"
      maxLength={10}
      value={readOnly ? formatDateForDisplay(value) : inputValue}
      readOnly={readOnly}
      onChange={(event) => {
        const maskedValue = maskDate(event.target.value)
        setInputValue(maskedValue)
        const parsedDate = parseBrazilianDate(maskedValue)
        if (parsedDate) onChange(parsedDate)
      }}
      onBlur={() => {
        if (!inputValue) onChange('Sem prazo')
        else if (!parseBrazilianDate(inputValue)) setInputValue(formatDateForInput(value))
      }}
    />
  )
}
