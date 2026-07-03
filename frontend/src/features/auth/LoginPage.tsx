import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { apiClient } from '../../api/client'
import { useAuthStore } from './authStore'
import styles from './LoginPage.module.css'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser  = useAuthStore((s) => s.setUser)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const { data: tokens } = await apiClient.post('/auth/login/', data)
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)

      // /auth/me/ devuelve user + permisos del rol
      const { data: me } = await apiClient.get('/auth/me/')
      setUser(me)
      navigate('/')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Panel izquierdo — marca */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.brandLabel}>
            <span className={styles.brandLine} />
            Proptech · IA · Colombia
          </div>
          <h1 className={styles.brandTitle}>
            HAB<br />
            <span className={styles.brandAccent}>Platform</span>
          </h1>
          <p className={styles.brandSub}>
            Transforma la adquisición de suelo urbano<br />usando inteligencia artificial
          </p>
          <div className={styles.stats}>
            {[
              { n: '100+', l: 'Predios analizados' },
              { n: '5x',   l: 'Más rápido que manual' },
              { n: '70%',  l: 'Reducción en tiempo' },
            ].map(({ n, l }) => (
              <div key={n} className={styles.stat}>
                <span className={styles.statN}>{n}</span>
                <span className={styles.statL}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Watermark */}
        <span className={styles.watermark}>HAB</span>
      </div>

      {/* Panel derecho — formulario */}
      <div className={styles.form}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <span className={styles.formLogoMark}>HAB</span>
            <h2 className={styles.formTitle}>Iniciar sesión</h2>
            <p className={styles.formSub}>Accede a tu panel de gestión inmobiliaria</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.formBody}>
            <div className={styles.field}>
              <label className={styles.label}>Usuario</label>
              <input
                className={`input ${errors.username ? styles.inputError : ''}`}
                placeholder="tu_usuario"
                {...register('username', { required: 'Campo requerido' })}
              />
              {errors.username && <span className={styles.fieldErr}>{errors.username.message}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <input
                className={`input ${errors.password ? styles.inputError : ''}`}
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Campo requerido' })}
              />
              {errors.password && <span className={styles.fieldErr}>{errors.password.message}</span>}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>
          </form>

          <p className={styles.formFooter}>
            HAB · Desarrolladores inmobiliarios · Bogotá
          </p>
        </div>
      </div>
    </div>
  )
}
