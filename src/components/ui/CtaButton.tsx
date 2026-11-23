import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { usePrefersReducedMotion } from './Viewport';

/**
 * Botão principal do jogo (CTA, 12/11/2026, pedido do dono): miolo turquesa escuro em moldura de canos de cobre com cipó nas pontas
 * (o MESMO botão do site do beta, `site-beta/public/dono/botao*.webp` → `assets/soulmon/ui/btn-cta*.webp`, um arquivo por estado), esticável sem distorcer (9-slice por `border-image`). Dono único do visual:
 * o CSS é `.sm2-cta` em `index.css` (estados hover/pressed/disabled com a arte de cada estado, foco visível, alvo >= 44, movimento reduzido); aqui só a casca.
 * Tamanho do texto vem do token (`--sm2-text-*`), nunca de número. Use nos CTAs PRINCIPAIS; ações secundárias seguem `sm2-kit-btn`.
 * Ao lado de outro botão: EMPILHAR (CTA em cima, largura total; a outra opção embaixo) e a outra opção é SEMPRE `CtaTextButton` (só texto:
 * sem fundo, sem borda; pedido do dono 13/11/2026). Se a ação secundária é importante demais para ser só texto, a tela NÃO usa `CtaButton`
 * (volta ao par padrão `sm2-kit-btn`). Modais e popups brancos pequenos também não usam `CtaButton` (§316c). Ver `docs/manual/06-REFERENCIA/components.md`.
 */
export interface CtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `full` ocupa a linha inteira (padrão); `auto` só o conteúdo (com largura mínima). */
  width?: 'full' | 'auto';
  /**
   * `acao` (13/11/2026, pedido do dono): a ação que a pessoa VEIO buscar (abrir a árvore, criar poção, começar a jornada) já nasce com a
   * arte cheia (a de hover), porque no celular não existe hover. `padrao` fica para confirmar, seguir, entrar e qualquer escolha/opção.
   * Pressionado e desabilitado mantêm a arte própria nos dois tons.
   */
  tone?: 'padrao' | 'acao';
  /**
   * PREENCHER AO TOCAR (16/11/2026, retrospectiva semanal): um toque normal (clique, toque, Enter ou Espaço) dispara um preenchimento
   * turquesa com brilho que corre da esquerda para a direita em `fillMs`; ao completar chama `onFillComplete`. Toques repetidos durante o
   * preenchimento são ignorados (a ação dispara uma vez só). Com `prefers-reduced-motion` não há animação: chama `onFillComplete` direto.
   * `onClick` (se vier) roda no primeiro toque. Visual em `.sm2-cta-fill` (`index.css`).
   */
  fillMs?: number;
  onFillComplete?: () => void;
}

/** Pausa no estado cheio antes de `onFillComplete`. */
export const FILL_REST_MS = 180;

/** Preenchimento ao toque (uso que FECHA/navega: depois de completar o botão fica cheio e travado de propósito): estado "preenchendo" + temporizador; trava toques repetidos. */
function useFill(ms: number | undefined, onComplete: (() => void) | undefined) {
  const reduced = usePrefersReducedMotion();
  const [filling, setFilling] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const active = useRef(false);
  const cb = useRef(onComplete);
  cb.current = onComplete;
  const start = useCallback(() => {
    if (!ms || active.current) return false;
    active.current = true;
    if (reduced) { cb.current?.(); return true; }
    setFilling(true);
    // segura um respiro no estado cheio antes de agir, para o fechamento não ser seco
    timer.current = window.setTimeout(() => { cb.current?.(); }, ms + FILL_REST_MS);
    return true;
  }, [ms, reduced]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { filling, start };
}

/** `ref` chega no `<button>` (devolver o foco ao fechar um diálogo aberto por ele). */
export const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(function CtaButton({ width = 'full', tone = 'padrao', fillMs, onFillComplete, className, type = 'button', children, onClick, style, ...rest }, ref) {
  const fill = useFill(fillMs, onFillComplete);
  if (!fillMs) {
    return (
      <button ref={ref} type={type} data-cta-button data-cta-width={width} data-cta-tone={tone} className={`sm2-cta${className ? ` ${className}` : ''}`} style={style} onClick={onClick} {...rest}>
        <span className="sm2-cta-label">{children}</span>
      </button>
    );
  }
  return (
    <button
      ref={ref} type={type} data-cta-button data-cta-width={width} data-cta-tone={tone} data-cta-fill data-cta-filling={fill.filling ? 'true' : undefined}
      className={`sm2-cta${className ? ` ${className}` : ''}`} style={{ ...style, ['--sm2-fill-ms' as string]: `${fillMs}ms` }}
      aria-busy={fill.filling || undefined}
      onClick={e => { if (fill.start()) onClick?.(e); }}
      {...rest}
    >
      <span className="sm2-cta-fill" aria-hidden="true" />
      <span className="sm2-cta-label">{children}</span>
    </button>
  );
});

export interface CtaTextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `full` ocupa a linha inteira (o alvo, não o sublinhado); `auto` (padrão) só o conteúdo. */
  width?: 'full' | 'auto';
  /** Fundo onde o botão mora: `claro` (padrão, texto `--sm2-muted`) ou `escuro` (sala de descanso: texto claro). */
  surface?: 'claro' | 'escuro';
}

/**
 * A ação SECUNDÁRIA ao lado de um `CtaButton` (§316c, 13/11/2026, pedido do dono): só texto, sem fundo e sem borda, cor quieta,
 * sublinhado ao tocar/passar e no foco (affordance clara), alvo >= 44. Visual em `.sm2-cta-texto` (`index.css`).
 */
export const CtaTextButton = forwardRef<HTMLButtonElement, CtaTextButtonProps>(function CtaTextButton({ width = 'auto', surface = 'claro', className, type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} data-cta-texto data-cta-width={width} data-cta-surface={surface} className={`sm2-cta-texto${className ? ` ${className}` : ''}`} {...rest} />;
});
