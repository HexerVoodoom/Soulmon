/**
 * TORCIDA — as peças de tela do sistema de torcida (decisão do dono, 02/10/2026).
 *
 * Torcer é TOCAR EM QUALQUER LUGAR da tela de combate. `TorcidaLayer` envolve
 * a luta inteira, pega o toque, solta um efeito de "grito" no ponto tocado e
 * avisa quem chamou; `TorcidaGauge` mostra a barra de CHEER e é também o caminho
 * para quem não toca na tela (teclado e leitor de tela): o mascote vira botão.
 *
 * As regras (quantos toques enchem, quanto vale o especial) NÃO moram aqui:
 * `utils/energia.ts` (PvE) e `functions/api/_duel.js` (duelo). Este arquivo só
 * desenha e repassa o toque. Superfície de combate nasce MUDA (R-NOVA,
 * `docs/SOM.md`): nenhum som.
 *
 * Os botões da tela (sair etc.) NUNCA são engolidos: toque que começa em
 * botão, link ou campo é do botão, não vira torcida.
 *
 * ── O MASCOTE DA TORCIDA (04/10/2026, estilo Digimon 1) ────────────────────
 * Com `mascot`, um bichinho de pixel (SVG, tokens do app) fica fixo no canto
 * inferior DIREITO da cena. A cada toque ele "grita": pula, levanta os pompons e
 * aparece o balão "VAI!"/"CHEER!" junto dele — além do grito no ponto tocado, que
 * continua. Ele também é um BOTÃO (teclado e leitor de tela torcem por ele).
 * `prefers-reduced-motion`: sem pulo e sem o grito no ponto — só o balão pisca.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { PixelMeter } from '../pixel/PixelKit';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { CHEER_TAPS_FULL, cheerRatio } from '../../utils/energia';
import { PixelIcon } from '../ui/PixelIcon';
// Carga do especial (04/10/2026, arte do dono — bloco 18): o mesmo cristal em 3 estados, 96² pixel.
import cargaVazio from '../../assets/icons/especial-carga-0-vazio.png';
import cargaMeio from '../../assets/icons/especial-carga-1-meio.png';
import cargaCheio from '../../assets/icons/especial-carga-2-cheio.png';

/** Estado do cristal de carga pela fração da barra: vazio (0), meio (0 < r < 1), cheio (1 = especial pronto). */
export function especialCargaArt(ratio: number): string {
  return ratio >= 1 ? cargaCheio : ratio > 0 ? cargaMeio : cargaVazio;
}

const WORDS_PT = ['VAI!', 'ISSO!', 'FORÇA!', '✦', 'BORA!'];
const WORDS_EN = ['GO!', 'YEAH!', 'COME ON!', '✦', 'NICE!'];
/** Quanto o efeito de um toque fica na tela. */
const BURST_MS = 700;
/** Teto de efeitos ao mesmo tempo (toque rápido não pode encher o DOM). */
const MAX_BURSTS = 12;
/** Quanto o mascote fica com os braços para cima depois de um toque. */
const MASCOT_POSE_MS = 420;
/** Quanto o dedo precisa andar na horizontal para contar como deslize (a esquiva do PvE). */
export const SWIPE_MIN_PX = 44;

interface Burst { id: number; x: number; y: number; word: string; dx: number }

function prefersReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** O mascote da torcida: pixel de 16×16 em SVG, só com tokens (nenhuma cor solta). `cheer` = braços e pompons para cima. */
export function CheerMascot({ cheer, size = 60 }: { cheer: boolean; size?: number }) {
  const ink = 'var(--sm2-ink)';
  const body = 'var(--sm2-primary-fill)';
  const pom = 'var(--sm2-gold-fill)';
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible' }}>
      <rect x="4" y="14" width="3" height="1" fill={ink} />
      <rect x="9" y="14" width="3" height="1" fill={ink} />
      <rect x="3" y="5" width="10" height="9" fill={ink} />
      <rect x="4" y="6" width="8" height="7" fill={body} />
      <rect x="6" y="8" width="1" height={cheer ? 1 : 2} fill={ink} />
      <rect x="9" y="8" width="1" height={cheer ? 1 : 2} fill={ink} />
      {cheer
        ? <rect x="6" y="10" width="4" height="2" fill={ink} />
        : <rect x="7" y="11" width="2" height="1" fill={ink} />}
      {cheer ? (
        <>
          <rect x="2" y="5" width="1" height="3" fill={ink} />
          <rect x="13" y="5" width="1" height="3" fill={ink} />
          <rect x="0" y="1" width="3" height="3" fill={pom} />
          <rect x="13" y="1" width="3" height="3" fill={pom} />
        </>
      ) : (
        <>
          <rect x="2" y="9" width="1" height="3" fill={ink} />
          <rect x="13" y="9" width="1" height="3" fill={ink} />
          <rect x="0" y="11" width="3" height="3" fill={pom} />
          <rect x="13" y="11" width="3" height="3" fill={pom} />
        </>
      )}
    </svg>
  );
}

export function TorcidaLayer({ onTap, active = true, isPt, children, style, mascot = false, onSwipe, swipeActive = false }: {
  /** Um toque de torcida. Chamado só quando `active`. */
  onTap: () => void;
  /** Fora da luta (convite, vitória, derrota) o toque não vale nada. */
  active?: boolean;
  isPt: boolean;
  children: ReactNode;
  style?: CSSProperties;
  /** Desenha o mascote da torcida no canto da cena (cena de combate, 04/10/2026). */
  mascot?: boolean;
  /**
   * Gesto de deslizar (a ESQUIVA do PvE): chamado com -1 (esquerda) ou 1 (direita) quando
   * `swipeActive` e o dedo anda mais de `SWIPE_MIN_PX` na horizontal. Não conta como toque de torcida.
   */
  onSwipe?: (dir: -1 | 1) => void;
  swipeActive?: boolean;
}) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  /** Muda a cada toque: reinicia o pulo do mascote e o balão. `pose` = braços para cima. */
  const [shout, setShout] = useState(0);
  const [pose, setPose] = useState(false);
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const seq = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const reduced = useRef(prefersReducedMotion());
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (poseTimer.current) clearTimeout(poseTimer.current);
  }, []);

  /** O mascote grita: pula e mostra o balão (o CSS tira o pulo com movimento reduzido; o balão só pisca). */
  const shoutNow = useCallback(() => {
    setShout(n => n + 1);
    setPose(true);
    if (poseTimer.current) clearTimeout(poseTimer.current);
    poseTimer.current = setTimeout(() => setPose(false), MASCOT_POSE_MS);
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement | null;
    swipeFrom.current = null; // um toque novo nunca herda o ponto de um gesto que não terminou
    // O botão de sair (e qualquer outro) fica com o próprio toque.
    if (el?.closest?.('button, a, input, textarea, select, [role="button"]')) return;
    if (swipeActive) swipeFrom.current = { x: e.clientX, y: e.clientY };
    if (!active) return;
    onTap();
    if (mascot) shoutNow();
    if (reduced.current) return; // movimento reduzido: o gauge e o balão são o retorno
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
  }, [active, isPt, onTap, mascot, shoutNow, swipeActive]);

  const onPointerCancel = useCallback(() => { swipeFrom.current = null; }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const from = swipeFrom.current;
    swipeFrom.current = null;
    if (!swipeActive || !from || !onSwipe) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.3) onSwipe(dx < 0 ? -1 : 1);
  }, [swipeActive, onSwipe]);

  return (
    <div
      ref={box}
      data-torcida-layer
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'inherit', touchAction: swipeActive ? 'none' : 'manipulation', ...style }}
    >
      {children}
      {mascot && (
        <div
          data-cheer-mascot
          data-cheer-pose={pose ? 'cheer' : 'idle'}
          style={{ position: 'absolute', right: 6, bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 2px)', zIndex: 6, pointerEvents: 'none' }}
        >
          {shout > 0 && (
            <span key={`b${shout}`} aria-hidden="true" data-cheer-bubble className="sm-cheer-bubble">
              {isPt ? 'VAI!' : 'CHEER!'}
            </span>
          )}
          <button
            type="button"
            onClick={() => { if (active) { onTap(); shoutNow(); } }}
            aria-label={isPt ? 'Torcer pelo seu Soulmon' : 'Cheer for your Soulmon'}
            data-torcida-button
            style={{ pointerEvents: 'auto', background: 'none', border: 'none', padding: 0, minWidth: 44, minHeight: 44, cursor: 'pointer', display: 'block' }}
          >
            <span key={`m${shout}`} className={shout > 0 ? 'sm-cheer-jump' : undefined} style={{ display: 'block' }}>
              <CheerMascot cheer={pose} />
            </span>
          </button>
        </div>
      )}
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

/**
 * A barra de CHEER. Na cena de combate (`bare`) ela é só a barra + o "?" (sem texto na
 * tela; o mascote do canto é o botão de torcer). Fora da cena (layout antigo) mantém a
 * frase e o botão "Torcer!".
 */
export function TorcidaGauge({ taps, onCheer, isPt, disabled = false, full = CHEER_TAPS_FULL, bare = false }: {
  /** Toques na barra de cheer (0..full). */
  taps: number;
  /** Caminho sem toque na tela: o botão "Torcer!" (no `bare`, o mascote faz esse papel). */
  onCheer: () => void;
  isPt: boolean;
  disabled?: boolean;
  /** Toques que enchem a barra. Padrão = `CHEER_TAPS_FULL` (24, lenta de propósito). */
  full?: number;
  /**
   * Versão da cena de combate (`BattleStage`): SEM texto e SEM "?" na tela (A7, rodada 7) — a explicação
   * de como torcer mora no modal ANTERIOR à luta (o InfoTip único dele).
   */
  bare?: boolean;
}) {
  const ratio = full > 0 ? Math.min(1, Math.max(0, taps) / full) : cheerRatio(taps);
  const label = isPt ? 'Torcida' : 'Cheer';
  return (
    <div data-torcida-gauge data-torcida-ratio={ratio.toFixed(2)} style={{ display: 'flex', alignItems: 'center', gap: bare ? 2 : 10, flex: 'none' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!bare && (
          <p style={{ ...sm2Hint, margin: 0 }} aria-live="polite">
            {isPt ? 'Toque em qualquer lugar para torcer' : 'Tap anywhere to cheer'}
          </p>
        )}
        <PixelMeter ratio={ratio} tone="gold" height={bare ? 12 : 10} label={label} />
      </div>
      {bare && (
        /* O raio cinza virou o cristal de carga do especial (arte do dono): vazio → meio → cheio. */
        <span data-especial-carga={ratio >= 1 ? 'cheio' : ratio > 0 ? 'meio' : 'vazio'} style={{ display: 'inline-flex' }}>
          <PixelIcon src={especialCargaArt(ratio)} size={24} />
        </span>
      )}
      {!bare && (
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
      )}
    </div>
  );
}
