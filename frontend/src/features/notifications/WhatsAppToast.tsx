import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifStore } from './useNotifications'
import styles from './WhatsAppToast.module.css'

const AUTO_DISMISS_MS = 7000

export function WhatsAppToast() {
  const { toasts, removeToast, markRead } = useNotifStore()
  const navigate = useNavigate()

  // Auto-dismiss después de 7 segundos
  useEffect(() => {
    if (!toasts.length) return
    const oldest = toasts[toasts.length - 1]
    const timer  = setTimeout(() => removeToast(oldest.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toasts, removeToast])

  if (!toasts.length) return null

  const handleClick = (toast: typeof toasts[0]) => {
    markRead(toast.id)
    removeToast(toast.id)
    if (toast.conversacion_id) {
      navigate(`/chat?conv=${toast.conversacion_id}`)
    }
  }

  return (
    <div className={styles.container}>
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[`toast_${i}`] ?? ''}`}
          style={{ bottom: `${16 + i * 90}px` }}
          onClick={() => handleClick(toast)}
        >
          <div className={styles.toastIcon}>💬</div>
          <div className={styles.toastBody}>
            <div className={styles.toastHeader}>
              <span className={styles.toastContact}>{toast.contacto}</span>
              <span className={styles.toastTime}>
                {new Date(toast.tiempo).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className={styles.toastMsg}>{toast.mensaje}</p>
            <span className={styles.toastCta}>Toca para ver la conversación →</span>
          </div>
          <button
            className={styles.toastClose}
            onClick={e => { e.stopPropagation(); removeToast(toast.id) }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
