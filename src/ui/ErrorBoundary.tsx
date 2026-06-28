import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches render-time crashes (e.g. a shader/WebGL failure) and shows a friendly
 * fallback with the message + a reload, instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] render error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="app-fallback">
        <h1>Something went wrong</h1>
        <p>The planet renderer hit an error. Reloading usually fixes it.</p>
        <pre>{error.message}</pre>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }
}
