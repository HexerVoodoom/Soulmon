import { Component, ReactNode, ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[DigiApp] Render error:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: '24px',
          fontFamily: 'monospace', textAlign: 'center', background: '#1a1a2e', color: '#2BFF95'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🦖</div>
          <h2 style={{ margin: '0 0 8px' }}>Algo deu errado</h2>
          <p style={{ margin: '0 0 24px', color: '#aaa', fontSize: '14px' }}>
            O DigiApp encontrou um erro inesperado.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#2BFF95', color: '#000', border: 'none',
              padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: 'bold'
            }}
          >
            Recarregar
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: '24px', padding: '12px', background: '#111',
              borderRadius: '8px', fontSize: '11px', color: '#f87171',
              maxWidth: '100%', overflow: 'auto', textAlign: 'left'
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
