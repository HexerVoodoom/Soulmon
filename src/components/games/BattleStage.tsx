/**
 * BATTLE STAGE — a CENA de combate em tela cheia (rodada 5 / I10, 02/10/2026; maior e com
 * energia em 04/10/2026).
 *
 * O background do combate ocupa a tela inteira, com PROFUNDIDADE de Game Boy/Pokémon: o seu
 * Soulmon embaixo à ESQUERDA (grande, mais perto), o inimigo em cima à DIREITA (menor, mais
 * longe), uma plataforma/sombra sob cada um. Desde 04/10/2026 os lutadores são BEM maiores
 * (até ~60% da largura) e as barras ficam EM CIMA do personagem, coladas nele: a de HP e,
 * logo abaixo, a de ENERGIA (que, cheia, libera o ESPECIAL — `utils/energia.ts`).
 *
 * Os golpes usam a arte de SKILL do ELEMENTO do lutador (`utils/combatFx.ts`,
 * `utils/attackFxArt.ts`): investida (`melee`), projétil (`ranged`/`special`) e o escudo da
 * defesa automática (`shield`). O JOGO decide o que acontece; esta peça só DESENHA, num relógio
 * em que o dano (barra, número) chega no IMPACTO. O Soulmon faz o "bouncing" idle durante a luta.
 *
 * É reutilizável: Duelo da Arena (`ArenaGame`), duelo fantasma do Torneio (`DuelScreen`), Pesadelo
 * (`NightmareBattle`) e Masmorra (`DungeonGame`) usam a mesma `BattleStage` (props `me`/`foes`/`action`).
 *
 * Contrato de tela (regras do dono):
 *  · NENHUM texto explicativo — o "?" é o `InfoTip` (no `TorcidaGauge bare`);
 *  · o botão de sair é o X no canto superior DIREITO (ícone pelado), com
 *    confirmação quando sair perde progresso (`exitConfirm`);
 *  · o toque em qualquer lugar é da `TorcidaLayer` que envolve esta peça (o mascote da torcida mora lá);
 *  · `prefers-reduced-motion`: sem investida, projétil nem pulo — só o flash no alvo.
 * Superfície de combate nasce MUDA (R-NOVA, `docs/SOM.md`): nenhum som.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { PixelMeter } from '../pixel/PixelKit';
import { sm2Button, sm2Text } from '../form/FormKit';
import { fxFrame, impactMs, totalMs, prefersReducedMotion, type StageActionKind } from '../../utils/combatFx';
import { type RingGrade, type RingSpec } from '../../utils/energia';
import { SpecialRing, DodgeButtons } from './PveMechanics';

/** O estilo da `TorcidaLayer` que envolve a cena: a tela inteira, acima das páginas. */
export const BATTLE_LAYER_STYLE: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 100, display: 'block',
};

export interface StageFighter {
  key: string | number;
  sprite: string;
  name: string;
  hp: number;
  maxHp: number;
  /** Id de elemento (qualquer um; sem arte cai no neutro). */
  element: string;
  /** Caído: some a barra e o sprite fica apagado. */
  down?: boolean;
  /** Energia 0..1 (a barra logo abaixo da de HP). Ausente = sem barra de energia. */
  energy?: number;
}

export interface StageAction {
  /** Muda a cada ação — é o que reinicia a animação. */
  id: number;
  actor: 'me' | 'foe';
  /** Índice do inimigo (atacante, se `actor` = foe; alvo, se `actor` = me). */
  foe: number;
  kind: StageActionKind;
  /** Elemento de quem ataca. */
  element: string;
  /** Elemento do DEFENSOR quando a defesa automática bloqueou: mostra a barreira dele no lugar do impacto. */
  shield?: string | null;
  /** Especial com carga longa (o do inimigo no PvE, que o jogador pode esquivar): o tempo do cast, do impacto e do total. */
  castMs?: number;
  impactMs?: number;
  totalMs?: number;
}

/** O número que sobe do alvo quando o dano CHEGA (o jogo manda no instante do impacto). */
export interface StageHit {
  id: number;
  /** Quem apanhou: o seu Soulmon ('me') ou um inimigo ('foe', índice em `foe`). */
  side: 'me' | 'foe';
  foe: number;
  value: number;
  /** Golpe especial/da torcida: número maior. */
  big?: boolean;
  /** Selo curto de feedback acima do número ("ÓTIMO!", "Defendeu!"). */
  tag?: string;
}

export interface Spot { x: number; y: number; size: number }
export interface StageLayout {
  me: Spot; foes: Spot[]; plateH: number; platHalf: (s: Spot) => number;
  /** Altura do bloco de barras (HP + energia) que fica EM CIMA de cada lutador. */
  barsH: number;
}

const PLATE_H = 14;
const BARS_H = 50;
/** Quanto do sprite fica acima dos pés (o resto é a base). */
const SPRITE_TOP = 0.94;

/**
 * Onde cada um fica, em px, dentro da CAIXA DO CAMPO de `w × h`. `x,y` é o centro
 * da plataforma (onde os pés pousam). Pura — testada em `BattleStage.test.tsx`.
 * O seu Soulmon: embaixo à esquerda, MUITO maior (até 64% da largura). Os inimigos: em cima à direita,
 * menores (0,6× com um, 0,5× com vários), escalonados no "fundo" da cena. As barras de HP e energia
 * ficam EM CIMA de cada um (`barsH`).
 */
export function stageLayout(w: number, h: number, nFoes: number): StageLayout {
  const meSize = Math.round(Math.max(110, Math.min(300, w * 0.64, h * 0.38)));
  const foeSize = Math.round(meSize * (nFoes <= 1 ? 0.66 : 0.5));
  const platHalf = (s: Spot) => Math.round(s.size * 0.1);
  const me: Spot = {
    x: Math.round(Math.max(w * 0.32, meSize / 2 + 4)),
    y: Math.round(h - meSize * 0.1 - 8),
    size: meSize,
  };
  const fr: Array<[number, number]> = nFoes <= 1
    ? [[0.7, 0.42]]
    : nFoes === 2
      ? [[0.72, 0.46], [0.34, 0.34]]
      : [[0.74, 0.5], [0.4, 0.4], [0.8, 0.27]];
  const minY = Math.round(foeSize * SPRITE_TOP + BARS_H + 6);
  const foes: Spot[] = fr.slice(0, Math.max(1, nFoes)).map(([fx, fy]) => ({
    x: Math.round(Math.min(w - foeSize / 2 - 2, Math.max(foeSize / 2 + 2, w * fx))),
    y: Math.round(Math.max(minY, h * fy)),
    size: foeSize,
  }));
  return { me, foes, plateH: PLATE_H, platHalf, barsH: BARS_H };
}

/** O centro do corpo (onde o golpe sai e chega). */
const bodyCenter = (s: Spot) => ({ x: s.x, y: s.y - s.size * 0.47 });

/** Mede a caixa do campo (ResizeObserver; sem ele, a janela). */
function useBox(ref: React.RefObject<HTMLDivElement | null>): { w: number; h: number } {
  const [box, setBox] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 375,
    h: typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 190) : 600,
  }));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setBox(b => (b.w === Math.round(r.width) && b.h === Math.round(r.height) ? b : { w: Math.round(r.width), h: Math.round(r.height) }));
      }
    };
    read();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(read); ro.observe(el); }
    window.addEventListener('resize', read);
    return () => { ro?.disconnect(); window.removeEventListener('resize', read); };
  }, [ref]);
  return box;
}

const SCRIM = 'color-mix(in srgb, var(--sm2-surface) 78%, transparent)';

/**
 * As barras EM CIMA do lutador, coladas nele (indicando que são DELE): nome (+ HP numérico quando
 * `numeric`), a barra de HP e, logo abaixo, a de ENERGIA — cheia, ela pulsa (o especial é o próximo golpe).
 */
function FighterBars({ fighter, spot, tone, numeric, barsH }: {
  fighter: StageFighter; spot: Spot; tone: 'cyan' | 'gold'; numeric: boolean; barsH: number;
}) {
  const width = Math.round(Math.max(124, Math.min(200, spot.size * 0.95)));
  const energy = fighter.energy;
  const full = energy !== undefined && energy >= 0.999;
  return (
    <div
      data-stage-plate={tone === 'cyan' ? 'me' : 'foe'}
      data-stage-energy-full={energy === undefined ? undefined : full ? '1' : '0'}
      style={{
        position: 'absolute', left: Math.round(spot.x - width / 2), top: Math.round(spot.y - spot.size * SPRITE_TOP - barsH + 12), width,
        boxSizing: 'border-box', padding: '3px 6px 4px', borderRadius: 8,
        backgroundColor: SCRIM, border: '1px solid var(--sm2-line)',
        display: 'flex', flexDirection: 'column', gap: 3, zIndex: 3, pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 12, lineHeight: 1.2, color: 'var(--sm2-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
          {fighter.name}
        </span>
        {numeric && (
          <span className="sm2-num" style={{ fontSize: 12, lineHeight: 1.2, color: 'var(--sm2-ink)', flex: 'none' }}>
            {Math.max(0, Math.round(fighter.hp))}/{fighter.maxHp}
          </span>
        )}
      </div>
      <PixelMeter ratio={fighter.maxHp > 0 ? fighter.hp / fighter.maxHp : 0} tone={tone} height={8} label={fighter.name} />
      {energy !== undefined && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(1, Math.max(0, energy)) * 100)}
          aria-label={`${fighter.name} · energy`}
          data-stage-energy
          className={full ? 'sm-bs-energy sm-bs-energy-full' : 'sm-bs-energy'}
        >
          <i style={{ width: `${Math.round(Math.min(1, Math.max(0, energy)) * 100)}%` }} />
        </div>
      )}
    </div>
  );
}

/** A sombra/plataforma sob os pés. */
function Platform({ spot, half }: { spot: Spot; half: number }) {
  const w = Math.round(spot.size * 1.05);
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: spot.x - w / 2, top: spot.y - half, width: w, height: half * 2,
        borderRadius: '50%', zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.16) 0 34%, rgba(0,0,0,.5) 36% 64%, transparent 72%)',
      }}
    />
  );
}

function Fighter({ f, spot, flip, zIndex, lunge, hitKey, hitDelay, charged }: {
  f: StageFighter; spot: Spot; flip: boolean; zIndex: number;
  lunge: { key: number; dx: number; dy: number; dur: number } | null;
  hitKey: number; hitDelay: number; charged: boolean;
}) {
  return (
    <div
      style={{ position: 'absolute', left: spot.x - spot.size / 2, top: spot.y - spot.size * SPRITE_TOP, width: spot.size, height: spot.size, zIndex, pointerEvents: 'none', opacity: f.down ? 0.28 : 1, filter: f.down ? 'grayscale(1)' : undefined, transition: 'opacity 300ms' }}
    >
      <div
        key={lunge ? `l${lunge.key}` : 'l-'}
        className={lunge ? 'sm-bs-lunge' : undefined}
        style={lunge ? ({ ['--dx' as string]: `${lunge.dx}px`, ['--dy' as string]: `${lunge.dy}px`, ['--bs-dur' as string]: `${lunge.dur}ms` } as CSSProperties) : undefined}
      >
        <div
          key={hitKey ? `h${hitKey}` : 'h-'}
          className={hitKey ? 'sm-bs-hit' : undefined}
          style={hitKey ? ({ ['--bs-delay' as string]: `${hitDelay}ms` } as CSSProperties) : undefined}
        >
          <img
            src={f.sprite}
            alt={f.name}
            width={spot.size}
            height={spot.size}
            className={charged && !f.down ? 'sm-bs-bounce sm-bs-charged' : 'sm-bs-bounce'}
            data-stage-sprite={flip ? 'foe' : 'me'}
            data-stage-charged={charged ? '1' : '0'}
            style={{
              display: 'block', width: spot.size, height: spot.size, maxWidth: 'none',
              objectFit: 'contain', imageRendering: 'pixelated',
              ['--flip' as string]: flip ? '-1' : '1',
              ['--bs-bounce' as string]: `${Math.max(5, Math.round(spot.size * 0.045))}px`,
              ['--sm-idle-dur' as string]: flip ? '1.25s' : '1.05s',
              ...(flip ? { transform: 'scaleX(-1)' } : null),
            } as CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

/** Uma figura de FX centrada num ponto. `anim` = a classe; `delay`/`dur` em ms. */
function Fx({ src, x, y, size, anim, delay, dur, rot = 0, flipX = false, extra }: {
  src: string | undefined; x: number; y: number; size: number; anim: string; delay: number; dur: number;
  rot?: number; flipX?: boolean; extra?: CSSProperties;
}) {
  if (!src) return null;
  return (
    <div
      aria-hidden="true"
      data-stage-fx={anim}
      className={anim}
      style={{
        position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 4, pointerEvents: 'none',
        ['--bs-delay' as string]: `${delay}ms`, ['--bs-dur' as string]: `${dur}ms`,
        ...extra,
      } as CSSProperties}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ display: 'block', width: size, height: size, maxWidth: 'none', imageRendering: 'pixelated', transform: `rotate(${rot}deg)${flipX ? ' scaleX(-1)' : ''}` }}
      />
    </div>
  );
}

function ActionFx({ action, layout, reduced }: { action: StageAction; layout: StageLayout; reduced: boolean }) {
  const meSpot = layout.me;
  const foeSpot = layout.foes[Math.min(action.foe, layout.foes.length - 1)] ?? layout.foes[0];
  const from = bodyCenter(action.actor === 'me' ? meSpot : foeSpot);
  const toSpot = action.actor === 'me' ? foeSpot : meSpot;
  const to = bodyCenter(toSpot);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const impact = action.impactMs ?? impactMs(action.kind, reduced);
  const total = action.totalMs ?? totalMs(action.kind, reduced);
  const el = action.element;
  const blocked = !!action.shield;
  const landing = blocked
    ? fxFrame(action.shield, 'defended')
    : fxFrame(el, 'impact');
  const big = action.kind === 'special';
  const landSize = Math.round(toSpot.size * (blocked ? 0.9 : big ? 1.1 : 0.8));
  const flipX = action.actor === 'foe'; // o corte e o orb são desenhados "para a direita"
  const fxScale = Math.max(1, meSpot.size / 190);

  const layers: ReactNode[] = [];
  if (!reduced) {
    if (action.kind === 'ranged' || big) {
      const cast = action.castMs ?? (big ? 900 : 650);
      layers.push(
        <Fx key="cast" src={fxFrame(el, 'cast')} x={from.x} y={from.y + (action.actor === 'me' ? 18 : 10)} size={Math.round((big ? 124 : 92) * fxScale)} anim="sm-bs-cast" delay={0} dur={cast} />,
      );
      if (big) {
        layers.push(
          <Fx key="aura" src={fxFrame(el, 'aura')} x={from.x} y={from.y} size={Math.round((action.actor === 'me' ? meSpot : foeSpot).size * 1.3)} anim="sm-bs-pop" delay={0} dur={Math.max(1000, action.castMs ?? 0)} />,
        );
      }
      const flyDelay = action.castMs ?? (big ? 320 : 180);
      layers.push(
        <Fx
          key="orb" src={fxFrame(el, 'orb')} x={from.x} y={from.y} size={Math.round((big ? 88 : 60) * fxScale)}
          anim="sm-bs-fly" delay={flyDelay} dur={Math.max(200, impact - flyDelay)} rot={ang}
          extra={{ ['--dx' as string]: `${Math.round(dx)}px`, ['--dy' as string]: `${Math.round(dy)}px` } as CSSProperties}
        />,
      );
    } else {
      layers.push(
        <Fx key="slash" src={fxFrame(el, 'slash')} x={to.x} y={to.y} size={Math.round(toSpot.size * 0.95)} anim="sm-bs-pop" delay={Math.max(0, impact - 240)} dur={400} flipX={flipX} />,
      );
    }
  }
  layers.push(
    <Fx key="land" src={landing} x={to.x} y={to.y} size={landSize} anim="sm-bs-pop" delay={Math.max(0, impact - 60)} dur={reduced ? total - impact : Math.min(700, total - impact + 60)} flipX={flipX && !blocked} />,
  );
  return <>{layers}</>;
}

export interface BattleStageProps {
  /** `background` shorthand do cenário (ex.: `ARENA_SCENE.bg`). */
  scene?: string;
  me: StageFighter;
  foes: StageFighter[];
  /** Índice do inimigo mirado (mostra o HP numérico dele). */
  target?: number;
  /** A ação em curso (investida/projétil/escudo). `null` = parado. */
  action?: StageAction | null;
  /** Título curto no canto superior esquerdo ("Arena · 2/5", "Duelo"). */
  title: string;
  closeLabel: string;
  onClose: () => void;
  /** Sair perde progresso? Então o X pede confirmação antes. */
  exitConfirm?: { title: string; stay: string; leave: string };
  /** A cena pausa a luta enquanto a confirmação está aberta. */
  onPauseChange?: (paused: boolean) => void;
  /** A barra de CHEER (no pé da cena, ao lado do mascote). */
  hud?: ReactNode;
  /** O número do dano que chega (um ou vários: o especial em área acerta mais de um). */
  hit?: StageHit | StageHit[] | null;
  /** Um selo ao lado do título (ex.: a carga do especial) — sem texto na tela. */
  badge?: ReactNode;
  /** Uma etiqueta de ESTADO (não explicativa) no pé da cena, ex.: "Conferindo…". */
  status?: string;
  /** PvE: o pet está carregando o especial (a aura fica ligada). */
  charging?: boolean;
  /** PvE: o ANEL que encolhe sobre o alvo (a mecânica do especial do pet). */
  ring?: { key: number; spec: RingSpec; foe: number } | null;
  onRingGrade?: (grade: RingGrade, tapMs: number | null) => void;
  /** PvE: a janela da ESQUIVA do especial do inimigo (setas de cada lado do pet). */
  dodge?: { key: number } | null;
  onDodge?: (dir: -1 | 1) => void;
  /** PvE: o pet desliza (a esquiva aconteceu). */
  petDodge?: { id: number; dir: -1 | 1 } | null;
  /** Nomes acessíveis das mecânicas (sem texto na tela). */
  mechLabels?: { strike: string; dodgeLeft: string; dodgeRight: string };
  children?: ReactNode;
}

/** A cena inteira. Envolva-a numa `TorcidaLayer style={BATTLE_LAYER_STYLE} mascot`. */
export function BattleStage({
  scene, me, foes, target = 0, action, hit, badge, title, closeLabel, onClose, exitConfirm, onPauseChange, hud, status,
  charging = false, ring, onRingGrade, dodge, onDodge, petDodge, mechLabels, children,
}: BattleStageProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const { w, h } = useBox(fieldRef);
  const layout = stageLayout(w, h, foes.length);
  const reducedRef = useRef(prefersReducedMotion());
  const reduced = reducedRef.current;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { onPauseChange?.(confirming); }, [confirming, onPauseChange]);

  const tryClose = () => {
    if (exitConfirm) setConfirming(true);
    else onClose();
  };

  const actor = action?.actor;
  const foeSpotOf = (i: number) => layout.foes[Math.min(i, layout.foes.length - 1)] ?? layout.foes[0];
  const meLunge = petDodge && !reduced
    ? { key: 100000 + petDodge.id, dx: petDodge.dir * Math.round(layout.me.size * 0.45), dy: 0, dur: 800 }
    : action && actor === 'me' && action.kind === 'melee' && !reduced
      ? (() => {
          const t = foeSpotOf(action.foe);
          const a = bodyCenter(layout.me); const b = bodyCenter(t);
          return { key: action.id, dx: Math.round((b.x - a.x) * 0.78), dy: Math.round((b.y - a.y) * 0.78), dur: totalMs('melee', false) };
        })()
      : null;
  const foeLunge = (i: number) => action && actor === 'foe' && action.foe === i && action.kind === 'melee' && !reduced
    ? (() => {
        const a = bodyCenter(layout.foes[i] ?? layout.foes[0]); const b = bodyCenter(layout.me);
        return { key: action.id, dx: Math.round((b.x - a.x) * 0.78), dy: Math.round((b.y - a.y) * 0.78), dur: totalMs('melee', false) };
      })()
    : null;
  const hitOn = (side: 'me' | number) => {
    if (!action || action.shield) return { key: 0, delay: 0 };
    const isTarget = side === 'me' ? action.actor === 'foe' : action.actor === 'me' && action.foe === side;
    return isTarget && !reduced ? { key: action.id, delay: action.impactMs ?? impactMs(action.kind, false) } : { key: 0, delay: 0 };
  };

  const hits = hit ? (Array.isArray(hit) ? hit : [hit]) : [];
  const meBody = bodyCenter(layout.me);

  return (
    <div
      data-battle-stage
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: scene ?? 'var(--sm2-viewport-bg)',
        color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)',
      }}
    >
      {/* O véu: escurece o topo e o pé para o HUD e as barras lerem sobre a arte. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,0) 20%, rgba(0,0,0,0) 76%, rgba(0,0,0,.45))' }} />

      {/* O HUD do topo: título à esquerda, X à direita (canto superior DIREITO). */}
      <div
        data-stage-hud
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
          padding: 'calc(env(safe-area-inset-top, 0px) + 4px) 12px 0', boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 500, color: 'var(--sm2-viewport-ink)', textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>{title}</p>
            {badge}
          </div>
          <button
            type="button"
            onClick={tryClose}
            aria-label={closeLabel}
            data-stage-close
            style={{
              width: 44, height: 44, flex: 'none', margin: '0 -8px 0 0',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sm2-viewport-ink)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.85))',
            }}
          >
            <Icon name="close" size={24} tone="inherit" />
          </button>
        </div>
      </div>

      {/* O campo: tudo que luta mora aqui, em px medidos. Usa quase a viewport inteira. */}
      <div
        ref={fieldRef}
        data-stage-field
        style={{
          position: 'absolute', left: 0, right: 0,
          top: 'calc(env(safe-area-inset-top, 0px) + 48px)',
          bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 54px)',
        }}
      >
        {foes.map((f, i) => {
          const s = layout.foes[i];
          if (!s) return null;
          return <Platform key={`pl${f.key}`} spot={s} half={layout.platHalf(s)} />;
        })}
        <Platform spot={layout.me} half={layout.platHalf(layout.me)} />

        {foes.map((f, i) => {
          const s = layout.foes[i];
          if (!s) return null;
          const ht = hitOn(i);
          return (
            <Fighter key={`f${f.key}`} f={f} spot={s} flip zIndex={2} lunge={foeLunge(i)} hitKey={ht.key} hitDelay={ht.delay} charged={(f.energy ?? 0) >= 0.999} />
          );
        })}
        <Fighter f={me} spot={layout.me} flip={false} zIndex={3} lunge={meLunge} hitKey={hitOn('me').key} hitDelay={hitOn('me').delay} charged={charging || (me.energy ?? 0) >= 0.999} />

        {/* As barras EM CIMA de cada lutador: HP e, logo abaixo, energia. */}
        {foes.map((f, i) => {
          const s = layout.foes[i];
          if (!s || f.down) return null;
          return <FighterBars key={`p${f.key}`} fighter={f} spot={s} tone="gold" numeric={i === target} barsH={layout.barsH} />;
        })}
        <FighterBars fighter={me} spot={layout.me} tone="cyan" numeric barsH={layout.barsH} />

        {action && <ActionFx key={action.id} action={action} layout={layout} reduced={reduced} />}
        {charging && !action?.shield && (
          <div key="charge" aria-hidden="true" data-stage-charging className="sm-bs-charge" style={{ position: 'absolute', left: layout.me.x - layout.me.size * 0.7, top: meBody.y - layout.me.size * 0.7, width: layout.me.size * 1.4, height: layout.me.size * 1.4, zIndex: 2, pointerEvents: 'none', borderRadius: '50%' }} />
        )}

        {ring && onRingGrade && (() => {
          const s = foeSpotOf(ring.foe);
          const c = bodyCenter(s);
          return (
            <SpecialRing
              key={ring.key}
              spec={ring.spec}
              x={c.x} y={c.y} size={s.size}
              onGrade={onRingGrade}
              label={mechLabels?.strike ?? 'Strike'}
            />
          );
        })()}
        {dodge && onDodge && (
          <DodgeButtons
            key={dodge.key}
            x={meBody.x} y={meBody.y} size={layout.me.size}
            onDodge={onDodge}
            labelLeft={mechLabels?.dodgeLeft ?? 'Dodge left'}
            labelRight={mechLabels?.dodgeRight ?? 'Dodge right'}
          />
        )}

        {hits.map(ht => {
          const spot = ht.side === 'me' ? layout.me : foeSpotOf(ht.foe);
          const c = bodyCenter(spot);
          return (
            <span
              key={ht.id}
              aria-hidden="true"
              className="sm-duel-dmg"
              data-stage-dmg
              style={{
                position: 'absolute', left: c.x, top: c.y - spot.size * 0.5, transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, whiteSpace: 'nowrap',
                fontFamily: 'Silkscreen, monospace', color: 'var(--sm2-ink)',
                textShadow: '0 1px 0 rgba(0,0,0,.7), 0 0 4px rgba(0,0,0,.6)',
              }}
            >
              {ht.tag && <span data-stage-tag style={{ fontSize: 13, color: 'var(--sm2-gold-ink)' }}>{ht.tag}</span>}
              {ht.value > 0 && <span style={{ fontSize: ht.big ? 26 : 20 }}>−{ht.value}</span>}
            </span>
          );
        })}
      </div>

      {/* A barra de CHEER no pé da cena (o mascote da torcida mora no canto, na `TorcidaLayer`). */}
      {hud && (
        <div
          data-stage-footer
          style={{
            position: 'absolute', left: 12, right: 74, zIndex: 4,
            bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 10px)',
            padding: '2px 8px', borderRadius: 12, backgroundColor: SCRIM, border: '1px solid var(--sm2-line)', boxSizing: 'border-box',
          }}
        >
          {hud}
        </div>
      )}

      {status && (
        <p
          role="status"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 60px)', margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--sm2-ink)', textShadow: '0 1px 2px rgba(0,0,0,.85)', zIndex: 4, pointerEvents: 'none' }}
        >
          {status}
        </p>
      )}

      {children}

      {confirming && exitConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={exitConfirm.title}
          data-stage-confirm
          style={{ position: 'absolute', inset: 0, zIndex: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,.6)' }}
        >
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, boxSizing: 'border-box', backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)' }}>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 500, textAlign: 'center' }}>{exitConfirm.title}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" autoFocus onClick={() => setConfirming(false)} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                {exitConfirm.stay}
              </button>
              <button type="button" onClick={onClose} data-stage-confirm-leave style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
                {exitConfirm.leave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
