import { useEffect, useState } from 'react';
import { Viewport } from './Viewport';
import { sm2Button } from '../form/FormKit';
import type { Language } from '../../utils/i18n';

/**
 * `ScreenSkeleton` — o que aparece enquanto uma tela `lazy()` chega.
 *
 * Antes eram **20 `Suspense fallback={null}`** (19 no `App.tsx` + 1 no
 * `ContentModals.tsx`): num 3G ou num cold start de APK, tocar em qualquer
 * item da navegação apagava a tela por meio segundo. Nulo não é "sem
 * distração", é o momento exato em que o app parece quebrado.
 *
 * O desenho é o do APARELHO, não um spinner genérico: o `Viewport` (a peça
 * de marca) com uma **varredura** correndo por dentro, como um visor que
 * ainda está sintonizando, e a palavra do sistema em Silkscreen — que é
 * justamente o único lugar onde a bitmap é permitida (dentro do visor,
 * ≥14px, caixa alta).
 *
 * Regras respeitadas aqui:
 *  · nenhum token fora dos `--sm2-*` (o visor já é escuro nos dois temas,
 *    então a tinta interna é `--sm2-viewport-ink`);
 *  · nenhuma classe utilitária de valor arbitrário — a folha do projeto é
 *    pré-compilada e classe ausente não aplica NADA (footgun 1). O que é
 *    layout vai em `style={{}}`; o que é `@keyframes` vai no `<style>` local
 *    abaixo, porque `index.css` tem outro dono;
 *  · `prefers-reduced-motion` corta a varredura em JS, não só no `@media`:
 *    o bloco global do projeto usa `animation-duration: .01ms` em `*`, o que
 *    num loop `infinite` vira milhares de recálculos por segundo;
 *  · texto EN + PT-BR, sempre os dois.
 *
 * BETA-2 (9.4, 13/10/2026) — MINIMALISTA: uma só palavra (a legenda "Carregando…" repetida saiu), o visor sem o "respirar"
 * (o único movimento é o segmento que alterna por cor, em `steps()`, e some com movimento reduzido), altura menor
 * (`page` 96, não 220) e a variante `inline` (dentro de uma folha já aberta). Três ESTADOS: `loading` (o padrão),
 * `error` (frase curta + "Tentar de novo" quando há `onRetry`) e `done` (não desenha nada — o conteúdo chegou).
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

/** Mesma checagem do `Viewport`: reduced-motion desliga o loop de verdade. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Keyframes locais. Não existe geração de classe neste projeto (Tailwind
 * pré-compilado) e `index.css` é de outro dono nesta onda, então a animação
 * viaja junto do componente. Nome prefixado para não colidir.
 */
/* O pulso do segmento (canvas `HomeCarregando`): um bloco `primary-fill`
   24×12 dentro do vidro alternando — `steps()`, movimento reduzido desliga.
   Alterna por COR (fill ↔ primary-deep), nunca por opacidade (canvas
   Conta D-K10: o gerador reprova `opacity < 1`). */
/** O "Tentar de novo": botão discreto com os tokens do app (sem importar o FormKit para o chunk de entrada). */
const RETRY_STYLE: React.CSSProperties = {
  minHeight: 44, padding: '0 16px', boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-md)',
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500, cursor: 'pointer',
  background: 'transparent', color: 'var(--sm2-ink)', border: '1px solid var(--sm2-line)',
};

const PULSE_CSS = `
@keyframes sm2-skel-pulse {
  0%, 49%  { background-color: var(--sm2-primary-fill); }
  50%, 100%{ background-color: var(--sm2-primary-deep); }
}
@media (prefers-reduced-motion: reduce) {
  .sm2-skel-pulse { animation: none !important; }
}
`;

export function ScreenSkeleton({ language = 'en-US', label, variant = 'page', state = 'loading', onRetry }: ScreenSkeletonProps) {
  const reduced = usePrefersReducedMotion();
  const pt = language === 'pt-BR';
  const text = label ?? (pt ? 'Carregando' : 'Loading');
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
    <div
      style={outer}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <style>{PULSE_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* Vidro 56×40 (28×20 lógicos a 2×) com UM segmento ciano pulsando —
            canvas Home, `HomeCarregando` (HOME-04/46). Silkscreen NÃO sai do
            vidro: a palavra fica FORA, em Rubik 12/500 caixa alta (achado 8).
            O contêiner é `role="status" aria-live="polite"` com `aria-label`
            em PT/EN (X6) — é o único anúncio do esqueleto para leitor de tela. */}
        <Viewport
          width={28}
          height={20}
          scale={2}
          breathing={false}
          screenStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span
            aria-hidden="true"
            className={reduced ? undefined : 'sm2-skel-pulse'}
            data-skel-seg
            style={{
              display: 'block',
              width: 24,
              height: 12,
              background: 'var(--sm2-primary-fill)',
              animation: reduced ? undefined : 'sm2-skel-pulse 1.2s steps(1, end) infinite',
            }}
          />
        </Viewport>
        <span
          data-skel-word
          style={{
            fontFamily: 'var(--sm2-font-text)',
            fontSize: 'var(--sm2-text-xs)',
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            color: 'var(--sm2-ink)',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

export default ScreenSkeleton;
