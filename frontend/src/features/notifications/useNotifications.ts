import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import { apiClient } from '../../api/client'
import type { Conversacion } from '../../types/models'

// ── Tipos ─────────────────────────────────────────────────
export interface Notification {
  id:             string
  type:           'whatsapp' | 'sistema'
  conversacion_id?: number
  contacto:       string
  mensaje:        string
  tiempo:         Date
  leida:          boolean
}

// ── Store de notificaciones ────────────────────────────────
interface NotifState {
  notifications:  Notification[]
  toasts:         Notification[]    // Las que se muestran como popup flotante
  addNotification: (n: Notification) => void
  markRead:       (id: string) => void
  markAllRead:    () => void
  removeToast:    (id: string) => void
  unreadCount:    () => number
}

export const useNotifStore = create<NotifState>((set, get) => ({
  notifications: [],
  toasts: [],

  addNotification: (n) => set(s => ({
    notifications: [n, ...s.notifications].slice(0, 50), // máx 50
    toasts:        [n, ...s.toasts].slice(0, 3),          // máx 3 toasts a la vez
  })),

  markRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, leida: true } : n),
  })),

  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, leida: true })),
  })),

  removeToast: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id),
  })),

  unreadCount: () => get().notifications.filter(n => !n.leida).length,
}))

// ── Hook principal ─────────────────────────────────────────
export function useNotifications() {
  const { addNotification } = useNotifStore()

  // Guarda el último mensaje visto por conversación en sessionStorage
  const setLastSeen = useCallback((convId: number, timestamp: string) => {
    sessionStorage.setItem(`notif_seen_${convId}`, timestamp)
  }, [])

  // Polling cada 12 segundos
  const { data } = useQuery({
    queryKey: ['conversaciones', 'polling'],
    queryFn: () =>
      apiClient
        .get('/conversaciones/?estado=activa&ordering=-ultimo_mensaje&page_size=20')
        .then(r => r.data as { results: Conversacion[] }),
    refetchInterval: 12_000,
    staleTime: 0,
  })

  const prevTimestamps = useRef<Map<number, string>>(new Map())
  const initialized    = useRef(false)

  useEffect(() => {
    if (!data?.results) return
    const convs = data.results

    // Primera carga: solo guarda timestamps, no muestra notificaciones
    if (!initialized.current) {
      convs.forEach(c => {
        if (c.ultimo_mensaje) {
          prevTimestamps.current.set(c.id, c.ultimo_mensaje)
          setLastSeen(c.id, c.ultimo_mensaje)
        }
      })
      initialized.current = true
      return
    }

    // Comparar con los anteriores para detectar mensajes nuevos
    convs.forEach(c => {
      if (!c.ultimo_mensaje) return
      const prev = prevTimestamps.current.get(c.id) ?? ''
      if (c.ultimo_mensaje > prev) {
        // Hay un mensaje nuevo en esta conversación
        const contacto  = c.propietario_nombre ?? c.wa_contact_phone
        const shortMsg  = '💬 Nuevo mensaje de WhatsApp'

        const notif: Notification = {
          id:              `wa_${c.id}_${Date.now()}`,
          type:            'whatsapp',
          conversacion_id: c.id,
          contacto,
          mensaje:         shortMsg,
          tiempo:          new Date(c.ultimo_mensaje),
          leida:           false,
        }
        addNotification(notif)
        prevTimestamps.current.set(c.id, c.ultimo_mensaje)
        setLastSeen(c.id, c.ultimo_mensaje)
      }
    })
  }, [data, addNotification, setLastSeen])
}
