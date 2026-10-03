/**
 * BATTLE STAGE — a CENA de combate em tela cheia (rodada 5 / I10, 02/10/2026).
 *
 * O dono testou o APK e achou a luta fraca: o cenário era uma faixinha de 160 px
 * no topo e os golpes eram um emoji. Agora o background do combate ocupa a
 * tela inteira, com PROFUNDIDADE de Game Boy/Pokémon: o seu Soulmon embaixo à
 * ESQUERDA (maior, mais perto), o inimigo em cima à DIREITA (menor, mais
 * longe), uma plataforma/sombra sob cada um, e a barra de HP de cada lutador
 * junto aos PÉS dele (nome curto + HP numérico), não numa barra lá em cima.
 *
 * Os golpes usam a arte de SKILL do ELEMENTO do lutador (`utils/combatFx.ts`,
 * `utils/attackFxArt.ts`): investida (`melee`), projétil (`ranged`/`special`) e
 * o escudo da defesa automática (`shield`). O JOGO decide o que acontece; esta
 * peça só DESENHA, num relógio em que o dano (barra, número) chega no IMPACTO.
 *
 * É reutilizável: Duelo da Arena (`ArenaGame`) e duelo fantasma do Torneio
 * (`DuelScreen`) já a usam; Pesadelo e Masmorra entram trocando o miolo pela
 * mesma `BattleStage` (props `me`/`foes`/`action`) — ver REGISTRO §20.9.
 *
 * Contrato de tela (regras do dono):
 *  · NENHUM texto explicativo — o "?" é o `InfoTip` (no `TorcidaGauge bare`);
 *  · o botão de sair é o X no canto superior DIREITO (ícone pelado), com
 *    confirmação quando sair perde progresso (`exitConfirm`);
 *  · o toque em qualquer lugar é da `TorcidaLayer` que envolve esta peça;
 *  · `prefers-reduced-motion`: sem investida nem projétil — só o flash no alvo.
 * Superfície de combate nasce MUDA (R-NOVA, `docs/SOM.md`): nenhum som.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { PixelMeter } from '../pixel/PixelKit';
import { sm2Button, sm2Text } from '../form/FormKit';
import { fxFrame, impactMs, totalMs, prefersReducedMotion, type StageActionKind } from '../../utils/combatFx';

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
}

export interface Spot { x: number; y: number; size: number }
export interface StageLayout { me: Spot; foes: Spot[]; plateH: number; platHalf: (s: Spot) => number }

const PLATE_H = 46;

/**
 * Onde cada um fica, em px, dentro da CAIXA DO CAMPO de `w × h`. `x,y` é o centro
 * da plataforma (onde os pés pousam). Pura — testada em `BattleStage.test.tsx`.
 * O seu Soulmon: embaixo à esquerda, grande. Os inimigos: em cima à direita,
 * menores (0,56× com um, 0,5× com vários), escalonados no "fundo" da cena.
 */
export function stageLayout(w: number, h: number, nFoes: number): StageLayout {
  const meSize = Math.round(Math.max(96, Math.min(190, w * 0.46, h * 0.3)));
  const foeSize = Math.round(meSize * (nFoes <= 1 ? 0.56 : 0.5));
  const platHalf = (s: Spot) => Math.round(s.size * 0.1);
  const me: Spot = {
    x: Math.round(w * 0.3),
    y: Math.round(Math.min(h * 0.88, h - PLATE_H - meSize * 0.1 - 8)),
    size: meSize,
  };
  const fr: Array<[number, number]> = nFoes <= 1
    ? [[0.7, 0.4]]
    : nFoes === 2
      ? [[0.72, 0.45], [0.36, 0.33]]
      : [[0.74, 0.47], [0.44, 0.38], [0.8, 0.27]];
  const foes: Spot[] = fr.slice(0, Math.max(1, nFoes)).map(([fx, fy]) => ({
    x: Math.round(w * fx),
    y: Math.round(Math.max(foeSize + 8, h * fy)),
    size: foeSize,
  }));
  return { me, foes, plateH: PLATE_H, platHalf };
}

/** O centro do corpo (onde o golpe sai e chega). */
const bodyCenter = (s: Spot) => ({ x: s.x, y: s.y - s.size * 0.47 });

/** Mede a caixa do campo (ResizeObserver; sem ele, a janela). */
function useBox(ref: React.RefObject<HTMLDivElement | null>): { w: number; h: number } {
  const [box, setBox] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 375,
    h: typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 180) : 600,
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

/** A barra de HP DO PÉ do lutador: nome curto, barra e HP numérico mínimo. */
function HpPlate({ fighter, spot, tone, numeric, platHalf }: {
  fighter: StageFighter; spot: Spot; tone: 'cyan' | 'gold'; numeric: boolean; platHalf: number;
}) {
  const width = Math.round(Math.max(116, spot.size * 1.15));
  return (
    <div
      data-stage-plate={tone === 'cyan' ? 'me' : 'foe'}
      style={{
        position: 'absolute', left: spot.x - width / 2, top: spot.y + platHalf + 3, width,
        boxSizing: 'border-box', padding: '3px 6px 4px', borderRadius: 8,
        backgroundColor: SCRIM, border: '1px solid var(--sm2-line)',
        display: 'flex', flexDirection: 'column', gap: 2, zIndex: 3, pointerEvents: 'none',
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

function Fighter({ f, spot, flip, zIndex, lunge, hitKey, hitDelay }: {
  f: StageFighter; spot: Spot; flip: boolean; zIndex: number;
  lunge: { key: number; dx: number; dy: number; dur: number } | null;
  hitKey: number; hitDelay: number;
}) {
  return (
    <div
      style={{ position: 'absolute', left: spot.x - spot.size / 2, top: spot.y - spot.size * 0.94, width: spot.size, height: spot.size, zIndex, pointerEvents: 'none', opacity: f.down ? 0.28 : 1, filter: f.down ? 'grayscale(1)' : undefined, transition: 'opacity 300ms' }}
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
            className="sm-battle-idle"
            data-stage-sprite={flip ? 'foe' : 'me'}
            style={{
              display: 'block', width: spot.size, height: spot.size, maxWidth: 'none',
              objectFit: 'contain', imageRendering: 'pixelated',
              ['--flip' as string]: flip ? '-1' : '1',
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
  const impact = impactMs(action.kind, reduced);
  const total = totalMs(action.kind, reduced);
  const el = action.element;
  const blocked = !!action.shield;
  const landing = blocked
    ? fxFrame(action.shield, 'defended')
    : fxFrame(el, 'impact');
  const big = action.kind === 'special';
  const landSize = Math.round(toSpot.size * (blocked ? 1.0 : big ? 1.25 : 1.0));
  const flipX = action.actor === 'foe'; // o corte e o orb são desenhados "para a direita"

  const layers: ReactNode[] = [];
  if (!reduced) {
    if (action.kind === 'ranged' || big) {
      layers.push(
        <Fx key="cast" src={fxFrame(el, 'cast')} x={from.x} y={from.y + (action.actor === 'me' ? 18 : 10)} size={big ? 124 : 92} anim="sm-bs-cast" delay={0} dur={big ? 900 : 650} />,
      );
      if (big) {
        layers.push(
          <Fx key="aura" src={fxFrame(el, 'aura')} x={from.x} y={from.y} size={Math.round((action.actor === 'me' ? meSpot : foeSpot).size * 1.25)} anim="sm-bs-pop" delay={0} dur={1000} />,
        );
      }
      const flyDelay = big ? 320 : 180;
      layers.push(
        <Fx
          key="orb" src={fxFrame(el, 'orb')} x={from.x} y={from.y} size={big ? 88 : 60}
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
  /** O gauge de torcida (e o que mais ficar no topo, sob o título). */
  hud?: ReactNode;
  /** O número do dano que chega. */
  hit?: StageHit | null;
  /** Um selo ao lado do título (ex.: a carga do especial) — sem texto na tela. */
  badge?: ReactNode;
  /** Uma etiqueta de ESTADO (não explicativa) no pé da cena, ex.: "Conferindo…". */
  status?: string;
  children?: ReactNode;
}

/** A cena inteira. Envolva-a numa `TorcidaLayer style={BATTLE_LAYER_STYLE}`. */
export function BattleStage({
  scene, me, foes, target = 0, action, hit, badge, title, closeLabel, onClose, exitConfirm, onPauseChange, hud, status, children,
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
  const meLunge = action && actor === 'me' && action.kind === 'melee' && !reduced
    ? (() => {
        const t = layout.foes[Math.min(action.foe, layout.foes.length - 1)] ?? layout.foes[0];
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
    return isTarget && !reduced ? { key: action.id, delay: impactMs(action.kind, false) } : { key: 0, delay: 0 };
  };

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
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,0) 26%, rgba(0,0,0,0) 72%, rgba(0,0,0,.4))' }} />

      {/* O HUD do topo: título à esquerda, X à direita (canto superior DIREITO), gauge embaixo. */}
      <div
        data-stage-hud
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
          padding: 'calc(env(safe-area-inset-top, 0px) + 6px) 12px 6px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>{title}</p>
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
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sm2-ink)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.85))',
            }}
          >
            <Icon name="close" size={24} tone="inherit" />
          </button>
        </div>
        {hud && (
          <div style={{ padding: '4px 8px', borderRadius: 12, backgroundColor: SCRIM, border: '1px solid var(--sm2-line)' }}>
            {hud}
          </div>
        )}
      </div>

      {/* O campo: tudo que luta mora aqui, em px medidos. */}
      <div
        ref={fieldRef}
        data-stage-field
        style={{
          position: 'absolute', left: 0, right: 0,
          top: 'calc(env(safe-area-inset-top, 0px) + 112px)',
          bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px))',
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
            <Fighter key={`f${f.key}`} f={f} spot={s} flip zIndex={2} lunge={foeLunge(i)} hitKey={ht.key} hitDelay={ht.delay} />
          );
        })}
        <Fighter f={me} spot={layout.me} flip={false} zIndex={3} lunge={meLunge} hitKey={hitOn('me').key} hitDelay={hitOn('me').delay} />

        {foes.map((f, i) => {
          const s = layout.foes[i];
          if (!s || f.down) return null;
          return <HpPlate key={`p${f.key}`} fighter={f} spot={s} tone="gold" numeric={i === target} platHalf={layout.platHalf(s)} />;
        })}
        <HpPlate fighter={me} spot={layout.me} tone="cyan" numeric platHalf={layout.platHalf(layout.me)} />

        {action && <ActionFx key={action.id} action={action} layout={layout} reduced={reduced} />}
        {hit && (() => {
          const spot = hit.side === 'me' ? layout.me : (layout.foes[Math.min(hit.foe, layout.foes.length - 1)] ?? layout.foes[0]);
          const c = bodyCenter(spot);
          return (
            <span
              key={hit.id}
              aria-hidden="true"
              className="sm-duel-dmg"
              data-stage-dmg
              style={{
                position: 'absolute', left: c.x, top: c.y - spot.size * 0.5, transform: 'translateX(-50%)', zIndex: 5, pointerEvents: 'none',
                fontFamily: 'Silkscreen, monospace', fontSize: hit.big ? 24 : 18, color: 'var(--sm2-ink)',
                textShadow: '0 1px 0 rgba(0,0,0,.7), 0 0 4px rgba(0,0,0,.6)',
              }}
            >
              −{hit.value}
            </span>
          );
        })()}
      </div>

      {status && (
        <p
          role="status"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(var(--sm-corner-h, 68px) + env(safe-area-inset-bottom, 0px) + 8px)', margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--sm2-ink)', textShadow: '0 1px 2px rgba(0,0,0,.85)', zIndex: 4, pointerEvents: 'none' }}
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
