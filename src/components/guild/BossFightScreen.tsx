/**
 * A LUTA CONTRA O CHEFE DA FEIRA (`docs/PLANO-FEIRA-CHEFE.md` §3, F-08/F-09).
 *
 * Puramente APRESENTAÇÃO: recebe o replay que o servidor validou (a lista de eventos do mesmo formato que `fightSteps`
 * produz) e o toca na `BattleStage` em modo `boss`; ao fim mostra o `ResultScreen` na variante `kind: 'boss'`.
 * Nenhuma regra de jogo aqui: o dano, o pool e as recompensas chegam prontos do servidor.
 *
 * Só AGREGADO: a barra é a do pool do clã (`poolPct*`) e a única cifra é o dano do PRÓPRIO jogador (`myDamage`).
 * Nenhum dado por membro entra por estas props (LV-G1). Tom: o chefe "recua / foge", nunca "você falhou".
 *
 * Sem torcida (cheer): o replay é validado pelo servidor e nada que o jogador toque muda o resultado, então um
 * toque de torcida aqui seria uma promessa falsa. A `TorcidaLayer` não é montada.
 * Mudo: nenhum som novo (a `BattleStage` só toca os efeitos que já tinha).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BattleStage, BATTLE_LAYER_STYLE, type StageAction, type StageFighter, type StageHit } from '../games/BattleStage';
import { ResultScreen, type ResultLedgerRow } from '../games/ResultScreen';
import type { FightEvent } from '../../utils/combate/fight';
import { impactMs, introMs, prefersReducedMotion, type StageActionKind } from '../../utils/combatFx';
import { BOSS_ROSTER, bossArt, bossText } from '../../data/bossRoster';
import type { Language } from '../../utils/i18n';

export interface BossFightMe {
  sprite: string;
  name: string;
  /** Id de elemento (sem arte cai no neutro). */
  element: string;
  /** Porte do bicho (`utils/spriteScale.ts`). */
  scale?: number;
  /** HP de exibição do SEU Soulmon (o replay só traz a fração). Padrão 100. */
  maxHp?: number;
}

export interface BossFightScreenProps {
  language: Language;
  /** Slug do chefe em `BOSS_ROSTER` (ex.: `arauto-do-fim`). */
  bossId: string;
  level: number;
  /** Pool do clã (agregado) em % antes e depois deste golpe. */
  poolPctBefore: number;
  poolPctAfter: number;
  /** Dano do PRÓPRIO jogador neste golpe. */
  myDamage: number;
  /** O replay do servidor: lado 0 = o jogador, lado 1 = o chefe. */
  events: readonly FightEvent[];
  me: BossFightMe;
  /** Forma do golpe básico do jogador (padrão à distância). */
  meStrike?: 'melee' | 'ranged';
  /** Recompensa quando dada (só no abate): seiva da Casa e Emblemas. */
  rewards?: { sap?: number; emblems?: number };
  /** Botão final da tela de resultado. */
  onDone: () => void;
  /** Teste/inspeção: pula o replay e abre o resultado. */
  skipReplay?: boolean;
}

/** O replay nunca passa disto em tempo de parede (s): lutas mais longas são aceleradas. */
const MAX_REPLAY_S = 18;
const TICK_MS = 50;
/** Respiro entre o último golpe e a tela de resultado. */
const END_BEAT_MS = 1100;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export function BossFightScreen(p: BossFightScreenProps) {
  const isPt = p.language === 'pt-BR';
  const entry = useMemo(() => BOSS_ROSTER.find(b => b.id === p.bossId), [p.bossId]);
  const text = entry ? bossText(entry, isPt) : { name: p.bossId, papel: '', elements: [], lore: '' };
  // O Arauto tem corpo inteiro próprio; os demais usam a única arte (a criatura inteira, 512×512).
  const art = bossArt(p.bossId, 'corpo-inteiro') ?? bossArt(p.bossId) ?? '';
  const bossElement = entry?.elements[0]?.id ?? 'neutro';
  const meMax = p.me.maxHp ?? 100;

  const events = useMemo(() => [...p.events].sort((a, b) => a.t - b.t), [p.events]);
  /** O `attack` no mesmo instante do `cast` do mesmo lado é o GOLPE do especial (não abre ação própria). */
  const specialHit = useMemo(() => {
    const set = new Set<FightEvent>();
    const castAt = new Map<number, number>();
    for (const e of events) {
      if (e.kind === 'cast') castAt.set(e.side, e.t);
      else if (e.kind === 'attack' && castAt.get(e.side) === e.t) set.add(e);
    }
    return set;
  }, [events]);
  /** Soma da fração que o JOGADOR tirou do chefe: reparte o dano e o pool entre os golpes. */
  const myTotal = useMemo(() => events.reduce((a, e) => a + ((e.kind === 'attack' || e.kind === 'tick') && e.side === 0 ? e.frac : 0), 0), [events]);

  const [phase, setPhase] = useState<'fight' | 'result'>(p.skipReplay || events.length === 0 ? 'result' : 'fight');
  const [action, setAction] = useState<StageAction | null>(null);
  const [hits, setHits] = useState<StageHit[]>([]);
  const [meHp, setMeHp] = useState(1);
  const [pool, setPool] = useState(clampPct(p.poolPctBefore));
  const seq = useRef(0);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (phase !== 'fight') return undefined;
    const rd = reduced.current;
    const lastT = events.length ? events[events.length - 1].t : 0;
    const speed = Math.max(1, lastT / MAX_REPLAY_S);
    const leadS = (k: StageActionKind) => (impactMs(k, rd) + introMs(k)) / 1000;
    const kindOf = (e: FightEvent): StageActionKind | null => {
      if (e.kind === 'cast') return 'special';
      if (e.kind === 'attack' && !specialHit.has(e)) return e.side === 0 ? p.meStrike ?? 'ranged' : 'ranged';
      return null;
    };
    let started = 0;
    let applied = 0;
    let mine = 0;
    let finished = false;
    let endId: number | undefined;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      if (finished) return;
      const clock = ((performance.now() - t0) / 1000) * speed;
      while (started < events.length) {
        const e = events[started];
        const k = kindOf(e);
        if (e.t - (k ? leadS(k) : 0) > clock) break;
        if (k) {
          const mineSide = e.side === 0;
          setAction({ id: ++seq.current, actor: mineSide ? 'me' : 'foe', foe: 0, kind: k, strike: k === 'special' ? 'ranged' : undefined, element: mineSide ? p.me.element : bossElement });
        }
        started++;
      }
      while (applied < events.length && events[applied].t <= clock) {
        const e = events[applied];
        applied++;
        if (applied > started) started = applied;
        setMeHp(clamp01(e.hp[0]));
        if ((e.kind === 'attack' || e.kind === 'tick') && e.frac > 1e-9) {
          const toBoss = e.side === 0;
          if (toBoss) {
            mine += e.frac;
            const share = myTotal > 0 ? mine / myTotal : 1;
            setPool(clampPct(p.poolPctBefore + (p.poolPctAfter - p.poolPctBefore) * share));
          }
          const value = toBoss ? Math.max(1, Math.round(myTotal > 0 ? p.myDamage * (e.frac / myTotal) : 0)) : Math.max(1, Math.round(e.frac * meMax));
          setHits([{ id: ++seq.current, side: toBoss ? 'foe' : 'me', foe: 0, value, big: specialHit.has(e) }]);
        }
      }
      if (applied >= events.length) {
        finished = true;
        setPool(clampPct(p.poolPctAfter));
        endId = window.setTimeout(() => setPhase('result'), rd ? 300 : END_BEAT_MS);
      }
    }, TICK_MS);
    return () => { window.clearInterval(id); if (endId !== undefined) window.clearTimeout(endId); };
    // O replay nasce uma vez por montagem: as props são dados já fechados do servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'result') {
    const defeated = p.poolPctAfter <= 0;
    const ledger: ResultLedgerRow[] = [];
    if (p.rewards?.sap && p.rewards.sap > 0) {
      ledger.push({ key: 'sap', kind: 'node', label: isPt ? 'Seiva da Casa' : 'House sap', node: <span className="sm2-num" data-result-sap style={{ fontWeight: 600 }}>+{p.rewards.sap}</span> });
    }
    if (p.rewards?.emblems && p.rewards.emblems > 0) ledger.push({ key: 'emblems', kind: 'honor', value: p.rewards.emblems });
    return (
      <ResultScreen
        language={p.language}
        kind="boss"
        outcome={defeated ? 'win' : 'calm'}
        gameName={text.name}
        title={defeated ? (isPt ? 'O caminho abriu' : 'The way is open') : (isPt ? `${text.name} fugiu por ora` : `${text.name} fled, for now`)}
        line={isPt ? `Você causou ${p.myDamage} de dano.` : `You dealt ${p.myDamage} damage.`}
        pool={{ label: isPt ? 'Força do chefe' : 'Boss strength', before: p.poolPctBefore, after: p.poolPctAfter }}
        petSrc={p.me.sprite}
        ledger={ledger}
        homeLabel={isPt ? 'Continuar' : 'Continue'}
        onHome={p.onDone}
        testId="boss-result"
      />
    );
  }

  const foe: StageFighter = { key: `boss-${p.bossId}`, sprite: art, name: text.name, hp: pool, maxHp: 100, element: bossElement };
  const meFighter: StageFighter = { key: 'me', sprite: p.me.sprite, scale: p.me.scale, name: p.me.name, hp: meHp * meMax, maxHp: meMax, element: p.me.element };
  return (
    <div style={BATTLE_LAYER_STYLE} data-boss-fight data-boss-id={p.bossId}>
      <BattleStage
        me={meFighter}
        foes={[foe]}
        action={action}
        hit={hits}
        title={isPt ? 'Chefe da Feira' : 'Fair boss'}
        closeLabel={isPt ? 'Pular para o resultado' : 'Skip to the result'}
        onClose={() => setPhase('result')}
        fast={reduced.current}
        isPt={isPt}
        boss={{ poolPct: pool, name: text.name, levelLabel: isPt ? `Nv ${p.level}` : `Lv ${p.level}` }}
      />
    </div>
  );
}
