import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConversaciones, useConversacion, useTomarControl, useCederControl } from '../../api/hooks'
import { apiClient } from '../../api/client'
import type { Conversacion, Mensaje } from '../../types/models'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import styles from './ChatPage.module.css'

const timeAgo = (d: string | null) =>
  d ? formatDistanceToNow(new Date(d), { addSuffix: true, locale: es }) : '—'

export default function ChatPage() {
  const [searchParams]  = useSearchParams()
  const [selected,      setSelected]      = useState<number | null>(
    searchParams.get('conv') ? Number(searchParams.get('conv')) : null
  )
  const [filtroEstado,  setFiltroEstado]  = useState('')
  const [filtroIA,      setFiltroIA]      = useState('')
  const [search,        setSearch]        = useState('')
  const [motivo,        setMotivo]        = useState('')
  const [texto,         setTexto]         = useState('')
  const [sending,       setSending]       = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: lista, refetch: refetchLista } = useConversaciones({
    estado:  filtroEstado || undefined,
    search:  search       || undefined,
  })
  const { data: conv, refetch: refetchConv } = useConversacion(selected ?? 0)
  const tomar  = useTomarControl()
  const ceder  = useCederControl()

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv])

  const convs = lista?.results ?? []
  const msgs: Mensaje[] = conv?.mensajes ?? []

  const enviarMensaje = async () => {
    if (!texto.trim() || !selected) return
    setSending(true)
    try {
      await apiClient.post(`/conversaciones/${selected}/enviar_mensaje/`, { texto })
      setTexto('')
      refetchConv()
      refetchLista()
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
  }

  return (
    <div className={styles.shell}>

      {/* ── Sidebar izquierdo ── */}
      <div className={styles.sidebar}>
        {/* Header + filtros */}
        <div className={styles.sideHeader}>
          <div className="section-label" style={{ marginBottom: 10 }}>
            <span className="line" />💬 WhatsApp Bot
          </div>
          {/* Búsqueda */}
          <input
            className={`input ${styles.searchInput}`}
            placeholder="Buscar número o nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Filtros en fila */}
          <div className={styles.filterRow}>
            <select
              className={`input ${styles.filterSel}`}
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todo estado</option>
              <option value="activa">Activas</option>
              <option value="escalada">Escaladas</option>
              <option value="pausada">Pausadas</option>
              <option value="cerrada">Cerradas</option>
            </select>
            <select
              className={`input ${styles.filterSel}`}
              value={filtroIA}
              onChange={e => setFiltroIA(e.target.value)}
            >
              <option value="">IA / Agente</option>
              <option value="true">🤖 Solo IA</option>
              <option value="false">👤 Agentes</option>
            </select>
          </div>
          <p className={styles.convCount}>{convs.length} conversaciones</p>
        </div>

        {/* Lista */}
        <div className={styles.list}>
          {convs
            .filter(c => filtroIA === '' || String(c.ia_activa) === filtroIA)
            .map((c: Conversacion) => (
              <button
                key={c.id}
                className={`${styles.convItem} ${selected === c.id ? styles.active : ''}`}
                onClick={() => setSelected(c.id)}
              >
                <div className={`${styles.convAvatar} ${!c.ia_activa ? styles.avatarAgent : ''}`}>
                  {c.wa_contact_phone.slice(-2)}
                </div>
                <div className={styles.convInfo}>
                  <div className={styles.convTop}>
                    <span className={styles.convPhone}>{c.wa_contact_phone}</span>
                    <span className={styles.convTime}>{timeAgo(c.ultimo_mensaje)}</span>
                  </div>
                  <div className={styles.convBottom}>
                    <span className={`${styles.convIA} ${c.ia_activa ? styles.iaOn : styles.iaOff}`}>
                      {c.ia_activa ? '🤖 IA' : '👤 Agente'}
                    </span>
                    <span className={styles.convEtapa}>{c.etapa_bot}</span>
                    <span className={`${styles.estadoDot} ${c.estado === 'escalada' ? styles.dotEscalada : c.estado === 'activa' ? styles.dotActiva : ''}`} />
                  </div>
                </div>
              </button>
            ))}
          {!convs.length && (
            <p className={styles.empty}>Sin conversaciones.</p>
          )}
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div className={styles.main}>
        {!selected ? (
          <div className={styles.placeholder}>
            <span style={{ fontSize: 48 }}>💬</span>
            <p>Selecciona una conversación</p>
            <p className="body-sm">Gestiona tus conversaciones de WhatsApp desde aquí</p>
          </div>
        ) : !conv ? (
          <div className={styles.placeholder}>Cargando…</div>
        ) : (
          <>
            {/* Header del chat */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={`${styles.chatAvatar} ${!conv.ia_activa ? styles.avatarAgent : ''}`}>
                  {conv.wa_contact_phone.slice(-2)}
                </div>
                <div>
                  <p className={styles.chatPhone}>{conv.wa_contact_phone}</p>
                  <p className={styles.chatMeta}>
                    Etapa: <b>{conv.etapa_bot}</b> · Estado: <b>{conv.estado}</b>
                  </p>
                </div>
              </div>
              <div className={styles.chatControls}>
                {conv.ia_activa ? (
                  <div className={styles.tomarForm}>
                    <input
                      className={`input ${styles.motivoInput}`}
                      placeholder="Motivo para tomar el chat…"
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 11, padding: '7px 14px', whiteSpace: 'nowrap' }}
                      onClick={() => { tomar.mutate({ id: conv.id, motivo }); setMotivo('') }}
                      disabled={tomar.isPending}
                    >
                      👤 Tomar control
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 11, padding: '7px 14px' }}
                    onClick={() => ceder.mutate(conv.id)}
                    disabled={ceder.isPending}
                  >
                    🤖 Ceder a IA
                  </button>
                )}
              </div>
            </div>

            {/* Área de mensajes */}
            <div className={styles.messages}>
              {msgs.length === 0 && (
                <p className={styles.noMessages}>Sin mensajes aún.</p>
              )}
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.bubble} ${m.direccion === 'saliente' ? styles.out : styles.in}`}
                >
                  {m.generado_por_ia && m.direccion === 'saliente' && (
                    <span className={styles.iaTag}>🤖 IA</span>
                  )}
                  <p className={styles.bubbleText}>{m.contenido}</p>
                  <span className={styles.bubbleTime}>
                    {new Date(m.enviado_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Box de escritura */}
            <div className={styles.composer}>
              {conv.ia_activa && (
                <div className={styles.iaWarning}>
                  ⚠️ La IA está activa. Tu mensaje se enviará igualmente, pero la IA puede sobrescribir.
                  <button className="btn btn-ghost" style={{ fontSize: 10, padding: '3px 8px', marginLeft: 8 }}
                    onClick={() => tomar.mutate({ id: conv.id, motivo: 'Envío manual de mensaje' })}>
                    Tomar control primero
                  </button>
                </div>
              )}
              <div className={styles.composerRow}>
                <textarea
                  className={styles.composerInput}
                  placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para salto de línea)"
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={sending}
                />
                <button
                  className={`btn btn-primary ${styles.sendBtn}`}
                  onClick={enviarMensaje}
                  disabled={!texto.trim() || sending}
                >
                  {sending ? '…' : '➤'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
