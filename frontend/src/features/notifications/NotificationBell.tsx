import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifStore, useNotifications } from './useNotifications'
import styles from './NotificationBell.module.css'

function timeAgo(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)  return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function NotificationBell() {
  // Activa el polling de notificaciones
  useNotifications()

  const { notifications, markRead, markAllRead, removeToast, unreadCount } = useNotifStore()
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)
  const navigate          = useNavigate()
  const count             = unreadCount()

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = (notif: typeof notifications[0]) => {
    markRead(notif.id)
    // También quitar el toast si existe
    removeToast(notif.id)
    setOpen(false)
    if (notif.type === 'whatsapp' && notif.conversacion_id) {
      navigate(`/chat?conv=${notif.conversacion_id}`)
    }
  }

  return (
    <div className={styles.wrap} ref={ref}>
      {/* Campana */}
      <button
        className={`${styles.bell} ${count > 0 ? styles.bellActive : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notificaciones"
      >
        <span className={styles.bellIcon}>
          {/* SVG campana */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </span>
        {count > 0 && (
          <span className={styles.badge}>{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <span className={styles.dropTitle}>Notificaciones</span>
            {count > 0 && (
              <button className={styles.markAll} onClick={markAllRead}>
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className={styles.list}>
            {!notifications.length && (
              <div className={styles.empty}>
                <span style={{ fontSize: 32 }}>🔔</span>
                <p>Sin notificaciones</p>
              </div>
            )}

            {notifications.map(n => (
              <button
                key={n.id}
                className={`${styles.item} ${!n.leida ? styles.unread : ''}`}
                onClick={() => handleNotifClick(n)}
              >
                <div className={`${styles.itemIcon} ${n.type === 'whatsapp' ? styles.iconWa : styles.iconSys}`}>
                  {n.type === 'whatsapp' ? '💬' : '🔔'}
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemContact}>{n.contacto}</span>
                    <span className={styles.itemTime}>{timeAgo(n.tiempo)}</span>
                  </div>
                  <p className={styles.itemMsg}>{n.mensaje}</p>
                </div>
                {!n.leida && <span className={styles.dot} />}
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className={styles.dropFooter}>
              <button
                className={styles.verTodo}
                onClick={() => { setOpen(false); navigate('/chat') }}
              >
                Ver todas las conversaciones →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
