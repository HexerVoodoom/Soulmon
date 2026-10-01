import { Component, ReactNode, ErrorInfo } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readLocal } from '../utils/safeStorage';
import { Viewport } from './ui/Viewport';
import { sm2Button } from './form/FormKit';
import { FeedbackLink } from './FeedbackLink';

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
      const isPt = (readLocal(STORAGE_KEYS.LANGUAGE) ?? 'pt-BR') === 'pt-BR';
      // O `saveId` também vem direto do storage, pelo mesmo motivo. Vai só um
      // trecho no e-mail (`FeedbackLink.tsx`).
      const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
      /* Canvas Home, `HomeErro` (HOME-47) / D-H7 / D-H9 / X7: mascote em
         pixel DENTRO de um vidro 96², título Cinzel 20, corpo Rubik 14
         `muted`, e UM `primary` "Reload" — a única ação. Sem `danger`, sem
         hex cru: tudo por token, e os tokens respondem ao tema que o `<html>`
         já carrega (o `:root` cobre o caso de a tela cair antes do script). */
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: 24, gap: 12,
          textAlign: 'center', background: 'var(--sm2-bg)', color: 'var(--sm2-ink)',
          fontFamily: 'var(--sm2-font-text)',
        }}>
          <Viewport width={32} height={32} scale={3} breathing={false} screenStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={ravenMascot} alt="" width={72} height={72} style={{ objectFit: 'contain', display: 'block' }} />
          </Viewport>
          <h1 style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg)', fontWeight: 600, lineHeight: 1.2, color: 'var(--sm2-ink)' }}>
            {isPt ? 'Algo deu errado' : 'Something went wrong'}
          </h1>
          <p style={{ margin: 0, fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-muted)', maxWidth: 320 }}>
            {isPt ? 'O Soulmon encontrou um erro inesperado.' : 'Soulmon hit an unexpected error.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ ...sm2Button('primary'), marginTop: 12, minWidth: 160 }}
          >
            {isPt ? 'Recarregar' : 'Reload'}
          </button>
          {/* O canal de feedback ONDE o erro acontece (QA geral 21/09/2026,
              item 4): um link de texto abaixo do único botão, para que a
              pessoa possa contar o que viu sem ter que voltar a Configurações
              — que talvez nem abra. Vai a mensagem do erro, nunca o stack. */}
          <FeedbackLink
            language={isPt ? 'pt-BR' : 'en-US'}
            saveId={saveId}
            errorMessage={this.state.error?.message ?? null}
          />
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: 24, padding: 12, background: 'var(--sm2-surface-2)',
              borderRadius: 'var(--sm2-radius-md)', fontSize: 'var(--sm2-text-xs)', color: 'var(--sm2-danger-ink)',
              fontFamily: 'var(--sm2-font-mono)',
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
