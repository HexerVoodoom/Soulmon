/**
 * TORCIDA — as peças de tela do sistema de torcida (decisão do dono, 02/10/2026).
 *
 * Torcer é TOCAR EM QUALQUER LUGAR da tela de combate. `TorcidaLayer` envolve
 * a luta inteira, pega o toque, solta um efeito de "grito" no ponto tocado e
 * avisa quem chamou; `TorcidaGauge` mostra o gauge e é também o caminho para
 * quem não toca na tela (teclado e leitor de tela): um botão "Torcer!".
 *
 * As regras (quantos toques enchem, quanto vale o especial) NÃO moram aqui:
 * `utils/torcida.ts` (PvE) e `functions/api/_duel.js` (duelo). Este arquivo só
 * desenha e repassa o toque. Superfície de combate nasce MUDA (R-NOVA,
 * `docs/SOM.md`): nenhum som.
 *
 * Os botões da tela (sair etc.) NUNCA são engolidos: toque que começa em
 * botão, link ou campo é do botão, não vira torcida.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { PixelMeter } from '../pixel/PixelKit';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { torcidaFill, torcidaCheio } from '../../utils/torcida';

const WORDS_PT = ['VAI!', 'ISSO!', 'FORÇA!', '✦', 'BORA!'];
const WORDS_EN = ['GO!', 'YEAH!', 'COME ON!', '✦', 'NICE!'];
/** Quanto o efeito de um toque fica na tela. */
const BURST_MS = 700;
/** Teto de efeitos ao mesmo tempo (toque rápido não pode encher o DOM). */
const MAX_BURSTS = 12;

interface Burst { id: number; x: number; y: number; word: string; dx: number }

function prefersReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function TorcidaLayer({ onTap, active = true, isPt, children, style }: {
  /** Um toque de torcida. Chamado só quando `active`. */
  onTap: () => void;
  /** Fora da luta (convite, vitória, derrota) o toque não vale nada. */
  active?: boolean;
  isPt: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seq = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const reduced = useRef(prefersReducedMotion());
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active) return;
    const el = e.target as HTMLElement | null;
    // O botão de sair (e qualquer outro) fica com o próprio toque.
    if (el?.closest?.('button, a, input, textarea, select, [role="button"]')) return;
    onTap();
    if (reduced.current) return; // movimento reduzido: o gauge é o retorno
    const rect = box.current?.getBoundingClientRect();
    const n = seq.current++;
    const words = isPt ? WORDS_PT : WORDS_EN;
    const b: Burst = {
      id: n,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
      word: words[n % words.length],
      dx: ((n * 37) % 41) - 20, // varia um pouco, sem sorteio (determinístico)
    };
    setBursts(list => [...list.slice(-(MAX_BURSTS - 1)), b]);
    timers.current.push(setTimeout(() => setBursts(list => list.filter(x => x.id !== n)), BURST_MS));
  }, [active, isPt, onTap]);

  return (
    <div
      ref={box}
      data-torcida-layer
      onPointerDown={onPointerDown}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'inherit', touchAction: 'manipulation', ...style }}
    >
      {children}
      {bursts.map(b => (
        <span
          key={b.id}
          aria-hidden="true"
          className="sm-torcida-burst"
          style={{ left: b.x + b.dx, top: b.y }}
        >
          {b.word}
        </span>
      ))}
    </div>
  );
}

export function TorcidaGauge({ taps, onCheer, isPt, disabled = false }: {
  /** Toques no gauge (0..TAPS_FULL). */
  taps: number;
  /** Caminho sem toque na tela: o botão "Torcer!". */
  onCheer: () => void;
  isPt: boolean;
  disabled?: boolean;
}) {
  const cheio = torcidaCheio(taps);
  const label = isPt ? 'Torcida' : 'Cheer';
  return (
    <div data-torcida-gauge data-torcida-full={cheio ? '1' : '0'} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ ...sm2Hint, margin: 0 }} aria-live="polite">
          {cheio
            ? (isPt ? 'Golpe especial pronto!' : 'Special strike ready!')
            : (isPt ? 'Toque em qualquer lugar para torcer' : 'Tap anywhere to cheer')}
        </p>
        <PixelMeter ratio={torcidaFill(taps)} tone="gold" height={10} label={label} />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onCheer}
        aria-label={isPt ? 'Torcer pelo seu Soulmon' : 'Cheer for your Soulmon'}
        data-torcida-button
        style={{ ...sm2Button('outline', disabled), minWidth: 88, minHeight: 44 }}
      >
        {isPt ? 'Torcer!' : 'Cheer!'}
      </button>
    </div>
  );
}
