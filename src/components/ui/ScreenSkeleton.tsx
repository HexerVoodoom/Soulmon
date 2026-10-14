import { LoadingBar } from './LoadingBar';
import type { Language } from '../../utils/i18n';

/**
 * `ScreenSkeleton` — o que aparece enquanto uma tela `lazy()` chega.
 *
 * Desde 14/10/2026 (REGISTRO §50) o estado `loading` é a `LoadingBar` (barra fina turquesa que
 * enche, sem texto/spinner/ilustração); este componente só cuida do ENQUADRAMENTO (página,
 * overlay, inline — altura fixa, sem salto) e do estado `error` (frase curta + "Tentar de novo").
 * `done` não desenha nada. Layout em `style={{}}` (a folha do projeto é pré-compilada: classe
 * utilitária de valor arbitrário não aplica nada); texto PT-BR + EN, sempre os dois.
 */

export interface ScreenSkeletonProps {
  language?: Language;
  /** Rótulo do que está carregando (par PT/EN já resolvido por quem chama). */
  label?: string;
  /**
   * `'page'` ocupa a área de conteúdo (padrão). `'overlay'` cobre a tela
   * inteira com um véu — é o certo para modal, que abre por cima de algo.
   */
  variant?: 'page' | 'overlay' | 'inline';
  /** `loading` (padrão) · `error` (falhou, com a saída) · `done` (concluído: nada a mostrar). */
  state?: 'loading' | 'error' | 'done';
  /** No `error`: o gesto que tenta de novo. Sem ele a frase de erro fica sem botão. */
  onRetry?: () => void;
}

/** O "Tentar de novo": botão discreto com os tokens do app (sem importar o FormKit para o chunk de entrada). */
const RETRY_STYLE: React.CSSProperties = {
  minHeight: 44, padding: '0 16px', boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-md)',
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500, cursor: 'pointer',
  background: 'transparent', color: 'var(--sm2-ink)', border: '1px solid var(--sm2-line)',
};

export function ScreenSkeleton({ language = 'en-US', label, variant = 'page', state = 'loading', onRetry }: ScreenSkeletonProps) {
  const pt = language === 'pt-BR';
  if (state === 'done') return null;

  const outer: React.CSSProperties =
    variant === 'overlay'
      ? {
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'color-mix(in srgb, var(--sm2-bg) 82%, transparent)',
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          minHeight: variant === 'inline' ? 72 : 96,
          padding: variant === 'inline' ? 16 : 24,
          width: '100%',
        };

  if (state === 'error') {
    return (
      <div style={outer} role="alert" data-skel-error>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-ink)' }}>
            {pt ? 'Não deu para abrir agora.' : "Couldn't open this right now."}
          </span>
          {onRetry && (
            <button type="button" data-skel-retry onClick={onRetry} style={RETRY_STYLE}>
              {pt ? 'Tentar de novo' : 'Try again'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={outer} aria-busy="true" data-skel>
      <LoadingBar language={language} label={label} />
    </div>
  );
}

export default ScreenSkeleton;
