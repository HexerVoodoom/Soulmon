import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { usePrefersReducedMotion } from './ui/Viewport';
import { ritualLabel } from './ritual/RitualKit';
import { sm2Button, sm2Hint } from './form/FormKit';
import { fragmentsGatherLine, fragmentsSpentLine } from '../utils/soulFragment';
import { pointsResetLine } from '../utils/betaResetGrant';
import { entrarNaSuperficie } from '../utils/musica';
import { SoulFragmentIcon } from './ui/SoulFragmentIcon';
import { SCENE_BG } from '../utils/fxPackArt';
import { EVOLUCAO_ART } from '../utils/criacaoEvolucaoArt';
import { quadroDaTira } from './OnboardingOvo';

/**
 * EvolutionCeremony — a TRANSFORMAÇÃO que fecha o cristal da evolução.
 * =====================================================================
 *
 * Refeita em 31/10/2026 (REGISTRO §208: sem vídeo nem sunburst) e de novo em
 * 03/11/2026 (revisão visual aprovada pelo dono, P1+P2): a cena fica ANCORADA no
 * altar do fundo pintado (`SCENE_BG.evolucao`, B-bg v2: centro do altar ≈ 61.3% da
 * altura) dentro de um PALCO de proporção fixa 9:16 que cobre o vidro — então o
 * cristal e a forma nova pisam no altar em qualquer tela. Seis tempos (~6 s):
 *
 *   1. `despede`   — a forma ANTIGA (`fromSprite`) se despede dentro do cristal;
 *   2. `carrega`   — o cristal carrega luz (`EVOLUCAO_ART.build`, 3 quadros);
 *   3. `racha`     — rachaduras crescem (`EVOLUCAO_ART.cracks`, 5 quadros) e ele treme;
 *   4. `estilhaca` — cacos de cristal (`EVOLUCAO_ART.shards`) voam + o flash turquesa;
 *   5. `revela`    — a forma NOVA, grande (58% da largura), sobre o pedestal, com brasas subindo;
 *   6. respiro de `RESPIRO_MS` antes da faixa final (`done`).
 *
 * A evolução é commitada (`onEvolved`) no começo da revelação.
 * `prefers-reduced-motion`: nenhuma animação longa — mostra o estado final
 * (forma nova no pedestal) e commita na montagem. A cerimônia continua ESPERANDO
 * o gesto de saída (RIT-20). Escape só depois de `done`. Não há "pular ao tocar"
 * (o comportamento não existia; não foi inventado aqui).
 *
 * Faixa final enxuta: o cartão antes→depois (`EVOLUCAO_ART.card`, forma antiga e
 * nova nos dois soquetes) com o nome no meio; data e fragmentos numa linha só; o
 * aviso dos pontos zerados (§209) pequeno; o botão em destaque.
 *
 * Acessibilidade (§10.4 b): `role="dialog"` + `aria-modal`, foco preso e
 * devolvido (`useDialogA11y`). Nada pisca: o flash cresce uma vez só (WCAG 2.3.1).
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

export type CeremonyPhase = 'despede' | 'carrega' | 'racha' | 'estilhaca' | 'revela';
/** Quando cada tempo COMEÇA (ms desde a montagem). */
export const PHASE_AT: Readonly<Record<CeremonyPhase, number>> = { despede: 0, carrega: 1200, racha: 2600, estilhaca: 3800, revela: 4600 };
/** A entrada da forma nova (anim `surge`) e o respiro antes da faixa final. */
export const SURGE_MS = 800;
export const RESPIRO_MS = 600;
export const TOTAL_MS = PHASE_AT.revela + SURGE_MS + RESPIRO_MS; // 6000

/** Geometria no palco 9:16 (frações do palco): o altar do B-bg2. */
export const ALTAR_Y = 61.3;
/** Largura da forma nova no palco (55–60%, pedido da revisão). */
export const FORMA_W = 58;
const CRISTAL_W = 80;

/** Fragmentos do estilhaço: ângulo (graus), distância (% do palco) e tamanho — determinísticos, nada de sorteio no render. */
export const SHARDS: ReadonlyArray<{ a: number; d: number; s: number; f: number }> = Array.from({ length: 14 }, (_, i) => ({
  a: (i * 360) / 14 + (i % 2 ? 9 : -7),
  d: 34 + ((i * 37) % 22),
  s: 7 + ((i * 13) % 6),
  f: i % EVOLUCAO_ART.shards.frames,
}));

const pixel: CSSProperties = { position: 'absolute', imageRendering: 'pixelated', display: 'block', maxWidth: 'none' };

const CSS = [
  '@keyframes sm2-cer-treme { 0%,100% { transform: translate(0,0) } 25% { transform: translate(-2px,1px) } 50% { transform: translate(2px,-1px) } 75% { transform: translate(-1px,-2px) } }',
  '@keyframes sm2-cer-tira { from { background-position: 0 0 } to { background-position: 100% 0 } }',
  '@keyframes sm2-cer-despede { 0% { opacity: .95; transform: translate(-50%,-50%) scale(1) } 70% { opacity: .7 } 100% { opacity: 0; transform: translate(-50%,-62%) scale(.7) } }',
  '@keyframes sm2-cer-voa { from { transform: translate(-50%,-50%) rotate(var(--a)) translate(0,0); opacity: 1 } to { transform: translate(-50%,-50%) rotate(var(--a)) translate(var(--d),0) rotate(140deg); opacity: 0 } }',
  '@keyframes sm2-cer-luz { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.3) } 35% { opacity: 1 } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5) } }',
  '@keyframes sm2-cer-surge { from { opacity: 0; transform: translateX(-50%) scale(.7) } to { opacity: 1; transform: translateX(-50%) scale(1) } }',
  '@keyframes sm2-cer-fade { from { opacity: 0 } to { opacity: 1 } }',
  '[data-cer-crystal][data-phase="carrega"] { animation: sm2-cer-treme .3s steps(2) infinite; }',
  '[data-cer-crystal][data-phase="racha"] { animation: sm2-cer-treme .1s steps(2) infinite; }',
  `[data-cer-crystal-art][data-tira="build"] { animation: sm2-cer-tira 1.3s steps(${EVOLUCAO_ART.build.frames - 1}) forwards; }`,
  `[data-cer-crystal-art][data-tira="cracks"] { animation: sm2-cer-tira 1.1s steps(${EVOLUCAO_ART.cracks.frames - 1}) forwards; }`,
  '[data-cer-from-sprite] { animation: sm2-cer-despede 1.2s ease-in forwards; }',
  '[data-cer-shard] { animation: sm2-cer-voa .8s cubic-bezier(.2,.7,.3,1) forwards; }',
  '[data-cer-flash] { animation: sm2-cer-luz .9s ease-out forwards; }',
  `[data-cer-sprite][data-reveal="anim"] { animation: sm2-cer-surge ${SURGE_MS}ms ease-out both; }`,
  '[data-cer-sprite][data-reveal="fade"] { animation: none; }',
  `[data-cer-embers] { animation: sm2-cer-tira 1.2s steps(${EVOLUCAO_ART.embers.frames - 1}) infinite; }`,
  '[data-cer-card] { animation: sm2-cer-fade .5s ease-out both; }',
  '@media (prefers-reduced-motion: reduce) { [data-cer-embers], [data-cer-card] { animation: none; } }',
].join('\n');

export function EvolutionCeremony({
  fromStage, toStage, toName, language, demoCharacterId, fromSpriteUrl, toSpriteUrl, reachedAt, fragmentsSpent, onEvolved, onClose,
}: EvolutionCeremonyProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CeremonyPhase>(reduced ? 'revela' : 'despede');
  const [done, setDone] = useState(false);
  const evolvedRef = useRef(false);
  // S18: o tema da cerimônia acompanha a cerimônia e o cartão final; fechar devolve a música anterior (crossfade).
  useEffect(() => entrarNaSuperficie('evolucao'), []);

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
      window.setTimeout(() => setPhase('carrega'), PHASE_AT.carrega),
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
  const cristalVisivel = phase === 'despede' || phase === 'carrega' || phase === 'racha';
  const tira = phase === 'racha' ? EVOLUCAO_ART.cracks : EVOLUCAO_ART.build;
  const temFragmentos = fragmentsSpent !== undefined && fragmentsSpent > 0;

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
      {/* ── O VISOR de tela cheia: o santuário (B-bg2) num palco 9:16 que cobre o vidro (container query). ── */}
      <div
        className="sm2-viewport-screen sm2-visor"
        aria-hidden="true"
        data-cer-glass
        style={{
          flex: 1, minHeight: 0, borderRadius: 0, position: 'relative', overflow: 'hidden',
          containerType: 'size', background: 'var(--sm2-viewport-bg, #071414)',
        } as CSSProperties}
      >
        <div
          data-cer-stage
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: 'max(100cqw, calc(100cqh * 9 / 16))', height: 'max(100cqh, calc(100cqw * 16 / 9))',
            backgroundImage: `url(${SCENE_BG.evolucao})`, backgroundSize: '100% 100%', imageRendering: 'pixelated',
          }}
        >
          {cristalVisivel && (
            <div
              data-cer-crystal
              data-phase={phase}
              style={{ position: 'absolute', left: `${(100 - CRISTAL_W) / 2}%`, width: `${CRISTAL_W}%`, aspectRatio: '1 / 1', bottom: `${100 - ALTAR_Y - 3}%` }}
            >
              <span
                key={phase === 'racha' ? 'cracks' : 'build'}
                data-cer-crystal-art
                data-tira={phase === 'despede' ? 'parado' : phase === 'racha' ? 'cracks' : 'build'}
                style={{ position: 'absolute', inset: 0, ...quadroDaTira(tira.src, tira.frames, 0) }}
              />
              {/* A despedida: a forma antiga, dentro do cristal, se apaga subindo. */}
              {phase === 'despede' && (
                <img data-cer-from-sprite src={fromSprite} alt="" style={{
                  ...pixel, left: '50%', top: '42%', width: '34%', height: 'auto', objectFit: 'contain',
                  filter: 'drop-shadow(0 0 6px rgba(127,255,240,.8))', mixBlendMode: 'screen',
                }} />
              )}
            </div>
          )}
          {phase === 'estilhaca' && (
            <>
              <img data-cer-flash src={EVOLUCAO_ART.flash} alt="" style={{ ...pixel, left: '50%', top: `${ALTAR_Y - 22}%`, width: '120%', height: 'auto', pointerEvents: 'none' }} />
              {SHARDS.map((sh, i) => (
                <span
                  key={i}
                  data-cer-shard
                  style={{
                    position: 'absolute', left: '50%', top: `${ALTAR_Y - 22}%`, width: `${sh.s}%`, aspectRatio: '1 / 1',
                    ...quadroDaTira(EVOLUCAO_ART.shards.src, EVOLUCAO_ART.shards.frames, sh.f),
                    ['--a' as string]: `${sh.a}deg`, ['--d' as string]: `${sh.d}cqw`,
                  } as CSSProperties}
                />
              ))}
            </>
          )}
          {phase === 'revela' && (
            <>
              <img data-cer-pedestal src={EVOLUCAO_ART.pedestal} alt="" style={{
                ...pixel, left: '50%', top: `${ALTAR_Y}%`, width: '62%', height: 'auto', transform: 'translate(-50%,-50%)',
              }} />
              <img
                src={toSprite}
                alt=""
                data-cer-sprite
                data-reveal={reduced ? 'fade' : 'anim'}
                style={{
                  ...pixel, width: `${FORMA_W}%`, aspectRatio: '1 / 1', height: 'auto', objectFit: 'contain',
                  left: '50%', bottom: `${100 - ALTAR_Y + 1}%`, transform: 'translateX(-50%)', transformOrigin: '50% 100%',
                  filter: 'drop-shadow(0 0 12px rgba(64,224,208,.55))',
                }}
              />
              {!reduced && (
                <span data-cer-embers style={{
                  position: 'absolute', left: '50%', bottom: `${100 - ALTAR_Y}%`, width: '70%', aspectRatio: '1 / 1', transform: 'translateX(-50%)',
                  pointerEvents: 'none', ...quadroDaTira(EVOLUCAO_ART.embers.src, EVOLUCAO_ART.embers.frames, 0),
                }} />
              )}
            </>
          )}
        </div>
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
          padding: '12px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          textAlign: 'center',
        }}
      >
        {done ? (
          /* O cartão antes → depois: a forma antiga no soquete da esquerda, a nova no da direita, o nome no meio. */
          <div data-cer-card style={{
            position: 'relative', width: 'min(100%, 320px)', aspectRatio: '540 / 324',
            backgroundImage: `url(${EVOLUCAO_ART.card})`, backgroundSize: '100% 100%', imageRendering: 'pixelated',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: '8%',
          }}>
            <img data-cer-card-from src={fromSprite} alt="" style={{ ...pixel, left: '19.76%', top: '18.2%', width: '10%', height: 'auto', transform: 'translate(-50%,-50%)' }} />
            <img data-cer-card-to src={toSprite} alt="" style={{ ...pixel, left: '80.16%', top: '18.2%', width: '10%', height: 'auto', transform: 'translate(-50%,-50%)' }} />
            <p style={{ ...ritualLabel, letterSpacing: '.1em', margin: 0 }}>{isPt ? 'EVOLUIU PARA' : 'EVOLVED INTO'}</p>
            <h1 style={{
              fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-xl)', fontWeight: 600,
              lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)', margin: 0, padding: '0 18%',
            }}>{toName}</h1>
          </div>
        ) : (
          <>
            <p style={{ ...ritualLabel, letterSpacing: '.1em', margin: 0 }}>{isPt ? 'EVOLUINDO' : 'EVOLVING'}</p>
            {/* Sem "…" (revisão 03/11/2026): uma frase calma enquanto o cristal trabalha. */}
            <h1 style={{
              fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg, 18px)', fontWeight: 600,
              lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-muted)', margin: 0,
            }}>{isPt ? 'Algo está mudando' : 'Something is changing'}</h1>
          </>
        )}
        {/* Data e fragmentos numa linha só (REGISTRO §153: os Fragmentos de Alma são USADOS aqui, ditos uma vez). */}
        {(done || temFragmentos) && (
          <p data-cer-linha style={{ ...sm2Hint, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
            {done && <span data-cer-date>{data}</span>}
            {done && temFragmentos && <span aria-hidden="true">·</span>}
            {temFragmentos && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <SoulFragmentIcon size={16} />
                <span data-cer-fragments>{done ? fragmentsSpentLine(fragmentsSpent!, language) : fragmentsGatherLine(language)}</span>
              </span>
            )}
          </p>
        )}
        {/* §209 (31/10/2026, dono): a evolução zera os 3 pontos — aviso pequeno, não compete com o clima. */}
        {done && (
          <p data-cer-points-reset style={{ ...sm2Hint, margin: 0, fontSize: 'var(--text-xs)', opacity: 0.75 }}>{pointsResetLine(language)}</p>
        )}
        {/* A saída é do jogador — a cerimônia espera o gesto (RIT-20). */}
        {done ? (
          <button type="button" data-cer-close onClick={onClose} style={{ ...sm2Button('primary'), minWidth: 260, marginTop: 6 }}>
            {/* Copy §3.2: a mesma saída relacional do `MilestoneCeremony`. */}
            {isPt ? 'Seguimos juntos' : 'We keep going together'}
          </button>
        ) : (
          <span aria-busy="true" style={{ display: 'block', minHeight: 48, marginTop: 6 }} />
        )}
      </div>
    </div>
  );
}
