import { useState, useEffect } from 'react'
import { useConfigIA, useUpdateConfigIA, type ConfigIA } from '../../api/hooks'
import styles from './ConfigPage.module.css'

export default function IAConfigPage() {
  const { data: cfg, isLoading } = useConfigIA()
  const update = useUpdateConfigIA()
  const [form, setForm] = useState<Partial<ConfigIA>>({})

  useEffect(() => { if (cfg) setForm(cfg) }, [cfg])

  const set = (k: keyof ConfigIA, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const save = () => update.mutate(form)

  if (isLoading) return <p className={styles.loading}>Cargando…</p>

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className="section-label"><span className="line" />⚙️ Configuración</div>
          <h1 className="h-med">Configuración IA</h1>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Guardando…' : '💾 Guardar cambios'}
        </button>
      </div>
      {update.isSuccess && <p className={styles.saved}>✅ Configuración guardada</p>}

      <div className={styles.sections}>
        {/* Modelos */}
        <div className="card">
          <h3 className={styles.secTitle}>🤖 Modelos OpenAI</h3>
          <div className={styles.fields}>
            {([
              ['modelo_estructuracion', 'Modelo estructuración'],
              ['modelo_bot_whatsapp',   'Modelo bot WhatsApp'],
              ['modelo_scoring',        'Modelo scoring'],
            ] as const).map(([k, l]) => (
              <div key={k} className={styles.field}>
                <label className={styles.fl}>{l}</label>
                <select
                  className="input"
                  value={String(form[k] ?? '')}
                  onChange={e => set(k, e.target.value)}
                >
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Temperatura */}
        <div className="card">
          <h3 className={styles.secTitle}>🌡️ Temperaturas</h3>
          <div className={styles.fields}>
            {([
              ['temperatura_bot',            'Temperatura bot (0–1)'],
              ['temperatura_estructuracion', 'Temperatura estructuración (0–1)'],
            ] as const).map(([k, l]) => (
              <div key={k} className={styles.field}>
                <label className={styles.fl}>{l}</label>
                <input
                  className="input"
                  type="number"
                  min="0" max="1" step="0.05"
                  value={String(form[k] ?? '')}
                  onChange={e => set(k, e.target.value)}
                  style={{ width: 100 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tokens */}
        <div className="card">
          <h3 className={styles.secTitle}>📏 Límites de tokens</h3>
          <div className={styles.fields}>
            {([
              ['max_tokens_respuesta_bot',  'Max tokens bot'],
              ['max_tokens_estructuracion', 'Max tokens estructuración'],
            ] as const).map(([k, l]) => (
              <div key={k} className={styles.field}>
                <label className={styles.fl}>{l}</label>
                <input
                  className="input"
                  type="number"
                  value={String(form[k] ?? '')}
                  onChange={e => set(k, parseInt(e.target.value, 10))}
                  style={{ width: 120 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bot */}
        <div className="card">
          <h3 className={styles.secTitle}>💬 Comportamiento del bot</h3>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label className={styles.fl}>IA bot activa globalmente</label>
              <select
                className="input"
                value={form.ia_bot_activa_global ? 'true' : 'false'}
                onChange={e => set('ia_bot_activa_global', e.target.value === 'true')}
              >
                <option value="true">✅ Activa</option>
                <option value="false">❌ Desactivada</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fl}>Escalar tras N mensajes</label>
              <input
                className="input"
                type="number"
                value={String(form.escalar_tras_n_mensajes ?? '')}
                onChange={e => set('escalar_tras_n_mensajes', parseInt(e.target.value, 10))}
                style={{ width: 100 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
