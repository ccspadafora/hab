import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40, fontFamily: 'monospace', background: '#1A1A1A',
          color: '#E07070', minHeight: '100vh',
        }}>
          <h2 style={{ color: '#C9B84C', marginBottom: 16 }}>⚠️ Error de renderizado</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            style={{ marginTop: 20, padding: '8px 20px', background: '#2B4D2E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
