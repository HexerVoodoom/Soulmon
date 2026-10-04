/**
 * AS DUAS MECÂNICAS ATIVAS DO PvE (04/10/2026, REGISTRO §20.10) — só desenho e gesto.
 * A regra (notas, multiplicadores, janelas) é de `utils/energia.ts`; o relógio é de
 * `usePveBattle.ts`. Nenhum texto explicativo na cena: só a figura e o nome acessível.
 *
 *  · `SpecialRing` — o anel que encolhe sobre o alvo (estilo Pokémon GO). Um toque QUALQUER na
 *    tela (ou o botão no alvo, para teclado) para o anel; perto do círculo do alvo = ótimo.
 *    O anel é desenhado por JS (intervalo curto), não por CSS: é a mecânica essencial e o
 *    `prefers-reduced-motion` não pode congelá-la (WCAG 2.3.3 isenta o movimento essencial).
 *  · `DodgeButtons` — as setas de cada lado do pet. O gesto principal é DESLIZAR o dedo (a
 *    `TorcidaLayer` detecta); as setas são a alternativa por toque/teclado.
 */
import { useCallback, useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';
import { RING_FROM, RING_OTIMO_MS, ringGrade, ringScale, type RingGrade, type RingSpec } from '../../utils/energia';

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** Depois de o anel passar do alvo, ainda dá `RING_GRACE_MS` para tocar antes de valer `ruim`. */
const RING_GRACE_MS = 250;

export function SpecialRing({ spec, x, y, size, onGrade, label, now: nowFn = now }: {
  spec: RingSpec;
  /** Centro do alvo em px do campo, e o tamanho do corpo dele. */
  x: number; y: number; size: number;
  onGrade: (grade: RingGrade, tapMs: number | null) => void;
  /** Nome acessível do botão do alvo (ex.: "Golpear"). */
  label: string;
  now?: () => number;
}) {
  const ringEl = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const t0 = useRef(nowFn());
  const gradeRef = useRef(onGrade);
  gradeRef.current = onGrade;
  const target = Math.round(Math.max(56, size * 0.8));

  const finish = useCallback((tapMs: number | null) => {
    if (done.current) return;
    done.current = true;
    gradeRef.current(ringGrade(tapMs, spec), tapMs);
  }, [spec]);

  useEffect(() => {
    done.current = false;
    t0.current = nowFn();
    const el = ringEl.current;
    const paint = () => {
      const t = nowFn() - t0.current;
      if (el) {
        el.style.transform = `translate(-50%, -50%) scale(${ringScale(t, spec).toFixed(3)})`;
        el.setAttribute('data-ring-hot', Math.abs(t - spec.targetMs) <= RING_OTIMO_MS ? '1' : '0');
      }
      if (t >= spec.ms + RING_GRACE_MS) finish(null);
    };
    paint();
    const id = setInterval(paint, 16);
    const onDown = (e: PointerEvent) => {
      const el2 = e.target as HTMLElement | null;
      // O X e a confirmação de sair ficam com o próprio toque; o mascote e o alvo contam.
      if (el2?.closest?.('[data-stage-close], [data-stage-confirm]')) return;
      finish(nowFn() - t0.current);
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => { clearInterval(id); window.removeEventListener('pointerdown', onDown, true); };
  }, [spec, finish, nowFn]);

  return (
    <div
      data-stage-ring
      data-ring-target={spec.targetMs}
      style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 6, pointerEvents: 'none' }}
    >
      {/* O alvo: o círculo fixo onde o anel deve encostar. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, top: 0, width: target, height: target, boxSizing: 'border-box',
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          border: '3px solid var(--sm2-gold-ink)', backgroundColor: 'color-mix(in srgb, var(--sm2-gold-fill) 18%, transparent)',
        }}
      />
      {/* O anel que encolhe (escala por JS). */}
      <div
        ref={ringEl}
        aria-hidden="true"
        className="sm-bs-ring"
        data-ring-hot="0"
        style={{
          position: 'absolute', left: 0, top: 0, width: target, height: target, boxSizing: 'border-box',
          transform: `translate(-50%, -50%) scale(${RING_FROM})`, borderRadius: '50%',
        }}
      />
      <button
        type="button"
        data-ring-button
        aria-label={label}
        onClick={() => finish(nowFn() - t0.current)}
        style={{
          position: 'absolute', left: 0, top: 0, width: Math.max(44, target), height: Math.max(44, target),
          transform: 'translate(-50%, -50%)', borderRadius: '50%', background: 'none', border: 'none',
          padding: 0, cursor: 'pointer', pointerEvents: 'auto', opacity: 0,
        }}
      />
    </div>
  );
}

export function DodgeButtons({ x, y, size, onDodge, labelLeft, labelRight }: {
  /** Centro do corpo do pet, em px do campo. */
  x: number; y: number; size: number;
  onDodge: (dir: -1 | 1) => void;
  labelLeft: string; labelRight: string;
}) {
  const off = Math.round(size * 0.5 + 26);
  const btn = (dir: -1 | 1, name: 'chevron_left' | 'chevron_right', label: string) => (
    <button
      key={dir}
      type="button"
      data-dodge-button={dir < 0 ? 'left' : 'right'}
      aria-label={label}
      onClick={() => onDodge(dir)}
      className="sm-bs-dodge-hint"
      style={{
        // a seta da esquerda não sai da tela quando o pet encosta na borda
        position: 'absolute', left: Math.max(4, x + dir * off - 24), top: y - 24, width: 48, height: 48, zIndex: 6,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
        background: 'none', border: 'none', color: 'var(--sm2-viewport-ink)', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.95))',
      }}
    >
      <Icon name={name} size={32} tone="inherit" />
    </button>
  );
  return <>{btn(-1, 'chevron_left', labelLeft)}{btn(1, 'chevron_right', labelRight)}</>;
}
