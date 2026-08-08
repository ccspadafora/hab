'use client'

import { useRef } from 'react'

interface OTPInputProps {
  length: number
  value: string
  onChange: (value: string) => void
  error?: string
}

export function OTPInput({ length, value, onChange, error }: OTPInputProps) {
  const inputs = useRef<HTMLInputElement[]>([])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return
    const chars = value.padEnd(length, ' ').split('')
    chars[index] = digit || ' '
    onChange(chars.join('').replace(/ /g, '').slice(0, length))
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) onChange(pasted)
  }

  return (
    <div className="otp-input" role="group" aria-label="Código de verificación">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            if (el) inputs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`otp-input__box ${error ? 'otp-input__box--error' : ''}`}
          aria-label={`Dígito ${i + 1} de ${length}`}
          aria-invalid={!!error}
        />
      ))}
      {error && (
        <p className="otp-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
