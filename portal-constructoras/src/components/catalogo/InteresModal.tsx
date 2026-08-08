'use client'

import { useState } from 'react'
import { useExpresarInteres } from '@/hooks/useProyectos'

interface InteresModalProps {
  proyectoId: number
  barrio: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InteresModal({
  proyectoId,
  barrio,
  open,
  onClose,
  onSuccess,
}: InteresModalProps) {
  const [nota, setNota] = useState('')
  const [done, setDone] = useState(false)
  const mutation = useExpresarInteres()

  if (!open) return null

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync({ id: proyectoId, nota })
      setDone(true)
      onSuccess?.()
    } catch {
      // error shown below
    }
  }

  const handleClose = () => {
    setNota('')
    setDone(false)
    mutation.reset()
    onClose()
  }

  return (
    <div className="interes-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="interes-title">
      <div className="interes-modal">
        {done ? (
          <>
            <h2 id="interes-title">Interés registrado</h2>
            <p>
              Registramos tu interés en el proyecto de <strong>{barrio}</strong>. El equipo HAB
              te contactará para avanzar.
            </p>
            <div className="interes-modal__actions">
              <button type="button" className="btn-primary" onClick={handleClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="interes-title">¿Te interesa este proyecto?</h2>
            <p>
              Confirma tu interés en el proyecto de <strong>{barrio}</strong>. HAB mediará el
              contacto con el propietario.
            </p>
            <label className="form-field">
              <span>Nota opcional</span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Comentarios para el equipo HAB…"
              />
            </label>
            {mutation.isError && (
              <p className="form-error" role="alert">
                No se pudo registrar el interés. Verifica tu sesión e intenta de nuevo.
              </p>
            )}
            <div className="interes-modal__actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirm}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Enviando…' : 'Confirmar interés'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
