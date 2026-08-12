import { Component, ReactNode, ErrorInfo } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[Soulmon] Render error:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      // A tela de erro é a única superfície que pode aparecer antes de o app
      // montar, então lê o idioma direto do localStorage.
      const isPt = (() => {
        try { return (localStorage.getItem('digiapp-language') ?? 'pt-BR') === 'pt-BR'; }
        catch { return true; }
      })();
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', padding: '24px',
          fontFamily: 'monospace', textAlign: 'center', background: '#0c1c1a', color: '#2dd4bf'
        }}>
          <img src={ravenMascot} alt="" width={72} height={72} style={{ marginBottom: '16px', objectFit: 'contain' }} />
          <h2 style={{ margin: '0 0 8px' }}>{isPt ? 'Algo deu errado' : 'Something went wrong'}</h2>
          <p style={{ margin: '0 0 24px', color: '#8fb0a8', fontSize: '14px' }}>
            {isPt ? 'O Soulmon encontrou um erro inesperado.' : 'Soulmon hit an unexpected error.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#2dd4bf', color: '#0c1c1a', border: 'none',
              padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'monospace', fontWeight: 'bold'
            }}
          >
            {isPt ? 'Recarregar' : 'Reload'}
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
