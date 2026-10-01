import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { GAIN_ART } from '../utils/gainArt';
import { ANIM_ART } from '../utils/animArt';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { usePrefersReducedMotion } from './ui/Viewport';
import { Icon } from './ui/Icon';
import { ritualLabel } from './ritual/RitualKit';
import { sm2Button, sm2Hint } from './form/FormKit';
import evolutionBgVideo from '../assets/video/evolution-bg.mp4';
import evolutionBgThumb from '../assets/video/evolution-bg-thumb.webp';

/**
 * EvolutionCeremony — a cerimônia da evolução MANUAL.
 * ====================================================
 *
 * Canvas Evolução (`Cerimonia`/`CerimoniaReduzida`, D-E6, DECISÕES §24,
 * 20/09/2026): o diálogo z-500 é um **VISOR de tela cheia** + o aparelho
 * embaixo. Dentro do vidro (`--sm2-viewport-bg`): o vídeo como CENÁRIO
 * (`cover`, `image-rendering: auto` — ilustração/transição, como o
 * `bg-room`), o burst `gain-evolution-burst` 96² a **3× = 288** atrás da
 * forma evoluída a **128** (0,5× — a mesma escala da Home e da Ficha) e a
 * faísca `anim-sparkle-pop` quadro 4 (64² a 2×) no canto superior direito,
 * fora da criatura (X2). Fora do vidro, a faixa `surface` com filete de
 * cobre 3px carrega "EVOLVED INTO" (`.lab` Rubik 12/500), o nome Cinzel 24,
 * a data (`formReachedAt`, 02 §45) e o primário "Let's keep going together"
 * (a saída relacional do marco, RIT-20). Texto e botão NUNCA ficam sobre o
 * vídeo: contraste sobre imagem não é medível por token.
 *
 * Movimento: os sprites da forma ATUAL e da PRÓXIMA intercalam em branco
 * por `TOTAL_MS`, acelerando — mas **nunca abaixo de `MIN_STEP_MS` = 340 ms**
 * (B3, WCAG 2.3.1: menos de 3 flashes por segundo). Antes o intervalo caía a
 * 55 ms — 18 trocas por segundo, sobre um vídeo a tela cheia.
 *
 * `prefers-reduced-motion` muda a ESTRUTURA, não a pausa (D7): o quadro
 * parado antes (64) → `arrow_forward` → depois (128), sem burst (X1: a 3× o
 * centrado no "depois" vazaria do vidro), sem vídeo (o poster fica), e a
 * evolução é commitada na montagem. A cerimônia continua ESPERANDO o gesto —
 * movimento reduzido reduz o movimento, nunca a saída.
 *
 * Acessibilidade (§10.4 b): `role="dialog"` + `aria-modal`, foco preso e
 * devolvido (`useDialogA11y`); Escape só depois de `done` — fechar antes
 * seria abandonar a evolução no meio, e o commit acontece em `onEvolved`.
 */
interface EvolutionCeremonyProps {
  fromStage: string;
  toStage: string;
  toName: string;
  language: 'pt-BR' | 'en-US' | string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe os sprites. */
  demoCharacterId?: string;
  /** Sprite PRÓPRIO adotado de cada forma, quando existe (senão a reserva). */
  fromSpriteUrl?: string;
  toSpriteUrl?: string;
  /** `formReachedAt[toStage]` — a data que a faixa mostra. Ausente = hoje. */
  reachedAt?: string;
  /** Chamado quando a animação termina (commit da evolução no estado). */
  onEvolved: () => void;
  /** Fecha a tela (depois do resultado). */
  onClose: () => void;
}

export const TOTAL_MS = 3000;
/** Piso do intervalo de troca (B3): 340 ms → < 3 trocas/s. */
export const MIN_STEP_MS = 340;

// Agenda de alternância: intervalos progressivamente menores somando ~3s,
// com o piso de `MIN_STEP_MS`.
export function buildSchedule(): number[] {
  const steps: number[] = [];
  let t = 0;
  let interval = 480;
  while (t + interval < TOTAL_MS) {
    steps.push(t + interval);
    t += interval;
    interval = Math.max(MIN_STEP_MS, interval * 0.82);
  }
  return steps;
}

const SPRITE = 128;
const BEFORE = 64;
const BURST = 288;
const SPARK = 128;

const pixel: CSSProperties = { position: 'absolute', imageRendering: 'pixelated', display: 'block', maxWidth: 'none' };

export function EvolutionCeremony({
  fromStage, toStage, toName, language, demoCharacterId, fromSpriteUrl, toSpriteUrl, reachedAt, onEvolved, onClose,
}: EvolutionCeremonyProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [showNext, setShowNext] = useState(false);
  const [done, setDone] = useState(false);
  const evolvedRef = useRef(false);

  const fromSprite = fromSpriteUrl ?? getSpriteForStage(fromStage, demoCharacterId);
  const toSprite = toSpriteUrl ?? getSpriteForStage(toStage, demoCharacterId);

  // Escape só fecha o que já terminou: antes disso o diálogo é a evolução.
  const dialogRef = useDialogA11y<HTMLDivElement>(true, () => { if (done) onClose(); });

  useEffect(() => {
    const commit = () => {
      if (evolvedRef.current) return;
      evolvedRef.current = true;
      onEvolved();
    };
    if (reduced) {
      setShowNext(true);
      setDone(true);
      commit();
      return;
    }
    const timers: number[] = [];
    buildSchedule().forEach((at, i) => {
      timers.push(window.setTimeout(() => setShowNext(i % 2 === 0), at));
    });
    timers.push(window.setTimeout(() => {
      setShowNext(true);
      setDone(true);
      commit();
    }, TOTAL_MS));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const data = useMemo(() => {
    const d = reachedAt ? new Date(reachedAt) : new Date();
    const ok = !Number.isNaN(d.getTime()) ? d : new Date();
    return new Intl.DateTimeFormat(isPt ? 'pt-BR' : 'en-US', { dateStyle: 'long' }).format(ok);
  }, [reachedAt, isPt]);

  const titulo = isPt ? 'Evolução' : 'Evolution';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      tabIndex={-1}
      data-evolution-ceremony
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sm2-surface)',
        outline: 'none',
      }}
    >
      {/* ── O VISOR de tela cheia: tudo que é cena fica aqui dentro. ── */}
      <div
        className="sm2-viewport-screen sm2-visor"
        aria-hidden="true"
        data-cer-glass
        style={{
          flex: 1, minHeight: 0, borderRadius: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundImage: `url(${evolutionBgThumb})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          imageRendering: 'auto',
        }}
      >
        {/* O cenário: vídeo em `cover` — ilustração, não grade (transição
            declarada, Home X11). Sob movimento reduzido só o quadro (poster). */}
        {!reduced && (
          <video
            autoPlay loop muted playsInline
            poster={evolutionBgThumb}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'auto' }}
          >
            <source src={evolutionBgVideo} type="video/mp4" />
          </video>
        )}

        {reduced ? (
          <>
            {/* D7: antes (64) → seta → depois (128), o quadro parado. */}
            <img
              src={fromSprite}
              alt=""
              data-cer-before
              style={{ ...pixel, width: BEFORE, height: BEFORE, left: '50%', top: '50%', margin: `-${BEFORE / 2}px 0 0 -${SPRITE}px`, objectFit: 'contain' }}
            />
            <span
              data-cer-arrow
              style={{ position: 'absolute', left: '50%', top: '50%', margin: '-12px 0 0 -52px', color: 'var(--sm2-viewport-ink)', display: 'block', lineHeight: 0 }}
            >
              <Icon name="arrow_forward" size={24} tone="viewport" />
            </span>
            <img
              src={toSprite}
              alt=""
              data-cer-sprite
              style={{ ...pixel, width: SPRITE, height: SPRITE, left: '50%', top: '50%', margin: `-${SPRITE / 2}px 0 0 0`, objectFit: 'contain' }}
            />
          </>
        ) : (
          <>
            {/* O burst a 3× atrás da criatura: os raios passam 80 px além
                dela e o centro ciano aparece nas frestas (X1). Só ao concluir. */}
            {done && (
              <img
                src={GAIN_ART.evolutionBurst}
                alt=""
                data-cer-burst
                className="sm-visor-swap"
                style={{ ...pixel, width: BURST, height: BURST, left: '50%', top: '50%', margin: `-${BURST / 2}px 0 0 -${BURST / 2}px` }}
              />
            )}
            {/* Sprite: branco durante a intercalação, cor ao concluir. */}
            <img
              src={showNext ? toSprite : fromSprite}
              alt=""
              data-cer-sprite
              style={{
                ...pixel, width: SPRITE, height: SPRITE, objectFit: 'contain',
                left: '50%', top: '50%', margin: `-${SPRITE / 2}px 0 0 -${SPRITE / 2}px`,
                filter: done ? 'none' : 'brightness(0) invert(1)',
              }}
            />
            {/* A faísca (quadro 4, a dispersão) no canto superior direito,
                fora da criatura — 0 px de sobreposição (X2). */}
            {done && (
              <span
                data-cer-spark
                style={{
                  position: 'absolute', left: '50%', top: '50%', width: SPARK, height: SPARK,
                  margin: '-160px 0 0 64px',
                  backgroundImage: `url(${ANIM_ART.sparklePop.src})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${ANIM_ART.sparklePop.frames * SPARK}px ${SPARK}px`,
                  backgroundPosition: `-${(ANIM_ART.sparklePop.frames - 1) * SPARK}px 0`,
                  imageRendering: 'pixelated', pointerEvents: 'none',
                }}
              />
            )}
          </>
        )}
        <span className="sm2-viewport-glass" style={{ borderRadius: 0 }} />
      </div>

      {/* ── O APARELHO: a faixa com o filete de cobre e a saída. ── */}
      <div
        data-cer-band
        aria-live="polite"
        style={{
          flex: 'none',
          backgroundColor: 'var(--sm2-surface)',
          borderTop: '3px solid var(--sm2-viewport-ring)',
          padding: '16px 16px calc(24px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          textAlign: 'center',
        }}
      >
        <p style={{ ...ritualLabel, letterSpacing: '.1em' }}>
          {done ? (isPt ? 'EVOLUIU PARA' : 'EVOLVED INTO') : (isPt ? 'EVOLUINDO' : 'EVOLVING')}
        </p>
        <h1
          style={{
            fontFamily: 'var(--sm2-font-display)',
            fontSize: 'var(--sm2-text-xl)',
            fontWeight: 600,
            lineHeight: 'var(--sm2-leading-title)',
            color: done ? 'var(--sm2-ink)' : 'var(--sm2-muted)',
            margin: 0,
          }}
        >
          {done ? toName : '…'}
        </h1>
        <p style={sm2Hint} aria-hidden={!done}>{done ? data : ' '}</p>
        {/* A saída é do jogador — a cerimônia espera o gesto (RIT-20). O
            botão só existe quando há o que sair; antes, a faixa é status. */}
        {done ? (
          <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), minWidth: 240, marginTop: 8 }}>
            {/* Copy §3.2: a mesma saída relacional do `MilestoneCeremony`. */}
            {isPt ? 'Seguimos juntos' : 'We keep going together'}
          </button>
        ) : (
          <span aria-busy="true" style={{ display: 'block', minHeight: 48, marginTop: 8 }} />
        )}
      </div>
    </div>
  );
}
