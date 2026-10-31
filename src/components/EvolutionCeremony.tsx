import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { PLACEHOLDER_ART } from '../utils/placeholderArt';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { usePrefersReducedMotion } from './ui/Viewport';
import { ritualLabel } from './ritual/RitualKit';
import { sm2Button, sm2Hint } from './form/FormKit';
import { fragmentsGatherLine, fragmentsSpentLine } from '../utils/soulFragment';
import { entrarNaSuperficie } from '../utils/musica';
import { SoulFragmentIcon } from './ui/SoulFragmentIcon';

/**
 * EvolutionCeremony — a TRANSFORMAÇÃO que fecha o cristal da evolução.
 * =====================================================================
 *
 * Refeita em 31/10/2026 (pedido do dono, REGISTRO §208): o vídeo de fundo e o
 * sunburst saíram. O jogador tocou Evoluir, o Soulmon passou um tempo NO
 * CRISTAL (`utils/evolutionCrystal.ts`) enquanto a forma nova era desenhada, e
 * quando ela fica pronta esta tela conta a transformação dentro do jogo, em
 * quatro tempos (CSS puro, sem vídeo nem imagem nova):
 *
 *   1. `treme`     — o cristal (a mesma arte do nascimento, `PLACEHOLDER_ART.forming`) treme;
 *   2. `racha`     — rachaduras de luz turquesa riscam o cristal;
 *   3. `estilhaca` — ele estilhaça em fragmentos que voam para fora;
 *   4. `revela`    — a forma nova aparece no lugar, e a faixa diz o nome.
 *
 * A evolução é commitada (`onEvolved`) no começo da revelação.
 * `prefers-reduced-motion` troca tudo por um fade simples para a forma nova e
 * commita na montagem. A cerimônia continua ESPERANDO o gesto de saída
 * (RIT-20). Escape só depois de `done`.
 *
 * Acessibilidade (§10.4 b): `role="dialog"` + `aria-modal`, foco preso e
 * devolvido (`useDialogA11y`). Nada pisca: o tremor é deslocamento e a luz
 * cresce uma vez só (WCAG 2.3.1).
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
  /** Fragmentos de Alma que esta evolução USA (o custo do estágio). Dito uma vez, ao terminar; ausente = não mostra a linha. */
  fragmentsSpent?: number;
  /** Chamado quando a forma nova aparece (commit da evolução no estado). */
  onEvolved: () => void;
  /** Fecha a tela (depois do resultado). */
  onClose: () => void;
}

export type CeremonyPhase = 'treme' | 'racha' | 'estilhaca' | 'revela';
/** Quando cada tempo COMEÇA (ms desde a montagem). */
export const PHASE_AT: Readonly<Record<CeremonyPhase, number>> = { treme: 0, racha: 1400, estilhaca: 2600, revela: 3200 };
export const TOTAL_MS = 3800;

const SPRITE = 128;
const CRYSTAL = 144;
/** Fragmentos do estilhaço: ângulo (graus), distância e tamanho — determinísticos, nada de sorteio no render. */
export const SHARDS: ReadonlyArray<{ a: number; d: number; s: number }> = Array.from({ length: 14 }, (_, i) => ({
  a: (i * 360) / 14 + (i % 2 ? 9 : -7),
  d: 110 + ((i * 37) % 70),
  s: 10 + ((i * 13) % 12),
}));

const pixel: CSSProperties = { position: 'absolute', imageRendering: 'pixelated', display: 'block', maxWidth: 'none' };

const CSS = [
  '@keyframes sm2-cer-treme { 0%,100% { transform: translate(0,0) } 25% { transform: translate(-2px,1px) } 50% { transform: translate(2px,-1px) } 75% { transform: translate(-1px,-2px) } }',
  '@keyframes sm2-cer-risca { from { stroke-dashoffset: 120 } to { stroke-dashoffset: 0 } }',
  '@keyframes sm2-cer-voa { from { transform: translate(-50%,-50%) rotate(var(--a)) translate(0,0); opacity: 1 } to { transform: translate(-50%,-50%) rotate(var(--a)) translate(var(--d),0) rotate(140deg); opacity: 0 } }',
  '@keyframes sm2-cer-luz { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.4) } 40% { opacity: .9 } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.6) } }',
  '@keyframes sm2-cer-surge { from { opacity: 0; transform: scale(.82) } to { opacity: 1; transform: scale(1) } }',
  '@keyframes sm2-cer-fade { from { opacity: 0 } to { opacity: 1 } }',
  '[data-cer-crystal][data-phase="treme"] { animation: sm2-cer-treme .2s steps(2) infinite; }',
  '[data-cer-crystal][data-phase="racha"] { animation: sm2-cer-treme .1s steps(2) infinite; }',
  '[data-cer-cracks] path { stroke-dasharray: 120; stroke-dashoffset: 120; animation: sm2-cer-risca .9s ease-out forwards; }',
  '[data-cer-shard] { animation: sm2-cer-voa .7s cubic-bezier(.2,.7,.3,1) forwards; }',
  '[data-cer-flash] { animation: sm2-cer-luz .8s ease-out forwards; }',
  '[data-cer-sprite][data-reveal="anim"] { animation: sm2-cer-surge .6s ease-out both; }',
  '[data-cer-sprite][data-reveal="fade"] { animation: sm2-cer-fade .6s ease-out both; }',
].join('\n');

const CRACKS = [
  'M72 20 L66 48 L78 70 L62 96 L70 124',
  'M66 48 L40 58 L30 80',
  'M78 70 L104 78 L112 100',
  'M62 96 L44 110',
  'M70 30 L92 40 L100 58',
];

export function EvolutionCeremony({
  fromStage, toStage, toName, language, demoCharacterId, fromSpriteUrl, toSpriteUrl, reachedAt, fragmentsSpent, onEvolved, onClose,
}: EvolutionCeremonyProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CeremonyPhase>(reduced ? 'revela' : 'treme');
  const [done, setDone] = useState(false);
  const evolvedRef = useRef(false);
  // S18: o tema da cerimônia acompanha a cerimônia e o cartão final; fechar devolve a música anterior (crossfade).
  useEffect(() => entrarNaSuperficie('evolucao'), []);

  // No cristal o visor mostra o cristal, não a forma de partida; ela fica só como `data-` para quem inspeciona.
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
      setPhase('revela');
      setDone(true);
      commit();
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase('racha'), PHASE_AT.racha),
      window.setTimeout(() => setPhase('estilhaca'), PHASE_AT.estilhaca),
      window.setTimeout(() => { setPhase('revela'); commit(); }, PHASE_AT.revela),
      window.setTimeout(() => setDone(true), TOTAL_MS),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const data = useMemo(() => {
    const d = reachedAt ? new Date(reachedAt) : new Date();
    const ok = !Number.isNaN(d.getTime()) ? d : new Date();
    return new Intl.DateTimeFormat(isPt ? 'pt-BR' : 'en-US', { dateStyle: 'long' }).format(ok);
  }, [reachedAt, isPt]);

  const titulo = isPt ? 'Evolução' : 'Evolution';
  const cristalVisivel = phase === 'treme' || phase === 'racha';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      tabIndex={-1}
      data-evolution-ceremony
      data-cer-phase={phase}
      data-cer-from={fromSprite}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sm2-surface)',
        outline: 'none',
      }}
    >
      <style>{CSS}</style>
      {/* ── O VISOR de tela cheia: a cena é o cristal, no vidro escuro de sempre. ── */}
      <div
        className="sm2-viewport-screen sm2-visor"
        aria-hidden="true"
        data-cer-glass
        style={{
          flex: 1, minHeight: 0, borderRadius: 0, position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 50%, rgba(64,224,208,.16) 0%, var(--sm2-viewport-bg, #071414) 62%)',
        }}
      >
        {cristalVisivel && (
          <div
            data-cer-crystal
            data-phase={phase}
            style={{ position: 'absolute', left: '50%', top: '50%', width: CRYSTAL, height: CRYSTAL, margin: `-${CRYSTAL / 2}px 0 0 -${CRYSTAL / 2}px` }}
          >
            <img src={PLACEHOLDER_ART.forming} alt="" style={{ ...pixel, left: 0, top: 0, width: CRYSTAL, height: CRYSTAL, objectFit: 'contain' }} />
            {phase === 'racha' && (
              <svg data-cer-cracks viewBox="0 0 144 144" width={CRYSTAL} height={CRYSTAL} style={{ position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 0 3px #40e0d0) drop-shadow(0 0 8px #40e0d0)' }}>
                {CRACKS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#f2fffd" strokeWidth={3} strokeLinecap="square" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </svg>
            )}
          </div>
        )}
        {phase === 'estilhaca' && (
          <>
            <span data-cer-flash style={{ position: 'absolute', left: '50%', top: '50%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,255,240,.95) 0%, rgba(64,224,208,.35) 45%, transparent 70%)', pointerEvents: 'none' }} />
            {SHARDS.map((sh, i) => (
              <span
                key={i}
                data-cer-shard
                style={{
                  position: 'absolute', left: '50%', top: '50%', width: sh.s, height: Math.round(sh.s * 1.4),
                  background: 'linear-gradient(135deg, #b8fff6 0%, #40e0d0 55%, #1b8f86 100%)',
                  clipPath: 'polygon(50% 0, 100% 40%, 70% 100%, 0 70%)',
                  ['--a' as string]: `${sh.a}deg`, ['--d' as string]: `${sh.d}px`,
                } as CSSProperties}
              />
            ))}
          </>
        )}
        {phase === 'revela' && (
          <img
            src={toSprite}
            alt=""
            data-cer-sprite
            data-reveal={reduced ? 'fade' : 'anim'}
            style={{
              ...pixel, width: SPRITE, height: SPRITE, objectFit: 'contain',
              left: '50%', top: '50%', margin: `-${SPRITE / 2}px 0 0 -${SPRITE / 2}px`,
              filter: 'drop-shadow(0 0 10px rgba(64,224,208,.55))',
            }}
          />
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
        {/* O CONSUMO (REGISTRO §153): os Fragmentos de Alma juntados são usados
            aqui. Dito como o que deu forma à evolução — uma vez, no ato, sem
            número que desce nem conta do que sobrou. */}
        {fragmentsSpent !== undefined && fragmentsSpent > 0 && (
          <p data-cer-fragments style={{ ...sm2Hint, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <SoulFragmentIcon size={16} />
            <span>{done ? fragmentsSpentLine(fragmentsSpent, language) : fragmentsGatherLine(language)}</span>
          </p>
        )}
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
