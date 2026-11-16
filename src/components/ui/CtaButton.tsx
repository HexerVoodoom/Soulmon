import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type PointerEvent } from 'react';

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
   * PRESSIONAR E SEGURAR (16/11/2026, retrospectiva semanal): o botão só dispara `onHoldComplete` depois de `holdMs` com o dedo/mouse/Enter/Espaço
   * pressionados; um preenchimento turquesa com brilho corre da esquerda para a direita (`.sm2-cta-fill`). Soltar antes cancela e volta.
   * O clique simples NÃO faz nada neste modo (de propósito: é a confirmação). Com `prefers-reduced-motion` não há animação de preenchimento
   * (só um estado fixo enquanto segura), mas continua exigindo segurar. `holdHint` é a instrução lida por leitor de tela (aria-describedby).
   */
  holdMs?: number;
  onHoldComplete?: () => void;
  holdHint?: string;
}

/** Pressionar-e-segurar: estado de "segurando" + temporizador, para ponteiro e teclado. */
function useHold(ms: number | undefined, onComplete: (() => void) | undefined) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const active = useRef(false);
  const cb = useRef(onComplete);
  cb.current = onComplete;
  const cancel = useCallback(() => {
    window.clearTimeout(timer.current);
    active.current = false;
    setHolding(false);
  }, []);
  const start = useCallback(() => {
    if (!ms || active.current) return;
    active.current = true;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      active.current = false;
      setHolding(false);
      cb.current?.();
    }, ms);
  }, [ms]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { holding, start, cancel };
}

/** `ref` chega no `<button>` (devolver o foco ao fechar um diálogo aberto por ele). */
export const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(function CtaButton({ width = 'full', tone = 'padrao', holdMs, onHoldComplete, holdHint, className, type = 'button', children, onClick, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onKeyDown, onKeyUp, onBlur, onContextMenu, style, ...rest }, ref) {
  const hint = useId();
  const hold = useHold(holdMs, onHoldComplete);
  if (!holdMs) {
    return (
      <button ref={ref} type={type} data-cta-button data-cta-width={width} data-cta-tone={tone} className={`sm2-cta${className ? ` ${className}` : ''}`} style={style} onClick={onClick}
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave} onPointerCancel={onPointerCancel} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={onBlur} onContextMenu={onContextMenu} {...rest}>
        <span className="sm2-cta-label">{children}</span>
      </button>
    );
  }
  const isHoldKey = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
  return (
    <button
      ref={ref} type={type} data-cta-button data-cta-width={width} data-cta-tone={tone} data-cta-hold data-cta-holding={hold.holding ? 'true' : undefined}
      className={`sm2-cta${className ? ` ${className}` : ''}`} style={{ ...style, ['--sm2-hold-ms' as string]: `${holdMs}ms` }}
      aria-describedby={holdHint ? hint : undefined}
      // o clique simples não confirma: a confirmação é segurar (o clique que o navegador sintetiza no soltar é ignorado)
      onClick={e => e.preventDefault()}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => { onPointerDown?.(e); if (((e as { button?: number }).button ?? 0) === 0) hold.start(); }}
      onPointerUp={e => { onPointerUp?.(e); hold.cancel(); }}
      onPointerLeave={e => { onPointerLeave?.(e); hold.cancel(); }}
      onPointerCancel={e => { onPointerCancel?.(e); hold.cancel(); }}
      onContextMenu={e => { onContextMenu?.(e); e.preventDefault(); }}
      onKeyDown={e => { onKeyDown?.(e); if (isHoldKey(e)) { e.preventDefault(); if (!e.repeat) hold.start(); } }}
      onKeyUp={e => { onKeyUp?.(e); if (isHoldKey(e)) { e.preventDefault(); hold.cancel(); } }}
      onBlur={e => { onBlur?.(e); hold.cancel(); }}
      {...rest}
    >
      <span className="sm2-cta-fill" aria-hidden="true" />
      <span className="sm2-cta-label">{children}</span>
      {holdHint && <span id={hint} className="sm2-cta-hint-sr">{holdHint}</span>}
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
